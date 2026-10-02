import fs from 'node:fs/promises';import {execFileSync} from 'node:child_process';import sharp from 'sharp';import jsQR from 'jsqr';
import {parseTransportFrame,decodeTransport} from '../protocol/transport.mjs';
const dir='docs/review13',run=JSON.parse(await fs.readFile(dir+'/emulator-flow-result.json')),folder='output/native-test/sessions/'+run.session;
const summary=JSON.parse(await fs.readFile(folder+'/session-info.json'));
const events=await Promise.all((await fs.readdir(folder+'/proof/events')).map(async f=>JSON.parse(await fs.readFile(folder+'/proof/events/'+f)).payload));
const claim=events.find(e=>e.type==='claim');const start=Math.max(0,(claim.at-Date.parse(summary.started_utc))/1000-1);
const work='output/review13-claim';await fs.mkdir(work,{recursive:true});
const ffmpeg='C:/Program Files/ffmpeg/bin/ffmpeg.exe';
execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-ss',String(start),'-i',run.media,'-t','10','-vf','fps=12,crop=320:320:1572:700','-y',work+'/%04d.png']);
const groups=new Map();for(const file of (await fs.readdir(work)).filter(n=>/^\d+\.png$/.test(n))){const {data,info}=await sharp(work+'/'+file).ensureAlpha().raw().toBuffer({resolveWithObject:true});const qr=jsQR(new Uint8ClampedArray(data),info.width,info.height);if(!qr)continue;try{const p=parseTransportFrame(qr.data);if(!groups.has(p.digest))groups.set(p.digest,new Set());groups.get(p.digest).add(qr.data)}catch{}}
const found=[];for(const frames of groups.values())try{const p=decodeTransport([...frames]);found.push({type:p.event.payload.type,seq:p.event.payload.seq,frames:frames.size});}catch{}
if(!found.some(p=>p.type==='claim'&&p.seq===claim.seq))throw Error('Signed claim QR not recovered from actual recording: '+JSON.stringify(found));
execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-ss',String(start),'-i',run.media,'-t','9','-vf','crop=872:480:1040:592','-an','-c:v','libx264','-crf','17','-y',dir+'/additional-photo-obs.mp4']);
execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-ss',String(start+2.5),'-i',run.media,'-vf','crop=872:480:1040:592','-frames:v','1','-y',dir+'/additional-photo-obs.png']);
await fs.writeFile(dir+'/claim-qr-recovery.json',JSON.stringify({media:run.media,clipStart:start,crop:[1572,700,320,320],sourceResolution:'1920x1080',recovered:found,expectedClaimSequence:claim.seq,scope:'Local original OBS recording. No platform transcode guarantee.'},null,2));console.log(JSON.stringify(found));
