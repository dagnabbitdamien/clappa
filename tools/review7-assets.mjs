import fs from 'node:fs';
import './generate-prompts.mjs';
const pcm=fs.readFileSync('assets/audio/source.pcm');
let attack=5*44100;while(Math.abs(pcm.readInt16LE(attack*2))<850)attack++;
const begin=attack-110,end=attack+Math.round(.28*44100),out=Buffer.alloc((end-begin)*2);
let peak=0;for(let i=begin;i<end;i++)peak=Math.max(peak,Math.abs(pcm.readInt16LE(i*2)));
for(let i=begin;i<end;i++){const n=i-begin;const fade=Math.min(1,n/80,(end-i)/800);out.writeInt16LE(Math.round(pcm.readInt16LE(i*2)*26000/peak*fade),n*2)}
fs.mkdirSync('android/app/src/main/assets/audio',{recursive:true});fs.writeFileSync('android/app/src/main/assets/audio/clapper.pcm',out);
console.log({attackSeconds:attack/44100,trimmedSeconds:out.length/2/44100,originalPeak:peak});
