import {readFile,readdir,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';import jsQR from 'jsqr';
import {decodeTransport} from '../protocol/transport.mjs';
const result=JSON.parse(await readFile('output/native-integration-result.json'));
const dir='output/qr-frames';await mkdir(dir,{recursive:true});
execFileSync('.tools/native-deps/bin/ffmpeg.exe',['-hide_banner','-loglevel','error','-i',result.media,'-vf','fps=12,crop=640:300:640:420','-y',dir+'/%03d.png']);
const groups=new Map();
for(const name of await readdir(dir)){
 const {data,info}=await sharp(dir+'/'+name).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const found=jsQR(new Uint8ClampedArray(data),info.width,info.height);if(!found)continue;
 const meta=JSON.parse(found.data);if(meta.magic!=='CLAPPA')continue;
 if(!groups.has(meta.digest))groups.set(meta.digest,new Set());groups.get(meta.digest).add(found.data);
}
const recovered=[];for(const frames of groups.values())recovered.push(decodeTransport([...frames]));
if(recovered.length!==2||recovered.some(r=>r.photos.length!==2))throw Error('Could not recover both two-photo events from the OBS recording');
console.log('PASS: both signed challenge events and all four compact photos recovered from recorded QR frames');
