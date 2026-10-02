import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const str=(pattern)=>({type:'string',...(pattern?{pattern}:{maxLength:4096})});
const num={type:'integer',minimum:0,maximum:Number.MAX_SAFE_INTEGER};
const obj=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const hex=str('^[0-9a-f]{64}$'), id=str('^[0-9a-f]{32}$'), b64=str('^[A-Za-z0-9_-]+$');
const file=obj({path:str('^images/[a-zA-Z0-9_-]+\\.jpg$'),sha256:hex,bytes:{...num,minimum:4,maximum:25000000}});
const pair=obj({original:file,proof:file});
const output=obj({session_id:id,output_id:id,role:{enum:['recording','streaming']},codec:str()});
const snapshot=obj({output_id:id,role:{enum:['recording','streaming']},packets:num,bytes:num,head:hex,complete:{const:true}});
const snapshots={type:'array',items:snapshot,minItems:1,maxItems:2};
const commitment=obj({recording_id:id,elapsed_ms:num,outputs:snapshots});
const challenge=obj({challenge_id:id,prompt_id:{enum:['left','right','up','down','front','back','recording_camera','main_subject_alt_angle','room_setup','selfie','selfie_cover_left','selfie_cover_right','selfie_wink','selfie_turn',"selfie_left","selfie_right","selfie_around","selfie_nose_left","selfie_nose_right","selfie_chin","selfie_palm","selfie_smile","selfie_tilt"]},phase:{enum:['start','verify','end']},cadence:str('^1[01]{2,15}$'),slot_ms:{type:'integer',minimum:50,maximum:300},camera:{enum:['rear','front']},flash:{enum:['red','green','blue','led']},obs:commitment});
challenge.properties.response_window_ms={const:10000};
challenge.properties.pair_window_ms={const:3000};
const pulse=obj({chain:{const:'52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971'},round:{...num,minimum:1,maximum:10000000000},at:num,signature:str('^[0-9a-f]{96}$')});
challenge.properties.freshness=obj({profile:{const:'CLAPPA-QUICKNET-v1'},arm_sha256:hex,pulse});
challenge.properties.pitches={type:'array',items:{type:'integer',minimum:-5,maximum:7},minItems:6,maxItems:7};
challenge.properties.qr_profile={const:'hashes-v1'};
challenge.oneOf=[
  {type:'object',properties:{camera:{const:'front'},prompt_id:{enum:["selfie","selfie_cover_left","selfie_cover_right","selfie_wink","selfie_turn","selfie_left","selfie_right","selfie_around","selfie_nose_left","selfie_nose_right","selfie_chin","selfie_palm","selfie_smile","selfie_tilt"]},flash:{enum:['red','green','blue']}}},
  {type:'object',properties:{camera:{const:'rear'},prompt_id:{enum:['left','right','up','down','front','back','recording_camera','main_subject_alt_angle','room_setup']},flash:{const:'led'}}}
];
const eventData={
  'session-start':obj({recording_id:id,outputs:{type:'array',items:output,minItems:1,maxItems:2}}),
  'output-checkpoint':obj({outputs:snapshots}),
  'challenge-armed':obj({camera_profile:{enum:['front-rear','front-only','rear-only']},challenge_id:id,phase:{enum:['start','verify','end']},mapping:{enum:['CLAPPA-CHOICES-v1','CLAPPA-CHOICES-v2']},chain:{const:'52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971'},round:{...num,minimum:1,maximum:10000000000},obs:commitment}),
  'challenge-issued':challenge,
  'challenge-captured':obj({challenge_id:id,photo_a:pair,photo_b:pair,a_at:num,b_at:num}),
  'challenge-failed':obj({challenge_id:id,reason:{enum:['cancelled','camera-error','timeout','transfer-error','skipped']}}),
  'claim':obj({challenge_id:id,photo:pair,captured_at:num}),
  'session-end':obj({})
};
eventData['session-start'].properties.session_policy={const:'CLAPPA-SESSION-v2'};
eventData['session-start'].properties.claim_window_ms={const:30000};
eventData['session-start'].properties.response_profile={const:'CLAPPA-RESPONSE-v1'};
eventData['session-start'].properties.camera_profile={enum:['front-rear','front-only','rear-only']};
eventData['session-start'].properties.freshness_profile={const:'CLAPPA-QUICKNET-v1'};
eventData['challenge-captured'].properties.response_ms=num;
eventData['challenge-captured'].properties.pair_ms=num;
const dualProfile={const:'CLAPPA-DUAL-v1'};
for(const t of ['session-start','challenge-armed','challenge-issued'])eventData[t].properties.capture_profile=dualProfile;
challenge.properties.rear_flash={const:'torch'};
const delivery=obj({front_delivered_ms:num,rear_delivered_ms:num,front_sensor_us:num,rear_sensor_us:num,front_width:{...num,minimum:240,maximum:4096},front_height:{...num,minimum:240,maximum:4096},rear_width:{...num,minimum:240,maximum:4096},rear_height:{...num,minimum:240,maximum:4096}});
eventData['challenge-captured'].properties.dual=obj({profile:dualProfile,rear_a:pair,rear_b:pair,normal:delivery,illuminated:delivery,exposure_synchronization:{const:'not-established'}});
export const schema={
  $schema:'http://json-schema.org/draft-07/schema#',$id:'https://clappa.invalid/protocol/0.3/schema.json',
  definitions:{file,pair,commitment,
    'media-proof':obj({payload:obj({profile:{const:'CLAPPA-MEDIA-PROOF-v1'},algorithm:{const:'ES256-P1363'},key_id:hex,session_id:id,recording_id:id,event_sha256:hex,challenge_sha256:hex,at:num,outputs:snapshots,descriptors:{type:'array',items:output,minItems:1,maxItems:2}}),signature:b64}),
    key:obj({protocol:{const:'0.3'},algorithm:{const:'ES256-P1363'},key_id:hex,spki:b64}),
    session:obj({protocol:{const:'0.3'},session_id:id,key_id:hex}),
    event:obj({payload:{oneOf:Object.entries(eventData).map(([type,data])=>obj({protocol:{const:'0.3'},algorithm:{const:'ES256-P1363'},key_id:hex,session_id:id,seq:num,prev:{anyOf:[hex,{type:'null'}]},at:num,type:{const:type},data}))},signature:b64}),
    seal:obj({payload:obj({protocol:{const:'0.3'},algorithm:{const:'ES256-P1363'},key_id:hex,session_id:id,type:{const:'final-seal'},at:num,event_count:{...num,minimum:1},head:hex,recording_id:id,outputs:snapshots,media:obj({name:str('^[^/\\\\:]+$'),bytes:{...num,minimum:1},sha256:hex})}),signature:b64})
  }
};
if(process.argv[1]===fileURLToPath(import.meta.url)) writeFileSync(new URL('schema.json',import.meta.url),JSON.stringify(schema,null,2)+'\n');

