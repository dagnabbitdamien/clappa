import {openTestObs} from './obs-test-client.mjs';
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

const client=await openTestObs();const outcomes=[];
try{
for(const attempt of ['pending-challenge','no-challenge','reopened-phone']){
 if(attempt==='reopened-phone'){run('shell','am','force-stop','org.clappa.app.review');run('shell','am','start','-W','-n','org.clappa.app.review/org.clappa.app.MainActivity');tap(await wait('Start recording',30));}
 else tap(await wait('Start another recording'));
 await wait('Tap to clap!');
 if(attempt==='pending-challenge'){tap(await wait('Tap to clap!'));await wait('Capture');}
 await client.request('StopRecord');await wait('Start another recording',40);
 const state=JSON.parse(await fs.readFile('output/native-test/obs-state.json'));
 const result=await verifyBundle('output/native-test/sessions/'+state.session_id+'/proof',state.media_path);
 if(result.status!=='EXACT ORIGINAL VERIFIED')throw Error(JSON.stringify(result));
 if(attempt==='pending-challenge'&&result.missed_challenges[0]?.reason!=='cancelled')throw Error('Missing cancelled challenge');
 outcomes.push({attempt,session:state.session_id,result});
}
await shot('flow-repeat-sealed');await fs.writeFile(reviewDir+'/lifecycle-results.json',JSON.stringify({pairedAgain:false,outcomes},null,2));console.log(JSON.stringify(outcomes));
}finally{client.close();}
