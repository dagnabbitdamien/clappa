import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const dir='docs/review12',report=JSON.parse(await fs.readFile(dir+'/emulator-flow-result.json'));
const ffmpeg='C:/Program Files/ffmpeg/bin/ffmpeg.exe';
const probe=execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-i',report.media,'-vf','fps=30,crop=2:2:1064:800,scale=1:1,format=gray','-an','-f','rawvideo','pipe:1']);
const first=probe.findIndex(v=>v>225);if(first<0)throw Error('No proof mount in recording');
const start=Math.max(0,first/30-.8);
execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-ss',String(start),'-i',report.media,'-t','10','-vf','crop=872:480:1040:592','-an','-c:v','libx264','-crf','17','-preset','fast','-movflags','+faststart','-y',dir+'/obs-motion.mp4']);
execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-ss',String(start+2.7),'-i',report.media,'-frames:v','1','-y',dir+'/obs-full-scene.png']);
execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-ss','2.7','-i',dir+'/obs-motion.mp4','-frames:v','1','-y',dir+'/obs-camera-proof.png']);
// Contact sheet makes entry, stable display and exit inspectable.
execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-i',dir+'/obs-motion.mp4','-vf','fps=2,scale=436:240,tile=4x5','-frames:v','1','-y',dir+'/obs-motion-sheet.png']);
console.log({videoStart:start,media:report.media});


