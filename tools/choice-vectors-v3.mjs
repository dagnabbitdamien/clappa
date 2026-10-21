import fs from 'node:fs';
import {choicesFromSeed,CHOICE_PROMPTS_V2,CHOICE_PROMPTS_V3} from '../protocol/challenge-derivation.mjs';
import {quicknetSeed,validateFreshChallenge} from '../protocol/quicknet.mjs';
import {deterministicSign as sign} from '../test-vectors/generate.mjs';
import {hashObject} from '../verifier/proof.mjs';

const vectors=[];
for(const profile of ['front-only','rear-only','front-rear']){
 const target=new Set(CHOICE_PROMPTS_V3.filter(id=>profile==='front-rear'||id.startsWith('selfie')===(profile==='front-only')));
 const seen=new Set();
 for(let n=0;n<4096&&(n<100||seen.size<target.size);n++){
  const seed=n.toString(16).padStart(64,'0');
  const row={seed,profile,...choicesFromSeed(seed,profile,'CLAPPA-CHOICES-v3')};
  vectors.push(row);seen.add(row.prompt_id);
 }
 if(seen.size!==target.size)throw Error('Incomplete prompt coverage for '+profile);
}
fs.writeFileSync('test-vectors/choices-v3.json',JSON.stringify(vectors,null,2)+'\n');
fs.writeFileSync('android/app/src/test/resources/choices-v3.tsv',vectors.map(v=>[v.seed,v.profile,v.prompt_id,v.camera,v.flash,v.cadence,v.slot_ms,v.pitches.join(',')].join('\t')).join('\n')+'\n');
const previous=JSON.parse(fs.readFileSync('test-vectors/quicknet/dual.json'));
const pulse=previous.issue.payload.data.freshness.pulse;
// Use a fixed pre-pulse challenge ID whose deterministic output exercises a new gesture.
let arm,choices;
for(let n=1;n<=256;n++){
 arm=sign({...previous.arm.payload,data:{...previous.arm.payload.data,mapping:'CLAPPA-CHOICES-v3',challenge_id:n.toString(16).padStart(32,'0')}});
 choices=choicesFromSeed(quicknetSeed(arm.payload,pulse),arm.payload.data.camera_profile,'CLAPPA-CHOICES-v3');
 if(!CHOICE_PROMPTS_V2.includes(choices.prompt_id))break;
}
if(CHOICE_PROMPTS_V2.includes(choices.prompt_id))throw Error('Fixture did not reach a new gesture');
delete choices.mapping;
const issue=sign({...previous.issue.payload,prev:hashObject(arm),data:{...previous.issue.payload.data,...choices,challenge_id:arm.payload.data.challenge_id,freshness:{...previous.issue.payload.data.freshness,arm_sha256:hashObject(arm)}}});
validateFreshChallenge(issue,arm);
fs.writeFileSync('test-vectors/quicknet/challenge-v3.json',JSON.stringify({arm,issue},null,2)+'\n');
console.log(`Wrote ${vectors.length} v3 choice vectors, Kotlin corpus and signed dual-camera fixture`);
