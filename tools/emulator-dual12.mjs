import {execFileSync} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {verifyBundle} from '../verifier/proof.mjs';
const adb=path.resolve('.tools/android-sdk/platform-tools/adb.exe');
const reviewDir=process.argv[2]??'docs/review7';
const run=(...args)=>execFileSync(adb,['-s','emulator-5556',...args],{encoding:'utf8',timeout:30000,maxBuffer:2000000});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const unescape=s=>s.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>');
function nodes(){run('shell','uiautomator','dump','/sdcard/flow.xml');return [...run('shell','cat','/sdcard/flow.xml').matchAll(/<node\b[^>]*>/g)].map(m=>Object.fromEntries([...m[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(a=>[a[1],unescape(a[2])])));}
async function wait(label,seconds=25){const end=Date.now()+seconds*1000;let last;do{last=nodes();const found=last.find(n=>(n.text===label||n['content-desc']===label)&&n.enabled==='true');if(found)return found;await pause(250)}while(Date.now()<end);throw Error('Waiting for '+label+': '+last.filter(n=>n.text).map(n=>n.text).join(' | '));}
function tap(node){const n=node.bounds.match(/\d+/g).map(Number);run('shell','input','tap',String(Math.round((n[0]+n[2])/2)),String(Math.round((n[1]+n[3])/2)));}
async function shot(name){await fs.writeFile(reviewDir+'/'+name+'.png',execFileSync(adb,['-s','emulator-5556','exec-out','screencap','-p'],{timeout:30000,maxBuffer:20000000}));}
run('shell','wm','user-rotation','lock','0');
const pairing=JSON.parse(await fs.readFile('output/native-test/pairing.json'));
if(!pairing.url.endsWith(':17444'))throw Error('Only isolated OBS is permitted');
pairing.url='https://10.0.2.2:17444';
run('shell','am','force-stop','org.clappa.app.review');
run('shell','am','start','-W','-n','org.clappa.app.review/org.clappa.app.ReviewFlowActivity','--ez','dual','true','--es','pairingData',Buffer.from(JSON.stringify(pairing)).toString('base64url'));

tap(await wait('Start recording'));await wait('Tap to clap!');
tap(await wait('Tap to clap!'));tap(await wait('Capture'));const shutter=await wait('Capture both views');await shot('dual-camera-portrait');tap(shutter);await wait('End session',35);await shot('dual-sent');await pause(8500);
tap(await wait('End session'));tap(await wait('Capture'));tap(await wait('Capture both views'));await wait('Stop & seal',35);tap(await wait('Stop & seal'));await wait('Start another recording',40);
const state=JSON.parse(await fs.readFile('output/native-test/obs-state.json'));const folder='output/native-test/sessions/'+state.session_id+'/proof';const result=await verifyBundle(folder,state.media_path);
if(result.status!=='EXACT ORIGINAL VERIFIED'||result.dual_view_responses!==2)throw Error(JSON.stringify(result));
const captures=[];for(const f of await fs.readdir(folder+'/events')){const e=JSON.parse(await fs.readFile(folder+'/events/'+f));if(e.payload.type==='challenge-captured')captures.push(e.payload.data)}
await fs.writeFile(reviewDir+'/dual-emulator-flow.json',JSON.stringify({result,session:state.session_id,media:state.media_path,captures,expectedQrEvents:2,extraPhotos:0,limitation:'Real concurrent CameraX pipeline on emulated cameras, including screen-colour and rear-torch commands. Does not establish physical Samsung/iPhone illumination or exposure synchronisation.'},null,2));console.log(JSON.stringify({result,captures}));
