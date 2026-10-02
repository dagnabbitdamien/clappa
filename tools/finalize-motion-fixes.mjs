import {readFile,writeFile} from 'node:fs/promises';
const dir='docs/mockups/21-motion/';let s=await readFile(dir+'player.js','utf8');
s=s.replace("r.variant==='open'","r.variant===(n.id==='forearm'&&p.thumbs?'thumb':'open')");
s=s.replace('M26 ${h-46}H${w-26}','M26 ${h-46}H${portrait?90:365}');
const a=s.indexOf('const tail=D.parts'),b=s.indexOf('return s+bar(772',a);
s=s.slice(0,a)+`s+=\`<defs><clipPath id="earBand"><rect x="633" y="354" width="115" height="36"/></clipPath></defs><path d="M144 390C118 369 96 374 76 382C47 394 27 381 33 366C38 354 52 355 57 363" fill="none" stroke="#51483c" stroke-width="15" stroke-linecap="round"/><path d="M144 390C118 369 96 374 76 382C47 394 27 381 33 366C38 354 52 355 57 363" fill="none" stroke="#766856" stroke-opacity=".22" stroke-width="2"/><g clip-path="url(#earBand)"><g transform="translate(549 355) scale(.76)">\${puppet({...p,head:0},['earFar','earNear','head'])}</g></g>\`;
`+s.slice(b);
await writeFile(dir+'player.js',s);
let m=await readFile(dir+'motion.js','utf8');m=m.replace("p.thumbs=t>.25&&t<1.05;","p.thumbs=t>.25&&t<1.05;p.upperArm=-28*keys(t,[[0,0],[.4,1],[.85,1],[1.2,0]]);p.forearm=-70*keys(t,[[0,0],[.4,1],[.85,1],[1.2,0]]);");await writeFile(dir+'motion.js',m);
