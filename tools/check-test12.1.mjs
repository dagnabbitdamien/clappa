import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {openTestObs} from './obs-test-client.mjs';
const dir='docs/review12.1';await fs.mkdir(dir,{recursive:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
if(process.argv[2]==='android'){
 const adb=path.resolve('.tools/android-sdk/platform-tools/adb.exe');
 const run=(...args)=>execFileSync(adb,['-s','emulator-5556',...args],{timeout:30000,encoding:'utf8'});
 run('install','-r','android/app/build/outputs/apk/review/app-review.apk');
 run('shell','wm','set-ignore-orientation-request','true');
 for(const orientation of ['portrait','landscape'])for(const phase of ['CHALLENGE','SENT']){
  const name=orientation+'-'+phase.toLowerCase();
  run('shell','wm','user-rotation','lock',orientation==='portrait'?'0':'1');
  run('shell','am','force-stop','org.clappa.app.review');
  run('shell','am','start','-W','-n','org.clappa.app.review/org.clappa.app.ReviewActivity','--es','phase',phase,'--ez','timed','true');
  await pause(700);
  await fs.writeFile(dir+'/'+name+'.png',execFileSync(adb,['-s','emulator-5556','exec-out','screencap','-p'],{maxBuffer:20000000}));
  run('shell','screenrecord','--time-limit','4','/sdcard/timer.mp4');run('pull','/sdcard/timer.mp4',dir+'/'+name+'.mp4');
 }
 console.log('Four native timer fixtures captured.');
}else{
 const c=await openTestObs();try{
  if((await c.request('GetRecordStatus')).outputActive)throw Error('Isolated recording already active');
  await c.request('StartRecord');await pause(750);
  const tile=JSON.parse(await fs.readFile('output/native-test/tile.json'));tile.until=Date.now()+4500;await fs.writeFile('output/native-test/tile.json',JSON.stringify(tile));
  await pause(5500);const stopped=await c.request('StopRecord');await pause(2500);
  const state=JSON.parse(await fs.readFile('output/native-test/obs-state.json'));
  const folder='output/native-test/sessions/'+state.session_id;
  const info=JSON.parse(await fs.readFile(folder+'/session-info.json'));
  if(info.recording_active||info.duration_seconds<5||info.duration_seconds>9||info.recording_path!==stopped.outputPath||info.final_seal_present)throw Error('Incorrect summary: '+JSON.stringify(info));
  await fs.copyFile(folder+'/SESSION.txt',dir+'/sample-SESSION.txt');await fs.copyFile(folder+'/session-info.json',dir+'/sample-session-info.json');
  await fs.copyFile('output/native-test/sessions/Sessions.html',dir+'/sample-Sessions.html');
  execFileSync('C:/Program Files/ffmpeg/bin/ffmpeg.exe',['-hide_banner','-loglevel','error','-i',stopped.outputPath,'-vf','crop=872:480:1040:592','-an','-c:v','libx264','-crf','17','-y',dir+'/obs-motion.mp4']);
  await fs.writeFile(dir+'/checks.json',JSON.stringify({nativeSummary:info,recording:stopped.outputPath,fixture:'Previously signed tile replayed for motion inspection; this recording intentionally has no phone seal.'},null,2));
  console.log('Native OBS summary and exit capture passed.');
 }finally{c.close();}
}
