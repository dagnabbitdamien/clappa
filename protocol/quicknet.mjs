import {validateDualChoice} from './dual-view.mjs';
import {createHash} from 'node:crypto';
import {bls12_381 as bls} from '@noble/curves/bls12-381';
import {canonical} from '../verifier/canonical.mjs';
import {choicesFromSeed} from './challenge-derivation.mjs';
export const QUICKNET_PROFILE='CLAPPA-QUICKNET-v1';
export const QUICKNET_CHAIN='52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971';
export const QUICKNET_KEY='83cf0f2896adee7eb8b5f01fcad3912212c437e0073e911fb90022d3e760183c8c4b450b6a0a6c3ac6a5776a2d1064510d1fec758c921cc22b0e17e63aaf4bcb5ed66304de9cf809bd274ca73bab4af5a6e9c76a4bc09e76eae8991ef5ece45a';
export const sha=b=>createHash('sha256').update(b).digest();
export function roundTime(round){if(!Number.isSafeInteger(round)||round<1||round>1e10)throw Error('Invalid Quicknet round');return (1692803367+(round-1)*3)*1000;}
export function verifyQuicknet(p){
 if(p.chain!==QUICKNET_CHAIN||p.at!==roundTime(p.round)||!/^([0-9a-f]{96})$/.test(p.signature))throw Error('Invalid Quicknet evidence');
 const round=Buffer.alloc(8);round.writeBigUInt64BE(BigInt(p.round));const sig=Buffer.from(p.signature,'hex');
 if(!bls.verifyShortSignature(sig,sha(round),Buffer.from(QUICKNET_KEY,'hex'),{DST:'BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_'}))throw Error('Quicknet signature mismatch');
 return sha(sig);
}
export function quicknetSeed(armedPayload,pulse){return sha(Buffer.concat([Buffer.from('CLAPPA-QUICKNET-SEED-v1\0'),Buffer.from(canonical(armedPayload)),Buffer.from([0]),verifyQuicknet(pulse)])).toString('hex');}
export function validateFreshChallenge(challenge,armed){
 const c=challenge.payload,a=armed.payload,d=c.data,f=d.freshness,p=f?.pulse;
 if(!f||f.profile!==QUICKNET_PROFILE||a.type!=='challenge-armed'||a.key_id!==c.key_id||a.session_id!==c.session_id||a.seq>=c.seq||a.at>=p.at||c.at<p.at||c.at>p.at+10000)throw Error('Invalid freshness chronology');
 if(f.arm_sha256!==sha(Buffer.from(canonical(armed))).toString('hex')||a.data.round!==p.round||a.data.chain!==p.chain||!['CLAPPA-CHOICES-v1','CLAPPA-CHOICES-v2'].includes(a.data.mapping)||a.data.challenge_id!==d.challenge_id||a.data.phase!==d.phase||canonical(a.data.obs)!==canonical(d.obs))throw Error('Challenge differs from locked commitment');
 validateDualChoice(d);if((a.data.capture_profile??null)!==(d.capture_profile??null)||(d.capture_profile&&a.data.camera_profile!=='front-only'))throw Error('Dual mode differs from locked commitment');
 const choices=choicesFromSeed(quicknetSeed(a,p),a.data.camera_profile,a.data.mapping);for(const k of ['prompt_id','camera','flash','cadence','slot_ms','pitches','response_window_ms'])if(canonical(d[k])!==canonical(choices[k]))throw Error('Challenge choice mismatch: '+k);
 if(d.qr_profile!=='hashes-v1')throw Error('Unsupported fresh QR profile');
 return {profile:QUICKNET_PROFILE,not_before:p.at,round:p.round,precommitment_observation:'requires live or external observation'};
}
