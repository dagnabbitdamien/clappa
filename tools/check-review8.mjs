import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {verifyBundle} from '../output/test-kit-v8/verifier/proof.mjs';
const dir='docs/review8',html=await fs.readFile(dir+'/index.html','utf8'),base='http://127.0.0.1:17450/revision8/';
const links=[...new Set([...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]).filter(x=>!x.startsWith('http')&&!x.startsWith('#')))];
const screens=JSON.parse(await fs.readFile(dir+'/screens.json'));for(const screen of screens)links.push(screen.file);
for(const link of new Set(links)){await fs.access(dir+'/'+link);if(!(await fetch(base+link,{method:'HEAD'})).ok)throw Error('Broken asset '+link)}
const range=await fetch(base+'obs-motion.mp4',{headers:{Range:'bytes=0-100'}});if(range.status!==206||(await range.arrayBuffer()).byteLength!==101)throw Error('Video range failed');
const manifest=JSON.parse(await fs.readFile(dir+'/builds/build.json'));for(const f of manifest.files){const r=await fetch(base+'builds/'+f.name);const bytes=Buffer.from(await r.arrayBuffer());if(createHash('sha256').update(bytes).digest('hex')!==f.sha256)throw Error('Download hash mismatch')}
const report=JSON.parse(await fs.readFile(dir+'/emulator-flow-result.json'));
const result=await verifyBundle(`output/native-test/sessions/${report.session}/proof`,report.media,{trustedKey:report.result.key_id});
if(result.status!=='EXACT ORIGINAL VERIFIED')throw Error('Packaged verifier failed');
console.log(JSON.stringify({reviewAssets:new Set(links).size,videoRange:'pass',downloadHashes:'pass',packagedVerifier:result.status}));
