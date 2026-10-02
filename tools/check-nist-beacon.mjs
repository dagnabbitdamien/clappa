// Explicit maintenance probe. Network-free proof verification does not call this.
import fs from 'node:fs/promises';import {X509Certificate,createHash} from 'node:crypto';
import {verifyNistPulse} from '../protocol/nist-beacon.mjs';
const root='https://beacon.nist.gov/beacon/2.0';
async function get(url){const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error(`NIST returned ${r.status}`);const b=Buffer.from(await r.arrayBuffer());if(b.length>1000000)throw Error('NIST response too large');return b;}
const receivedAt=Date.now(),pulse=JSON.parse(await get(root+(process.argv.includes('--historical')?'/chain/1/pulse/1000000':'/pulse/last'))).pulse;
if(!/^[a-fA-F0-9]{128}$/.test(pulse.certificateId))throw Error('Invalid certificate identifier');
const pem=(await get(root+'/certificate/'+pulse.certificateId)).toString();
const cert=new X509Certificate(pem),pin=createHash('sha256').update(cert.raw).digest('hex');
await fs.writeFile('output/nist-probe.json',JSON.stringify({pulse,pem,receivedAt}));
console.log({keyType:cert.publicKey.asymmetricKeyType,keyDetails:cert.publicKey.asymmetricKeyDetails,signatureBytes:pulse.signatureValue.length/2});
let verified;
try{verified=verifyNistPulse(pulse,pem,{trustedCertificateSha256:[pin]});}
catch(error){await fs.writeFile('docs/review10/beacon-live-rejection.json',JSON.stringify({uri:pulse.uri,certificateId:pulse.certificateId,certificateSubject:cert.subject,certificateBits:cert.publicKey.asymmetricKeyDetails.modulusLength,signatureBytes:pulse.signatureValue.length/2,receivedAt,error:error.message,action:'Rejected. No fallback to unauthenticated randomness.'},null,2));throw error;}
await fs.mkdir('test-vectors/nist',{recursive:true});
await fs.writeFile('test-vectors/nist/pulse.json',JSON.stringify(pulse,null,2)+'\n');
await fs.writeFile('test-vectors/nist/certificate.pem',pem);
await fs.writeFile('test-vectors/nist/trust.json',JSON.stringify({certificate_sha256:pin,provisioning:'Retrieved from the official NIST HTTPS certificate endpoint during development; not supplied by a proof producer.',retrieved_at:new Date(receivedAt).toISOString()},null,2)+'\n');
await fs.writeFile('docs/review10/beacon-check.json',JSON.stringify({verified,receivedAt,pulseAgeMs:receivedAt-verified.at,status:'Pulse signature/output verification only; native challenge integration not yet enabled.'},null,2));
console.log(verified);
