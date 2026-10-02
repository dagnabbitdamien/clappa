import {parseTransportFrame} from "../protocol/transport.mjs";
// Integration harness for the isolated portable OBS instance, not a phone camera test.
import {verifyQrMedia} from '../verifier/qr-proof.mjs';
import https from 'node:https';
import {spawn} from 'node:child_process';
import {generateKeyPairSync,createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import WebSocket from 'ws';
import sharp from 'sharp';
import jsQR from 'jsqr';
import {signObject,publicRecord,hashObject,sha256,verifyBundle} from '../verifier/proof.mjs';
const root='output/native-test';
const pairing=JSON.parse(await readFile(root+'/pairing.json'));
if(!pairing.url.endsWith(':17444'))throw Error('Only isolated test port is allowed');
const {privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'}),pub=publicRecord(privateKey);
let issued,qrFrames;let cursor=0,seq=0,head=null,session,outputs,seal,sealed=false,lastAck=-1;const messages=[];
async function req(path,body,authorized=true){return new Promise((resolve,reject)=>{const r=https.request({hostname:'127.0.0.1',port:17444,path,method:body?'POST':'GET',rejectUnauthorized:false,headers:{...(authorized?{Authorization:'Bearer '+pairing.token}:{}),...(body?{'Content-Type':'application/json'}:{})}},res=>{if(sha256(res.socket.getPeerCertificate().raw)!==pairing.cert_sha256){reject(Error('TLS pin mismatch'));r.destroy();return;}let text='';res.on('data',b=>text+=b);res.on('end',()=>{if(res.statusCode!==200)reject(Error('HTTP '+res.statusCode));else resolve(JSON.parse(text));});});r.on('error',reject);r.end(body?JSON.stringify(body):undefined);});}
async function poll(){for(const row of await req('/poll?after='+cursor)){if(row.id<=cursor)continue;cursor=row.id;const m=row.message;messages.push(m.type);if(m.type==='error')throw Error(m.message);if(m.type==='ack')lastAck=m.seq;if(m.type==='session')session=m;if(m.type==='checkpoint')outputs=m.outputs;if(m.type==='seal-request')seal=m;if(m.type==='sealed')sealed=true;}}
async function until(fn,ms=12000){const stop=Date.now()+ms;while(!fn()){if(Date.now()>stop)throw Error('Timeout '+messages.join(','));await poll();await new Promise(r=>setTimeout(r,100));}}
async function event(type,data,images={}){const e=signObject({protocol:'0.3',algorithm:'ES256-P1363',key_id:pub.key_id,session_id:session.session_id,seq,prev:head,at:Date.now(),type,data},privateKey);let context;if(type==='challenge-issued')issued=e;if(type==='challenge-captured'||type==='claim')context={challenge:issued,proof:signObject({profile:'CLAPPA-MEDIA-PROOF-v1',algorithm:'ES256-P1363',key_id:pub.key_id,session_id:session.session_id,recording_id:session.recording_id,event_sha256:hashObject(e),challenge_sha256:hashObject(issued),at:Date.now(),outputs,descriptors:session.descriptors},privateKey)};await req('/message',{type:'event',event:e,images,...(context?{context}:{})});head=hashObject(e);seq++;return e;}
const cfg=JSON.parse(await readFile('.tools/obs-test/config/obs-studio/plugin_config/obs-websocket/config.json'));
const ws=new WebSocket('ws://127.0.0.1:'+cfg.server_port),pending=new Map();let rid=0;
const h=s=>createHash('sha256').update(s).digest('base64');
await new Promise((resolve,reject)=>{ws.on('error',reject);ws.on('message',raw=>{const m=JSON.parse(raw);if(m.op===0){const a=m.d.authentication;ws.send(JSON.stringify({op:1,d:{rpcVersion:1,authentication:h(h(cfg.server_password+a.salt)+a.challenge)}}));}if(m.op===2)resolve();if(m.op===7){const p=pending.get(m.d.requestId);pending.delete(m.d.requestId);m.d.requestStatus.result?p.resolve(m.d.responseData):p.reject(Error(JSON.stringify(m.d.requestStatus)));}});});
function obs(requestType,requestData={}){return new Promise((resolve,reject)=>{const requestId=String(++rid);pending.set(requestId,{resolve,reject});ws.send(JSON.stringify({op:6,d:{requestType,requestId,requestData}}));});}
const jpeg=await readFile('test-vectors/fixture.jpg');
const flashJpeg=await sharp({create:{width:128,height:128,channels:3,background:'#d97a43'}}).jpeg().toBuffer();
async function challenge(phase){await poll();await until(()=>outputs?.every(o=>o.packets>0));const id=(phase==='start'?'1':'2').repeat(32);await event('challenge-issued',{challenge_id:id,prompt_id:'left',phase,response_window_ms:10000,cadence:'1000110',slot_ms:100,camera:'rear',flash:'led',obs:{recording_id:session.recording_id,elapsed_ms:Date.now()-began,outputs}});if(process.argv.includes('--reject-late-response'))await new Promise(r=>setTimeout(r,10150));const at=Date.now();let images={};const pair=label=>Object.fromEntries(['original','proof'].map(kind=>{const path=`images/${phase}-${label}-${kind}.jpg`;const image=label==='b'?flashJpeg:jpeg;images[path]=image.toString('base64url');return [kind,{path,bytes:image.length,sha256:sha256(image)}];}));await event('challenge-captured',{challenge_id:id,photo_a:pair('a'),photo_b:pair('b'),a_at:at,b_at:at,response_ms:at-issued.payload.at,pair_ms:0},images);}
let began,streamSink,previousStream;const withStream=process.argv.includes('--with-stream');
try{
  let rejected=false;try{await req('/poll?after=0',null,false)}catch(e){rejected=e.message==='HTTP 401'}if(!rejected)throw Error('Unauthenticated access was not rejected');
  await req('/message',{type:'hello',key:pub});await until(()=>messages.includes('paired'));
  if((await obs('GetRecordStatus')).outputActive)throw Error('Isolated instance is already recording');
  const scene=(await obs('GetCurrentProgramScene')).currentProgramSceneName;
  const item=(await obs('GetSceneItemId',{sceneName:scene,sourceName:'CLAPPA tile'})).sceneItemId;
  await obs('SetVideoSettings',{baseWidth:1920,baseHeight:1080,outputWidth:1920,outputHeight:1080});
  const video=await obs('GetVideoSettings');
  await obs('SetSceneItemTransform',{sceneName:scene,sceneItemId:item,sceneItemTransform:{positionX:video.baseWidth-872-8,positionY:video.baseHeight-480-8,scaleX:1,scaleY:1}});
  if(withStream){
   previousStream=await obs('GetStreamServiceSettings');
   streamSink=spawn('C:/Program Files/ffmpeg/bin/ffmpeg.exe',['-hide_banner','-loglevel','error','-listen','1','-i','rtmp://127.0.0.1:19359/live/test','-c','copy','-f','flv','-y','output/local-stream-test.flv'],{windowsHide:true,stdio:'ignore'});
   await new Promise(r=>setTimeout(r,500));await obs('SetStreamServiceSettings',{streamServiceType:'rtmp_custom',streamServiceSettings:{server:'rtmp://127.0.0.1:19359/live',key:'test',use_auth:false}});await obs('StartStream');
   for(let i=0;i<40;i++){if((await obs('GetStreamStatus')).outputActive)break;await new Promise(r=>setTimeout(r,250));}
   if(!(await obs('GetStreamStatus')).outputActive)throw Error('Local-only stream failed to start');
  }
  began=Date.now();await req('/message',{type:'start-recording'});await until(()=>session&&outputs);
  if(process.argv.includes('--reject-bad-signature')){
    const invalid=signObject({protocol:'0.3',algorithm:'ES256-P1363',key_id:pub.key_id,session_id:session.session_id,seq:0,prev:null,at:Date.now(),type:'session-start',data:{recording_id:session.recording_id,outputs:session.descriptors}},privateKey);
    invalid.payload.at++;await req('/message',{type:'event',event:invalid,images:{}});
    let rejected=false;try{await until(()=>false,3000)}catch(e){rejected=e.message.includes('signature mismatch')}
    if(!rejected)throw Error('Tampered phone signature was not rejected');console.log('PASS: tampered phone signature rejected by native OBS service');
  }else if(process.argv.includes('--reject-late-response')){
   await event('session-start',{recording_id:session.recording_id,outputs:session.descriptors,response_profile:'CLAPPA-RESPONSE-v1'});
   await challenge('start');let rejected=false;let detail='';try{await until(()=>false,5000)}catch(e){detail=e.message;rejected=detail.includes('Response deadline');}
   if(!rejected)throw Error('Late signed response was not rejected: '+detail);
   await writeFile('docs/review10/native-deadline-rejection.json',JSON.stringify({rejected:true,detail,validPhoneSignature:true,firstPhotoDelayMs:10150},null,2));
   console.log('PASS: native OBS rejects a correctly signed, late photo response');
  }else{
  await event('session-start',{recording_id:session.recording_id,outputs:session.descriptors,response_profile:'CLAPPA-RESPONSE-v1'});
  await event('output-checkpoint',{outputs});await challenge('start');await until(()=>lastAck===seq-1);
  await new Promise(r=>setTimeout(r,500));
  const early=await obs('GetSourceScreenshot',{sourceName:'CLAPPA tile',imageFormat:'png',imageWidth:872,imageHeight:480});
  await writeFile('output/native-flash-preview.png',Buffer.from(early.imageData.split(',')[1],'base64'));
  const earlyPhoto=await sharp(Buffer.from(early.imageData.split(',')[1],'base64')).extract({left:280,top:210,width:1,height:1}).removeAlpha().raw().toBuffer();
  if(earlyPhoto[0]<180||earlyPhoto[1]>160)throw Error('Flash photo was not visible initially');
  await new Promise(r=>setTimeout(r,1000));await poll();await event('output-checkpoint',{outputs});
  const screenshot=await obs('GetSourceScreenshot',{sourceName:'CLAPPA tile',imageFormat:'png',imageWidth:872,imageHeight:480});
  const png=Buffer.from(screenshot.imageData.split(',')[1],'base64');await writeFile('output/native-render.png',png);
  const pixels=await sharp(png).extract({left:24,top:118,width:8,height:8}).removeAlpha().raw().toBuffer();
  if(pixels[0]<180||pixels[1]<180||pixels[2]<180)throw Error('OBS rendered a black/incorrect proof tile');
  const qrPixels=await sharp(png).extract({left:544,top:120,width:300,height:300}).ensureAlpha().raw().toBuffer();
  const decoded=jsQR(new Uint8ClampedArray(qrPixels),300,300);
  if(!decoded||parseTransportFrame(decoded.data).magic!=='CLAPPA')throw Error('Rendered QR cannot be decoded');
  const normal=await sharp(png).extract({left:280,top:210,width:1,height:1}).removeAlpha().raw().toBuffer();
  if(normal[0]>=earlyPhoto[0]-20)throw Error('Flash did not fade to normal photo');
  const manifest=JSON.parse(await readFile(root+'/tile.json'));let bounds;
  qrFrames=[];for(const file of manifest.frames){const raw=await sharp(file).resize(872,480).extract({left:544,top:120,width:300,height:300}).ensureAlpha().raw().toBuffer();const qr=jsQR(new Uint8ClampedArray(raw),300,300);if(!qr)throw Error('One QR frame cannot be decoded');qrFrames.push(qr.data);const current=[qr.version,qr.location.topLeftCorner.x,qr.location.topLeftCorner.y,qr.location.bottomRightCorner.x,qr.location.bottomRightCorner.y];if(bounds&&(bounds[0]!==current[0]||bounds.some((v,i)=>i>0&&Math.abs(v-current[i])>1)))throw Error('QR grid/boundary changed by more than one pixel');bounds=current;}
  console.log('PASS: flash then normal photo; all QR frames decode with identical grid and boundaries');
  await challenge('end');await event('session-end',{});await req('/message',{type:'stop-request',session_id:session.session_id});
  await until(()=>seal,15000);const payload={...seal,protocol:'0.3',algorithm:'ES256-P1363',key_id:pub.key_id,type:'final-seal',at:Date.now()};
  await req('/message',{type:'final-seal',seal:signObject(payload,privateKey)});await until(()=>sealed);
  const state=JSON.parse(await readFile(root+'/obs-state.json'));const result=await verifyBundle(`${root}/sessions/${session.session_id}/proof`,state.media_path,{trustedKey:pub.key_id});
  if(result.status!=='EXACT ORIGINAL VERIFIED')throw Error(JSON.stringify(result));
  const prefix=await verifyQrMedia(qrFrames,`${root}/sessions/${session.session_id}/proof`,state.media_path,{trustedKey:pub.key_id});console.log(prefix);
  await writeFile('output/native-integration-result.json',JSON.stringify({result,prefix,packets:state.outputs[0].packets,tile_renders:state.tile_renders,media:state.media_path},null,2));console.log(JSON.stringify({result,packets:state.outputs[0].packets,tile_renders:state.tile_renders},null,2));
  const previous=session.session_id;session=null;outputs=null;seq=0;head=null;seal=null;sealed=false;
  await req('/message',{type:'hello',key:pub});await poll();
  began=Date.now();await req('/message',{type:'start-recording'});await until(()=>session&&outputs);
  if(session.session_id===previous)throw Error('New recording reused the previous session');
  await event('session-start',{recording_id:session.recording_id,outputs:session.descriptors,response_profile:'CLAPPA-RESPONSE-v1'});await event('output-checkpoint',{outputs});
  await challenge('start');await challenge('end');await event('session-end',{});await req('/message',{type:'stop-request',session_id:session.session_id});
  await until(()=>seal,20000);await req('/message',{type:'final-seal',seal:signObject({...seal,protocol:'0.3',algorithm:'ES256-P1363',key_id:pub.key_id,type:'final-seal',at:Date.now()},privateKey)});await until(()=>sealed);
  const secondState=JSON.parse(await readFile(root+'/obs-state.json'));const second=await verifyBundle(`${root}/sessions/${session.session_id}/proof`,secondState.media_path,{trustedKey:pub.key_id});if(second.status!=='EXACT ORIGINAL VERIFIED')throw Error(JSON.stringify(second));
  console.log('PASS: second recording, same pairing and identity, independently sealed');
  if(withStream){if(!(await obs('GetStreamStatus')).outputActive)throw Error('Finishing a proof stopped the broadcast');await writeFile('docs/review9/stream-lifecycle.json',JSON.stringify({localReceiverOnly:true,streamRemainedLive:true,successiveSealedRecordings:2,second},null,2));console.log('PASS: two signed recording sessions while the local stream remains live');}
  }
}finally{if((await obs('GetRecordStatus')).outputActive)await obs('StopRecord');if(withStream){if((await obs('GetStreamStatus')).outputActive)await obs('StopStream');streamSink?.kill();for(let i=0;i<60&&(await obs('GetStreamStatus')).outputActive;i++)await new Promise(r=>setTimeout(r,250));if(previousStream)await obs('SetStreamServiceSettings',previousStream);}ws.close();}




