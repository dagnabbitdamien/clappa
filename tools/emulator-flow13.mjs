import {execFileSync} from 'node:child_process';import fs from 'node:fs/promises';import path from 'node:path';
import {verifyBundle} from '../verifier/proof.mjs';
const adb=path.resolve('.tools/android-sdk/platform-tools/adb.exe'),dir='docs/review13';
const run=(...args)=>execFileSync(adb,['-s','emulator-5556',...args],{encoding:'utf8',timeout:30000,maxBuffer:2000000});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function nodes(){run('shell','uiautomator','dump','/sdcard/flow.xml');return [...run('shell','cat','/sdcard/flow.xml').matchAll(/<node\b[^>]*>/g)].map(m=>Object.fromEntries([...m[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(a=>[a[1],a[2].replaceAll('&amp;','&').replaceAll('&quot;','"')])));}
async function wait(label,seconds=30){const end=Date.now()+seconds*1000;let last=[];do{last=nodes();const n=last.find(n=>(n.text===label||n['content-desc']===label)&&n.enabled==='true');if(n)return n;await pause(200)}while(Date.now()<end);throw Error('Missing '+label+': '+last.filter(n=>n.text).map(n=>n.text).join(' | '));}
function tap(n){const b=n.bounds.match(/\d+/g).map(Number);run('shell','input','tap',String(Math.round((b[0]+b[2])/2)),String(Math.round((b[1]+b[3])/2)));}
async function shot(name){await fs.writeFile(dir+'/'+name+'.png',execFileSync(adb,['-s','emulator-5556','exec-out','screencap','-p'],{timeout:30000,maxBuffer:20000000}));}
run('install','-r','android/app/build/outputs/apk/review/app-review.apk');run('shell','pm','grant','org.clappa.app.review','android.permission.CAMERA');run('shell','wm','user-rotation','lock','0');
const pairing=JSON.parse(await fs.readFile('output/native-test/pairing.json'));if(!pairing.url.endsWith(':17444'))throw Error('Only isolated OBS allowed');pairing.url='https://10.0.2.2:17444';
run('shell','am','force-stop','org.clappa.app.review');run('shell','am','start','-W','-n','org.clappa.app.review/org.clappa.app.ReviewFlowActivity','--es','pairingData',Buffer.from(JSON.stringify(pairing)).toString('base64url'),'--ez','chatFixture','true');
tap(await wait('Start recording'));await wait('Chat would like a challenge!');await shot('chat-invitation');
const before=JSON.parse(await fs.readFile('output/native-test/obs-state.json'));const folder=`output/native-test/sessions/${before.session_id}/proof`;
async function events(){return Promise.all((await fs.readdir(folder+'/events')).sort().map(async f=>JSON.parse(await fs.readFile(folder+'/events/'+f)).payload));}
if((await events()).some(e=>e.type==='challenge-issued'))throw Error('Invitation started a challenge without acceptance');
tap(await wait('Take a challenge'));tap(await wait('Capture'));tap(await wait('Capture photo'));await wait('Add a photo',35);await shot('additional-offer');
await pause(1500);tap(await wait('Add a photo'));tap(await wait('Capture photo'));await wait('Additional photo received by OBS!',35);
for(let i=0;i<3;i++){await pause(1300);if(nodes().some(n=>n.text==='Add a photo'))throw Error('Additional offer reopened after receipt');}
await shot('additional-received');
const claims=(await events()).filter(e=>e.type==='claim');if(claims.length!==1)throw Error('Expected exactly one signed claim');
const detached=JSON.parse(await fs.readFile(folder+'/media-proofs/'+String(claims[0].seq).padStart(6,'0')+'.json'));if(detached.proof.payload.event_sha256==null)throw Error('Claim lacks OBS media proof');
const tile=JSON.parse(await fs.readFile('output/native-test/tile.json'));if(!tile.frames?.length||tile.until<=claims[0].at)throw Error('Extra-photo tile did not activate');
tap(await wait('End session'));tap(await wait('Capture'));tap(await wait('Capture photo'));await wait('Stop & seal',35);tap(await wait('Stop & seal'));await wait('Start another recording',45);await shot('sealed');
const state=JSON.parse(await fs.readFile('output/native-test/obs-state.json'));const result=await verifyBundle(folder,state.media_path);if(result.status!=='EXACT ORIGINAL VERIFIED')throw Error(JSON.stringify(result));
await fs.writeFile(dir+'/emulator-flow-result.json',JSON.stringify({session:state.session_id,media:state.media_path,result,claims:claims.length,offerDidNotReopen:true,claimTileFrames:tile.frames.length,chatInvitation:'Review-only injection into production handler, duplicate delivered twice, starts only after acceptance. No live Twitch credentials.',limitation:'Emulator camera; no physical S22 illumination or haptic sensation check.'},null,2));console.log(JSON.stringify({result,claims:claims.length,offerDidNotReopen:true}));
