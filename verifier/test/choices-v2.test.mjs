import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {choicesFromSeed,CHOICE_PROMPTS_V2} from '../../protocol/challenge-derivation.mjs';
import {quicknetSeed,validateFreshChallenge} from '../../protocol/quicknet.mjs';
import {deterministicSign as sign} from '../../test-vectors/generate.mjs';
import {hashObject} from '../proof.mjs';
const vectors=[];
for(const profile of ['front-only','rear-only','front-rear'])for(let n=0;n<100;n++){
 const seed=n.toString(16).padStart(64,'0');vectors.push({seed,profile,...choicesFromSeed(seed,profile,'CLAPPA-CHOICES-v2')});
}
fs.writeFileSync('test-vectors/choices-v2.json',JSON.stringify(vectors,null,2));
fs.writeFileSync('android/app/src/test/resources/choices-v2.tsv',vectors.map(v=>[v.seed,v.profile,v.prompt_id,v.camera,v.flash,v.cadence,v.slot_ms,v.pitches.join(',')].join('\t')).join('\n'));
test('v2 reaches every new prompt and obeys fixed camera capabilities',()=>{
 assert.deepEqual(new Set(vectors.map(v=>v.prompt_id)),new Set(CHOICE_PROMPTS_V2));
 for(const v of vectors){if(v.profile==='front-only')assert.equal(v.camera,'front');if(v.profile==='rear-only')assert.equal(v.camera,'rear');assert.equal(v.pitches.length,[...v.cadence].filter(x=>x==='1').length);}
 assert.throws(()=>choicesFromSeed('00'.repeat(32),'front-only','unknown'));
});
test('v2 authenticated commitment validates and cannot be relabelled v1',()=>{
 const previous=JSON.parse(fs.readFileSync('test-vectors/quicknet/challenge.json'));
 const pulse=previous.issue.payload.data.freshness.pulse;
 const arm=sign({...previous.arm.payload,data:{...previous.arm.payload.data,mapping:'CLAPPA-CHOICES-v2'}});
 const choices=choicesFromSeed(quicknetSeed(arm.payload,pulse),arm.payload.data.camera_profile,'CLAPPA-CHOICES-v2');delete choices.mapping;
 const issue=sign({...previous.issue.payload,prev:hashObject(arm),data:{...previous.issue.payload.data,...choices,freshness:{...previous.issue.payload.data.freshness,arm_sha256:hashObject(arm)}}});
 validateFreshChallenge(issue,arm);
 fs.writeFileSync('test-vectors/quicknet/challenge-v2.json',JSON.stringify({arm,issue},null,2));
 const bad=structuredClone(arm);bad.payload.data.mapping='CLAPPA-CHOICES-v1';assert.throws(()=>validateFreshChallenge(issue,bad));
});
