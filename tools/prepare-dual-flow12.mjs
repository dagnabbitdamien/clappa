import fs from 'node:fs';
let s=fs.readFileSync('tools/emulator-flow12.mjs','utf8');s=s.slice(0,s.indexOf("tap(await wait('Start recording'))"));
s=s.replace("'--es','pairingData'","'--ez','dual','true','--es','pairingData'");
s+=`
tap(await wait('Start recording'));await wait('Tap to clap!');
tap(await wait('Tap to clap!'));tap(await wait('Capture'));const shutter=await wait('Capture both views');await shot('dual-camera-portrait');tap(shutter);await wait('End session',35);await shot('dual-sent');await pause(8500);
tap(await wait('End session'));tap(await wait('Capture'));tap(await wait('Capture both views'));await wait('Stop & seal',35);tap(await wait('Stop & seal'));await wait('Start another recording',40);
const state=JSON.parse(await fs.readFile('output/native-test/obs-state.json'));const folder='output/native-test/sessions/'+state.session_id+'/proof';const result=await verifyBundle(folder,state.media_path);
if(result.status!=='EXACT ORIGINAL VERIFIED'||result.dual_view_responses!==2)throw Error(JSON.stringify(result));
const captures=[];for(const f of await fs.readdir(folder+'/events')){const e=JSON.parse(await fs.readFile(folder+'/events/'+f));if(e.payload.type==='challenge-captured')captures.push(e.payload.data)}
await fs.writeFile(reviewDir+'/dual-emulator-flow.json',JSON.stringify({result,session:state.session_id,media:state.media_path,captures,expectedQrEvents:2,extraPhotos:0,limitation:'Real concurrent CameraX pipeline on emulated cameras, including screen-colour and rear-torch commands. Does not establish physical Samsung/iPhone illumination or exposure synchronisation.'},null,2));console.log(JSON.stringify({result,captures}));
`;
fs.writeFileSync('tools/emulator-dual12.mjs',s);
