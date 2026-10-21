import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {encodeTransport,decodeTransport,parseTransportFrame} from '../../protocol/transport.mjs';
import {encodeBase45,decodeBase45} from '../../protocol/base45.mjs';
const root=new URL('../../test-vectors/',import.meta.url);
const e=JSON.parse(await readFile(new URL('valid/events/000002.json',root))),k=JSON.parse(await readFile(new URL('valid/public-key.json',root))),p=await readFile(new URL('fixture.jpg',root));
test('two-photo QR payload recovers out of order with repeats',()=>{const frames=encodeTransport(e,k,[p,p]);const o=decodeTransport([...frames].reverse().concat(frames));assert.deepEqual(o.event,e);assert.equal(o.photos.length,2);});
test('missing and corrupt compact frames are rejected',()=>{const f=encodeTransport(e,k,[p,p]);assert.throws(()=>decodeTransport(f.slice(1)));const bytes=decodeBase45(f[0].slice(8));bytes[36]^=1;assert.throws(()=>decodeTransport(['CLAPPA2:'+encodeBase45(bytes),...f.slice(1)]));});
test('legacy transport remains readable, mixed versions rejected',()=>{const old=encodeTransport(e,k,[p,p],{version:1}),fresh=encodeTransport(e,k,[p,p]);assert.deepEqual(decodeTransport(old).event,e);assert.throws(()=>decodeTransport([...old,...fresh]));});
test('compact frames retain full digest and have bounded binary headers',()=>{const frames=encodeTransport(e,k,[p,p]);for(const f of frames){assert.ok(f.length<=368);const x=parseTransportFrame(f);assert.equal(x.digest.length,64);assert.equal(x.version,2);assert.ok(Buffer.from(x.data,'base64url').length<=200)}assert.throws(()=>parseTransportFrame('CLAPPA2:0'));assert.throws(()=>parseTransportFrame('CLAPPA2:'+encodeBase45(Buffer.alloc(240))))});
test('Base45 RFC 9285 vectors and malformed input',()=>{for(const [a,b] of [['AB','BB8'],['Hello!!','%69 VD92EX0'],['base-45','UJCLQE7W581'],['ietf!','QED8WEX0']]){assert.equal(encodeBase45(Buffer.from(a)),b);assert.equal(decodeBase45(b).toString(),a)}for(const bad of ['A',':::','::','aa'])assert.throws(()=>decodeBase45(bad));const all=Buffer.from(Array.from({length:256},(_,i)=>i));assert.deepEqual(decodeBase45(encodeBase45(all)),all)});

