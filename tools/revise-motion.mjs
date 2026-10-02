import {readFile,writeFile} from 'node:fs/promises';
const dir='docs/mockups/21-motion/';
let m=await readFile(dir+'motion.js','utf8');
m=m.replace("exit:1.1","exit:.28");
m=m.replace(/if\(name==='obs'\)\{[^\n]+/,`if(name==='obs'){p.bodyY=keys(t,[[0,480],[.25,-3],[.36,0]]);p.bar=keys(t,[[0,0],[.12,0],[.23,1.4],[.34,0],[.38,.15],[.42,0]]);p.photoAngle=keys(t,[[0,0],[.18,-.5],[.30,.35],[.45,0]]);}`);
m=m.replace(/if\(name==='exit'\)\{[^\n]+/,`if(name==='exit'){const u=clamp(t/.24);p.bodyY=490*u*u;p.bar=keys(t,[[0,0],[.08,.65],[.19,.25],[.24,0]]);p.photoAngle=.35*Math.sin(u*Math.PI);}`);
m=m.replace('const hits=[.24,.53,.95]','const hits=[.24]').replace('t>.73&&t<.84','t>.73&&t<.84');
// Keep the elbow on its natural forward-bending branch and unwrap rotations.
m=m.replace('Math.atan2(dy,dx)+Math.acos','Math.atan2(dy,dx)-Math.acos');
m=m.replace('upperArm:(alpha-r1)*180/Math.PI,forearm:(beta-r2-alpha+r1)*180/Math.PI','upperArm:((alpha-r1)*180/Math.PI+540)%360-180,forearm:((beta-r2-alpha+r1)*180/Math.PI+540)%360-180');
m=m.replace("p.blink=t>.24&&t<.38;","p.blink=t>.24&&t<.38;p.thumbs=t>.25&&t<1.05;");
await writeFile(dir+'motion.js',m);
let s=await readFile(dir+'player.js','utf8');
s=s.replace('QR delivery waits for the settle.','Photo and QR are attached throughout; the bar lifts only slightly.').replace('Three visible strikes at the hinge, small contact impulses and a delayed guide entrance. Preview timing only; the native cadence remains authoritative.','One quick snap, independent of the musical cadence.').replace('The guide withdraws to let the camera interaction take priority.','A full-screen camera with a small CLAPPA mark and shutter control.');
s=s.replace("r.variant===(n.id==='head'&&p.blink?'blink':'open')","r.variant==='open'");
// Blink covers only the eyes; the complete head remains mounted and decoded.
s=s.replace('${$(\'pins\').checked?', '${n.id===\'head\'&&p.blink?`<path d="M183 96 Q195 104 207 95 M234 85 Q240 91 246 84" stroke="#cabea4" stroke-width="13" fill="none"/><path d="M183 97 Q195 102 207 96 M234 86 Q240 90 246 85" stroke="#493323" stroke-width="1.8" fill="none"/>`:""}${$(\'pins\').checked?');
s=s.replace('<rect x="3" y="13" width="21" height="28" rx="4" fill="#555149"/><circle cx="13" cy="26" r="5" fill="#c0b8a8"/><path d="M10 26h6" stroke="#585347" stroke-width="1.5"/>','<path d="M7 18L19 18L36 47L4 47Z" fill="#716d62" stroke="#aaa391" stroke-width=".8"/><g fill="#cec7b8" stroke="#464239" stroke-width="1"><circle cx="11" cy="40" r="3"/><circle cx="28" cy="40" r="3"/><circle cx="13" cy="24" r="3.6"/></g><path d="M9 40h4M26 40h4M11 24h4" stroke="#625d51"/>');
const a=s.indexOf('function proof('),b=s.indexOf('function phone(',a);
s=s.slice(0,a)+`function proof(p){let s=base(772,390);
s+=\`<g transform="rotate(\${p.photoAngle||0} 199 60)"><rect x="26" y="59" width="355" height="292" rx="2" fill="#000" opacity=".35"/><rect x="24" y="55" width="355" height="292" rx="2" fill="#eee7d8"/><image href="\${MEDIA.photo}" x="33" y="64" width="337" height="246" preserveAspectRatio="xMidYMid slice"/>\${text(42,333,'Look to your left.',17).replace('fill="#eee9dc"','fill="#38342a"')}<path d="M162 48l75 1-2 21-74-1z" fill="#bcaf8e" opacity=".94"/></g>
<rect x="414" y="57" width="318" height="294" rx="5" fill="#080808" opacity=".5"/><rect x="409" y="53" width="318" height="294" rx="5" fill="#aaa69b" stroke="#d4cfc2"/><rect x="421" y="57" width="294" height="286" fill="white"/>\`;
MEDIA.qr.forEach((uri,i)=>s+=\`<image href="\${uri}" x="423" y="58" width="284" height="284" opacity="\${i===Math.floor(Math.max(0,time)/.24)%MEDIA.qr.length?1:0}"/>\`);
for(const x of [415,721])for(const y of [60,339])s+=\`<circle cx="\${x}" cy="\${y}" r="2.2" fill="#57554f"/><path d="M\${x-1} \${y}h2" stroke="#d6d1c5" stroke-width=".7"/>\`;
const tail=D.parts.find(x=>x.node==='tail'),b=tail.bounds;
s+=\`<defs><clipPath id="tailBand"><rect x="10" y="348" width="145" height="42"/></clipPath><clipPath id="earBand"><rect x="633" y="354" width="115" height="36"/></clipPath></defs><g clip-path="url(#tailBand)"><g transform="translate(15 272) scale(.66)"><image href="\${tail.uri}" x="\${b[0]}" y="\${b[1]}" width="\${b[2]}" height="\${b[3]}"/></g></g><g clip-path="url(#earBand)"><g transform="translate(549 355) scale(.76)">\${puppet({...p,head:0},['earFar','earNear','head'])}</g></g>\`;
return s+bar(772,p.bar);}
`+s.slice(b);
s=s.replace('py=portrait?360:128','py=portrait?605:193');
const start=s.indexOf('s+=`<defs><clipPath id="mascotStage"'),end=s.indexOf('\nif(!ready)',start);
s=s.slice(0,start)+`s+=\`<defs><clipPath id="mascotStage"><rect width="\${w}" height="\${h}"/></clipPath></defs><g clip-path="url(#mascotStage)"><g transform="translate(\${px+313.5*k} \${py+p.rootY*k}) scale(\${-k} \${k})">\${puppet(p)}</g></g>\`;
`+s.slice(end);
s=s.replace("portrait?633:251","portrait?410:251").replace("portrait?661:280","portrait?438:280");
s=s.replace("let s=base(w,h)+text",`if(scene==='capture'&&time>.25)return \`<image href="\${MEDIA.photo}" width="\${w}" height="\${h}" preserveAspectRatio="xMidYMid slice"/><rect width="\${w}" height="6" fill="#e7e0d0"/>\${text(18,36,'CLAPPA',18,'font-style="italic" font-weight="700"')}<circle cx="\${w/2}" cy="\${h-48}" r="26" fill="none" stroke="white" stroke-width="3"/><circle cx="\${w/2}" cy="\${h-48}" r="21" fill="white"/>\`;
let s=base(w,h)+text`);
s=s.replace('${phone(p,portrait)}</g>','<defs><clipPath id="phoneBounds"><rect width="${w}" height="${h}" rx="8"/></clipPath></defs><g clip-path="url(#phoneBounds)">${phone(p,portrait)}</g></g>');
// Preserve image nodes between frames. No resource remounts or blank decode frames.
s=s.replace("function render(){ $('stage').innerHTML=markup(scene,time);$('rigView').innerHTML=puppet(M.evaluate(scene,time));",`function patch(root,html){const tmp=document.createElementNS('http://www.w3.org/2000/svg','svg');tmp.innerHTML=html;function sync(a,b){if(a.nodeType!==b.nodeType||a.nodeName!==b.nodeName){a.replaceWith(b.cloneNode(true));return;}if(a.nodeType===3){if(a.textContent!==b.textContent)a.textContent=b.textContent;return;}for(const at of [...a.attributes])if(!b.hasAttribute(at.name))a.removeAttribute(at.name);for(const at of [...b.attributes])if(a.getAttribute(at.name)!==at.value)a.setAttribute(at.name,at.value);const aa=[...a.childNodes],bb=[...b.childNodes];for(let i=0;i<Math.max(aa.length,bb.length);i++){if(!bb[i])aa[i].remove();else if(!aa[i])a.append(bb[i].cloneNode(true));else sync(aa[i],bb[i]);}}const aa=[...root.childNodes],bb=[...tmp.childNodes];for(let i=0;i<Math.max(aa.length,bb.length);i++){if(!bb[i])aa[i].remove();else if(!aa[i])root.append(bb[i].cloneNode(true));else sync(aa[i],bb[i]);}}
function render(){ patch($('stage'),markup(scene,time));patch($('rigView'),puppet(M.evaluate(scene,time)));`);
s=s.replace(";choose('obs');",";Promise.all([...D.parts.map(p=>p.uri),MEDIA.photo,...MEDIA.qr].map(src=>{const img=new Image();img.src=src;return img.decode();})).then(()=>choose('obs'));");
await writeFile(dir+'player.js',s);
let html=await readFile(dir+'index.html','utf8');
html=html.replace('Working motion prototype · 21','Revised motion · 21b').replace('Full upward travel; body overshoot drives the hinged bar; bar strikes and settles; QR starts after the board is stationary.','Quick 360 ms rise; restrained 1.4° bar lift. Photo and QR remain attached throughout.').replace('Press response and three demonstrated clacks; hinge contacts drive small body impulses, followed by guide entrance.','One quick visual clap; musical cadence remains independent.').replace('Brief upward anticipation, then a weighted drop out of frame.','Quick 240 ms drop, with photo and QR still mounted.');
html=html.replace(/<details>[\s\S]*?<\/details>/,'<details><summary>Implementation status</summary><p>Browser prototype only; no APK or OBS binary replaced. QR frames are illustrative. Earlier video downloads describe the superseded motion and have been removed from this review.</p></details>');
await writeFile(dir+'index.html',html);
