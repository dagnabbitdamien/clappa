import fs from 'node:fs';import {createHash} from 'node:crypto';import {choicesFromSeed} from '../protocol/challenge-derivation.mjs';
const vectors=Array.from({length:32},(_,i)=>{const seed=createHash('sha256').update('CLAPPA choice test '+i).digest('hex');return {seed,...choicesFromSeed(seed)}});
fs.writeFileSync('test-vectors/choices-v1.json',JSON.stringify(vectors,null,2)+'\n');
fs.mkdirSync('android/app/src/test/resources',{recursive:true});
fs.writeFileSync('android/app/src/test/resources/choices-v1.tsv',vectors.map(v=>[v.seed,v.prompt_id,v.camera,v.flash,v.cadence,v.slot_ms,v.pitches.join(',')].join('\t')).join('\n')+'\n');
