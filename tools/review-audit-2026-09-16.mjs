// Read-only product audit. Uses a fresh, disposable key; never reads user keys.
import {generateKeyPairSync} from 'node:crypto';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {signObject, publicRecord} from '../verifier/proof.mjs';
import {encodeTransport, decodeTransport} from '../protocol/transport.mjs';
const root=new URL('../',import.meta.url);
const event=JSON.parse(await readFile(new URL('test-vectors/valid/events/000002.json',root)));
const photo=await readFile(new URL('test-vectors/fixture.jpg',root));
const {privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const publicKey=publicRecord(privateKey);
event.payload.key_id='0'.repeat(64);
const signed=signObject(event.payload,privateKey);
let binding;
try{
 const decoded=decodeTransport(encodeTransport(signed,publicKey,[photo,photo]));
 binding={accepted:true,claimedFingerprint:decoded.event.payload.key_id,actualFingerprint:decoded.key.key_id,equal:decoded.event.payload.key_id===decoded.key.key_id};
}catch(error){binding={accepted:false,error:String(error)};}
const current=t=>t<250?533*Math.pow(1-t/250,3)-3:t<360?-3*(1-(t-250)/110):0;
const smoother=t=>{const u=Math.min(1,Math.max(0,t/310));return 530*(1-(6*u**5-15*u**4+10*u**3));};
const motion=Array.from({length:13},(_,i)=>{const t=i*1000/30;return {ms:+t.toFixed(2),currentY:+current(t).toFixed(2),proposedY:+smoother(t).toFixed(2)}});
const result={date:'2026-09-16',scope:'Read-only audit and mathematical motion model; not an adversarial video-model benchmark.',qrClaimedKeyMismatch:binding,motion30fps:motion,source:{width:872,height:480,currentPhotoAperture:[337,246],proposedPhotoAperture:[492,292],qrSquare:[292,292]},first33msTravelPercent:+((current(0)-current(1000/30))/530*100).toFixed(2),photoApertureAreaIncreasePercent:+((492*292/(337*246)-1)*100).toFixed(2)};
const out=new URL('docs/review7/critical-review/',root);await mkdir(out,{recursive:true});await writeFile(new URL('audit-evidence.json',out),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
