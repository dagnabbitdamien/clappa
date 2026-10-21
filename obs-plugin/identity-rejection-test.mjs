// Run only against a fresh isolated OBS process on port 17444.
import https from 'node:https';
import {readFile,writeFile,unlink} from 'node:fs/promises';
import {generateKeyPairSync} from 'node:crypto';
import {publicRecord,sha256} from '../verifier/proof.mjs';
const root='output/native-test',file=root+'/trusted-phone.json';
const pairing=JSON.parse(await readFile(root+'/pairing.json'));
if(!pairing.url.endsWith(':17444'))throw Error('Refusing non-test instance');
let prior;try{prior=await readFile(file)}catch(e){if(e.code!=='ENOENT')throw e}
async function req(path,body){return new Promise((resolve,reject)=>{const r=https.request({hostname:'127.0.0.1',port:17444,path,method:body?'POST':'GET',rejectUnauthorized:false,headers:{Authorization:'Bearer '+pairing.token,'Content-Type':'application/json'}},res=>{if(sha256(res.socket.getPeerCertificate().raw)!==pairing.cert_sha256){res.destroy();reject(Error('TLS pin mismatch'));return}let text='';res.on('data',b=>text+=b);res.on('end',()=>{try{resolve(JSON.parse(text))}catch(e){reject(e)}})});r.on('error',reject);r.end(body?JSON.stringify(body):undefined)})}
try{
 await writeFile(file,JSON.stringify({key_id:'0'.repeat(64)}));
 const {privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
 await req('/message',{type:'hello',key:publicRecord(privateKey)});
 let rejected=false;
 for(let i=0;i<30;i++){const rows=await req('/poll?after=0');if(rows.some(r=>r.message.type==='paired'))throw Error('Untrusted identity accepted');if(rows.some(r=>r.message.type==='error'&&r.message.message.includes('trusted fingerprint'))){rejected=true;break}await new Promise(r=>setTimeout(r,100))}
 if(!rejected)throw Error('No explicit identity rejection');
 console.log('PASS: native OBS rejected a different phone key before pairing');
}finally{if(prior)await writeFile(file,prior);else await unlink(file)}
