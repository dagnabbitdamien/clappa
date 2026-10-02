import {validateDualResponse} from '../protocol/dual-view.mjs';
import {validateFreshChallenge,QUICKNET_PROFILE,roundTime} from '../protocol/quicknet.mjs';
import {validateResponseWindow,RESPONSE_PROFILE} from '../protocol/response-window.mjs';
import {createHash,createPublicKey,sign,verify} from 'node:crypto';
import {readFile,realpath,stat,readdir} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';
import {schema} from '../protocol/schema.mjs';
import {canonical,parseStrict} from './canonical.mjs';
import {verifyMediaArchive} from '../protocol/media-chain.mjs';
import {matchRecording} from './recording.mjs';
import {validateMediaContext} from '../protocol/evidence.mjs';
export {canonical,parseStrict};
export const sha256=b=>createHash('sha256').update(b).digest('hex');
export const hashObject=o=>sha256(Buffer.from(canonical(o)));
const order=BigInt('0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551');
const validators=Object.fromEntries(['key','session','event','seal','media-proof'].map(k=>[k,new Ajv({strict:false}).compile({...schema,$ref:'#/definitions/'+k})]));
export function validate(kind,o){ if(!validators[kind](o)) throw Error('Invalid '+kind+': '+validators[kind].errors?.[0]?.message); }
export function decode(s) {if(typeof s!=='string'||!/^[A-Za-z0-9_-]+$/.test(s))throw Error('Invalid base64url'); const b=Buffer.from(s,'base64url');if(b.toString('base64url')!==s)throw Error('Noncanonical base64url');return b;}
export function signatureBytes(s){const b=decode(s);if(b.length!==64)throw Error('Invalid signature length');const r=BigInt('0x'+b.subarray(0,32).toString('hex')),v=BigInt('0x'+b.subarray(32).toString('hex'));if(r===0n||r>=order||v===0n||v>order/2n)throw Error('Noncanonical ES256 signature');return b;}
export function normalizeSignature(b){b=Buffer.from(b);const s=BigInt('0x'+b.subarray(32).toString('hex'));if(s>order/2n)Buffer.from((order-s).toString(16).padStart(64,'0'),'hex').copy(b,32);return b;}
export function signObject(payload,key){return {payload,signature:normalizeSignature(sign('sha256',Buffer.from(canonical(payload)),{key,dsaEncoding:'ieee-p1363'})).toString('base64url')};}
export function publicRecord(key){const spki=createPublicKey(key).export({type:'spki',format:'der'});return {protocol:'0.3',algorithm:'ES256-P1363',key_id:sha256(spki),spki:spki.toString('base64url')};}
export function keyObject(record){validate('key',record);const spki=decode(record.spki);if(sha256(spki)!==record.key_id)throw Error('Key fingerprint mismatch');const key=createPublicKey({key:spki,type:'spki',format:'der'});if(key.asymmetricKeyType!=='ec'||key.asymmetricKeyDetails.namedCurve!=='prime256v1')throw Error('Wrong signing curve');return key;}
export function verifySignature(record,key){if(!verify('sha256',Buffer.from(canonical(record.payload)),{key,dsaEncoding:'ieee-p1363'},signatureBytes(record.signature)))throw Error('Signature mismatch');}
export async function hashFile(file){const h=createHash('sha256');for await(const b of createReadStream(file))h.update(b);return h.digest('hex');}
async function json(file){const s=await stat(file);if(s.size>4*1024*1024)throw Error('JSON too large');return parseStrict(new TextDecoder('utf-8',{fatal:true}).decode(await readFile(file)));}
async function inside(root,relative){const p=await realpath(path.join(root,relative));if(!p.startsWith(root+path.sep))throw Error('Proof path escapes folder');return p;}
async function photo(root,pair){for(const f of [pair.original,pair.proof]){const p=await inside(root,f.path),s=await stat(p);if(!s.isFile()||s.size!==f.bytes||await hashFile(p)!==f.sha256)throw Error('Image mismatch: '+f.path);const b=await readFile(p);if(b[0]!==255||b[1]!==216||b.at(-2)!==255||b.at(-1)!==217)throw Error('Invalid JPEG markers');}}

export async function verifyBundle(folder,mediaPath,{trustedKey}={}) {
  try {
    const root=await realpath(folder),session=await json(await inside(root,'session.json')),pub=await json(await inside(root,'public-key.json'));
    if(session.protocol!=='0.3'||pub.protocol!=='0.3')return {status:'UNSUPPORTED VERSION'};
    validate('session',session); const key=keyObject(pub);
    if(session.key_id!==pub.key_id||trustedKey&&trustedKey!==pub.key_id)throw Error('Unexpected signing key');
    const eventsDir=await inside(root,'events');const names=(await readdir(eventsDir)).sort();
    if(names.length>10000)throw Error('Too many events');
    let prev=null,at=0,recording=null,pending=null,startOK=false,endOK=false,ended=false,failed=false,lastChallenge=null,previousType=null;
    let captureProfile=null,dualResponses=0;let sessionPolicy=null,claimWindow=6000;const missed=[];let cameraProfile=null,freshnessProfile=null,armedEvent=null,armPending=false,freshResponses=0;const ids=new Set();let lastElapsed=0;let descriptors=[];let issuedEvent=null,mediaProofs=0,timedResponses=0,responseProfile=null;const checkpoints=new Map();
    function collect(outputs){if(outputs.length!==descriptors.length||new Set(outputs.map(o=>o.output_id)).size!==outputs.length)throw Error('Output coverage missing/duplicate');for(const o of outputs){const list=checkpoints.get(o.output_id);if(!list)throw Error('Unknown output');const last=list.at(-1);if(last&&(o.packets<last.packets||o.bytes<last.bytes))throw Error('Output checkpoint regression');list.push(o);}}
    for(let seq=0;seq<names.length;seq++){
      if(names[seq]!==String(seq).padStart(6,'0')+'.json')throw Error('Event filename/sequence gap');
      const e=await json(await inside(root,'events/'+names[seq]));if(e.payload?.protocol!=='0.3')return {status:'UNSUPPORTED VERSION'};
      validate('event',e);verifySignature(e,key);const p=e.payload,d=p.data;
      if(p.session_id!==session.session_id||p.key_id!==pub.key_id||p.seq!==seq||p.prev!==prev||p.at<at||ended)throw Error('Event chain mismatch');
      if(seq===0&&p.type!=='session-start'||seq>0&&p.type==='session-start')throw Error('Session start position');
      switch(p.type){
        case 'session-start':captureProfile=d.capture_profile??null;if(captureProfile&&(d.camera_profile!=='front-only'||d.session_policy!=='CLAPPA-SESSION-v2'||d.freshness_profile!==QUICKNET_PROFILE))throw Error('Invalid dual session policy');sessionPolicy=d.session_policy??null;claimWindow=d.claim_window_ms??6000;if((sessionPolicy==='CLAPPA-SESSION-v2')!==(d.claim_window_ms===30000))throw Error('Invalid session/claim policy');cameraProfile=d.camera_profile??null;freshnessProfile=d.freshness_profile??null;responseProfile=d.response_profile??null;recording=d.recording_id;descriptors=d.outputs;if(new Set(descriptors.map(o=>o.output_id)).size!==descriptors.length||descriptors.some(o=>o.session_id!==session.session_id)||!descriptors.some(o=>o.role==='recording'))throw Error('Invalid output descriptors');for(const o of descriptors)checkpoints.set(o.output_id,[]);break;
        case 'output-checkpoint':collect(d.outputs);break;
        case 'challenge-armed':
          if((d.capture_profile??null)!==captureProfile||d.camera_profile!==cameraProfile||freshnessProfile!==QUICKNET_PROFILE||armPending||pending||endOK||p.at>=roundTime(d.round)||d.obs.recording_id!==recording||d.obs.elapsed_ms<lastElapsed)throw Error('Invalid challenge lock');
          collect(d.obs.outputs);lastElapsed=d.obs.elapsed_ms;armedEvent=e;armPending=true;break;
        case 'challenge-issued':
          if(freshnessProfile===QUICKNET_PROFILE){if(!armPending)throw Error('Missing challenge lock');validateFreshChallenge(e,armedEvent);armPending=false;freshResponses++;}else if(d.freshness||d.pitches||d.qr_profile)throw Error('Freshness without session policy');
          if(sessionPolicy==='CLAPPA-SESSION-v2'&&d.pair_window_ms!==3000)throw Error('Missing signed photo pair window');
          if(pending||endOK||ids.has(d.challenge_id)||d.phase==='start'&&startOK||d.phase!=='start'&&!startOK)throw Error('Invalid challenge ordering');
          if(d.obs.recording_id!==recording||d.obs.elapsed_ms<lastElapsed)throw Error('OBS commitment regression');
          if(responseProfile===RESPONSE_PROFILE&&d.response_window_ms!==10000)throw Error('Missing response deadline');if(freshnessProfile!==QUICKNET_PROFILE)collect(d.obs.outputs);lastElapsed=d.obs.elapsed_ms;ids.add(d.challenge_id);pending={...d,at:p.at};issuedEvent=e;break;
        case 'challenge-captured':
          if(!pending||pending.challenge_id!==d.challenge_id||d.a_at<pending.at||d.b_at<d.a_at||d.b_at-d.a_at>(pending.pair_window_ms??(pending.flash==="led"?3000:1500))||p.at<d.b_at)throw Error('Invalid two-photo response');
          if(validateResponseWindow(issuedEvent.payload,p,{required:responseProfile===RESPONSE_PROFILE})===RESPONSE_PROFILE)timedResponses++;
          await photo(root,d.photo_a);await photo(root,d.photo_b);if(validateDualResponse(issuedEvent.payload,p)){await photo(root,d.dual.rear_a);await photo(root,d.dual.rear_b);dualResponses++;}
          if(pending.phase==='start')startOK=true;if(pending.phase==='end')endOK=true;
          lastChallenge={id:d.challenge_id,at:p.at};pending=null;break;
        case 'challenge-failed':if((!pending||pending.challenge_id!==d.challenge_id)&&(!armPending||armedEvent.payload.data.challenge_id!==d.challenge_id))throw Error('Unmatched failed challenge');missed.push({challenge_id:d.challenge_id,reason:d.reason,phase:pending?.phase??armedEvent.payload.data.phase});if(sessionPolicy==='CLAPPA-SESSION-v2'){const phase=pending?.phase??armedEvent.payload.data.phase;if(phase==='start')startOK=true;if(phase==='end')endOK=true;}else failed=true;lastChallenge=null;pending=null;armPending=false;break;
        case 'claim':
          if(previousType!=='challenge-captured'||!lastChallenge||d.challenge_id!==lastChallenge.id||d.captured_at<lastChallenge.at||d.captured_at>lastChallenge.at+claimWindow||p.at<d.captured_at)throw Error('Claim must follow a captured challenge within its signed offer window');
          await photo(root,d.photo);break;
        case 'session-end':if(pending||armPending||(sessionPolicy!=='CLAPPA-SESSION-v2'&&(!startOK||!endOK)))throw Error('End with unresolved challenges or missing legacy bookends');ended=true;break;
      }
      if(p.type==='challenge-captured'||p.type==='claim'){
        let context;try{context=await json(await inside(root,'media-proofs/'+names[seq]));}catch(error){if(error.code!=='ENOENT')throw error;}
        if(context){validateMediaContext(e,pub,context);if(canonical(context.challenge)!==canonical(issuedEvent)||(freshnessProfile===QUICKNET_PROFILE&&canonical(context.armed)!==canonical(armedEvent))||canonical(context.proof.payload.descriptors)!==canonical(descriptors))throw Error('Detached proof differs from session transcript');collect(context.proof.payload.outputs);mediaProofs++;}
      }
      if(p.type!=='output-checkpoint')previousType=p.type;prev=hashObject(e);at=p.at;
    }
    let seal;try{seal=await json(await inside(root,'final-seal.json'));}catch(e){if(e.code==='ENOENT')return {status:'INCOMPLETE SESSION',key_id:pub.key_id};throw e;}
    if(seal.payload?.protocol!=='0.3')return {status:'UNSUPPORTED VERSION'};
    validate('seal',seal);verifySignature(seal,key);const p=seal.payload;
    if(p.session_id!==session.session_id||p.key_id!==pub.key_id||p.recording_id!==recording||p.event_count!==names.length||p.head!==prev||p.at<at)throw Error('Final seal does not bind transcript');
    if(!ended||failed)return {status:'INCOMPLETE SESSION',key_id:pub.key_id};
    collect(p.outputs);
    for(const d of descriptors){const terminal=p.outputs.find(o=>o.output_id===d.output_id);if(!terminal||terminal.packets===0)throw Error('No terminal media coverage');await verifyMediaArchive(d,await inside(root,'outputs/'+d.output_id+'.jsonl'),await inside(root,'outputs/'+d.output_id+'.bin'),checkpoints.get(d.output_id),terminal);}
    if(!mediaPath)return {status:'INCOMPLETE SESSION',detail:'Supply exact recording',key_id:pub.key_id};
    const s=await stat(mediaPath);if(!s.isFile()||s.size!==p.media.bytes||await hashFile(mediaPath)!==p.media.sha256)return {status:'PROOF TRANSCRIPT VERIFIED, MEDIA MISMATCH',key_id:pub.key_id};
    const recordingOutput=descriptors.find(d=>d.role==='recording');
    const binding=await matchRecording(recordingOutput,await inside(root,'outputs/'+recordingOutput.output_id+'.jsonl'),await inside(root,'outputs/'+recordingOutput.output_id+'.bin'),mediaPath,{sealedMediaVerified:true});
    let twitchBindings=0;
    let identityNames=[];try{identityNames=await readdir(path.join(root,'identities'));}catch(e){if(e.code!=='ENOENT')throw e;}
    if(identityNames.length){const {validateIdentityBinding}=await import('../protocol/twitch-identity.mjs');if(identityNames.length>names.length)throw Error('Excess identity records');for(const name of identityNames){if(!/^[0-9]{6}\.json$/.test(name)||!names.includes(name))throw Error('Invalid identity filename');const event=await json(await inside(root,'events/'+name));if(!['challenge-captured','claim'].includes(event.payload.type))throw Error('Identity is not bound to a photo event');const identity=await json(await inside(root,'identities/'+name));if(!identity.evidence)throw Error('Missing archived Twitch evidence');validateIdentityBinding(identity,event,pub);twitchBindings++;}}
    return {status:'EXACT ORIGINAL VERIFIED',key_id:pub.key_id,identity:trustedKey?'matches supplied fingerprint':'bundle key; identity not independently established',twitch_identity_bindings:twitchBindings,twitch_account_verification:twitchBindings?'Phone bindings checked; Twitch issuer signature requires separately trusted Twitch keys':'not present',events:names.length,session_policy:sessionPolicy??'legacy-strict',missed_challenges:missed,bookends:{start_resolved:startOK,end_resolved:endOK},dual_view_responses:dualResponses,detached_media_proofs:mediaProofs,response_profile:responseProfile??"legacy-unbounded",timed_responses:timedResponses,freshness_profile:freshnessProfile??"none",beacon_challenges:freshResponses,media_binding:binding};
  }catch(e){return {status:'INVALID PROOF',detail:e.message};}
}

