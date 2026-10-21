import test from 'node:test';import assert from 'node:assert/strict';
import {validate} from '../proof.mjs';import {readFile} from 'node:fs/promises';
const events=[null,JSON.parse(await readFile(new URL('../../test-vectors/valid/events/000001.json',import.meta.url)))];
test('camera and illumination must agree with the signed challenge',()=>{
 const e=structuredClone(events[1]);e.payload.data.camera='front';e.payload.data.prompt_id='selfie';
 for(const color of ['red','green','blue']){e.payload.data.flash=color;assert.doesNotThrow(()=>validate('event',e));}
 e.payload.data.flash='led';assert.throws(()=>validate('event',e));
 e.payload.data.camera='rear';assert.throws(()=>validate('event',e));
 e.payload.data.prompt_id='left';assert.doesNotThrow(()=>validate('event',e));
 e.payload.data.flash='red';assert.throws(()=>validate('event',e));
});
