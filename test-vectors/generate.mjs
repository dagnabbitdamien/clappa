import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createPrivateKey,createECDH} from 'node:crypto';
import {p256} from '@noble/curves/p256';
import {canonical,sha256,hashObject,publicRecord} from '../verifier/proof.mjs';
import {MediaChain} from '../protocol/media-chain.mjs';
const sourceRoot=new URL('./',import.meta.url);
const privateBytes=Buffer.alloc(32);privateBytes[31]=1; // Public TEST ONLY key. Never use for real capture.
const ec=createECDH('prime256v1');ec.setPrivateKey(privateBytes);const pt=ec.getPublicKey();
const privateKey=createPrivateKey({format:'jwk',key:{kty:'EC',crv:'P-256',d:privateBytes.toString('base64url'),x:pt.subarray(1,33).toString('base64url'),y:pt.subarray(33).toString('base64url')}});
const key=publicRecord(privateKey),session_id='11'.repeat(16),recording_id='22'.repeat(16),base=1789200000000;
export function deterministicSign(payload){return {payload,signature:Buffer.from(p256.sign(Buffer.from(sha256(Buffer.from(canonical(payload))),'hex'),privateBytes,{lowS:true}).toCompactRawBytes()).toString('base64url')};}
const json=(url,v)=>writeFile(url,canonical(v)+'\n');
export async function generate(root=sourceRoot){
  const dir=new URL('valid/',root);await mkdir(new URL('events/',dir),{recursive:true});await mkdir(new URL('images/',dir),{recursive:true});await mkdir(new URL('outputs/',dir),{recursive:true});
  const descriptor={session_id,output_id:'66'.repeat(16),role:'recording',codec:'test-fixture'};const mediaChain=new MediaChain(descriptor);
  const jpg=await readFile(new URL('fixture.jpg',sourceRoot));
  const ref=name=>({path:'images/'+name+'.jpg',bytes:jpg.length,sha256:sha256(jpg)});
  const pair=name=>({original:ref(name+'-original'),proof:ref(name+'-proof')});
  for(const name of ['start-a','start-b','claim','end-a','end-b'])for(const kind of ['original','proof'])await writeFile(new URL('images/'+name+'-'+kind+'.jpg',dir),jpg);
  const events=[];
  const add=(type,data,offset)=>{const seq=events.length;events.push(deterministicSign({protocol:'0.3',algorithm:'ES256-P1363',key_id:key.key_id,session_id,seq,prev:seq?hashObject(events.at(-1)):null,at:base+offset,type,data}));};
  const issued=(phase,id,offset)=>add('challenge-issued',{challenge_id:id,prompt_id:'left',phase,cadence:'1000110',slot_ms:100,camera:'rear',flash:'led',obs:{recording_id,outputs:[mediaChain.snapshot()],elapsed_ms:offset}},offset);
  add('session-start',{recording_id,outputs:[descriptor]},0);issued('start','33'.repeat(16),1000);
  add('challenge-captured',{challenge_id:'33'.repeat(16),photo_a:pair('start-a'),photo_b:pair('start-b'),a_at:base+2000,b_at:base+2100},2200);
  add('claim',{challenge_id:'33'.repeat(16),photo:pair('claim'),captured_at:base+3000},3100);
  issued('end','44'.repeat(16),4000);
  add('challenge-captured',{challenge_id:'44'.repeat(16),photo_a:pair('end-a'),photo_b:pair('end-b'),a_at:base+5000,b_at:base+5100},5200);
  add('session-end',{},5300);
  const media=Buffer.from('CLAPPA deterministic TEST recording bytes\n');await writeFile(new URL('recording.bin',root),media);
  const packet=mediaChain.append({type:'video',track:0,pts:'0',dts:'0',timebase_num:1,timebase_den:1000,keyframe:true},media);await writeFile(new URL('outputs/'+descriptor.output_id+'.jsonl',dir),canonical(packet)+'\n');await writeFile(new URL('outputs/'+descriptor.output_id+'.bin',dir),media);
  const seal=deterministicSign({protocol:'0.3',algorithm:'ES256-P1363',key_id:key.key_id,session_id,type:'final-seal',at:base+6000,event_count:events.length,head:hashObject(events.at(-1)),recording_id,outputs:[mediaChain.snapshot()],media:{name:'recording.bin',bytes:media.length,sha256:sha256(media)}});
  await json(new URL('session.json',dir),{protocol:'0.3',session_id,key_id:key.key_id});await json(new URL('public-key.json',dir),key);await json(new URL('final-seal.json',dir),seal);
  for(let i=0;i<events.length;i++)await json(new URL('events/'+String(i).padStart(6,'0')+'.json',dir),events[i]);
  await json(new URL('expected.json',root),{status:'EXACT ORIGINAL VERIFIED',key_id:key.key_id,head:seal.payload.head,seal_sha256:hashObject(seal)});
  await json(new URL('invalid-cases.json',root),[
    {case:'change-photo-b-byte',expected:'INVALID PROOF'},
    {case:'change-cadence',expected:'INVALID PROOF'},
    {case:'change-flash',expected:'INVALID PROOF'},
    {case:'reorder-events',expected:'INVALID PROOF'},
    {case:'delete-event',expected:'INVALID PROOF'},
    {case:'remove-final-seal',expected:'INCOMPLETE SESSION'},
    {case:'change-recording-byte',expected:'PROOF TRANSCRIPT VERIFIED, MEDIA MISMATCH'},
    {case:'unsupported-version',expected:'UNSUPPORTED VERSION'}]);
  return {events,seal,key,privateKey};
}
if(process.argv[1]?.endsWith('generate.mjs')){await generate();console.log('Deterministic vectors generated (TEST KEY ONLY)');}


