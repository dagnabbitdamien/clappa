import {readFile,writeFile} from 'node:fs/promises';
const path='docs/mockups/21-motion/player.js';let s=await readFile(path,'utf8');s=s.replaceAll('rotate(${-angle} 13 26)','rotate(${-angle} 13 14)');
const a=s.indexOf('<path d="M5 20Q5 16'),b=s.indexOf('`;}',a);
s=s.slice(0,a)+`<path d="M0 0H21L40 45Q42 49 37 49H0Z" fill="#545852" stroke="#242723" stroke-width=".8"/><path d="M1 1H20L38 46H1Z" fill="#a2a296"/><path d="M1 1H20M1 1V46" fill="none" stroke="#d6d4c8" stroke-width="1"/><path d="M2 47H37" stroke="#666a60"/><g fill="#dedace" stroke="#555a50" stroke-width=".9"><circle cx="13" cy="14" r="4.3"/><circle cx="10" cy="40" r="3.2"/><circle cx="29" cy="40" r="3.2"/></g><path d="M10.5 14h5M8 40h4M27 40h4" stroke="#63685e" stroke-width="1"/>`+s.slice(b);
await writeFile(path,s);
