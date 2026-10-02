import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {verifyQuicknet,quicknetSeed,validateFreshChallenge,QUICKNET_PROFILE} from '../../protocol/quicknet.mjs';
import {choicesFromSeed} from '../../protocol/challenge-derivation.mjs';
import {deterministicSign as sign} from '../../test-vectors/generate.mjs';
import {hashObject} from '../proof.mjs';
import {encodeTransport,decodeTransport} from '../../protocol/transport.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../../test-vectors/'+p,import.meta.url)));
const pulse=read('quicknet/pulse.json'),old=read('valid/events/000001.json'),key=read('valid/public-key.json');
const arm=sign({...old.payload,type:'challenge-armed',at:pulse.at-6000,data:{challenge_id:old.payload.data.challenge_id,phase:'start',mapping:'CLAPPA-CHOICES-v1',chain:pulse.chain,round:pulse.round,camera_profile:'front-only',obs:old.payload.data.obs}});
const choices=choicesFromSeed(quicknetSeed(arm.payload,pulse),'front-only');delete choices.mapping;
const issue=sign({...old.payload,seq:2,prev:hashObject(arm),at:pulse.at+100,data:{...old.payload.data,...choices,qr_profile:'hashes-v1',freshness:{profile:QUICKNET_PROFILE,arm_sha256:hashObject(arm),pulse}}});
test('real Quicknet pulse verifies against the provisioned public key',()=>assert.equal(verifyQuicknet(pulse).length,32));
for(const property of ['round','at','signature','chain'])test('reject changed beacon '+property,()=>{const p=structuredClone(pulse);p[property]=typeof p[property]==='number'?p[property]+1:'00'+p[property].slice(2);assert.throws(()=>verifyQuicknet(p));});
test('all derived choices verify with fixed camera capabilities',()=>assert.equal(validateFreshChallenge(issue,arm).not_before,pulse.at));
for(const field of ['prompt_id','flash','pitches','cadence','slot_ms'])test('reject signed choice substitution '+field,()=>{const e=structuredClone(issue);e.payload.data[field]=field==='pitches'?[0,0,0,0,0,7]:field==='slot_ms'?100:field==='prompt_id'?'up':field==='flash'?'led':'1000100010001000';assert.throws(()=>validateFreshChallenge(e,arm));});
test('reject signed post-pulse commitment',()=>{const a=sign({...arm.payload,at:pulse.at});const e=structuredClone(issue);e.payload.data.freshness.arm_sha256=hashObject(a);assert.throws(()=>validateFreshChallenge(e,a));});
test('changed media commitment changes deterministic seed',()=>{const a=structuredClone(arm);a.payload.data.obs.outputs[0].head='cc'.repeat(32);assert.notEqual(quicknetSeed(a.payload,pulse),quicknetSeed(arm.payload,pulse));});
test('compact QR carries signed image hashes and beacon, without JPEG bytes',()=>{
 const oldCapture=read('valid/events/000002.json');const event=sign({...oldCapture.payload,seq:3,prev:hashObject(issue),at:pulse.at+1400,data:{...oldCapture.payload.data,a_at:pulse.at+1100,b_at:pulse.at+1300,response_ms:1000,pair_ms:200}});
 const descriptors=read('valid/events/000000.json').payload.data.outputs;
 const context={armed:arm,challenge:issue,proof:sign({profile:'CLAPPA-MEDIA-PROOF-v1',algorithm:'ES256-P1363',key_id:key.key_id,session_id:event.payload.session_id,recording_id:issue.payload.data.obs.recording_id,event_sha256:hashObject(event),challenge_sha256:hashObject(issue),at:event.payload.at,outputs:issue.payload.data.obs.outputs.map(o=>({...o,packets:o.packets+1,bytes:o.bytes+20})),descriptors})};
 const frames=encodeTransport(event,key,[],{context});assert.equal(decodeTransport(frames).photos.length,0);assert.throws(()=>encodeTransport(event,key,[Buffer.from('fake')],{context}));
});
fs.writeFileSync(new URL('../../test-vectors/quicknet/challenge.json',import.meta.url),JSON.stringify({arm,issue},null,2));

