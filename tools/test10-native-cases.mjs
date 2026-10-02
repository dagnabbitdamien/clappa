import fs from 'node:fs/promises';
let s=await fs.readFile('obs-plugin/native-integration-test.mjs','utf8');
s=s.replace("phase,cadence:'1000110'","phase,response_window_ms:10000,cadence:'1000110'");
s=s.replace("const at=Date.now();let images={};", "if(process.argv.includes('--reject-late-response'))await new Promise(r=>setTimeout(r,10150));const at=Date.now();let images={};");
s=s.replace('a_at:at,b_at:at},images)', 'a_at:at,b_at:at,response_ms:at-issued.payload.at,pair_ms:0},images)');
s=s.replaceAll("await event('session-start',{recording_id:session.recording_id,outputs:session.descriptors});", "await event('session-start',{recording_id:session.recording_id,outputs:session.descriptors,response_profile:'CLAPPA-RESPONSE-v1'});");
const marker="  }else{\n  await event('session-start'";
if(!s.includes(marker))throw Error('Native test insertion target missing');
s=s.replace(marker,`  }else if(process.argv.includes('--reject-late-response')){
   await event('session-start',{recording_id:session.recording_id,outputs:session.descriptors,response_profile:'CLAPPA-RESPONSE-v1'});
   await challenge('start');let rejected=false;let detail='';try{await until(()=>false,5000)}catch(e){detail=e.message;rejected=detail.includes('Response deadline');}
   if(!rejected)throw Error('Late signed response was not rejected: '+detail);
   await writeFile('docs/review10/native-deadline-rejection.json',JSON.stringify({rejected:true,detail,validPhoneSignature:true,firstPhotoDelayMs:10150},null,2));
   console.log('PASS: native OBS rejects a correctly signed, late photo response');
  }else{
  await event('session-start'`);
await fs.writeFile('obs-plugin/native-integration-test.mjs',s);
