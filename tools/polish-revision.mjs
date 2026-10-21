import {readFile,writeFile} from 'node:fs/promises';
let s=await readFile('docs/mockups/21-motion/player.js','utf8');
const a=s.indexOf("${n.id==='head'&&p.blink?"),b=s.indexOf("${$('pins').checked?",a);
s=s.slice(0,a)+`${'${'}n.id==='head'?\`<ellipse cx="195" cy="96" rx="17" ry="19" fill="#d9ccb2" opacity="${'${'}p.blink?1:0}"/><ellipse cx="240" cy="85" rx="9" ry="16" fill="#d9ccb2" opacity="${'${'}p.blink?1:0}"/><path d="M183 97 Q195 103 207 96 M234 86 Q240 90 246 85" stroke="#493323" stroke-width="1.8" fill="none" opacity="${'${'}p.blink?1:0}"/>\`:''}`+s.slice(b);
s=s.replace(/<path d="M144 390C118 369[\s\S]*?stroke-width="2"\/>/, '<path d="M150 390C132 370 109 363 80 376C56 388 33 381 34 368C35 358 49 353 58 364C52 359 44 362 44 368C44 376 58 378 76 366C105 348 134 365 156 390Z" fill="#51483c"/>');
await writeFile('docs/mockups/21-motion/player.js',s);
let rig=await readFile('assets/mascot-v2/repair-parts.mjs','utf8');rig=rig.replace('M180 241L171 232Q167 227 164 231Q161 234 168 243L176 250L177 257Q185 263 193 258L198 249Q197 243 190 241Z','M179 242Q186 239 193 243L206 239Q212 237 212 242Q212 245 199 249L197 256Q187 264 178 257Z');await writeFile('assets/mascot-v2/repair-parts.mjs',rig);
