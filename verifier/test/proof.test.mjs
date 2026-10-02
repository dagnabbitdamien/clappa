import test,{after} from 'node:test';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
import {mkdtemp,cp,readFile,writeFile,rm} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {canonical,parseStrict,verifyBundle,hashObject} from '../proof.mjs';
import {generate,deterministicSign} from '../../test-vectors/generate.mjs';
const vectorPrefix=path.join(os.tmpdir(),'clappa-vectors-');const vectorDirectory=await mkdtemp(vectorPrefix);const root=pathToFileURL(vectorDirectory+path.sep);const fixture=await generate(root);
after(async()=>{if(!vectorDirectory.startsWith(vectorPrefix))throw Error('Unexpected fixture directory');await rm(vectorDirectory,{recursive:true,force:true})});
async function temp(t){const d=await mkdtemp(path.join(os.tmpdir(),'clappa-test-'));t.after(()=>rm(d,{recursive:true,force:true}));await cp(new URL('valid/',root),path.join(d,'proof'),{recursive:true});await cp(new URL('recording.bin',root),path.join(d,'recording.bin'));return d;}
const run=d=>verifyBundle(path.join(d,'proof'),path.join(d,'recording.bin'));
const eventPath=(d,n)=>path.join(d,'proof/events/'+String(n).padStart(6,'0')+'.json');
async function edit(file,f){const x=JSON.parse(await readFile(file,'utf8'));f(x);await writeFile(file,JSON.stringify(x));}
test('JCS sorting, numbers and preserved unicode',()=>{assert.equal(canonical({z:-0,a:1e30,b:'é'}),'{"a":1e+30,"b":"é","z":0}');assert.equal(canonical({'\uE000':1,'😀':2}),' {"😀":2,"":1}'.trim());});
test('strict JSON rejects ambiguous/invalid input',()=>{for(const x of ['{"x":1,"x":2}','{"x":1,"\\u0078":2}','[1,]','{"x":1,}','"\\ud800"','1e999','{} garbage'])assert.throws(()=>parseStrict(x));assert.equal(parseStrict('{"__proto__":1}').__proto__,1);});
test('valid fixture and independent key pin',async()=>{const r=await verifyBundle(new URL('valid/',root),new URL('recording.bin',root),{trustedKey:fixture.key.key_id});assert.equal(r.status,'EXACT ORIGINAL VERIFIED');assert.equal((await verifyBundle(new URL('valid/',root),new URL('recording.bin',root),{trustedKey:'0'.repeat(64)})).status,'INVALID PROOF');});
test('vectors regenerate byte-identically',async()=>{const before=await readFile(new URL('valid/final-seal.json',root));await generate(root);assert.deepEqual(await readFile(new URL('valid/final-seal.json',root)),before);});
for(const field of ['cadence','flash'])test('tampering '+field,async t=>{const d=await temp(t);await edit(eventPath(d,1),e=>e.payload.data[field]=field==='flash'?'red':'1110001');assert.equal((await run(d)).status,'INVALID PROOF');});
test('both photo originals and proof derivatives checked',async t=>{for(const file of ['start-a-original','start-b-original','start-a-proof','start-b-proof']){const d=await temp(t);const p=path.join(d,'proof/images/'+file+'.jpg');let b=await readFile(p);b[10]^=1;await writeFile(p,b);assert.equal((await run(d)).status,'INVALID PROOF');}});
test('one-byte media change reports mismatch',async t=>{const d=await temp(t);await writeFile(path.join(d,'recording.bin'),'X');assert.equal((await run(d)).status,'PROOF TRANSCRIPT VERIFIED, MEDIA MISMATCH');});
test('missing final seal stays incomplete',async t=>{const d=await temp(t);await rm(path.join(d,'proof/final-seal.json'));assert.equal((await run(d)).status,'INCOMPLETE SESSION');});
test('removed event fails closed',async t=>{const d=await temp(t);await rm(eventPath(d,2));assert.equal((await run(d)).status,'INVALID PROOF');});
test('reordered events fail closed',async t=>{const d=await temp(t);const a=await readFile(eventPath(d,1)),b=await readFile(eventPath(d,2));await writeFile(eventPath(d,1),b);await writeFile(eventPath(d,2),a);assert.equal((await run(d)).status,'INVALID PROOF');});
test('duplicate JSON key fails closed',async t=>{const d=await temp(t);await writeFile(path.join(d,'proof/session.json'),'{"protocol":"0.3","protocol":"0.3"}');assert.equal((await run(d)).status,'INVALID PROOF');});
test('version is reported explicitly',async t=>{const d=await temp(t);await edit(path.join(d,'proof/session.json'),x=>x.protocol='9');assert.equal((await run(d)).status,'UNSUPPORTED VERSION');});
async function resign(d,mutate){const es=structuredClone(fixture.events);mutate(es);for(let i=0;i<es.length;i++){es[i].payload.prev=i?hashObject(es[i-1]):null;es[i]=deterministicSign(es[i].payload);await writeFile(eventPath(d,i),canonical(es[i]));}const s=structuredClone(fixture.seal);s.payload.head=hashObject(es.at(-1));await writeFile(path.join(d,'proof/final-seal.json'),canonical(deterministicSign(s.payload)));}
test('valid signature cannot authorize claim without preceding random result',async t=>{const d=await temp(t);await resign(d,es=>{es[3].payload.data.challenge_id='55'.repeat(16)});assert.equal((await run(d)).status,'INVALID PROOF');});
test('claim deadline checked even when signed',async t=>{const d=await temp(t);await resign(d,es=>{es[3].payload.data.captured_at+=10000});assert.equal((await run(d)).status,'INVALID PROOF');});
test('signed path traversal rejected',async t=>{const d=await temp(t);await resign(d,es=>{es[2].payload.data.photo_a.original.path='../recording.bin'});assert.equal((await run(d)).status,'INVALID PROOF');});
test('two-photo delay bounded',async t=>{const d=await temp(t);await resign(d,es=>{es[2].payload.data.b_at+=2000});assert.equal((await run(d)).status,'INVALID PROOF');});

