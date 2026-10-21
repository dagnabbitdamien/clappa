import sharp from 'sharp';import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
const dir='assets/mascot-v3/';await mkdir(dir+'dist/parts',{recursive:true});
const {data,info}=await sharp(dir+'source/parts-sheet.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
// Remove only the neutral checker background connected to the sheet border.
// The rectangles below separate already-exploded art; they do not cut anatomy out of a pose.
const {width:W,height:H}=info,seen=new Uint8Array(W*H),queue=[];
function visit(x,y){if(x<0||y<0||x>=W||y>=H)return;const k=y*W+x,i=k*4;if(seen[k])return;const rgb=[data[i],data[i+1],data[i+2]];if(Math.max(...rgb)-Math.min(...rgb)<16&&Math.min(...rgb)>150){seen[k]=1;queue.push(k);}}
for(let x=0;x<W;x++){visit(x,0);visit(x,H-1);}for(let y=0;y<H;y++){visit(0,y);visit(W-1,y);}for(let i=0;i<queue.length;i++){const k=queue[i],x=k%W,y=Math.floor(k/W);data[k*4+3]=0;visit(x-1,y);visit(x+1,y);visit(x,y-1);visit(x,y+1);}
const sheet=await sharp(data,{raw:info}).png().toBuffer();await writeFile(dir+'source/parts-alpha.png',sheet);
// Source rectangles in the generator's 1262 × 1246 coordinate system; rescale if needed.
const definitions=[
 ['body',[40,10,385,455],[116,90,162,212]],
 ['head',[480,110,345,298],[151,46,110,96]],
 ['earNear',[877,127,170,231],[118,11,61,82]],
 ['earFar',[1060,125,170,233],[213,9,51,81]],
 ['farArm',[88,489,269,293],[136,124,77,85]],
 ['farArm-rub',[479,493,311,269],[136,124,112,96]],
 ['farArm-thumb',[883,495,281,267],[136,124,92,90]],
 ['longArm',[98,832,254,355],[194,145,55,119]],
 ['tail',[457,783,370,427],[15,127,146,177]],
 ['tailHook',[909,785,312,432],[0,0,83,115]],
];
const parts=[];
for(const [id,rect,bounds] of definitions){const [x,y,w,h]=rect.map((n,i)=>Math.round(n*(i%2?H/1246:W/1262)));const png=await sharp(sheet).extract({left:x,top:y,width:w,height:h}).png().toBuffer();await writeFile(dir+'dist/parts/'+id+'.png',png);parts.push({id,node:id.startsWith('farArm')?'farArm':id,variant:id.includes('-')?id.split('-')[1]:'open',bounds,uri:'data:image/png;base64,'+png.toString('base64')});}
const nodes=[['tail','body',[151,279]],['body',null,[178,248]],['longArm','body',[222,157]],['earFar','head',[235,69]],['earNear','head',[164,80]],['head','body',[197,129]],['farArm','body',[155,140]]].map(([id,parent,pivot])=>({id,parent,pivot}));
const rig={version:3,canvas:[313.5,313.5],nodes,parts,gestureMethod:'Whole authored bent-arm poses, registered at shoulder; restrained pose blend and squash, no inverse-kinematic wrist flipping.'};
await writeFile(dir+'dist/puppet-data.js','window.PUPPET='+JSON.stringify(rig)+';');await copyFile(dir+'dist/puppet-data.js','docs/mockups/21-motion/puppet-data.js');
await writeFile(dir+'rig.json',JSON.stringify({...rig,parts:parts.map(({uri,...p})=>p)},null,2));
const images=nodes.map(n=>{const p=parts.find(p=>p.id===n.id),b=p.bounds;return `<g id="${n.id}" data-pivot="${n.pivot}"><image href="${p.uri}" x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}"/></g>`;}).join('');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="627" height="627" viewBox="0 0 313.5 313.5">${images}</svg>`;
await writeFile(dir+'source/puppet.svg',svg);await sharp(Buffer.from(svg)).png().toFile('docs/mockups/21-motion/assembled.png');
await copyFile(dir+'source/pose-reference.png','docs/mockups/21-motion/pose-reference.png');await copyFile(dir+'source/parts-sheet.png','docs/mockups/21-motion/parts-reference.png');
console.log('Exported 10 separate authored pieces, complete torso/head, three bent-arm poses, and hooked brush tail.');
