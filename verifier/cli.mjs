import {verifyBundle} from './proof.mjs';
const [folder,media,...rest]=process.argv.slice(2);
if(!folder||rest.length&&!(rest.length===2&&rest[0]==='--trust-key')){console.error('Usage: node verifier/cli.mjs PROOF_FOLDER RECORDING [--trust-key SHA256]');process.exit(64);}
const result=await verifyBundle(folder,media,{trustedKey:rest[1]});console.log(JSON.stringify(result,null,2));
process.exitCode={'EXACT ORIGINAL VERIFIED':0,'INCOMPLETE SESSION':2,'PROOF TRANSCRIPT VERIFIED, MEDIA MISMATCH':3,'INVALID PROOF':4,'UNSUPPORTED VERSION':5}[result.status];

