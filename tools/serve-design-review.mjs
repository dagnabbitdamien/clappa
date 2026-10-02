import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../docs/mockups/',import.meta.url));
const port=Number(process.argv[2]||17448);if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid local preview port');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8','.zip':'application/zip','.mp4':'video/mp4'};
http.createServer(async(req,res)=>{
 try{const url=new URL(req.url,'http://127.0.0.1:17448'),name=decodeURIComponent(url.pathname==='/'?'/19-review.html':url.pathname);const target=path.resolve(root,'.'+name),rel=path.relative(root,target);if(rel.startsWith('..')||path.isAbsolute(rel)){res.writeHead(403);res.end();return;}const bytes=await readFile(target);res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);}catch{res.writeHead(404);res.end('Review file not found');}
}).listen(port,'127.0.0.1');
