import https from 'node:https';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const pair=JSON.parse(await fs.readFile('output/native-test/pairing.json'));
if(!pair.url.endsWith(':17444'))throw Error('Only isolated OBS is allowed');
const body=JSON.stringify({padding:'x'.repeat(128*1024)});
let completed=0;
async function request(){await new Promise((resolve,reject)=>{
 const req=https.request({hostname:'127.0.0.1',port:17444,path:'/message',method:'POST',agent:false,rejectUnauthorized:false,minVersion:'TLSv1.3',headers:{'Authorization':'Bearer invalid-test-token','Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}},res=>{
  const pin=createHash('sha256').update(res.socket.getPeerCertificate().raw).digest('hex');
  if(pin!==pair.cert_sha256){res.destroy();reject(Error('TLS pin mismatch'));return}
  if(res.statusCode!==401||res.headers.connection?.toLowerCase()!=='close'){res.destroy();reject(Error('Unauthorized request or connection close policy failed'));return}
  res.resume();res.on('end',()=>{completed++;resolve()});res.on('error',reject);
 });req.setTimeout(12000,()=>req.destroy(Error('TLS request timeout')));req.on('error',reject);req.end(body);
})}
await Promise.all(Array.from({length:6},async()=>{for(let n=0;n<8;n++)await request()}));
const result={completed,concurrentClients:6,bodyBytes:Buffer.byteLength(body),tls:'1.3',certificatePin:'verified',authentication:'all unauthorized requests rejected',connections:'closed after each response'};
await fs.writeFile('docs/review8/tls-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
