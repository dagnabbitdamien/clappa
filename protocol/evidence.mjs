import {validateDualResponse} from './dual-view.mjs';
import {validateResponseWindow} from './response-window.mjs';
import {validateFreshChallenge} from './quicknet.mjs';
import {validate,keyObject,verifySignature,hashObject,canonical} from '../verifier/proof.mjs';
export function validateMediaContext(event,key,context){
 const fresh=!!context?.challenge?.payload?.data?.freshness;
 if(!context||Object.keys(context).sort().join(',')!==(fresh?'armed,challenge,proof':'challenge,proof'))throw Error('Missing signed media context');
 const {proof,challenge}=context;validate('media-proof',proof);validate('event',challenge);const publicKey=keyObject(key);verifySignature(proof,publicKey);verifySignature(challenge,publicKey);
 const p=proof.payload,e=event.payload,c=challenge.payload;
 if(fresh){validate('event',context.armed);verifySignature(context.armed,publicKey);validateFreshChallenge(challenge,context.armed);}
 if(e.key_id!==key.key_id||p.key_id!==key.key_id||c.key_id!==key.key_id||p.session_id!==e.session_id||c.session_id!==e.session_id)throw Error('Media proof signing identity/session mismatch');
 if(p.event_sha256!==hashObject(event)||p.challenge_sha256!==hashObject(challenge)||c.type!=='challenge-issued'||c.data.challenge_id!==e.data.challenge_id||c.seq>=e.seq||c.at>e.at||p.at<e.at||p.recording_id!==c.data.obs.recording_id)throw Error('Media proof event/challenge mismatch');
 if(p.descriptors.length!==p.outputs.length||new Set(p.descriptors.map(d=>d.output_id)).size!==p.descriptors.length||new Set(p.outputs.map(o=>o.output_id)).size!==p.outputs.length||!p.descriptors.some(d=>d.role==='recording')||p.outputs.length!==c.data.obs.outputs.length)throw Error('Media proof output coverage');
 for(const d of p.descriptors){const o=p.outputs.find(o=>o.output_id===d.output_id),old=c.data.obs.outputs.find(o=>o.output_id===d.output_id);if(d.session_id!==p.session_id||!o||!old||o.role!==d.role||old.role!==d.role||o.packets<1||o.packets<old.packets||o.bytes<old.bytes||(o.packets===old.packets&&canonical(o)!==canonical(old)))throw Error('Invalid media prefix boundary');}
 if(e.type==='challenge-captured'){validateResponseWindow(c,e);validateDualResponse(c,e);}
 return context;
}
