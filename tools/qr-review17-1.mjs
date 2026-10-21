import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';import QRCode from 'qrcode';import jsQR from 'jsqr';
import {canonical,hashObject} from '../verifier/proof.mjs';import {deterministicSign as sign} from '../test-vectors/generate.mjs';
import {encodeTransport,decodeTransport} from '../protocol/transport.mjs';
import {verifyTwitchEvidence} from '../protocol/twitch-identity.mjs';
const dir='docs/review17.1/qr';await fs.mkdir(dir,{recursive:true});
const proof=JSON.parse(await fs.readFile('android/app/src/review/assets/viewer/proof.json'));
const fixture=JSON.parse(await fs.readFile('docs/review14/twitch-test-fixture.json')),evidence=fixture.cases[0].evidence;
verifyTwitchEvidence(evidence,proof.key.key_id,fixture.jwks);
const binding=sign({profile:'CLAPPA-TWITCH-BINDING-v1',algorithm:'ES256-P1363',key_id:proof.key.key_id,session_id:proof.event.payload.session_id,event_sha256:hashObject(proof.event),identity_sha256:hashObject(evidence)});
const full=encodeTransport(proof.event,proof.key,[],{context:proof.context,identity:{binding,evidence}}),reference=encodeTransport(proof.event,proof.key,[],{context:proof.context,identity:{binding}});
const base=await sharp('docs/review17.1/twitch-fixture.png').resize(872,480).png().toBuffer();
for(let i=0;i<full.length;i++){
 const qr=await QRCode.toBuffer(full[i],{version:12,errorCorrectionLevel:'M',margin:4,scale:4});
 const board=await sharp(base).composite([{input:qr,left:548,top:120}]).png().toBuffer();
 await sharp({create:{width:1920,height:1080,channels:3,background:'#354253'}}).composite([{input:board,left:1040,top:592}]).png().toFile(`${dir}/input-${String(i).padStart(3,'0')}.png`);
}
const ffmpeg='C:/Program Files/ffmpeg/bin/ffmpeg.exe',results=[];
for(const height of [1080,720]){
 const prefix=`${dir}/h${height}`;
 for(const f of await fs.readdir(dir))if(new RegExp(`^h${height}-[0-9]+\\.png$`).test(f))await fs.unlink(dir+'/'+f);
 execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-framerate','25/6','-i',`${dir}/input-%03d.png`,'-vf',`scale=-2:${height}:flags=lanczos,fps=30`,'-c:v','libx264','-crf','23','-pix_fmt','yuv420p','-y',prefix+'.mp4'],{timeout:60000});
 execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-i',prefix+'.mp4','-vf','fps=5','-y',prefix+'-%03d.png'],{timeout:60000});
 const frames=[];for(const f of (await fs.readdir(dir)).filter(f=>f.startsWith(`h${height}-`)&&f.endsWith('.png'))){
  const s=height/1080,left=Math.floor(1580*s),top=Math.floor(708*s),width=Math.ceil(308*s),h=Math.ceil(308*s);const {data,info}=await sharp(dir+'/'+f).extract({left,top,width,height:h}).ensureAlpha().raw().toBuffer({resolveWithObject:true});const qr=jsQR(new Uint8ClampedArray(data),info.width,info.height);if(qr)frames.push(qr.data);
 }
 const unique=[...new Set(frames)];const dropped=unique.filter((_,i)=>i%2===0);let halfRecovered=false;try{halfRecovered=!!decodeTransport(dropped)}catch{}
 let recovered=false;try{const result=decodeTransport(frames);recovered=canonical(result.identity.evidence)===canonical(evidence)}catch{}
 results.push({height,sourceScale:height/1080,codec:'H.264 CRF 23 yuv420p, 30 fps',decodedSamples:frames.length,uniqueFrames:new Set(frames).size,requiredFrames:full.length/2,recovered,halfRecovered});
}
await fs.writeFile('docs/review17.1/qr-recovery.json',JSON.stringify({firstProofFrames:full.length,laterProofFrames:reference.length,photosEncoded:0,fixture:'Synthetic Twitch signature; genuine archived Quicknet pulse. Local transcodes, not a Twitch/YouTube delivery guarantee.',results},null,2));console.log(JSON.stringify(results));
if(results.some(r=>!r.recovered))process.exitCode=1;
