import fs from 'node:fs';import {X509Certificate,publicDecrypt,constants,createHash,verify} from 'node:crypto';import {pulseBytes} from '../protocol/nist-beacon.mjs';
const {pulse,pem}=JSON.parse(fs.readFileSync('output/nist-probe.json'));
const key=new X509Certificate(pem).publicKey,signature=Buffer.from(pulse.signatureValue,'hex'),bytes=pulseBytes(pulse),hash=b=>createHash('sha512').update(b).digest();
const digestInfo=publicDecrypt({key,padding:constants.RSA_PKCS1_PADDING},signature);
console.log({digestInfo:digestInfo.toString('hex'),sha512:hash(bytes).toString('hex'),doubleSha512:hash(hash(bytes)).toString('hex'),outputMatch:hash(Buffer.concat([bytes,Buffer.from('0000000000000200','hex'),signature])).toString('hex')===pulse.outputValue.toLowerCase(),doubleVerified:verify('sha512',hash(bytes),key,signature)});
