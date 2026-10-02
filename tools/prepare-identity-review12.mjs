import fs from 'node:fs';
let s=fs.readFileSync('tools/emulator-flow12.mjs','utf8').split("run('shell','wm','user-rotation'")[0];
s+=`
run('install','-r','android/app/build/outputs/apk/review/app-review.apk');run('shell','wm','user-rotation','lock','0');run('shell','am','start','-W','-n','org.clappa.app.review/org.clappa.app.MainActivity');
tap(await wait('Settings'));await shot('settings-camera-mode');
for(let attempt=0;attempt<6;attempt++){
 const all=nodes();if(all.some(n=>n.text==='Export private backup'&&n.enabled==='true'))break;
 const scroll=all.find(n=>n.scrollable==='true');if(!scroll)throw Error('Settings have no scroll area');const b=scroll.bounds.match(/\\d+/g).map(Number);run('shell','input','swipe',String((b[0]+b[2])/2),String(b[3]-40),String((b[0]+b[2])/2),String(b[1]+60),'450');await pause(400);
}
await shot('settings-identity');tap(await wait('Export private backup'));await shot('identity-export-dialog');run('shell','wm','user-rotation','lock','1');await pause(700);await shot('identity-export-landscape');run('shell','input','keyevent','4');run('shell','wm','user-rotation','lock','0');
console.log('Saved native identity and camera-mode settings.');
`;
fs.writeFileSync('tools/identity-review12.mjs',s);
