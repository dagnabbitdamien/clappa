import fs from 'node:fs/promises';import {execFileSync} from 'node:child_process';import path from 'node:path';import sharp from 'sharp';
import {encodeTransport,parseTransportFrame} from '../protocol/transport.mjs';
const dir='docs/review12';const node=process.execPath;const adb=path.resolve('.tools/android-sdk/platform-tools/adb.exe');
for(const [source,name]of [['review-identity.json','identity-roundtrip.json'],['review-capabilities.json','camera-capabilities.json']])await fs.writeFile(dir+'/'+name,execFileSync(adb,['-s','emulator-5556','shell','run-as','org.clappa.app.review','cat','files/'+source]));
const profiles=[];
for(const name of ['emulator-flow-result.json','dual-emulator-flow.json']){
 const report=JSON.parse(await fs.readFile(dir+'/'+name));const root='output/native-test/sessions/'+report.session+'/proof';const key=JSON.parse(await fs.readFile(root+'/public-key.json'));
 for(const file of await fs.readdir(root+'/events')){const event=JSON.parse(await fs.readFile(root+'/events/'+file));if(!['challenge-captured','claim'].includes(event.payload.type))continue;const context=JSON.parse(await fs.readFile(root+'/media-proofs/'+file));const frames=encodeTransport(event,key,[],{context});const refs=event.payload.type==='claim'?[event.payload.data.photo]:[event.payload.data.photo_a,event.payload.data.photo_b,...(event.payload.data.dual?[event.payload.data.dual.rear_a,event.payload.data.dual.rear_b]:[])];const photos=[];for(const ref of refs){const m=await sharp(root+'/'+ref.original.path).metadata();photos.push({width:m.width,height:m.height,bytes:ref.original.bytes})}
 profiles.push({run:name,event:event.payload.seq,type:event.payload.type,dual:!!event.payload.data.dual,compressedBytes:frames.map(parseTransportFrame).reduce((n,f)=>n+Buffer.from(f.data,'base64url').length,0),frames:frames.length,embeddedImages:0,photos});
 }
}
await fs.writeFile(dir+'/payload-measurements.json',JSON.stringify(profiles,null,2));
await fs.copyFile('output/qr-audit-test12/results.json',dir+'/qr-recovery.json');await fs.copyFile('output/test12-node-tests.txt',dir+'/protocol-tests.txt');
const summary=[];for(const file of await fs.readdir('android/app/build/test-results/testDebugUnitTest'))if(file.endsWith('.xml')){const xml=await fs.readFile('android/app/build/test-results/testDebugUnitTest/'+file,'utf8');const root=xml.match(/<testsuite [^>]+>/)[0];summary.push(Object.fromEntries([...root.matchAll(/(name|tests|failures|errors)="([^"]+)"/g)].map(m=>[m[1],m[2]])))}
await fs.writeFile(dir+'/android-tests.json',JSON.stringify(summary,null,2));
let collect=await fs.readFile('tools/collect-review12.mjs','utf8');collect=collect.replace('emulator-flow-result.json','dual-emulator-flow.json').replaceAll('obs-motion','dual-motion').replaceAll('obs-full-scene','dual-full-scene').replaceAll('obs-camera-proof','dual-camera-proof');await fs.writeFile('tools/collect-dual12.mjs',collect);execFileSync(node,['tools/collect-dual12.mjs'],{stdio:'inherit'});
console.log(JSON.stringify(profiles.map(p=>({type:p.type,dual:p.dual,bytes:p.compressedBytes,frames:p.frames,photos:p.photos.map(x=>[x.width,x.height])}))));
