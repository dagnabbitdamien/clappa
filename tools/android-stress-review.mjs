import {execFileSync,spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const adb=path.resolve('.tools/android-sdk/platform-tools/adb.exe');
const run=(...a)=>execFileSync(adb,['-s','emulator-5556',...a],{encoding:'utf8',timeout:25000});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let n=0;n<10;n++){run('shell','uiautomator','dump','/sdcard/stress.xml');const s=run('shell','cat','/sdcard/stress.xml');if(s.includes('text="CLAPPA"')){await pause(700);return s}await pause(250)}throw Error('Native screen missing')}
function shot(name){const png=execFileSync(adb,['-s','emulator-5556','exec-out','screencap','-p'],{maxBuffer:20000000});const w=png.readUInt32BE(16),h=png.readUInt32BE(20);if((h>w)!==name.includes('-portrait-'))throw Error(`Wrong screenshot orientation: ${name} ${w}x${h}`);fs.writeFileSync((process.argv[2]??'docs/review7')+'/'+name+'.png',png)}
try{
 run('shell','wm','fixed-to-user-rotation','enabled');
 run('shell','wm','density','450');
 run('shell','settings','put','system','font_scale','1.3');
 run('shell','cmd','overlay','enable-exclusive','--category','com.android.internal.systemui.navbar.threebutton');
 run('shell','cmd','overlay','enable','com.android.internal.display.cutout.emulation.hole');
 for(const [orientation,rotation] of [['portrait','0'],['landscape','1'],['landscape-reverse','3']]){
  run('shell','wm','user-rotation','lock',rotation);
  for(const phase of ['UNPAIRED','CHALLENGE','LOST']){
   run('shell','am','force-stop','org.clappa.app.review');run('shell','am','start','-W','-n','org.clappa.app.review/org.clappa.app.ReviewActivity','--es','phase',phase);
   await ready();shot(`stress-${orientation}-${phase.toLowerCase()}`);
  }
 }
}finally{
 run('shell','settings','put','system','font_scale','1.0');run('shell','wm','density','420');
 run('shell','cmd','overlay','disable','com.android.internal.display.cutout.emulation.hole');
 run('shell','cmd','overlay','enable-exclusive','--category','com.android.internal.systemui.navbar.gestural');
}
run('shell','wm','user-rotation','lock','0');run('shell','am','force-stop','org.clappa.app.review');run('shell','am','start','-W','-n','org.clappa.app.review/org.clappa.app.ReviewActivity','--es','phase','READY');
const xml=await ready();const node=[...xml.matchAll(/<node\b[^>]+>/g)].find(m=>m[0].includes('text="Tap to clap!"'))[0];const b=node.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/).slice(1).map(Number);
const video=spawn(adb,['-s','emulator-5556','shell','screenrecord','--time-limit','6','/sdcard/clappa-motion.mp4'],{stdio:'ignore',windowsHide:true});
const done=new Promise((resolve,reject)=>{video.once('exit',c=>c===0?resolve():reject(Error('screenrecord failed')));video.once('error',reject)});
await pause(900);run('shell','input','tap',String((b[0]+b[2])/2),String((b[1]+b[3])/2));await done;
fs.writeFileSync((process.argv[2]??'docs/review7')+'/phone-motion.mp4',execFileSync(adb,['-s','emulator-5556','exec-out','cat','/sdcard/clappa-motion.mp4'],{maxBuffer:30000000}));
console.log('Saved nine 130%-text/three-button/cutout screens and native motion capture.');
