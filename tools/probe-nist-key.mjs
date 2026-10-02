import fs from 'node:fs';import {X509Certificate,publicDecrypt,constants} from 'node:crypto';
const p=JSON.parse(fs.readFileSync('output/nist-probe.json')).pulse,c=new X509Certificate(fs.readFileSync('test-vectors/nist/certificate.pem'));
console.log({subject:c.subject,from:c.validFrom,to:c.validTo,bits:c.publicKey.asymmetricKeyDetails});
try{console.log(publicDecrypt({key:c.publicKey,padding:constants.RSA_PKCS1_PADDING},Buffer.from(p.signatureValue,'hex')).toString('hex'))}catch(e){console.log(e.message)}
