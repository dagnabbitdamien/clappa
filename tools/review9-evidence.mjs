import fs from 'node:fs/promises';import assert from 'node:assert/strict';import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {verifyBundle} from '../verifier/proof.mjs';import {verifyQrMedia} from '../verifier/qr-proof.mjs';import {encodeTransport} from '../protocol/transport.mjs';
const report=JSON.parse(await fs.readFile('docs/review9/emulator-flow-result.json')),folder=`output/native-test/sessions/${report.session}/proof`,pub=JSON.parse(await fs.readFile(folder+'/public-key.json'));
report.result=await verifyBundle(folder,report.media,{trustedKey:pub.key_id});assert.equal(report.result.status,'EXACT ORIGINAL VERIFIED');assert.equal(report.result.detached_media_proofs,2);await fs.writeFile('docs/review9/emulator-flow-result.json',JSON.stringify(report,null,2));
const prefixResults=[];
const changed='output/review9-changed-scene.mkv';execFileSync('C:/Program Files/ffmpeg/bin/ffmpeg.exe',['-v','error','-i',report.media,'-vf','drawbox=x=0:y=0:w=32:h=32:color=red:t=fill','-c:v','libx264','-preset','ultrafast','-c:a','copy','-y',changed],{windowsHide:true});
for(const name of await fs.readdir(folder+'/media-proofs')){
 const context=JSON.parse(await fs.readFile(folder+'/media-proofs/'+name)),event=JSON.parse(await fs.readFile(folder+'/events/'+name));const d=event.payload.data;
 const photos=await Promise.all([d.photo_a,d.photo_b].map(p=>fs.readFile(path.join(folder,p.proof.path))));const frames=encodeTransport(event,pub,photos,{context});
 const result=await verifyQrMedia(frames,folder,report.media,{trustedKey:pub.key_id});
 await assert.rejects(()=>verifyQrMedia(frames,folder,changed),/Recording payload differs|time mismatch|missing committed|order\/track/);
 prefixResults.push({...result,frames:frames.length,transplantedOntoChangedScene:'rejected'});
}
await fs.writeFile('docs/review9/prefix-results.json',JSON.stringify(prefixResults,null,2));console.log(prefixResults);
