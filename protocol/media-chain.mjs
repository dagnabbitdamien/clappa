import {createHash} from 'node:crypto';
import {readFile,open,stat} from 'node:fs/promises';
import {canonical,sha256,parseStrict} from '../verifier/proof.mjs';
export const initialHead=d=>sha256(Buffer.from('CLAPPA-OUTPUT-v1\0'+canonical(d)));
export function nextHead(prev,packet){return createHash('sha256').update('CLAPPA-PACKET-v1\0').update(Buffer.from(prev,'hex')).update(canonical(packet)).digest('hex');}
export class MediaChain {
  constructor(descriptor){this.descriptor=descriptor;this.head=initialHead(descriptor);this.packets=0;this.bytes=0;}
  append(meta,bytes){
    const p={seq:this.packets,offset:this.bytes,type:meta.type,track:meta.track,pts:String(meta.pts),dts:String(meta.dts),timebase_num:meta.timebase_num,timebase_den:meta.timebase_den,keyframe:meta.keyframe,bytes:bytes.length,sha256:sha256(bytes)};
    this.head=nextHead(this.head,p);this.packets++;this.bytes+=bytes.length;return p;
  }
  snapshot(){return {output_id:this.descriptor.output_id,role:this.descriptor.role,packets:this.packets,bytes:this.bytes,head:this.head,complete:true};}
}
export async function verifyMediaArchive(descriptor,manifestPath,archivePath,snapshots,terminal,{prefix=false}={}){
  if((await stat(manifestPath)).size>256*1024*1024)throw Error('Packet manifest too large');const text=await readFile(manifestPath,'utf8');
  const lines=text.trim()?text.trim().split('\n'):[];const chain=new MediaChain(descriptor);
  const expected=new Map();for(const s of [...snapshots,terminal]){if(s.output_id!==descriptor.output_id||s.role!==descriptor.role||s.complete!==true)throw Error('Output identity/coverage mismatch');if(expected.has(s.packets)&&canonical(expected.get(s.packets))!==canonical(s))throw Error('Conflicting output checkpoint');expected.set(s.packets,s);}
  const match=()=>{if(expected.has(chain.packets)&&canonical(expected.get(chain.packets))!==canonical(chain.snapshot()))throw Error('Media checkpoint mismatch');};match();
  const file=await open(archivePath,'r');try{
    for(const line of lines){if(prefix&&chain.packets===terminal.packets)break;const p=parseStrict(line);if(!Number.isSafeInteger(p.bytes)||p.bytes<1||p.bytes>32*1024*1024)throw Error('Packet size invalid');
      if(!['audio','video'].includes(p.type)||!Number.isSafeInteger(p.track)||p.track<0||p.track>63||typeof p.keyframe!=='boolean'||!/^[-]?\d+$/.test(p.pts)||!/^[-]?\d+$/.test(p.dts)||!Number.isInteger(p.timebase_num)||p.timebase_num<1||!Number.isInteger(p.timebase_den)||p.timebase_den<1)throw Error('Invalid packet metadata');
      const bytes=Buffer.alloc(p.bytes);const read=await file.read(bytes,0,p.bytes,chain.bytes);if(read.bytesRead!==p.bytes)throw Error('Truncated packet archive');const rebuilt=chain.append(p,bytes);if(canonical(p)!==canonical(rebuilt))throw Error('Packet archive mismatch');match();
    }
    if(!prefix&&(await file.stat()).size!==chain.bytes)throw Error('Uncommitted trailing packet bytes');
  }finally{await file.close();}
  if(terminal.packets!==chain.packets||terminal.bytes!==chain.bytes||terminal.head!==chain.head)throw Error('Incomplete terminal coverage');
  if([...expected.keys()].some(n=>n>chain.packets))throw Error('Checkpoint beyond output');return chain.snapshot();
}

