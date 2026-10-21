import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import sharp from 'sharp';
const adb='.tools/android-sdk/platform-tools/adb.exe',dir='docs/review15.1';fs.mkdirSync(dir,{recursive:true});
const run=(...args)=>execFileSync(adb,['-s','emulator-5556',...args],{encoding:'utf8',timeout:20000});
run('shell','wm','set-ignore-orientation-request','true');run('shell','wm','fixed-to-user-rotation','enabled');
const results=[];
for(const rotation of [0,1]){
 run('shell','wm','user-rotation','lock',String(rotation));
 for(const [name,activity,text] of [['modes','HomeActivity','Viewer'],['viewer','ReviewViewerActivity','Signed challenge verified']]){
  run('shell','am','force-stop','org.clappa.app.review');run('shell','am','start','-W','-n','org.clappa.app.review/org.clappa.app.'+activity);
  let found=false;for(let i=0;i<10;i++){run('shell','uiautomator','dump','/sdcard/viewer.xml');if(run('shell','cat','/sdcard/viewer.xml').includes(text)){found=true;break}}if(!found)throw Error('Missing native screen '+name);
  const file=`${name}-${rotation?'landscape':'portrait'}.png`;const png=execFileSync(adb,['-s','emulator-5556','exec-out','screencap','-p'],{maxBuffer:15000000});const m=await sharp(png).metadata();if((m.width>m.height)!==Boolean(rotation))throw Error('Wrong orientation');fs.writeFileSync(dir+'/'+file,png);results.push({file,width:m.width,height:m.height});
 }
}
fs.writeFileSync(dir+'/viewer-native-result.json',run('shell','run-as','org.clappa.app.review','cat','files/viewer-review.json'));
fs.writeFileSync(dir+'/screens.json',JSON.stringify(results,null,2));console.log('Four native screenshots and QR verification result saved.');

