import {readFile,writeFile} from 'node:fs/promises';
const dir='docs/mockups/21-motion/';let s=await readFile(dir+'player.js','utf8');
s=s.replace("let scene='obs',time=0,raf=0;","let scene='obs',time=0,raf=0,generation=0;");
s=s.replace('function stop(){cancelAnimationFrame(raf);raf=0;}','function stop(){generation++;cancelAnimationFrame(raf);raf=0;}');
s=s.replace('const start=performance.now(),speed=', 'const token=generation,start=performance.now(),speed=').replace('function tick(now){time=', 'function tick(now){if(token!==generation)return;time=');
s=s.replace('<g transform="${chain(n,p)}">${q}', '<g transform="${chain(n,p)}" clip-path="${n.id===\'farArm\'?\'url(#armOverlap)\':n.id===\'head\'?\'url(#headNeckOverlap)\':\'none\'}">${q}');
s=s.replace('return `<g transform="translate(178 248)', 'return `<defs><clipPath id="armOverlap"><path d="M163 120L140 164L125 198L110 320H330V0H163Z"/></clipPath><clipPath id="headNeckOverlap"><rect x="0" y="0" width="314" height="129"/></clipPath></defs><g transform="translate(178 248)');
await writeFile(dir+'player.js',s);
// Remove the superseded simulation and IK; current gestures cannot accidentally reuse it.
let m=await readFile(dir+'motion.js','utf8');const a=m.indexOf('const dt='),b=m.indexOf('const clamp=',a);m=m.slice(0,a)+'const frames=[],impacts=[.34];\n'+m.slice(b);
const c=m.indexOf('function spring('),d=m.indexOf('function keys(',c);m=m.slice(0,c)+m.slice(d);
const e=m.indexOf('function arm('),f=m.indexOf('const lengths=',e);m=m.slice(0,e)+m.slice(f);
m=m.replace('root.MOTION={evaluate,lengths,frames,impacts,rotate,arm};','for(let i=0;i<=180;i++){const t=i/60,p=evaluate(\'obs\',t);frames.push({t,y:p.bodyY,a:p.bar});}root.MOTION={evaluate,lengths,frames,impacts,rotate};');
await writeFile(dir+'motion.js',m);
