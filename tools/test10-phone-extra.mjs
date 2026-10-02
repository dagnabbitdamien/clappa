import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
const adb=path.resolve('.tools/android-sdk/platform-tools/adb.exe'),dir='docs/review10';
const run=(...a)=>execFileSync(adb,['-s','emulator-5556',...a],{encoding:'utf8',timeout:20000});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function nodes(){run('shell','uiautomator','dump','/sdcard/extra.xml');return [...run('shell','cat','/sdcard/extra.xml').matchAll(/<node\b[^>]*>/g)].map(m=>Object.fromEntries([...m[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(a=>[a[1],a[2]])));}
async function find(label){for(let i=0;i<10;i++){const n=nodes().find(n=>(n.text===label||n['content-desc']===label)&&n.enabled==='true');if(n)return n;await pause(300)}throw Error('Missing '+label)}
function tap(n){const b=n.bounds.match(/\d+/g).map(Number);run('shell','input','tap',String((b[0]+b[2])/2),String((b[1]+b[3])/2));}
function shot(name){fs.writeFileSync(dir+'/'+name+'.png',execFileSync(adb,['-s','emulator-5556','exec-out','screencap','-p'],{maxBuffer:20000000}));}
tap(await find('Settings'));tap(await find('Try two cameras · experimental'));await pause(1800);
const text=nodes().filter(n=>n.text).map(n=>n.text).join(' | ');shot('dual-camera');
if(!/does not expose|cannot run|Both cameras are open/.test(text))throw Error('Missing explicit camera capability result: '+text);
fs.writeFileSync(dir+'/dual-camera-capability.json',JSON.stringify({device:'Android emulator',screen:text,supported:text.includes('Both cameras are open'),physicalDualCaptureVerified:false},null,2));
tap(await find('Done'));tap(await find('Start another recording'));tap(await find('Tap to clap!'));await pause(11200);
await find('Stop incomplete recording');shot('phone-timeout');
const state=JSON.parse(fs.readFileSync('output/native-test/obs-state.json')),events=fs.readdirSync(`output/native-test/sessions/${state.session_id}/proof/events`).map(f=>JSON.parse(fs.readFileSync(`output/native-test/sessions/${state.session_id}/proof/events/${f}`)));
const issue=events.find(e=>e.payload.type==='challenge-issued'),failure=events.find(e=>e.payload.type==='challenge-failed');
if(failure?.payload.data.reason!=='timeout'||failure.payload.at-issue.payload.at<10000)throw Error('Missing signed timeout');
fs.writeFileSync(dir+'/phone-timeout.json',JSON.stringify({signedTimeout:true,elapsedMs:failure.payload.at-issue.payload.at,session:state.session_id,finalSealCreated:fs.existsSync(`output/native-test/sessions/${state.session_id}/proof/final-seal.json`)},null,2));
tap(await find('Stop incomplete recording'));await find('Start another recording');
console.log('PASS: explicit dual-camera capability result; signed phone timeout; incomplete recording stopped.');
