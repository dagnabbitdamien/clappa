// NISTIR 8213 draft, sections 4.1.2, 4.8 and 4.9. Offline verifier only.
import {createHash,verify,X509Certificate,constants} from 'node:crypto';
const hash=(data,algorithm='sha512')=>createHash(algorithm).update(data).digest();
function uint(value,size){if(!Number.isSafeInteger(value)||value<0||(size===4&&value>0xffffffff))throw Error('Invalid beacon integer');const out=Buffer.alloc(size);if(size===8)out.writeBigUInt64BE(BigInt(value));else out.writeUInt32BE(value);return out;}
function hex(value,length=64){if(typeof value!=='string'||!new RegExp(`^[a-fA-F0-9]{${length*2}}$`).test(value))throw Error('Invalid beacon hexadecimal field');return Buffer.from(value,'hex');}
function field(value,size=8){const b=Buffer.isBuffer(value)?value:Buffer.from(value,'utf8');return Buffer.concat([uint(b.length,size),b]);}
export function pulseBytes(p){
 if(!['2.0','Version 2.0'].includes(p.version)||p.cipherSuite!==0||p.period!==60000)throw Error('Unsupported NIST pulse profile');
 if(p.uri!==`https://beacon.nist.gov/beacon/2.0/chain/${p.chainIndex}/pulse/${p.pulseIndex}`)throw Error('Unexpected beacon identity');
 if(!Number.isFinite(Date.parse(p.timeStamp))||new Date(p.timeStamp).toISOString()!==p.timeStamp)throw Error('Invalid beacon time');
 if(!Array.isArray(p.listValues)||p.listValues.length!==5)throw Error('Invalid beacon skip list');
 // Historical API format predates the draft's 64-bit lengths and external status.
 const width=p.version==='Version 2.0'?4:8,f=v=>field(v,width);
 const values=['previous','hour','day','month','year'].map(type=>{const found=p.listValues.filter(v=>v.type===type);if(found.length!==1)throw Error('Missing/duplicate beacon link');return f(hex(found[0].value))});
 return Buffer.concat([f(p.uri),f(p.version),uint(p.cipherSuite,4),uint(p.period,4),f(hex(p.certificateId)),uint(p.chainIndex,8),uint(p.pulseIndex,8),f(p.timeStamp),f(hex(p.localRandomValue)),f(hex(p.external.sourceId)),uint(p.external.statusCode,width),f(hex(p.external.value)),...values,f(hex(p.precommitmentValue)),uint(p.statusCode,4)]);
}
export function verifyNistPulse(p,pem,{trustedCertificateSha256,expectedChain,expectedPulse,expectedTime}={}){
 if(!trustedCertificateSha256?.length)throw Error('An independently provisioned NIST certificate pin is required');
 const cert=new X509Certificate(pem),pin=hash(cert.raw,'sha256').toString('hex');
 if(!trustedCertificateSha256.includes(pin))throw Error('Untrusted NIST certificate');
 // The live NIST v2 service identifies the DER certificate (not PEM whitespace).
 if(hash(cert.raw).toString('hex')!==p.certificateId.toLowerCase())throw Error('NIST certificate ID mismatch');
 if(cert.publicKey.asymmetricKeyType!=='rsa'||cert.publicKey.asymmetricKeyDetails.modulusLength!==4096)throw Error('Unexpected NIST signing key');
 const at=Date.parse(p.timeStamp);
 if(at<Date.parse(cert.validFrom)||at>Date.parse(cert.validTo))throw Error('Pulse outside signing certificate validity');
 if(expectedChain!==undefined&&p.chainIndex!==expectedChain||expectedPulse!==undefined&&p.pulseIndex!==expectedPulse||expectedTime!==undefined&&at!==expectedTime)throw Error('Wrong designated NIST pulse');
 if(p.statusCode!==0)throw Error('NIST pulse reports abnormal status');
 const bytes=pulseBytes(p),signature=hex(p.signatureValue,512);
 if(!verify('sha512',bytes,{key:cert.publicKey,padding:constants.RSA_PKCS1_PADDING},signature))throw Error('NIST signature mismatch');
 if(!hash(Buffer.concat([bytes,p.version==='Version 2.0'?signature:field(signature)])).equals(hex(p.outputValue)))throw Error('NIST output mismatch');
 return {chain:p.chainIndex,pulse:p.pulseIndex,at,output:p.outputValue.toLowerCase(),certificate_sha256:pin};
}
