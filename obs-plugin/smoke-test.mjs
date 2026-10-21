// Only targets the isolated portable OBS test instance, never the user's OBS profile.
import WebSocket from 'ws';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {verifyMediaArchive} from '../protocol/media-chain.mjs';
const config=JSON.parse(await readFile('.tools/obs-test/config/obs-studio/plugin_config/obs-websocket/config.json'));
const ws=new WebSocket(`ws://127.0.0.1:${config.server_port}`),pending=new Map();let id=0;
const hash=s=>createHash('sha256').update(s).digest('base64');
const ready=new Promise((resolve,reject)=>{
  ws.on('error',reject);ws.on('message',raw=>{const m=JSON.parse(raw);
    if(m.op===0){const a=m.d.authentication;ws.send(JSON.stringify({op:1,d:{rpcVersion:1,authentication:hash(hash(config.server_password+a.salt)+a.challenge)}}));}
    if(m.op===2)resolve();
    if(m.op===7){const p=pending.get(m.d.requestId);pending.delete(m.d.requestId);if(m.d.requestStatus.result)p?.resolve(m.d.responseData);else p?.reject(Error(JSON.stringify(m.d.requestStatus)));}
  });
});
function call(requestType,requestData={}){return new Promise((resolve,reject)=>{const requestId=String(++id);pending.set(requestId,{resolve,reject});ws.send(JSON.stringify({op:6,d:{requestType,requestId,requestData}}));});}
const timeout=setTimeout(()=>{console.error('OBS smoke test timed out');process.exit(1)},20000);
try{
  await ready;const before=await call('GetRecordStatus');if(before.outputActive)throw Error('Isolated OBS is already recording');
  await call('StartRecord');await new Promise(r=>setTimeout(r,2200));await call('StopRecord');await new Promise(r=>setTimeout(r,1500));
  const state=JSON.parse(await readFile('output/live/obs-state.json','utf8'));
  if(!state.closed||state.outputs.length!==1||!state.outputs[0].complete||state.outputs[0].packets<1)throw Error('Native packet capture did not complete');
  const d=state.descriptors[0],base=`output/live/sessions/${state.session_id}/proof/outputs/${d.output_id}`;
  await verifyMediaArchive(d,base+'.jsonl',base+'.bin',[],state.outputs[0]);
  const result={closed:state.closed,media_path:state.media_path,outputs:state.outputs,descriptors:state.descriptors};
  await writeFile('output/native-smoke-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{clearTimeout(timeout);ws.close();}
