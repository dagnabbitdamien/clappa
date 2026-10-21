import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {choicesFromSeed,CHOICE_MAPPING,CHOICE_PROMPTS,CHOICE_PROMPTS_V2,CHOICE_PROMPTS_V3} from '../../protocol/challenge-derivation.mjs';
import {validateFreshChallenge} from '../../protocol/quicknet.mjs';
import {schema} from '../../protocol/schema.mjs';
import Ajv from 'ajv';
const read=name=>JSON.parse(fs.readFileSync(new URL('../../'+name,import.meta.url)));
const vectors=read('test-vectors/choices-v3.json');
const prompts=read('protocol/prompts.json'),dual=read('protocol/dual-prompts.json');

test('v3 current catalog has 32 distinct selfie prompts, all with matching dual instructions',()=>{
 assert.equal(CHOICE_MAPPING,'CLAPPA-CHOICES-v3');
 const selfies=CHOICE_PROMPTS_V3.filter(id=>id.startsWith('selfie'));
 assert.equal(selfies.length,32);assert.equal(new Set(CHOICE_PROMPTS_V3).size,38);
 assert.equal(new Set(selfies.map(id=>prompts[id])).size,32);
 for(const id of selfies){assert.ok(prompts[id]);assert.ok(dual[id]);}
 for(const id of ['selfie_thumb_left','selfie_thumb_right','selfie_peace_left','selfie_peace_right','selfie_tilt_left','selfie_tilt_right'])assert.ok(selfies.includes(id));
});

test('shared v3 corpus reaches every prompt in each profile and reproduces every choice',()=>{
 for(const profile of ['front-only','rear-only','front-rear']){
  const rows=vectors.filter(row=>row.profile===profile);
  const expected=CHOICE_PROMPTS_V3.filter(id=>profile==='front-rear'||id.startsWith('selfie')===(profile==='front-only'));
  assert.deepEqual(new Set(rows.map(row=>row.prompt_id)),new Set(expected));
  for(const row of rows){const {seed,profile,...choice}=row;assert.deepEqual(choicesFromSeed(seed,profile,row.mapping),choice);if(profile==='front-only')assert.equal(choice.camera,'front');if(profile==='rear-only')assert.equal(choice.camera,'rear');}
 }
});

test('v1 and v2 legacy corpora retain their committed mapping and exact outputs',()=>{
 assert.equal(CHOICE_PROMPTS.length,14);assert.equal(CHOICE_PROMPTS_V2.length,17);
 for(const version of [1,2])for(const row of read(`test-vectors/choices-v${version}.json`)){
  const {seed,profile,...choice}=row;assert.deepEqual(choicesFromSeed(seed,profile??'front-rear',`CLAPPA-CHOICES-v${version}`),choice);
 }
 for(const name of ['challenge.json','challenge-v2.json','dual.json']){const v=read('test-vectors/quicknet/'+name);validateFreshChallenge(v.issue,v.arm);}
});

test('v3 signed dual-camera fixture validates; old/unknown mapping relabelling is rejected',()=>{
 const v=read('test-vectors/quicknet/challenge-v3.json');
 assert.ok(!CHOICE_PROMPTS_V2.includes(v.issue.payload.data.prompt_id),'Authenticated v3 fixture exercises a newly added gesture');
 assert.equal(v.arm.payload.data.camera_profile,'front-only');
 assert.equal(v.arm.payload.data.capture_profile,'CLAPPA-DUAL-v1');
 validateFreshChallenge(v.issue,v.arm);
 for(const mapping of ['CLAPPA-CHOICES-v1','CLAPPA-CHOICES-v2','unknown']){const arm=structuredClone(v.arm);arm.payload.data.mapping=mapping;assert.throws(()=>validateFreshChallenge(v.issue,arm));}
 const ajv=new Ajv({allErrors:true,strict:false});const valid=ajv.compile({$ref:'#/definitions/event',...schema});
 assert.ok(valid(v.arm),JSON.stringify(valid.errors));
 for(const id of CHOICE_PROMPTS_V3.filter(id=>id.startsWith('selfie'))){const issue=structuredClone(v.issue);issue.payload.data.prompt_id=id;assert.ok(valid(issue),JSON.stringify(valid.errors));}
});
