import fs from 'node:fs';import {verifyQuicknet,QUICKNET_CHAIN,roundTime} from '../protocol/quicknet.mjs';
const base='https://api.drand.sh/'+QUICKNET_CHAIN;
const r=await fetch(base+'/public/latest',{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error(r.status);const p=await r.json();
const pulse={chain:QUICKNET_CHAIN,round:p.round,at:roundTime(p.round),signature:p.signature};const output=verifyQuicknet(pulse).toString('hex');if(output!==p.randomness)throw Error('Randomness digest mismatch');
fs.mkdirSync('test-vectors/quicknet',{recursive:true});fs.writeFileSync('test-vectors/quicknet/pulse.json',JSON.stringify(pulse,null,2));console.log({round:p.round,at:pulse.at,output});
