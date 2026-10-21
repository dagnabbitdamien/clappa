// Local degradation probes; these are not Twitch/YouTube certification.
import {readFile,mkdir,writeFile,readdir,unlink} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
import jsQR from 'jsqr';
import {decodeTransport,parseTransportFrame} from '../protocol/transport.mjs';
const reportPath=process.argv[2]||'output/native-integration-result.json';
const source=JSON.parse(await readFile(reportPath));const {media}=source;const expectedEvents=source.expectedQrEvents??(source.captures?.length??source.result?.timed_responses??0)+(source.extraPhotos??0);
const base=process.argv[3]||'output/qr-transcode-audit';await mkdir(base,{recursive:true});
const reports=[];
for(const [name,width,height,crf,blur] of [['1080p',1920,1080,23,0],['720p',1280,720,23,0],['480p',854,480,28,0],['360p',640,360,28,0],['720p-blur',1280,720,23,0.6]]){
 const dir=`${base}/${name}`;await mkdir(dir,{recursive:true});
 for(const file of await readdir(dir))if(/^\d+\.png$/.test(file))await unlink(`${dir}/${file}`);
 const video=`${dir}/video.mp4`;
 execFileSync('.tools/native-deps/bin/ffmpeg.exe',['-hide_banner','-loglevel','error','-i',media,'-vf',`scale=${width}:${height}:flags=bicubic${blur?`,gblur=sigma=${blur}`:''}`,'-an','-c:v','libx264','-crf',String(crf),'-preset','fast','-pix_fmt','yuv420p','-y',video]);
 execFileSync('.tools/native-deps/bin/ffmpeg.exe',['-hide_banner','-loglevel','error','-i',video,'-vf',`fps=12,crop=${Math.floor(320*width/1920)}:${Math.floor(320*height/1080)}:${Math.floor(1572*width/1920)}:${Math.floor(700*height/1080)}`,'-y',`${dir}/%03d.png`]);
 const groups=new Map();let decodedFrames=0;
 for(const file of (await readdir(dir)).filter(x=>x.endsWith('.png'))){
  const {data,info}=await sharp(`${dir}/${file}`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const qr=jsQR(new Uint8ClampedArray(data),info.width,info.height);if(!qr)continue;
  let frame;try{frame=parseTransportFrame(qr.data);}catch{continue;}if(frame.magic!=='CLAPPA')continue;
  decodedFrames++;if(!groups.has(frame.digest))groups.set(frame.digest,{count:frame.count,frames:new Set()});groups.get(frame.digest).frames.add(qr.data);
 }
 let recovered=0;const chunks=[];
 for(const g of groups.values()){chunks.push({found:g.frames.size,required:g.count});try{const p=decodeTransport([...g.frames]);if(['challenge-captured','claim'].includes(p.event.payload.type))recovered++;}catch{}}
 reports.push({name,width,height,crf,blur,decodedFrames,recoveredEvents:recovered,expectedEvents,chunks});
 console.log(JSON.stringify(reports.at(-1)));
}
await writeFile(`${base}/results.json`,JSON.stringify({media,sourceReport:reportPath,qrCropAt1080p:[1572,700,320,320],limitation:'Local x264 re-encoding only; no Twitch/YouTube platform round trip. Payload and camera type are those in the source report.',reports},null,2));
