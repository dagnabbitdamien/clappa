import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const adb=path.resolve('.tools/android-sdk/platform-tools/adb.exe');
const run=(...a)=>execFileSync(adb,['-s','emulator-5556',...a],{encoding:'utf8',timeout:25000});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function find(label){for(let i=0;i<12;i++){run('shell','uiautomator','dump','/sdcard/recovery.xml');const xml=run('shell','cat','/sdcard/recovery.xml');const node=[...xml.matchAll(/<node\b[^>]+>/g)].find(m=>m[0].includes(`text="${label}"`));if(node)return node[0].match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/).slice(1).map(Number);await pause(400)}throw Error('Missing recovery action '+label)}
async function tap(label){const b=await find(label);run('shell','input','tap',String((b[0]+b[2])/2),String((b[1]+b[3])/2))}
await tap('Stop incomplete recording');await find('Start another recording');
run('shell','am','force-stop','org.clappa.app.review');
run('shell','am','start','-W','-n','org.clappa.app.review/org.clappa.app.MainActivity');
await tap('Start recording');await find('Tap to clap!');
run('shell','am','force-stop','org.clappa.app.review');
run('shell','am','start','-W','-n','org.clappa.app.review/org.clappa.app.MainActivity');
await tap('Stop incomplete recording');await find('Start another recording');
const state=JSON.parse(fs.readFileSync('output/native-test/obs-state.json'));
if(!state.closed||state.recording_active)throw Error('Incomplete recording did not stop');
fs.writeFileSync('docs/review7/recovery-result.json',JSON.stringify({savedPairingReconnect:true,restartDuringRecording:'explicit incomplete state',stopIncomplete:'stopped actual OBS recording',falseSeal:false},null,2));
console.log('PASS: saved pairing, restart during recording, stop incomplete, ready for another recording');
