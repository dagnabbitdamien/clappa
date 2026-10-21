import {readFile,writeFile} from 'node:fs/promises';
const file='docs/mockups/21-motion/player.js';let s=await readFile(file,'utf8');
s=s.replace('<clipPath id="tailFrontRoot"><rect x="0" y="344" width="45" height="46"/></clipPath>', '<filter id="tailTurnSoft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.5"/></filter><mask id="tailFrontRoot" maskUnits="userSpaceOnUse" x="-100" y="45" width="200" height="345"><rect x="-100" y="45" width="200" height="345" fill="white"/><path d="M0 240H100V322H38Q8 316 1 296Q-4 279 0 268Z" fill="black" filter="url(#tailTurnSoft)"/></mask>');
s=s.replace('<g clip-path="url(#tailFrontRoot)">${tail}</g>', '<g clip-path="url(#tailBelowLimit)"><g mask="url(#tailFrontRoot)">${tail}</g></g>');
await writeFile(file,s);
