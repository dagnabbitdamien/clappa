import {readFile,writeFile} from 'node:fs/promises';
let build=await readFile('assets/mascot-v4-isolate.mjs','utf8');build=build.replace('const p=D.sprites[n];','const p=D.sprites[n],nose=[[418,200],[900,205],[1477,273],[435,658],[900,710],[1471,700]][n];p.mouth=[(Math.floor((512-fm.width)/2)+(nose[0]-o.l+3)*fm.width/ww)*313.5/512,(498-fm.height+(nose[1]-o.t+3)*fm.height/hh)*313.5/512];');await writeFile('assets/mascot-v4-isolate.mjs',build);
let s=await readFile('docs/mockups/21-motion/player.js','utf8');
const start=s.indexOf('},k=portrait?.54:.57;'),end=s.indexOf('\nfunction bar(',start);
s=s.slice(0,start)+`},k=.50;return text(26,portrait?181:164,'LOCAL',9,'letter-spacing="1" opacity=".6"')+digital(value(false),75,portrait?170:153,k)+text(26,portrait?215:198,'GMT',9,'letter-spacing="1" opacity=".6"')+digital(value(true),75,portrait?204:187,k);}
`+s.slice(end);
s=s.replace('const ui=p.ui??1,','const z=p.sprite,anchor=D.sprites.find(r=>r.id===z.id).mouth||[250,120],mx=(anchor[0]-190)*z.sx,my=(anchor[1]-300)*z.sy,angle=z.angle*Math.PI/180,mouthX=px+313.5*k-k*(190+mx*Math.cos(angle)-my*Math.sin(angle)),mouthY=py+p.rootY*k+k*(300+z.y+mx*Math.sin(angle)+my*Math.cos(angle)),tipX=mouthX-12,tipY=mouthY;const pointer=portrait?`M94 577L${tipX} ${tipY}L110 577`:`M481 246L${tipX} ${tipY}L481 260`;const ui=p.ui??1,');
s=s.replace("${portrait?'M94 577L143 674L110 577':'M481 246L527 284L481 260'}",'${pointer}');
await writeFile('docs/mockups/21-motion/player.js',s);
let main=await readFile('assets/mascot-v4-build.mjs','utf8');main+="\nawait import('./mascot-v4-isolate.mjs');\n";await writeFile('assets/mascot-v4-build.mjs',main);
