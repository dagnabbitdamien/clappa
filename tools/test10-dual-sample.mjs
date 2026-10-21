import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
const adb=path.resolve('.tools/android-sdk/platform-tools/adb.exe'),dir='docs/review10';
const run=(...a)=>execFileSync(adb,['-s','emulator-5556',...a],{encoding:'utf8',timeout:20000});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function nodes(){run('shell','uiautomator','dump','/sdcard/dual.xml');return [...run('shell','cat','/sdcard/dual.xml').matchAll(/<node\b[^>]*>/g)].map(m=>Object.fromEntries([...m[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(a=>[a[1],a[2]])));}
async function find(label){for(let i=0;i<8;i++){const n=nodes().find(n=>(n.text===label||n['content-desc']===label)&&n.enabled==='true');if(n)return n;await pause(300)}throw Error('Missing '+label)}
function tap(n){const b=n.bounds.match(/\d+/g).map(Number);run('shell','input','tap',String((b[0]+b[2])/2),String((b[1]+b[3])/2));}
function shot(name){fs.writeFileSync(dir+'/'+name+'.png',execFileSync(adb,['-s','emulator-5556','exec-out','screencap','-p'],{maxBuffer:20000000}));}
run('install','-r','android/app/build/outputs/apk/debug/app-debug.apk');run('shell','pm','grant','org.clappa.app','android.permission.CAMERA');run('shell','am','force-stop','org.clappa.app');run('shell','am','start','-W','-n','org.clappa.app/.MainActivity');
tap(await find('Settings'));tap(await find('Try two cameras · experimental'));await pause(1500);
shot('dual-camera');
let text=nodes().filter(n=>n.text).map(n=>n.text).join(' | ');
if(!/Both cameras are open|does not expose|cannot run/.test(text))throw Error('Camera capability result not shown: '+text);
const supported=text.includes('Both cameras are open');let sample=null;
if(supported){
  for(let i=0;i<3;i++){
    let n=nodes().find(n=>n.text==='Sample both views');
    if(!n){run('shell','input','swipe','500','1800','500','900','350');n=await find('Sample both views')}
    tap(n);await pause(2700);text=nodes().filter(n=>n.text).map(n=>n.text).join(' | ');
    if(text.includes('Two separate images saved'))break;
  }
  shot('dual-camera-sampled');
  if(!text.includes('Two separate images saved'))throw Error('Camera sample did not save: '+text);
  const folders=run('shell','run-as','org.clappa.app','ls','files/dual-camera-samples').trim().split(/\s+/).sort();
  const folder='files/dual-camera-samples/'+folders.at(-1);
  sample=JSON.parse(run('shell','run-as','org.clappa.app','cat',folder+'/sample.json'));
  if(sample.signed!==false||sample.delivery_skew_ms>120)throw Error('Invalid sample metadata');
  for(const role of ['front','rear'])fs.writeFileSync(dir+'/dual-'+role+'.jpg',execFileSync(adb,['-s','emulator-5556','exec-out','run-as','org.clappa.app','cat',folder+'/'+role+'.jpg'],{maxBuffer:10000000}));
  run('shell','input','swipe','500','500','500','1800','350');await pause(400);shot('dual-camera');
}
fs.writeFileSync(dir+'/dual-camera-capability.json',JSON.stringify({device:'Android emulator',screen:text,supported,sample,physicalDualCaptureVerified:false},null,2));
run('shell','input','keyevent','4');console.log(JSON.stringify({supported,sample}));
