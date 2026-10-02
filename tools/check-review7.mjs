import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {verifyBundle} from '../output/test-kit-v7/verifier/proof.mjs';
const dir='docs/review7',html=await fs.readFile(dir+'/index.html','utf8');
const links=[...new Set([...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]).filter(x=>!x.startsWith('http')&&!x.startsWith('#')))];
for(const link of links){await fs.access(dir+'/'+link);const r=await fetch('http://127.0.0.1:17450/'+link,{method:'HEAD'});if(!r.ok)throw Error('Broken review asset '+link)}
const range=await fetch('http://127.0.0.1:17450/obs-motion.mp4',{headers:{Range:'bytes=0-100'}});if(range.status!==206||(await range.arrayBuffer()).byteLength!==101)throw Error('Video range serving failed');
const manifest=JSON.parse(await fs.readFile(dir+'/builds/build.json'));for(const f of manifest.files){const bytes=await fs.readFile(dir+'/builds/'+f.name);if(createHash('sha256').update(bytes).digest('hex')!==f.sha256)throw Error('Build copy mismatch')}
const report=JSON.parse(await fs.readFile(dir+'/emulator-flow-result.json'));
const result=await verifyBundle(`output/native-test/sessions/${report.session}/proof`,report.media,{trustedKey:report.result.key_id});
if(result.status!=='EXACT ORIGINAL VERIFIED')throw Error('Packaged verifier failed');
console.log(JSON.stringify({reviewAssets:links.length,videoRange:'pass',buildHashes:'pass',packagedVerifier:result.status}));
