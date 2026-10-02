import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
const dir='assets/mascot-v2/',ctx={window:{}};
vm.runInNewContext(await readFile(dir+'dist/puppet-data.js','utf8'),ctx);
const d=ctx.window.PUPPET;
const svg=s=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1254" height="1254" viewBox="0 0 313.5 313.5">${s}</svg>`);
const master=await readFile(dir+'source/master-alpha.png');
const tex=await sharp(master).extract({left:935,top:886,width:65,height:65}).png().toBuffer();
const defs=`<defs><pattern id="paper" width="16.25" height="16.25" patternUnits="userSpaceOnUse"><image href="data:image/png;base64,${tex.toString('base64')}" width="16.25" height="16.25"/></pattern></defs>`;
async function replace(id,art){const png=await sharp(svg(art)).png().toBuffer();const part=d.parts.find(p=>p.id===id);part.bounds=[0,0,313.5,313.5];part.uri='data:image/png;base64,'+png.toString('base64');await writeFile(dir+'dist/parts/'+id+'.png',png);await writeFile(dir+'source/'+id+'-repaired.svg',svg(art));}
// Rounded, independent limb silhouettes. No source-image belly pixels enter these parts.
await replace('upperArm',defs+'<path d="M216 151Q224 146 232 156Q239 177 220 215Q215 225 203 223Q192 219 196 206L211 166Q211 158 216 151Z" fill="url(#paper)"/>');
await replace('forearm',defs+'<path d="M197 206Q206 201 215 210Q219 217 207 232L196 249Q191 256 181 250Q175 246 178 238L190 216Z" fill="url(#paper)"/><path d="M180 240Q186 235 195 242L196 250Q196 257 192 260Q189 261 188 253Q185 264 182 261L182 253Q177 261 175 256L177 247Z" fill="#443d35"/>');
const arm=d.parts.find(p=>p.id==='forearm');d.parts.push({...arm,id:'forearm-thumb',variant:'thumb'});
await replace('forearm-thumb',defs+'<path d="M197 206Q206 201 215 210Q219 217 207 232L196 249Q191 256 181 250Q175 246 178 238L190 216Z" fill="url(#paper)"/><path d="M179 242Q186 239 193 243L206 239Q212 237 212 242Q212 245 199 249L197 256Q187 264 178 257Z" fill="#443d35"/>');
const body=d.parts.find(p=>p.id==='body'),bb=body.bounds;
await replace('body',defs+`<image href="${body.uri}" x="${bb[0]}" y="${bb[1]}" width="${bb[2]}" height="${bb[3]}"/><path d="M151 124Q179 118 215 128Q231 164 247 196L222 262L190 286Q142 281 135 242L143 161Z" fill="url(#paper)"/><path d="M163 126Q188 134 215 130Q203 172 193 218Q182 256 194 281Q165 272 159 241Q157 197 163 126Z" fill="#ddd0b7"/><path d="M163 126Q188 134 215 130Q203 172 193 218Q182 256 194 281Q165 272 159 241Q157 197 163 126Z" fill="url(#paper)" opacity=".11"/>`);
// Erase neither cheek nor crown when an ear moves. Keep roots behind the complete head.
for(const id of ['earNear','earFar']){const part=d.parts.find(p=>p.id===id),b=part.bounds;const silhouette=id==='earNear'?'M121 13Q149 17 171 53Q176 67 166 81Q146 81 130 62Q120 42 121 13Z':'M216 40Q226 18 240 5Q251 28 245 52L237 62Q224 59 216 40Z';await replace(id,`<defs><clipPath id="ear"><path d="${silhouette}"/></clipPath></defs><g clip-path="url(#ear)"><image href="${part.uri}" x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}"/></g>`);}
// Extend the crown under ear roots; the face is kept as a complete, permanent layer.
const head=d.parts.find(p=>p.id==='head'),hb=head.bounds;
await replace('head',defs+`<path d="M161 78Q163 62 183 55Q210 43 236 62L242 79L230 94L180 108L155 113Z" fill="url(#paper)"/><image href="${head.uri}" x="${hb[0]}" y="${hb[1]}" width="${hb[2]}" height="${hb[3]}"/>`);
await writeFile(dir+'dist/puppet-data.js','window.PUPPET='+JSON.stringify(d)+';');
await writeFile('docs/mockups/21-motion/puppet-data.js','window.PUPPET='+JSON.stringify(d)+';');
await writeFile(dir+'rig.json',JSON.stringify({...d,parts:d.parts.map(({uri,...p})=>p)},null,2));
const all=d.nodes.map(n=>{const p=d.parts.find(p=>p.node===n.id&&p.variant==='open'),b=p.bounds;return `<image href="${p.uri}" x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}"/>`;}).join('');
await sharp(svg(all)).resize(627).png().toFile('docs/mockups/21-motion/assembled.png');
console.log('Rebuilt separate limbs, trimmed ear roots, completed hidden crown.');
