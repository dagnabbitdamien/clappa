import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';import sharp from 'sharp';import vm from 'node:vm';
const dir='assets/mascot-v4/';await mkdir(dir+'sprites',{recursive:true});
await copyFile('C:/Users/Harrison/.codex/generated_images/01a09534-eabd-7fe1-b794-5227ba0977ba/exec-64c09f83-a57d-4675-a74c-b0a0d8a52c92.png',dir+'whole-sprite-sheet.png');
const {data,info}=await sharp(dir+'whole-sprite-sheet.png').ensureAlpha().raw().toBuffer({resolveWithObject:true}),W=info.width,H=info.height,seen=new Uint8Array(W*H),q=[];
function visit(x,y){if(x<0||y<0||x>=W||y>=H)return;const k=y*W+x,i=k*4;if(seen[k])return;const rgb=[data[i],data[i+1],data[i+2]];if(Math.max(...rgb)-Math.min(...rgb)<17&&Math.min(...rgb)>155){seen[k]=1;q.push(k);}}
for(let x=0;x<W;x++){visit(x,0);visit(x,H-1);}for(let y=0;y<H;y++){visit(0,y);visit(W-1,y);}for(let j=0;j<q.length;j++){const k=q[j],x=k%W,y=Math.floor(k/W);data[k*4+3]=0;visit(x-1,y);visit(x+1,y);visit(x,y-1);visit(x,y+1);}
const names=['rest','blink','rub','success','error','guide'],sprites=[];
for(let i=0;i<6;i++){const left=Math.round(i%3*W/3),top=Math.round(Math.floor(i/3)*H/2),width=Math.round((i%3+1)*W/3)-left,height=Math.round((Math.floor(i/3)+1)*H/2)-top;const png=await sharp(data,{raw:info}).extract({left,top,width,height}).png().toBuffer();await writeFile(dir+'sprites/'+names[i]+'.png',png);sprites.push({id:names[i],uri:'data:image/png;base64,'+png.toString('base64')});}
// Preserve the accepted OBS crown as one flat static image, never an articulated rig.
const ctx={window:{}};vm.runInNewContext(await readFile('assets/mascot-v3/dist/puppet-data.js','utf8'),ctx);const old=ctx.window.PUPPET;let art='';for(const id of ['earFar','earNear','head']){const p=old.parts.find(p=>p.id===id),b=p.bounds;art+=`<image href="${p.uri}" x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}"/>`;}
const crown=await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="627" height="627" viewBox="0 0 313.5 313.5">${art}</svg>`)).png().toBuffer();await writeFile(dir+'obs-crown.png',crown);
const hook=old.parts.find(p=>p.id==='tailHook');await writeFile(dir+'obs-tail.png',Buffer.from(hook.uri.split(',')[1],'base64'));
const dataJs='window.PUPPET='+JSON.stringify({version:4,parts:[],sprites,crown:'data:image/png;base64,'+crown.toString('base64'),hook:hook.uri})+';';await writeFile(dir+'sprites.js',dataJs);await writeFile('docs/mockups/21-motion/puppet-data.js',dataJs);await copyFile(dir+'whole-sprite-sheet.png','docs/mockups/21-motion/whole-sprite-sheet.png');await copyFile(dir+'sprites/rest.png','docs/mockups/21-motion/assembled.png');
console.log('Six intact character sprites, one static OBS crown, one brush-tail image. No articulated character parts.');

await import('./mascot-v4-isolate.mjs');
