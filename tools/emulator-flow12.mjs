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
run('shell','am','start','-W','-n','org.clappa.app.review/org.clappa.app.ReviewFlowActivity','--es','pairingData',Buffer.from(JSON.stringify(pairing)).toString('base64url'));
tap(await wait('Start recording'));await wait('Tap to clap!');await shot('flow-ready');
// Avoid repeated UI dumps/screenshots inside the signed ten-second deadline.
// First deliberately miss a challenge, then continue within the same recording.
tap(await wait('Tap to clap!'));await wait('Capture');await pause(11500);await wait('Tap to clap!');await shot('flow-missed');
tap(await wait('Tap to clap!'));const captureAction=await wait('Capture');await shot('flow-challenge');tap(captureAction);const shutter=await wait('Capture photo');await shot('flow-camera');tap(shutter);
await wait('End session',35);await shot('flow-sent');
// An extra photo more than six seconds later must still be accepted.
await pause(8000);const offer=nodes().find(n=>n.text.startsWith('Add a photo'));if(!offer)throw Error('Missing extra-photo offer');tap(offer);tap(await wait('Capture photo'));await wait('End session',35);await pause(1500);await shot('flow-extra');
tap(await wait('End session'));tap(await wait('Capture'));tap(await wait('Capture photo'));await wait('Stop & seal',35);tap(await wait('Stop & seal'));
await wait('Start another recording',40);await shot('flow-sealed');
const state=JSON.parse(await fs.readFile('output/native-test/obs-state.json'));
const folder=`output/native-test/sessions/${state.session_id}/proof`;
const pub=JSON.parse(run('shell','run-as','org.clappa.app.review','cat',`files/proof/${state.session_id}/public-key.json`));
const result=await verifyBundle(folder,state.media_path,{trustedKey:pub.key_id});
if(result.status!=='EXACT ORIGINAL VERIFIED')throw Error(JSON.stringify(result));
const captures=[];let issuedPrompt;for(const f of await fs.readdir(folder+'/events')){const e=JSON.parse(await fs.readFile(folder+'/events/'+f));if(e.payload.type==='challenge-issued')issuedPrompt=e.payload.data.prompt_id;if(e.payload.type==='challenge-captured')captures.push({prompt:issuedPrompt,responseMs:e.payload.data.response_ms,pairMs:e.payload.data.pair_ms,gapMs:e.payload.data.b_at-e.payload.data.a_at,photoA:e.payload.data.photo_a.original,photoB:e.payload.data.photo_b.original});}
await fs.writeFile(reviewDir+'/emulator-flow-result.json',JSON.stringify({result,session:state.session_id,media:state.media_path,captures,extraPhotos:(await Promise.all((await fs.readdir(folder+'/events')).map(async f=>JSON.parse(await fs.readFile(folder+'/events/'+f)).payload.type))).filter(t=>t==='claim').length,limitation:'Android emulator camera; validates capture sequencing and transport, not physical RGB light reflected from a face.'},null,2));
console.log(JSON.stringify({result,captureGaps:captures.map(x=>x.gapMs)}));
