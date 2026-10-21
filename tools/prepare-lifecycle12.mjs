import fs from 'node:fs';
let source=fs.readFileSync('tools/emulator-flow12.mjs','utf8').split("run('shell','wm','user-rotation'")[0];
source="import {openTestObs} from './obs-test-client.mjs';\n"+source;
source+=`
const client=await openTestObs();const outcomes=[];
try{
for(const attempt of ['pending-challenge','no-challenge','reopened-phone']){
 if(attempt==='reopened-phone'){run('shell','am','force-stop','org.clappa.app.review');run('shell','am','start','-W','-n','org.clappa.app.review/org.clappa.app.MainActivity');tap(await wait('Start recording',30));}
 else tap(await wait('Start another recording'));
 await wait('Tap to clap!');
 if(attempt==='pending-challenge'){tap(await wait('Tap to clap!'));await wait('Capture');}
 await client.request('StopRecord');await wait('Start another recording',40);
 const state=JSON.parse(await fs.readFile('output/native-test/obs-state.json'));
 const result=await verifyBundle('output/native-test/sessions/'+state.session_id+'/proof',state.media_path);
 if(result.status!=='EXACT ORIGINAL VERIFIED')throw Error(JSON.stringify(result));
 if(attempt==='pending-challenge'&&result.missed_challenges[0]?.reason!=='cancelled')throw Error('Missing cancelled challenge');
 outcomes.push({attempt,session:state.session_id,result});
}
await shot('flow-repeat-sealed');await fs.writeFile(reviewDir+'/lifecycle-results.json',JSON.stringify({pairedAgain:false,outcomes},null,2));console.log(JSON.stringify(outcomes));
}finally{client.close();}
`;
fs.writeFileSync('tools/emulator-lifecycle12.mjs',source);
let flow=fs.readFileSync('tools/emulator-flow12.mjs','utf8');flow=flow.replace("extraPhotos:(await fs.readdir(folder+'/events')).map(f=>f).length","extraPhotos:(await Promise.all((await fs.readdir(folder+'/events')).map(async f=>JSON.parse(await fs.readFile(folder+'/events/'+f)).payload.type))).filter(t=>t==='claim').length");fs.writeFileSync('tools/emulator-flow12.mjs',flow);
