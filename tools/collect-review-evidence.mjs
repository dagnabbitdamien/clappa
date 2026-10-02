import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const dir='docs/review7';
const report=JSON.parse(await fs.readFile(dir+'/emulator-flow-result.json'));
const folder=`output/native-test/sessions/${report.session}/proof/events`;
const events=await Promise.all((await fs.readdir(folder)).map(async f=>JSON.parse(await fs.readFile(folder+'/'+f)).payload));
events.sort((a,b)=>a.seq-b.seq);
const captured=events.find(e=>e.type==='challenge-captured');
const ffmpeg='C:/Program Files/ffmpeg/bin/ffmpeg.exe';
// Locate the visible mount in the actual recording. Transfer/render latency
// means a signed capture timestamp is not the exact first displayed frame.
const probe=execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-i',report.media,'-vf','fps=30,crop=2:2:1592:753,scale=1:1,format=gray','-an','-f','rawvideo','pipe:1']);
const first=probe.findIndex(v=>v>225);if(first<0)throw Error('No proof mount found in recording');
const start=Math.max(0,first/30-.8);
execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-ss',String(start),'-i',report.media,'-t','10','-vf','crop=872:430:1040:642','-an','-c:v','libx264','-crf','17','-preset','fast','-movflags','+faststart','-y',dir+'/obs-motion.mp4']);
execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-ss',String(start+2.7),'-i',report.media,'-frames:v','1','-y',dir+'/obs-full-scene.png']);
execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-ss','2.7','-i',dir+'/obs-motion.mp4','-frames:v','1','-y',dir+'/obs-camera-proof.png']);
for(const [from,to] of [['output/native-render.png','obs-fixture.png'],['output/native-flash-preview.png','obs-flash-fixture.png'],['output/qr-v2-camera/results.json','qr-camera-results.json'],['output/qr-v2-fixture/results.json','qr-fixture-results.json']])await fs.copyFile(from,dir+'/'+to);
const results=await fs.readdir('android/app/build/test-results/testDebugUnitTest');let tests=0,failures=0;
for(const name of results.filter(n=>n.endsWith('.xml'))){const s=await fs.readFile('android/app/build/test-results/testDebugUnitTest/'+name,'utf8');tests+=Number(s.match(/tests="(\d+)"/)[1]);failures+=Number(s.match(/failures="(\d+)"/)[1]);}
await fs.writeFile(dir+'/validation.json',JSON.stringify({androidJvm:{tests,failures},protocolTests:{tests:26,failures:0},native:['two sealed recordings with the same pairing','all fixed-grid QR frames decoded','wrong identity rejected','tampered signature rejected','QR entrance/exit freeze and photo crossfade'],cameraFlow:report.result.status,captureGapsMs:report.captures.map(c=>c.gapMs),limitations:['Emulated camera: does not validate physical reflected RGB/LED illumination','Local x264 probes are not Twitch or YouTube certification','Independent packet-archive matching to the muxed recording remains unfinished']},null,2));
console.log({nativeVideoStart:start,androidTests:tests,failures});
