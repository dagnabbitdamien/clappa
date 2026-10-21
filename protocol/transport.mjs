import {encodeShards,recoverShards} from './erasure.mjs';
import {deflateRawSync,inflateRawSync} from 'node:zlib';
import {canonical,sha256,decode,validate,keyObject,verifySignature,parseStrict} from '../verifier/proof.mjs';
import {validateMediaContext} from './evidence.mjs';
import {encodeBase45,decodeBase45} from './base45.mjs';
import {validateIdentityBinding} from './twitch-identity.mjs';
export function crc32(b){let c=0xffffffff;for(const x of b){c^=x;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return ((c^0xffffffff)>>>0).toString(16).padStart(8,'0');}
export function encodeTransport(event,key,photos,{version=3,context,identity}={}){
  validate('event',event);verifySignature(event,keyObject(key));
  if(event.payload.key_id!==key.key_id)throw Error('Event signing identity mismatch');
  if(context)validateMediaContext(event,key,context);
  if(identity)validateIdentityBinding(identity,event,key);
  const type=event.payload.type;if(!['challenge-captured','claim'].includes(type))throw Error('Not a photo event');
  const expected=type==='claim'?[event.payload.data.photo.proof]:[event.payload.data.photo_a.proof,event.payload.data.photo_b.proof];
  const hashesOnly=context?.challenge?.payload?.data?.qr_profile==='hashes-v1';
  if(hashesOnly&&!context?.challenge?.payload?.data?.freshness)throw Error('Hash-only QR requires authenticated freshness context');
  if(photos.length!==(hashesOnly?0:expected.length))throw Error('Proof photo count');
  photos.forEach((b,i)=>{if(b.length!==expected[i].bytes||sha256(b)!==expected[i].sha256)throw Error('Proof photo mismatch');});
  const compressed=deflateRawSync(Buffer.from(canonical({event,key,photos:photos.map(b=>b.toString('base64url')),...(context?{context}:{}),...(identity?{identity}:{})})),{level:9});
  if(compressed.length>8192)throw Error('Proof transport exceeds 8 KiB budget');
  if(version===3){const shards=encodeShards(compressed),k=shards.length/2;return shards.map((data,index)=>{const h=Buffer.alloc(42);Buffer.from(sha256(compressed),'hex').copy(h);h.writeUInt16BE(index,32);h.writeUInt16BE(k,34);h.writeUInt16BE(compressed.length,36);h.writeUInt32BE(parseInt(crc32(data),16),38);return 'CLAPPA3:'+encodeBase45(Buffer.concat([h,data]));});}
  if(![1,2].includes(version))throw Error('Unsupported transport version');
  const chunkSize=version===2?200:400,count=Math.ceil(compressed.length/chunkSize),digest=sha256(compressed);
  return Array.from({length:count},(_,index)=>{const data=compressed.subarray(index*chunkSize,(index+1)*chunkSize);
    if(version===1)return canonical({magic:'CLAPPA',version:1,session:event.payload.session_id,digest,index,count,crc32:crc32(data),data:data.toString('base64url')});
    const header=Buffer.alloc(40);Buffer.from(digest,'hex').copy(header);header.writeUInt16BE(index,32);header.writeUInt16BE(count,34);header.writeUInt32BE(parseInt(crc32(data),16),36);
    return 'CLAPPA2:'+encodeBase45(Buffer.concat([header,data]));
  });
}
export function parseTransportFrame(frame){
 if(typeof frame!=='string'||frame.length>1500)throw Error('Frame too large');let o;
 if(frame.startsWith('CLAPPA3:')){
  const b=decodeBase45(frame.slice(8));if(b.length!==238)throw Error('Bad erasure frame size');
  const count=b.readUInt16BE(34),index=b.readUInt16BE(32),length=b.readUInt16BE(36),data=b.subarray(42);
  if(count<1||count>42||index>=2*count||length<1||length>8192||Math.ceil(length/196)!==count||crc32(data)!==b.subarray(38,42).toString('hex'))throw Error('Bad erasure frame');
  return {magic:'CLAPPA',version:3,digest:b.subarray(0,32).toString('hex'),index,count,length,data:data.toString('base64url')};
 }
 if(frame.startsWith('CLAPPA2:')){
  const b=decodeBase45(frame.slice(8));if(b.length<41||b.length>240)throw Error('Bad frame size');
  o={magic:'CLAPPA',version:2,digest:b.subarray(0,32).toString('hex'),index:b.readUInt16BE(32),count:b.readUInt16BE(34),crc32:b.subarray(36,40).toString('hex'),data:b.subarray(40).toString('base64url')};
 }else{o=JSON.parse(frame);if(o.version!==1||typeof o.session!=='string')throw Error('Bad legacy frame');}
 if(o.magic!=='CLAPPA'||![1,2].includes(o.version)||!Number.isInteger(o.count)||o.count<1||o.count>(o.version===2?41:21)||!Number.isInteger(o.index)||o.index<0||o.index>=o.count||typeof o.digest!=='string'||!(/^[a-f0-9]{64}$/).test(o.digest))throw Error('Bad frame');
 const bytes=decode(o.data);if(!bytes.length||bytes.length>(o.version===2?200:400)||crc32(bytes)!==o.crc32)throw Error('CRC mismatch');return o;
}
export function decodeTransport(frames){
  const chunks=new Map();let meta;
  if(frames.length>256)throw Error('Too many frames');
  for(const frame of frames){const o=parseTransportFrame(frame);const b=decode(o.data);
    if(meta&&(meta.version!==o.version||meta.digest!==o.digest||meta.count!==o.count||meta.session!==o.session||meta.length!==o.length))throw Error('Mixed event chunks');meta=o;
    if(chunks.has(o.index)&&!chunks.get(o.index).equals(b))throw Error('Conflicting duplicate');chunks.set(o.index,b);
  }
  if(!meta||chunks.size<meta.count)throw Error('Incomplete QR transport');
  const b=meta.version===3?recoverShards(chunks,meta.count,meta.length):Buffer.concat(Array.from({length:meta.count},(_,i)=>chunks.get(i)));if(sha256(b)!==meta.digest)throw Error('Transport digest mismatch');
  const o=parseStrict(new TextDecoder('utf-8',{fatal:true}).decode(inflateRawSync(b,{maxOutputLength:128*1024})));validate('event',o.event);verifySignature(o.event,keyObject(o.key));
  if(meta.version===1&&o.event.payload.session_id!==meta.session)throw Error('Session mismatch');
  encodeTransport(o.event,o.key,o.photos.map(decode),{context:o.context,identity:o.identity});return o;
}

