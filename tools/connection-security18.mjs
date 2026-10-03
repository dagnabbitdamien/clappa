import fs from 'node:fs';import https from 'node:https';import dgram from 'node:dgram';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const sharp=require('sharp');const jsQR=require('jsqr');
const pairing=JSON.parse(fs.readFileSync('output/native-test/pairing.json'));
const raw=await sharp('output/native-test/pairing.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});const im={data:raw.data,width:raw.info.width,height:raw.info.height};const qr=jsQR(new Uint8ClampedArray(im.data),im.width,im.height);if(!qr||JSON.parse(qr.data).cert_sha256!==pairing.cert_sha256)throw Error('QR did not decode');
if(fs.readFileSync('output/native-test/connection.secret').includes(Buffer.from('PRIVATE KEY')))throw Error('Unprotected TLS key');
await new Promise((ok,bad)=>{https.get('https://127.0.0.1:17444/poll?after=0',{rejectUnauthorized:false,headers:{Authorization:'Bearer wrong'}},r=>{r.resume();if(r.statusCode!==401)bad(Error('Invalid token accepted'));else ok()}).on('error',bad)});
await new Promise((ok,bad)=>{const s=dgram.createSocket('udp4');s.on('message',()=>{s.close();bad(Error('Wrong pin received discovery response'))});s.send(Buffer.from(JSON.stringify({type:'CLAPPA-DISCOVER-v1',pin:'0'.repeat(64),nonce:'0'.repeat(32)})),17444,'127.0.0.1');setTimeout(()=>{s.close();ok()},500)});
console.log('Pairing QR decoded; Windows secret encrypted; invalid bearer rejected; wrong discovery pin ignored.');
fs.writeFileSync('docs/review18/security-result.json',JSON.stringify({pairingQr:true,encryptedStore:true,rejectWrongBearer:true,ignoreWrongDiscoveryPin:true}));
