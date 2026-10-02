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

run('install','-r','android/app/build/outputs/apk/review/app-review.apk');run('shell','wm','user-rotation','lock','0');run('shell','am','start','-W','-n','org.clappa.app.review/org.clappa.app.MainActivity');
tap(await wait('Settings'));await shot('settings-camera-mode');
for(let attempt=0;attempt<6;attempt++){
 const all=nodes();if(all.some(n=>n.text==='Export private backup'&&n.enabled==='true'))break;
 const scroll=all.find(n=>n.scrollable==='true');if(!scroll)throw Error('Settings have no scroll area');const b=scroll.bounds.match(/\d+/g).map(Number);run('shell','input','swipe',String((b[0]+b[2])/2),String(b[3]-40),String((b[0]+b[2])/2),String(b[1]+60),'450');await pause(400);
}
await shot('settings-identity');tap(await wait('Export private backup'));await shot('identity-export-dialog');run('shell','wm','user-rotation','lock','1');await pause(700);await shot('identity-export-landscape');run('shell','input','keyevent','4');run('shell','wm','user-rotation','lock','0');
console.log('Saved native identity and camera-mode settings.');
