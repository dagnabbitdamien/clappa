import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const adb=path.resolve('.tools/android-sdk/platform-tools/adb.exe');
const run=(...args)=>execFileSync(adb,['-s','emulator-5556',...args],{encoding:'utf8',timeout:20000});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
run('install','-r','android/app/build/outputs/apk/review/app-review.apk');
run('shell','wm','set-ignore-orientation-request','true');
run('shell','wm','fixed-to-user-rotation','enabled');
const outputs=[];
for(const orientation of ['portrait','landscape']){
 run('shell','wm','user-rotation','lock',orientation==='portrait'?'0':'1');
 for(const phase of ['UNPAIRED','STANDBY','READY','CHALLENGE','SENT','LOST']){
  run('shell','am','force-stop','org.clappa.app.review');
  run('shell','am','start','-W','-n','org.clappa.app.review/org.clappa.app.ReviewActivity','--es','phase',phase);
  let drawn=false;
  for(let tries=0;tries<8;tries++){run('shell','uiautomator','dump','/sdcard/layout.xml');const xml=run('shell','cat','/sdcard/layout.xml');if(xml.includes('text="CLAPPA"')){drawn=true;break}await pause(300)}
  if(!drawn)throw Error(`Native layout did not appear: ${orientation} ${phase}`);
  await pause(700);
  const name=`${orientation}-${phase.toLowerCase()}.png`,dest=(process.argv[2]??'docs/review7')+'/'+name;
  const screenshot=execFileSync(adb,['-s','emulator-5556','exec-out','screencap','-p'],{maxBuffer:20000000,timeout:20000});
  const dimensions=await sharp(screenshot).metadata();
  if((dimensions.height>dimensions.width)!==(orientation==='portrait'))throw Error(`Wrong actual orientation for ${name}: ${dimensions.width}x${dimensions.height}`);
  fs.writeFileSync(dest,screenshot);outputs.push({orientation,phase,file:name,width:dimensions.width,height:dimensions.height});
 }
}
await fs.promises.writeFile((process.argv[2]??'docs/review7')+'/screens.json',JSON.stringify(outputs,null,2));
for(const orientation of ['portrait','landscape']){
 const files=outputs.filter(x=>x.orientation===orientation);const width=orientation==='portrait'?300:560;const tiles=[];let height=0;
 for(const x of files){const image=await sharp((process.argv[2]??'docs/review7')+'/'+x.file).resize({width}).png().toBuffer();const meta=await sharp(image).metadata();height=meta.height;tiles.push(image)}
 const cols=3,rows=2,gap=16;await sharp({create:{width:width*cols+gap*4,height:height*rows+gap*3,channels:3,background:'#111210'}}).composite(tiles.map((input,i)=>({input,left:gap+(i%cols)*(width+gap),top:gap+Math.floor(i/cols)*(height+gap)}))).png().toFile((process.argv[2]??'docs/review7')+'/'+orientation+'-states.png');
}
console.log('Saved twelve native layout fixtures and two contact sheets.');
