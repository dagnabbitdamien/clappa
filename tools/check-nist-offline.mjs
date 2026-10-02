import fs from 'node:fs/promises';import {X509Certificate,createHash} from 'node:crypto';import {verifyNistPulse} from '../protocol/nist-beacon.mjs';
const {pulse,pem,receivedAt}=JSON.parse(await fs.readFile('output/nist-probe.json'));
const pin=createHash('sha256').update(new X509Certificate(pem).raw).digest('hex');
const verified=verifyNistPulse(pulse,pem,{trustedCertificateSha256:[pin]});
await fs.mkdir('test-vectors/nist',{recursive:true});
await fs.writeFile('test-vectors/nist/pulse.json',JSON.stringify(pulse,null,2)+'\n');await fs.writeFile('test-vectors/nist/certificate.pem',pem);
await fs.writeFile('test-vectors/nist/trust.json',JSON.stringify({certificate_sha256:pin,provisioning:'Official NIST HTTPS endpoint, development retrieval',retrieved_at:new Date(receivedAt).toISOString()},null,2));
await fs.writeFile('docs/review10/beacon-historical-check.json',JSON.stringify({verified,receivedAt,historical:true,status:'Historical signature and output verified; not a freshness input for a new challenge.'},null,2));console.log(verified);
