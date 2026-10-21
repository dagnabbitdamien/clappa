import {createPublicKey,verify} from 'node:crypto';
import {canonical,sha256,decode,parseStrict,keyObject,verifySignature} from '../verifier/proof.mjs';
export const TWITCH_CLIENT_ID='dohpa93i266ysl246z4b82zy9as97r';
export const TWITCH_KEYS_URL='https://id.twitch.tv/oauth2/keys';
const insist=(ok,message)=>{if(!ok)throw Error(message);};
export function validateIdentityBinding(identity,event,key){
 insist(identity&&Object.keys(identity).every(k=>['binding','evidence'].includes(k)),'Unexpected identity fields');
 const b=identity.binding,p=b?.payload;
 insist(p&&Object.keys(p).sort().join(',')==='algorithm,event_sha256,identity_sha256,key_id,profile,session_id','Invalid identity binding');
 insist(p.profile==='CLAPPA-TWITCH-BINDING-v1'&&p.algorithm==='ES256-P1363'&&p.key_id===key.key_id&&p.session_id===event.payload.session_id&&p.event_sha256===sha256(Buffer.from(canonical(event)))&&/^[a-f0-9]{64}$/.test(p.identity_sha256),'Identity binding mismatch');
 verifySignature(b,keyObject(key));
 if(identity.evidence)insist(sha256(Buffer.from(canonical(identity.evidence)))===p.identity_sha256,'Identity evidence mismatch');
 return p.identity_sha256;
}
/** trustedJwks must come from Twitch HTTPS or an explicitly trusted archive, never the QR. */
export function verifyTwitchEvidence(evidence,keyId,trustedJwks,{now=Date.now(),login=false}={}){
 insist(evidence&&Object.keys(evidence).sort().join(',')==='client_id,id_token,profile,salt','Invalid Twitch evidence');
 insist(evidence.profile==='CLAPPA-TWITCH-OIDC-v1'&&evidence.client_id===TWITCH_CLIENT_ID&&/^[a-f0-9]{64}$/.test(evidence.salt)&&/^[a-f0-9]{64}$/.test(keyId),'Invalid Twitch context');
 const token=evidence.id_token;insist(typeof token==='string'&&token.length<=8192,'Invalid token');const parts=token.split('.');insist(parts.length===3,'Invalid JWT');
 const json=b=>parseStrict(new TextDecoder('utf-8',{fatal:true}).decode(decode(b)));
 const header=json(parts[0]),claims=json(parts[1]);
 insist(header.alg==='RS256'&&typeof header.kid==='string'&&!['crit','jku','jwk','x5u'].some(k=>k in header),'Unsupported JWT header');
 const matches=trustedJwks.keys.filter(k=>k.kid===header.kid);insist(matches.length===1,'Trusted Twitch key unavailable');const jwk=matches[0];
 insist(jwk.kty==='RSA'&&(jwk.alg??'RS256')==='RS256'&&(jwk.use??'sig')==='sig'&&decode(jwk.e).equals(Buffer.from([1,0,1])),'Invalid Twitch key');
 const pub=createPublicKey({key:jwk,format:'jwk'});insist(pub.asymmetricKeyDetails.modulusLength>=2048&&pub.asymmetricKeyDetails.modulusLength<=4096,'Unsupported RSA size');
 insist(verify('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),pub,decode(parts[2])),'Twitch signature mismatch');
 insist(claims.iss==='https://id.twitch.tv/oauth2'&&claims.aud===TWITCH_CLIENT_ID&&(claims.azp??TWITCH_CLIENT_ID)===TWITCH_CLIENT_ID,'Wrong Twitch issuer or audience');
 insist(claims.nonce===sha256(Buffer.from(`CLAPPA-TWITCH-OIDC-v1\0${keyId}\0${evidence.salt}`)),'Twitch token belongs to another phone identity');
 insist(typeof claims.sub==='string'&&/^[0-9]{1,30}$/.test(claims.sub)&&typeof claims.preferred_username==='string'&&claims.preferred_username.length>=1&&claims.preferred_username.length<=64&&!/[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/u.test(claims.preferred_username),'Invalid Twitch account');
 insist(Number.isSafeInteger(claims.iat)&&Number.isSafeInteger(claims.exp)&&claims.iat>=0&&claims.iat<=Math.floor(now/1000)+60&&claims.exp>claims.iat&&claims.exp<=8640000000000,'Invalid authentication dates');
 if(login)insist(now<claims.exp*1000,'Twitch sign-in expired');
 return {id:claims.sub,name:claims.preferred_username,authenticatedAt:claims.iat*1000,expiresAt:claims.exp*1000};
}
