import path from 'node:path';
import {realpath} from 'node:fs/promises';
import {decodeTransport} from '../protocol/transport.mjs';
import {validateMediaContext} from '../protocol/evidence.mjs';
import {verifyMediaArchive} from '../protocol/media-chain.mjs';
import {matchRecording} from './recording.mjs';
export async function verifyQrMedia(frames,proofFolder,recording,options={}){
 const decoded=decodeTransport(frames);validateMediaContext(decoded.event,decoded.key,decoded.context);
 if(options.trustedKey&&options.trustedKey!==decoded.key.key_id)throw Error('Unexpected signing identity');
 const p=decoded.context.proof.payload,d=p.descriptors.find(d=>d.role==='recording'),snapshot=p.outputs.find(o=>o.output_id===d.output_id),root=await realpath(proofFolder);
 const inside=async suffix=>{const f=await realpath(path.join(root,'outputs',d.output_id+suffix));if(!f.startsWith(root+path.sep))throw Error('Proof path escapes folder');return f;};
 const manifest=await inside('.jsonl'),archive=await inside('.bin');await verifyMediaArchive(d,manifest,archive,[],snapshot,{prefix:true});
 const match=await matchRecording(d,manifest,archive,recording,{...options,throughPackets:snapshot.packets});
 return {status:'QR MEDIA PREFIX VERIFIED',session_id:p.session_id,key_id:decoded.key.key_id,covered_packets:snapshot.packets,media_binding:match,prompt:decoded.context.challenge.payload.data.prompt_id,embedded_photos:decoded.photos.length,displayed_photo_binding:'Requires the later sealed original; this prefix ends before the overlay.'};
}
