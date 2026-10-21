import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {DUAL_PROFILE,validateDualResponse} from '../../protocol/dual-view.mjs';
import {quicknetSeed,validateFreshChallenge,QUICKNET_PROFILE} from '../../protocol/quicknet.mjs';
import {choicesFromSeed} from '../../protocol/challenge-derivation.mjs';
import {deterministicSign as sign} from '../../test-vectors/generate.mjs';
import {hashObject} from '../proof.mjs';import {encodeTransport,decodeTransport} from '../../protocol/transport.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../../test-vectors/'+p,import.meta.url)));
const pulse=read('quicknet/pulse.json'),old=read('valid/events/000001.json'),key=read('valid/public-key.json');
const arm=sign({...old.payload,type:'challenge-armed',at:pulse.at-6000,data:{challenge_id:old.payload.data.challenge_id,phase:'start',mapping:'CLAPPA-CHOICES-v1',chain:pulse.chain,round:pulse.round,camera_profile:'front-only',capture_profile:DUAL_PROFILE,obs:old.payload.data.obs}});
const choices=choicesFromSeed(quicknetSeed(arm.payload,pulse),'front-only');delete choices.mapping;
const issue=sign({...old.payload,seq:2,prev:hashObject(arm),at:pulse.at+100,data:{...old.payload.data,...choices,capture_profile:DUAL_PROFILE,rear_flash:'torch',pair_window_ms:3000,qr_profile:'hashes-v1',freshness:{profile:QUICKNET_PROFILE,arm_sha256:hashObject(arm),pulse}}});
const group=t=>({front_delivered_ms:t,rear_delivered_ms:t+10,front_sensor_us:t*1000,rear_sensor_us:(t+5)*1000,front_width:720,front_height:1280,rear_width:720,rear_height:1280});
const oldCapture=read('valid/events/000002.json');
const data={...oldCapture.payload.data,a_at:pulse.at+1100,b_at:pulse.at+1300,response_ms:1000,pair_ms:200,dual:{profile:DUAL_PROFILE,rear_a:oldCapture.payload.data.photo_a,rear_b:oldCapture.payload.data.photo_b,normal:group(5000),illuminated:group(5200),exposure_synchronization:'not-established'}};
test('dual profile locks before beacon and validates four-image timing',()=>{validateFreshChallenge(issue,arm);assert.equal(validateDualResponse(issue.payload,{data}),DUAL_PROFILE)});
for(const [name,mutate]of [
 ['missing rear view',d=>delete d.dual],['excess delivery skew',d=>d.dual.normal.rear_delivered_ms+=121],['reused sensor frame',d=>d.dual.illuminated.front_sensor_us=d.dual.normal.front_sensor_us],['wrong pair duration',d=>d.pair_ms+=20],['false simultaneous claim',d=>d.dual.exposure_synchronization='simultaneous']
])test('dual response rejects '+name,()=>{const d=structuredClone(data);mutate(d);assert.throws(()=>validateDualResponse(issue.payload,{data:d}))});
test('dual mode cannot be added after seeing the beacon',()=>{const altered=structuredClone(arm);delete altered.payload.data.capture_profile;assert.throws(()=>validateFreshChallenge(issue,altered))});
test('single-camera profile rejects unsolicited extra images',()=>assert.throws(()=>validateDualResponse({camera:'front',flash:'blue'},{data})));
test('all four photo references survive the signed QR round trip',()=>{
 const event=sign({...oldCapture.payload,seq:3,prev:hashObject(issue),at:pulse.at+1400,data});const descriptors=read('valid/events/000000.json').payload.data.outputs;
 const context={armed:arm,challenge:issue,proof:sign({profile:'CLAPPA-MEDIA-PROOF-v1',algorithm:'ES256-P1363',key_id:key.key_id,session_id:event.payload.session_id,recording_id:issue.payload.data.obs.recording_id,event_sha256:hashObject(event),challenge_sha256:hashObject(issue),at:event.payload.at,outputs:issue.payload.data.obs.outputs.map(o=>({...o,packets:o.packets+1,bytes:o.bytes+20})),descriptors})};
 const frames=encodeTransport(event,key,[],{context});const recovered=decodeTransport(frames);assert.deepEqual(recovered.event.payload.data,data);assert.equal(recovered.photos.length,0);
 fs.writeFileSync(new URL('../../test-vectors/quicknet/dual.json',import.meta.url),JSON.stringify({arm,issue,event,context,key,frames},null,2)+'\n');
});
