import {execFileSync} from 'node:child_process';import fs from 'node:fs';import path from 'node:path';
const adb=path.resolve('.tools/android-sdk/platform-tools/adb.exe');const app='org.clappa.app.review';
const run=(...a)=>execFileSync(adb,['-s','emulator-5556',...a],{encoding:'utf8',timeout:30000});const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(text){for(let i=0;i<15;i++){run('shell','uiautomator','dump','/sdcard/connection.xml');const x=run('shell','cat','/sdcard/connection.xml');if(x.includes(`text="${text}"`))return x;await pause(500)}throw Error('Missing '+text)}
function start(){run('shell','am','force-stop',app);run('shell','am','start','-W','-n',app+'/org.clappa.app.ReviewFlowActivity')}
function shot(name){fs.writeFileSync('docs/review18/'+name+'.png',execFileSync(adb,['-s','emulator-5556','exec-out','screencap','-p'],{maxBuffer:20000000}));}
run('install','-r','android/app/build/outputs/apk/review/app-review.apk');run('shell','pm','grant',app,'android.permission.CAMERA');run('shell','wm','user-rotation','lock','0');
const original=JSON.parse(fs.readFileSync('output/native-test/pairing.json'));const p={...original,url:'https://10.0.2.2:17444'};
run('shell','am','force-stop',app);run('shell','am','start','-W','-n',app+'/org.clappa.app.ReviewFlowActivity','--es','pairingData',Buffer.from(JSON.stringify(p)).toString('base64url'));
await wait('Start recording');console.log('Initial pairing passed');shot('connected-portrait');
start();await wait('Start recording');console.log('Phone relaunch connected without scanning');
execFileSync('powershell',['-NoProfile','-ExecutionPolicy','Bypass','-File','tools/restart-review-obs.ps1'],{timeout:40000});
const after=JSON.parse(fs.readFileSync('output/native-test/pairing.json'));if(after.token!==original.token||after.cert_sha256!==original.cert_sha256)throw Error('Restart lost pairing');
start();await wait('Start recording');console.log('OBS restart preserved credentials; phone connected without scanning');
run('shell','wm','user-rotation','lock','1');await pause(1200);shot('connected-landscape');run('shell','wm','user-rotation','lock','0');
fs.writeFileSync('docs/review18/connection-result.json',JSON.stringify({initialPair:true,phoneRestart:true,obsRestart:true,credentialsStable:true},null,2));
