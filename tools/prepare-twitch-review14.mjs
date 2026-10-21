import fs from 'node:fs/promises';
import {generateKeyPairSync,sign} from 'node:crypto';
import {sha256} from '../verifier/proof.mjs';
import {TWITCH_CLIENT_ID} from '../protocol/twitch-identity.mjs';
const rsa=generateKeyPairSync('rsa',{modulusLength:2048}),keyId=JSON.parse(await fs.readFile('test-vectors/valid/public-key.json')).key_id,salt='02'.repeat(32),now=Math.floor(Date.now()/1000);
const claims={iss:'https://id.twitch.tv/oauth2',sub:'123456',aud:TWITCH_CLIENT_ID,iat:now-60,exp:now+3600,preferred_username:'ClappaTestAccount',nonce:sha256(Buffer.from(`CLAPPA-TWITCH-OIDC-v1\0${keyId}\0${salt}`))};
function evidence(c=claims,h={alg:'RS256',kid:'fixture'}){const body=Buffer.from(JSON.stringify(h)).toString('base64url')+'.'+Buffer.from(JSON.stringify(c)).toString('base64url');return {profile:'CLAPPA-TWITCH-OIDC-v1',client_id:TWITCH_CLIENT_ID,salt,id_token:body+'.'+sign('RSA-SHA256',Buffer.from(body),rsa.privateKey).toString('base64url')};}
const cases=[{name:'valid',evidence:evidence(),key_id:keyId,valid:true},{name:'different signer',evidence:evidence(),key_id:'03'.repeat(32),valid:false},{name:'historical',evidence:evidence({...claims,iat:now-7200,exp:now-3600}),key_id:keyId,valid:true}];
for(const [name,change] of Object.entries({audience:{aud:'wrong'},issuer:{iss:'https://example.com'},nonce:{nonce:'wrong'},future:{iat:now+600},spoofName:{preferred_username:'a\u202eb'}}))cases.push({name,evidence:evidence({...claims,...change}),key_id:keyId,valid:false});
cases.push({name:'injected key URL',evidence:evidence(claims,{alg:'RS256',kid:'fixture',jku:'https://example.com'}),key_id:keyId,valid:false});
const bad=evidence();const parts=bad.id_token.split('.');const bytes=Buffer.from(parts[2],'base64url');bytes[0]^=1;parts[2]=bytes.toString('base64url');bad.id_token=parts.join('.');cases.push({name:'signature tamper',evidence:bad,key_id:keyId,valid:false});
await fs.mkdir('docs/review14',{recursive:true});await fs.writeFile('docs/review14/twitch-test-fixture.json',JSON.stringify({testOnly:true,jwks:{keys:[{...rsa.publicKey.export({format:'jwk'}),kid:'fixture',alg:'RS256',use:'sig'}]},cases},null,2));
console.log('Created ten test-only Twitch identity cases; no private test key retained.');
