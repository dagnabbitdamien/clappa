import fs from 'node:fs/promises';import WebSocket from 'ws';import {createHash} from 'node:crypto';
export async function openTestObs(){
 const cfg=JSON.parse(await fs.readFile('.tools/obs-test/config/obs-studio/plugin_config/obs-websocket/config.json'));if(cfg.server_port!==17445)throw Error('Only isolated OBS is permitted');
 const ws=new WebSocket('ws://127.0.0.1:17445'),pending=new Map();let rid=0;const h=s=>createHash('sha256').update(s).digest('base64');
 await new Promise((resolve,reject)=>{ws.on('error',reject);ws.on('message',raw=>{const m=JSON.parse(raw);if(m.op===0){const a=m.d.authentication;ws.send(JSON.stringify({op:1,d:{rpcVersion:1,authentication:h(h(cfg.server_password+a.salt)+a.challenge)}}))}if(m.op===2)resolve();if(m.op===7){const p=pending.get(m.d.requestId);pending.delete(m.d.requestId);m.d.requestStatus.result?p.resolve(m.d.responseData):p.reject(Error(m.d.requestStatus.comment))}})});
 return {close:()=>ws.close(),request:(requestType,requestData={})=>new Promise((resolve,reject)=>{const requestId=String(++rid);pending.set(requestId,{resolve,reject});ws.send(JSON.stringify({op:6,d:{requestType,requestId,requestData}}))})};
}
