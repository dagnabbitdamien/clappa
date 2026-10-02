// Explicit supported media profile: OBS H.264/AAC in Matroska.
// Match every packet to the actual container; Annex-B start codes become AVCC lengths.
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createInterface} from 'node:readline';
import {readFile,stat,open,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {sha256,hashFile,parseStrict} from './proof.mjs';
const exec=promisify(execFile);
export function avcc(bytes){
 const starts=[];for(let i=0;i<bytes.length-2;i++)if(bytes[i]===0&&bytes[i+1]===0&&(bytes[i+2]===1||bytes[i+2]===0&&bytes[i+3]===1)){const length=bytes[i+2]===1?3:4;starts.push([i,length]);i+=length-1;}
 if(!starts.length||starts[0][0]!==0)throw Error('Unsupported H.264 packet framing');
 return Buffer.concat(starts.map(([pos,length],i)=>{const end=starts[i+1]?.[0]??bytes.length,nal=bytes.subarray(pos+length,end);if(!nal.length)throw Error('Empty H.264 NAL');const n=Buffer.alloc(4);n.writeUInt32BE(nal.length);return Buffer.concat([n,nal]);}));
}
async function ffprobePath(explicit){if(explicit)return explicit;const candidates=[process.env.CLAPPA_FFPROBE,fileURLToPath(new URL('../ffprobe.exe',import.meta.url)),process.env.ProgramFiles&&path.join(process.env.ProgramFiles,'ffmpeg/bin/ffprobe.exe')].filter(Boolean);for(const p of candidates)try{await access(p);return p}catch{}return 'ffprobe';}
export async function matchRecording(descriptor,manifestPath,archivePath,mediaPath,{throughPackets,ffprobe,sealedMediaVerified=false}={}){
 if(descriptor.codec==='test-fixture'){if(throughPackets)throw Error('Synthetic vector cannot verify a live prefix');if(await hashFile(archivePath)!==await hashFile(mediaPath))throw Error('Fixture archive/media mismatch');return {profile:'synthetic-test-vector',matched:true};}
 if(descriptor.role!=='recording'||descriptor.codec!=='obs-encoded-packets-v1')throw Error('Unsupported media binding profile');
 if((await stat(manifestPath)).size>256*1024*1024)throw Error('Packet manifest too large');
 const packets=(await readFile(manifestPath,'utf8')).trim().split('\n').map(parseStrict);const count=throughPackets??packets.length;if(!Number.isSafeInteger(count)||count<1||count>packets.length)throw Error('Invalid media prefix length');
 const probe=await ffprobePath(ffprobe),media=mediaPath instanceof URL?fileURLToPath(mediaPath):String(mediaPath);
 const {stdout}=await exec(probe,['-v','error','-protocol_whitelist','file,pipe','-show_streams','-show_format','-of','json',media],{windowsHide:true,maxBuffer:1024*1024,timeout:20000});const info=JSON.parse(stdout);
 if(!info.format?.format_name?.split(',').includes('matroska'))throw Error('Media binding currently requires an OBS Matroska recording');
 const video=info.streams.filter(s=>s.codec_type==='video'),audio=info.streams.filter(s=>s.codec_type==='audio');
 if(video.length!==1||video[0].codec_name!=='h264'||video[0].nal_length_size!=='4'||audio.some(s=>s.codec_name!=='aac')||video.length+audio.length!==info.streams.length)throw Error('Media binding currently supports H.264 + AAC only');
 const tracks=new Map([[video[0].index,{type:'video',track:0}],...audio.map((s,i)=>[s.index,{type:'audio',track:i}])]);
 const child=spawn(probe,['-v','error','-protocol_whitelist','file,pipe','-show_packets','-show_data_hash','sha256','-show_entries','packet=stream_index,pts_time,dts_time,size,flags,data_hash','-of','compact',media],{windowsHide:true,stdio:['ignore','pipe','pipe']});
 let error='',i=0,intentional=false;child.stderr.on('data',b=>{if(error.length<8192)error+=b});const finished=new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',code=>code===0||intentional?resolve():reject(Error('Media extraction failed: '+error)))});finished.catch(()=>{});
 const archive=await open(archivePath,'r'),lines=createInterface({input:child.stdout,crlfDelay:Infinity});const timeout=setTimeout(()=>child.kill(),120000);timeout.unref();
 try{for await(const line of lines){if(!line.startsWith('packet|'))continue;if(i>=count)throw Error('Recording contains uncommitted packets');const actual=Object.fromEntries(line.split('|').slice(1).map(x=>{const at=x.indexOf('=');return [x.slice(0,at),x.slice(at+1)]})),p=packets[i],track=tracks.get(Number(actual.stream_index));
   if(!track||track.type!==p.type||track.track!==p.track)throw Error('Recording packet order/track mismatch at '+i);
   if(!Number.isSafeInteger(p.bytes)||p.bytes<1||p.bytes>32*1024*1024||!Number.isSafeInteger(p.offset)||p.offset<0)throw Error('Invalid archived packet');
   const bytes=Buffer.alloc(p.bytes);if((await archive.read(bytes,0,bytes.length,p.offset)).bytesRead!==bytes.length||sha256(bytes)!==p.sha256)throw Error('Archived packet changed at '+i);
   const normalized=p.type==='video'?avcc(bytes):bytes;
   if(Number(actual.size)!==normalized.length||actual.data_hash!=='SHA256:'+sha256(normalized))throw Error('Recording payload differs from signed packets at '+i);
   const pts=Number(p.pts)*p.timebase_num/p.timebase_den;if(!Number.isFinite(pts)||!Number.isFinite(Number(actual.pts_time))||Math.abs(Number(actual.pts_time)-pts)>.00051)throw Error('Recording presentation time mismatch at '+i);
   if(actual.dts_time!=='N/A'&&(!Number.isFinite(Number(actual.dts_time))||Math.abs(Number(actual.dts_time)-Number(p.dts)*p.timebase_num/p.timebase_den)>.00051))throw Error('Recording decoding time mismatch at '+i);
   if(actual.flags.startsWith('K')!==p.keyframe)throw Error('Recording keyframe flag mismatch at '+i);
   i++;if(throughPackets&&i===count){intentional=true;child.kill();break;}
  }await finished;
  // OBS's muxer discards callbacks at/after stop_ts. These are a terminal
  // encoder drain, not file contents. Accept only after the exact file seal
  // has been checked; an unsealed QR prefix never gets this allowance.
  const drain=count-i;
  if(drain){const end=packets[i-1],endTime=end&&Number(end.dts)*end.timebase_num/end.timebase_den;
   if(!sealedMediaVerified||throughPackets||!i||drain>8||packets.slice(i).some(p=>{const t=Number(p.dts)*p.timebase_num/p.timebase_den;return !Number.isFinite(t)||t<endTime-.001||t>endTime+.1}))throw Error('Recording is missing committed packets: '+i+' of '+count);
  }
  return {profile:'obs-mkv-h264-aac-v1',packets:i,unmuxed_tail_packets:drain,prefix:!!throughPackets,matched:true};
 }finally{clearTimeout(timeout);lines.close();intentional=true;child.kill();await archive.close();}
}

