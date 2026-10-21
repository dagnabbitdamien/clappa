import {readFile,writeFile} from 'node:fs/promises';
const dir='docs/mockups/21-motion/';let m=await readFile(dir+'motion.js','utf8');
m=m.replace('[.23,1.4]','[.23,2.7]');
m=m.replace(/if\(name==='rub'\)\{[^\n]+/,`if(name==='rub'){p.rub=keys(t,[[0,0],[.18,0],[.42,1],[1.4,1],[1.65,0]]);p.head=4*p.rub;p.blink=t>.73&&t<.84;p.earNear=-3*p.rub;}`);
m=m.replace(/if\(name==='success'\)\{[^\n]+/,`if(name==='success'){p.head=keys(t,[[0,0],[.22,-3],[.43,5],[.7,0]]);p.blink=t>.24&&t<.38;p.thumb=keys(t,[[0,0],[.18,0],[.36,1],[.85,1],[1.05,0]]);p.earNear=keys(t,[[0,0],[.45,-7],[.65,3],[.9,0]]);}`);
m=m.replace("p.earNear=-3*ease(t/.3);","p.earNear=-3*ease(t/.3);p.alert=keys(t,[[0,0],[.16,1.08],[.27,1]]);p.blink=t>.22&&t<.34;");
m=m.replace('return p;','p.ui= name===\'clap\'?ease((t-1.04)/.20):name===\'guide\'?ease((t-.23)/.20):1; return p;');
await writeFile(dir+'motion.js',m);
let s=await readFile(dir+'player.js','utf8');const a=s.indexOf('function puppet('),b=s.indexOf('function bar(',a);
s=s.slice(0,a)+`function puppet(p,only=null){const rub=p.rub||0,thumb=p.thumb||0;let art=D.nodes.filter(n=>!only||only.includes(n.id)).map(n=>{const parts=D.parts.filter(r=>r.node===n.id),q=parts.map(r=>{const b=r.bounds,alpha=n.id==='farArm'?(r.variant==='rub'?rub:r.variant==='thumb'?thumb:1-Math.max(rub,thumb)):1;return \`<g transform="\${r.variant==='rub'?'rotate(-16 155 140)':''}"><image href="\${r.uri}" x="\${b[0]}" y="\${b[1]}" width="\${b[2]}" height="\${b[3]}" opacity="\${alpha}"/></g>\`;}).join('');return \`<g transform="\${chain(n,p)}">\${q}\${n.id==='head'?\`<ellipse cx="202" cy="94" rx="13" ry="15" fill="#d9ccb2" opacity="\${p.blink?1:0}"/><ellipse cx="240" cy="86" rx="8" ry="13" fill="#d9ccb2" opacity="\${p.blink?1:0}"/><path d="M192 95Q202 100 212 95M234 86Q240 90 246 85" stroke="#493323" stroke-width="1.7" fill="none" opacity="\${p.blink?1:0}"/>\`:''}\${$('pins').checked?\`<circle cx="\${n.pivot[0]}" cy="\${n.pivot[1]}" r="2.5" fill="#ea9574"/>\`:''}</g>\`;}).join('');return \`<g transform="translate(178 248) scale(\${1+.012*Math.max(rub,thumb)} \${1-.012*Math.max(rub,thumb)}) translate(-178 -248)">\${art}</g>\`;}
`+s.slice(b);
// Move the proof content right/down while keeping the QR's full square and quiet zone.
s=s.replace('rotate(${p.photoAngle||0} 199 60)','translate(38 9) rotate(${p.photoAngle||0} 199 60)');
s=s.replace('<rect x="414" y="57"','<g transform="translate(25 9)"><rect x="414" y="57"');
const c=s.indexOf('s+=`<defs><clipPath id="earBand"'),d=s.indexOf('return s+bar(772',c);
s=s.slice(0,c)+`s+='</g>';const hook=D.parts.find(x=>x.id==='tailHook');
s+=\`<defs><clipPath id="obsMascotCut"><rect x="0" y="45" width="772" height="345" rx="8"/></clipPath><clipPath id="crownBand"><rect x="75" y="338" width="133" height="52"/></clipPath></defs><g clip-path="url(#obsMascotCut)"><image href="\${hook.uri}" x="-14" y="275" width="79" height="122"/><g clip-path="url(#crownBand)"><g transform="translate(-15 334) scale(.82)">\${puppet({...p,head:0},['earFar','earNear','head'])}</g></g></g>\${text(746,382,'CLAPPA',23,'text-anchor="end" font-style="italic" font-weight="700"')}\`;
`+s.slice(d);
const e=s.indexOf("const ready=scene==='clap'"),f=s.indexOf('const px=',e);
s=s.slice(0,e)+`const ready=scene==='clap'&&time<1.05,caption=scene==='error'?'Couldn’t reach OBS':scene==='success'?'Sent to OBS':'Take a picture';
if(ready)s+=text(26,portrait?231:176,'Tap to clap',26);
`+s.slice(f);
// Bubble and action fade/slide together, with the tail pointing toward the guide.
const g=s.indexOf('if(!ready)s+='),h=s.indexOf('\ns+=`<path d="M26',g);
s=s.slice(0,g)+`const ui=p.ui??1,bx=portrait?26:280,by=portrait?532:151,bw=portrait?308:274,bh=84;
s+=\`<g opacity="\${ui}" transform="translate(0 \${(1-ui)*7})"><path d="M\${bx+9} \${by}H\${bx+bw-9}Q\${bx+bw} \${by} \${bx+bw} \${by+9}V\${by+bh-9}Q\${bx+bw} \${by+bh} \${bx+bw-9} \${by+bh}H\${bx+9}Q\${bx} \${by+bh} \${bx} \${by+bh-9}V\${by+9}Q\${bx} \${by} \${bx+9} \${by}Z" fill="#e8e1d2"/><path d="\${portrait?'M165 616L174 660L194 616':'M504 235L548 267L531 231'}" fill="#e8e1d2"/>\${text(bx+18,by+32,caption,21).replace('fill="#eee9dc"','fill="#302e28"')}\${['guide','ear','rub','clap'].includes(scene)?text(bx+18,by+59,'to your left.',21).replace('fill="#eee9dc"','fill="#302e28"'):''}<rect x="26" y="\${portrait?681:251}" width="\${portrait?125:235}" height="43" rx="5" fill="#e7e0d0"/>\${text(portrait?54:100,portrait?709:280,scene==='error'?'Retry':'Capture',17).replace('fill="#eee9dc"','fill="#29271f"')}</g>\`;
if(scene==='error')s+=\`<g transform="translate(\${portrait?240:658} \${portrait?582:168}) scale(\${p.alert||0})"><circle r="13" fill="#bd6455"/>\${text(0,6,'!',19,'text-anchor="middle" font-weight="700"')}</g>\`;
`+s.slice(h);
s=s.replace('A two-joint forelimb reaches the head’s nose target, rubs twice and returns.','The naturally bent arm uses a dedicated nose-touch drawing and a short pose transition.').replace('A small nod and ear flick after success, then quiet.','The bent arm gives a small chest-height thumbs-up, with a nod.').replace('An attentive tilt without a success gesture.','A small red exclamation appears; the guide blinks in surprise.');
await writeFile(dir+'player.js',s);
let html=await readFile(dir+'index.html','utf8');html=html.replace('Revised motion · 21b','Revised motion · 21c').replaceAll('1.4°','2.7°');html=html.replace('<section class="card"><h2>Motion coverage</h2>','<section class="card"><h2>Character library</h2><p>New pose references and independent parts used by this revision. The arm uses whole authored poses, not a wrist-flipping joint solve.</p><a href="pose-reference.png"><img src="pose-reference.png" alt="Resting, nose touch and thumbs-up pose references"></a><a href="parts-reference.png"><img src="parts-reference.png" alt="Separate complete body, head, ears, arm poses and brush tails" style="max-height:620px"></a></section><section class="card"><h2>Motion coverage</h2>');
await writeFile(dir+'index.html',html);
