import {readFile,writeFile,mkdir} from 'node:fs/promises';import vm from 'node:vm';import sharp from 'sharp';import assert from 'node:assert/strict';
const dir='docs/mockups/21-motion/';let s=await readFile(dir+'motion.js','utf8');s=s.replace('p.upperArm=-28*keys','p.upperArm=169.45*keys').replace('p.forearm=-70*keys','p.forearm=109.04*keys');await writeFile(dir+'motion.js',s);
const ctx={window:{},document:{getElementById:()=>({checked:false})}};vm.createContext(ctx);for(const f of ['puppet-data.js','media-data.js','motion.js'])vm.runInContext(await readFile(dir+f,'utf8'),ctx);
let player=await readFile(dir+'player.js','utf8');player=player.replace('function markup(name,t){const p=', 'function markup(name,t){scene=name;time=t;const p=');await writeFile(dir+'player.js',player);
vm.runInContext(player.slice(0,player.indexOf("$('scenes').onclick"))+';window.draw=markup;',ctx);
const M=ctx.window.MOTION,checks=[];
for(const name of ['obs','exit']){for(let t=0;t<=M.lengths[name];t+=1/240){const p=M.evaluate(name,t);assert.equal(p.qr,true);assert.equal(p.photo,1);assert(p.bar<=1.401);assert(Number.isFinite(p.bodyY));}checks.push(`${name}: photo and QR present at every sampled frame; bar <= 1.4 degrees`);}
assert.equal(M.evaluate('obs',.42).bodyY,0);assert(M.evaluate('exit',.24).bodyY>=480);
checks.push('Entrance settled by 420 ms; exit below frame by 240 ms');
const pngs=[];for(const [name,t] of [['obs',.19],['obs',1],['rub',1],['success',.6],['ear',.78],['capture',.5]]){const svg='<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1280" height="720">'+ctx.window.draw(name,t)+'</svg>';const png=await sharp(Buffer.from(svg)).resize(640,360).png().toBuffer();pngs.push(png);await writeFile(dir+'check-'+name+'.png',png);}
await sharp({create:{width:1280,height:1080,channels:4,background:'#25241f'}}).composite(pngs.map((input,i)=>({input,left:(i%2)*640,top:Math.floor(i/2)*360}))).png().toFile(dir+'revision-contact.png');
await writeFile(dir+'revision-checks.json',JSON.stringify({checks,scope:'Deterministic motion constraints and rendered poses. Not aesthetic approval or native integration.'},null,2));
await writeFile('assets/mascot-v2/dist/clips.json',JSON.stringify(Object.fromEntries(Object.entries(M.lengths).map(([name,length])=>[name,{fps:60,frames:Array.from({length:Math.ceil(length*60)+1},(_,i)=>M.evaluate(name,i/60))}]))));
console.log(checks.join('\n'));
