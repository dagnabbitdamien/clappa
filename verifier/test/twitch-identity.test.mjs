import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {canonical,sha256,signObject,publicRecord} from '../proof.mjs';
import {TWITCH_CLIENT_ID,verifyTwitchEvidence,validateIdentityBinding} from '../../protocol/twitch-identity.mjs';
const rsa=generateKeyPairSync('rsa',{modulusLength:2048}),ec=generateKeyPairSync('ec',{namedCurve:'prime256v1'}),key=publicRecord(ec.privateKey);
const jwks={keys:[{...rsa.publicKey.export({format:'jwk'}),kid:'fixture',alg:'RS256',use:'sig'}]};
const now=1790800000000,salt='ab'.repeat(32);
const claims={iss:'https://id.twitch.tv/oauth2',sub:'123456',aud:TWITCH_CLIENT_ID,iat:Math.floor(now/1000)-60,exp:Math.floor(now/1000)+3600,preferred_username:'ClappaTest',nonce:sha256(Buffer.from(`CLAPPA-TWITCH-OIDC-v1\0${key.key_id}\0${salt}`))};
function evidence(c=claims,h={alg:'RS256',kid:'fixture'}){const body=Buffer.from(JSON.stringify(h)).toString('base64url')+'.'+Buffer.from(JSON.stringify(c)).toString('base64url');return {profile:'CLAPPA-TWITCH-OIDC-v1',client_id:TWITCH_CLIENT_ID,salt,id_token:body+'.'+sign('RSA-SHA256',Buffer.from(body),rsa.privateKey).toString('base64url')};}
test('Twitch fixture verifies issuer, signature, audience and phone-bound nonce',()=>{const who=verifyTwitchEvidence(evidence(),key.key_id,jwks,{now,login:true});assert.equal(who.name,'ClappaTest');assert.equal(who.id,'123456');assert.equal(who.authenticatedAt,claims.iat*1000)});
test('reject copied identity, wrong audience/issuer, altered signature and untrusted key',()=>{
 assert.throws(()=>verifyTwitchEvidence(evidence(),'00'.repeat(32),jwks,{now}));
 for(const patch of [{aud:'other'},{iss:'https://evil.example'},{nonce:'different'},{preferred_username:'a\u202eb'}])assert.throws(()=>verifyTwitchEvidence(evidence({...claims,...patch}),key.key_id,jwks,{now}));
 const bad=evidence();const parts=bad.id_token.split('.');const sig=Buffer.from(parts[2],'base64url');sig[0]^=1;parts[2]=sig.toString('base64url');bad.id_token=parts.join('.');assert.throws(()=>verifyTwitchEvidence(bad,key.key_id,jwks,{now}));
 assert.throws(()=>verifyTwitchEvidence(evidence(),key.key_id,{keys:[]},{now}));
 for(const extra of [{alg:'none'},{jku:'https://evil.example'},{jwk:jwks.keys[0]},{crit:['b64']}])assert.throws(()=>verifyTwitchEvidence(evidence(claims,{alg:'RS256',kid:'fixture',...extra}),key.key_id,jwks,{now}));
});
test('expired token remains dated historical evidence, not a fresh login',()=>{const old=evidence({...claims,iat:claims.iat-7200,exp:claims.iat-3600});assert.equal(verifyTwitchEvidence(old,key.key_id,jwks,{now}).id,'123456');assert.throws(()=>verifyTwitchEvidence(old,key.key_id,jwks,{now,login:true}))});
test('phone identity binding cannot move between events or be replaced by a reference',()=>{
 const event=signObject({session_id:'11'.repeat(16),seq:4},ec.privateKey),ev=evidence();const binding=signObject({profile:'CLAPPA-TWITCH-BINDING-v1',algorithm:'ES256-P1363',key_id:key.key_id,session_id:event.payload.session_id,event_sha256:sha256(Buffer.from(canonical(event))),identity_sha256:sha256(Buffer.from(canonical(ev)))},ec.privateKey);
 assert.equal(validateIdentityBinding({binding,evidence:ev},event,key),binding.payload.identity_sha256);assert.equal(validateIdentityBinding({binding},event,key),binding.payload.identity_sha256);
 assert.throws(()=>validateIdentityBinding({binding,evidence:{...ev,salt:'00'.repeat(32)}},event,key));assert.throws(()=>validateIdentityBinding({binding},signObject({...event.payload,seq:5},ec.privateKey),key));
});
