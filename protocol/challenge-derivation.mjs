// Versioned deterministic challenge selection; v1 remains immutable.
import {createHash} from 'node:crypto';import {canonical} from '../verifier/canonical.mjs';
export const CHOICE_MAPPING='CLAPPA-CHOICES-v2';
export const CHOICE_PROMPTS_V2=["left","right","up","down","front","back","selfie","selfie_left","selfie_right","selfie_around","selfie_nose_left","selfie_nose_right","selfie_chin","selfie_palm","selfie_smile","selfie_tilt","selfie_wink"];
export const CHOICE_PROMPTS=['left','right','up','down','front','back','recording_camera','main_subject_alt_angle','room_setup','selfie','selfie_cover_left','selfie_cover_right','selfie_wink','selfie_turn'];
const sha=b=>createHash('sha256').update(b).digest();
export function challengeSeed(committedPayload,verifiedPulse){
 if(!['CLAPPA-CHOICES-v1',CHOICE_MAPPING].includes(committedPayload.mapping))throw Error('Unknown challenge mapping');
 const target=committedPayload.pulse;
 if(!target||target.chain!==verifiedPulse.chain||target.index!==verifiedPulse.pulse||target.at!==verifiedPulse.at)throw Error('Pulse differs from fixed commitment');
 if(!/^[0-9a-f]{128}$/.test(verifiedPulse.output))throw Error('Invalid verified beacon output');
 // Signature bytes are deliberately excluded: ECDSA randomness cannot reroll choices.
 return sha(Buffer.concat([Buffer.from('CLAPPA-CHALLENGE-v1\0'),Buffer.from(canonical(committedPayload)),Buffer.from([0]),Buffer.from(verifiedPulse.output,'hex')])).toString('hex');
}
export function choicesFromSeed(seedHex,cameraProfile='front-rear',mapping='CLAPPA-CHOICES-v1'){
 if(!['CLAPPA-CHOICES-v1',CHOICE_MAPPING].includes(mapping))throw Error('Unknown challenge mapping');
 if(!/^[0-9a-f]{64}$/.test(seedHex))throw Error('Invalid challenge seed');
 const seed=Buffer.from(seedHex,'hex');
 const stream=label=>{let counter=0;return n=>{if(!Number.isInteger(n)||n<1||n>256)throw Error('Invalid choice range');const limit=Math.floor(4294967296/n)*n;for(;;){const c=Buffer.alloc(4);c.writeUInt32BE(counter++);const v=sha(Buffer.concat([seed,Buffer.from(label+'\0'),c])).readUInt32BE();if(v<limit)return v%n;}}};
 if(!['front-rear','front-only','rear-only'].includes(cameraProfile))throw Error('Unknown camera profile');
 const available=(mapping===CHOICE_MAPPING?CHOICE_PROMPTS_V2:CHOICE_PROMPTS).filter(p=>cameraProfile==='front-rear'||p.startsWith('selfie')===(cameraProfile==='front-only'));
 const prompt=available[stream('prompt')(available.length)],camera=prompt.startsWith('selfie')?'front':'rear';
 const flash=camera==='front'?['red','green','blue'][stream('illumination')(3)]:'led';
 const rhythm=stream('rhythm'),offbeats=[2,6,10,14];
 for(let i=offbeats.length-1;i>0;i--){const j=rhythm(i+1);[offbeats[i],offbeats[j]]=[offbeats[j],offbeats[i]];}
 const slots=new Set([0,4,8,12,...offbeats.slice(0,2+rhythm(2))]);
 const notes=stream('notes'),scale=[-5,-3,0,2,4,7];let note=2;
 const pitches=Array.from({length:slots.size},(_,i)=>{if(i===slots.size-1)return 0;if(i>0)note=Math.max(0,Math.min(5,note+notes(3)-1));return scale[note];});
 return {mapping,prompt_id:prompt,camera,flash,cadence:Array.from({length:16},(_,i)=>slots.has(i)?'1':'0').join(''),slot_ms:stream('tempo')(2)===0?125:111,pitches,response_window_ms:10000};
}
