import https from 'node:https';import {X509Certificate,randomBytes,timingSafeEqual} from 'node:crypto';import os from 'node:os';import path from 'node:path';
import {mkdir,readFile,writeFile,rename,stat} from 'node:fs/promises';
import {WebSocketServer} from 'ws';import selfsigned from 'selfsigned';import QRCode from 'qrcode';import sharp from 'sharp';
import {canonical,parseStrict,validate,keyObject,verifySignature,hashObject,sha256,decode,hashFile,verifyBundle} from '../verifier/proof.mjs';
import {encodeTransport} from '../protocol/transport.mjs';
const args=process.argv.slice(2);const option=(k,d)=>args.includes(k)?args[args.indexOf(k)+1]:d;
const root=path.resolve(option('--root',path.join(os.homedir(),'CLAPPA'))),port=Number(option('--port','17443'));
const host=option('--host',Object.values(os.networkInterfaces()).flat().find(x=>x.family==='IPv4'&&!x.internal)?.address||'127.0.0.1');
await mkdir(root,{recursive:true});
async function atomic(file,obj){await mkdir(path.dirname(file),{recursive:true});const tmp=file+'.tmp';await writeFile(tmp,canonical(obj)+'\n');await rename(tmp,file);}
async function json(file){return parseStrict(await readFile(file,'utf8'));}
const status=message=>atomic(path.join(root,'status.json'),{message});
// Ephemeral TLS credentials and pairing token: a restart requires re-pairing.
const cert=selfsigned.generate([{name:'commonName',value:'CLAPPA local pairing'}],{days:1,keySize:2048,algorithm:'sha256'});
const token=randomBytes(32).toString('base64url');const pairing={url:`wss://${host}:${port}`,cert_sha256:sha256(new X509Certificate(cert.cert).raw),token};
await atomic(path.join(root,'pairing.json'),pairing);await QRCode.toFile(path.join(root,'pairing.png'),canonical(pairing),{width:440,errorCorrectionLevel:'M',margin:4});
const server=https.createServer({key:cert.private,cert:cert.cert,minVersion:'TLSv1.2'},(_q,r)=>{r.writeHead(404);r.end();});const wss=new WebSocketServer({server,maxPayload:110*1024*1024});
let phone=null,pub=null,key=null,sid=null,count=0,head=null,folder=null,lastState=null,announced=false,ended=false,sealSent=false,chain=Promise.resolve(),tileGeneration=0,lastTileEnd=0,lastTileRenders=0;
const send=o=>{if(phone?.readyState===1)phone.send(canonical(o));};
function equal(a,b){const x=Buffer.from(a??''),y=Buffer.from(b??'');return x.length===y.length&&timingSafeEqual(x,y);}
async function renderTile(event){
    const d=event.payload.data,isClaim=event.payload.type==='claim';const refs=isClaim?[d.photo.proof]:[d.photo_a.proof,d.photo_b.proof];
    const frames=encodeTransport(event,pub,await Promise.all(refs.map(r=>readFile(path.join(folder,r.path)))));
    const a=await sharp(path.join(folder,(isClaim?d.photo:d.photo_a).original.path)).rotate().resize(260,210,{fit:'cover'}).png().toBuffer();
    const background=Buffer.from(`<svg width="640" height="300"><rect width="640" height="300" rx="16" fill="#252b27"/><path d="M0 0H640V42H0Z" fill="#eee9da"/>${Array.from({length:9},(_,i)=>`<path d="M${i*80-25} 0h40l40 42h-40z" fill="#1a1f1c"/>`).join('')}<rect x="20" y="54" width="284" height="236" fill="#faf7ed"/><rect x="121" y="45" width="74" height="20" fill="#cbbd95"/><text x="330" y="276" fill="#eee" font-family="sans-serif" font-size="17">CLAPPA CHECK ${event.payload.seq}</text></svg>`);
    const gen=++tileGeneration;lastTileEnd=Date.now()+4500;lastTileRenders=lastState?.tile_renders??0;
    for(let i=0;i<frames.length;i++){const qr=await QRCode.toBuffer(frames[i],{width:220,margin:4,errorCorrectionLevel:'M'});await sharp(background).composite([{input:a,left:32,top:66},{input:qr,left:353,top:48}]).png().toFile(path.join(root,`tile-${gen}-${i}.png`));}
    const until=Date.now()+4500;lastTileEnd=until;let index=0;
    async function frame(){if(gen!==tileGeneration||Date.now()>until)return;await atomic(path.join(root,'tile.json'),{path:path.join(root,`tile-${gen}-${index++%frames.length}.png`),until});setTimeout(()=>frame().catch(e=>status(e.message)),120);}
    await frame();
}
async function onMessage(ws,m){
    if(ws!==phone){if(m.type!=='hello'||phone||!equal(m.token,token))throw Error('Pairing denied');validate('key',m.key);key=keyObject(m.key);pub=m.key;phone=ws;send({type:'paired'});await status('Phone paired — start recording in OBS');return;}
    if(m.type==='event'){
        validate('event',m.event);verifySignature(m.event,key);const p=m.event.payload;
        if(!sid||p.session_id!==sid||p.key_id!==pub.key_id||p.seq!==count||p.prev!==head||ended)throw Error('Event chain disagreement');
        if(count===0&&p.type!=='session-start')throw Error('Session start required');
        if(p.type==='session-start'&&canonical(p.data.outputs)!==canonical(lastState.descriptors))throw Error('Output descriptor disagreement');
        const images=m.images??{};const refs=[];const add=pair=>refs.push(pair.original,pair.proof);
        if(p.type==='challenge-captured'){add(p.data.photo_a);add(p.data.photo_b)}if(p.type==='claim')add(p.data.photo);
        if(Object.keys(images).length!==refs.length)throw Error('Unexpected image count');
        for(const r of refs){const bytes=decode(images[r.path]);if(bytes.length!==r.bytes||sha256(bytes)!==r.sha256)throw Error('Photo transfer mismatch');await mkdir(path.join(folder,'images'),{recursive:true});await writeFile(path.join(folder,r.path),bytes,{flag:'wx'});}
        await atomic(path.join(folder,'events',String(count).padStart(6,'0')+'.json'),m.event);count++;head=hashObject(m.event);if(p.type==='session-end')ended=true;
        if(['challenge-captured','claim'].includes(p.type))await renderTile(m.event);
        send({type:'ack',seq:p.seq});
    }else if(m.type==='stop-request'){
        if(!ended||m.session_id!==sid)throw Error('No completed end challenge');
        const wait=Math.max(0,lastTileEnd-Date.now());setTimeout(async()=>{try{const s=await json(path.join(root,'obs-state.json'));if(s.tile_renders<=lastTileRenders)throw Error('Proof tile was not rendered — add it to the active scene');await atomic(path.join(root,'command.json'),{type:'stop',session_id:sid});}catch(e){send({type:'error',message:e.message});}},wait);
    }else if(m.type==='final-seal'){
        if(!sealSent||!lastState?.closed)throw Error('Recording has not closed');validate('seal',m.seal);verifySignature(m.seal,key);await atomic(path.join(folder,'final-seal.json'),m.seal);
        const result=await verifyBundle(folder,lastState.media_path,{trustedKey:pub.key_id});if(result.status!=='EXACT ORIGINAL VERIFIED')throw Error(result.status+': '+(result.detail??''));send({type:'sealed'});await status('EXACT ORIGINAL VERIFIED — '+folder);
    }else throw Error('Unknown message');
}
wss.on('connection',ws=>{const timeout=setTimeout(()=>{if(ws!==phone)ws.close(1008,'Pairing timeout')},10000);ws.on('message',data=>{chain=chain.then(()=>onMessage(ws,parseStrict(data.toString('utf8')))).catch(async e=>{if(ws===phone){send({type:'error',message:e.message});await status('INCOMPLETE: '+e.message)}else ws.close(1008,'Pairing denied');});});ws.on('close',()=>{clearTimeout(timeout);if(ws===phone){phone=null;status('Phone disconnected — session incomplete').catch(()=>{});}});});
setInterval(()=>{chain=chain.then(async()=>{
    let s;try{s=await json(path.join(root,'obs-state.json'))}catch{return}lastState=s;if(!phone)return;
    if(!s.session_id||!s.descriptors?.some(d=>d.role==='recording'))return;
    if(sid!==s.session_id){if(sid&&!sealSent){send({type:'error',message:'Previous session was not finalized'});return;}sid=s.session_id;count=0;head=null;ended=false;sealSent=false;announced=false;folder=path.join(root,'sessions',sid,'proof');await mkdir(folder,{recursive:true});await atomic(path.join(folder,'session.json'),{protocol:'0.2',session_id:sid,key_id:pub.key_id});await atomic(path.join(folder,'public-key.json'),pub);}
    if(!announced){if(s.closed)return;announced=true;send({type:'session',session_id:sid,recording_id:s.recording_id,descriptors:s.descriptors});}
    if(!s.closed&&!ended)send({type:'checkpoint',outputs:s.outputs});
    if(s.closed&&ended&&!sealSent){if(s.outputs.some(o=>!o.complete||!o.packets))throw Error('Incomplete output packet coverage');const info=await stat(s.media_path);const media={name:path.basename(s.media_path),bytes:info.size,sha256:await hashFile(s.media_path)};sealSent=true;send({type:'seal-request',session_id:sid,recording_id:s.recording_id,event_count:count,head,outputs:s.outputs,media});await status('Recording closed — waiting for phone seal');}
}).catch(e=>{send({type:'error',message:e.message});status('INCOMPLETE: '+e.message).catch(()=>{})});},1000);
server.listen(port,'0.0.0.0',async()=>{await status('Scan pairing QR in CLAPPA dock');console.log(`CLAPPA local companion: ${root}\nTLS listener on ${host}:${port}. Pairing token is only in local pairing files.`)});
