import {execFileSync as exec} from 'node:child_process';import fs from 'node:fs';
const adb='.tools/android-sdk/platform-tools/adb.exe',pkg='org.clappa.app.review';const run=(...a)=>exec(adb,['-s','emulator-5556',...a],{encoding:'utf8',timeout:20000});
function xml(){run('shell','uiautomator','dump','/sdcard/ui17.xml');return run('shell','cat','/sdcard/ui17.xml')}
function tap(text){const n=[...xml().matchAll(/<node\b[^>]*>/g)].map(m=>m[0]).find(n=>n.includes(`text="${text}"`));if(!n)throw Error('Missing '+text);const b=n.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]/).slice(1).map(Number);run('shell','input','tap',String((b[0]+b[2])/2),String((b[1]+b[3])/2));}
function shot(name,expected){if(!xml().includes(expected))throw Error('Missing '+expected);fs.writeFileSync('docs/review17/'+name+'.png',exec(adb,['-s','emulator-5556','exec-out','screencap','-p'],{maxBuffer:20000000}));}
run('shell','pm','grant',pkg,'android.permission.CAMERA');
for(const rot of [0,1]){const suffix=rot?'landscape':'portrait';run('shell','wm','user-rotation','lock',String(rot));run('shell','am','force-stop',pkg);run('shell','am','start','-W','-n',pkg+'/org.clappa.app.HomeActivity');tap('Viewer');tap('Scan a proof');shot('scanner-'+suffix,'Cancel scan');tap('Cancel scan');tap('‹ Home');tap('Streamer');shot('streamer-'+suffix,'CLAPPA');}
console.log('Scanner navigation and streamer screenshots passed.');
