import {readFile} from 'node:fs/promises';
import {verifyQrMedia} from './qr-proof.mjs';
const [frames,folder,recording,trustedKey]=process.argv.slice(2);
try{if(!frames||!folder||!recording)throw Error('Usage: node qr-cli.mjs decoded-frames.json proof-folder original-recording.mkv [expected-identity-code]');const result=await verifyQrMedia(JSON.parse(await readFile(frames,'utf8')),folder,recording,{trustedKey});console.log(JSON.stringify(result,null,2));}
catch(e){console.log(JSON.stringify({status:'MEDIA PREFIX NOT VERIFIED',detail:e.message},null,2));process.exitCode=1;}
