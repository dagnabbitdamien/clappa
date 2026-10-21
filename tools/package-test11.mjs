import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import path from 'node:path';
const kit='output/test-kit-v11';await fs.mkdir(kit,{recursive:true});
for(const f of ['Install OBS plugin.cmd','Install-OBS.ps1','Verify latest recording.cmd','Verify-Latest.ps1','THIRD-PARTY.md'])await fs.copyFile('output/test-kit-v6/'+f,kit+'/'+f);
await fs.cp('output/test-kit-v6/licenses',kit+'/licenses',{recursive:true});
await fs.copyFile('assets/audio/README.md',kit+'/licenses/Clapperboard-CC0.md');
await fs.copyFile('android/app/build/outputs/apk/debug/app-debug.apk',kit+'/CLAPPA-0.3.0-test11.apk');
await fs.copyFile('obs-plugin/build/Release/clappa.dll',kit+'/clappa.dll');
await fs.copyFile('docs/test11.md',kit+'/TESTING.md');
await fs.copyFile('docs/review11/FRESHNESS-PROFILE.md',kit+'/FRESHNESS-PROFILE.md');
await fs.writeFile(kit+'/TESTING.md',(await fs.readFile(kit+'/TESTING.md','utf8')).replaceAll('review11/index.html','http://127.0.0.1:17450/revision11/index.html').replaceAll('review11/FRESHNESS-PROFILE.md','FRESHNESS-PROFILE.md'));
for(const dir of ['verifier','protocol']){await fs.mkdir(kit+'/'+dir,{recursive:true});for(const f of await fs.readdir(dir))if(f.endsWith('.mjs')||f==='prompts.json')await fs.copyFile(dir+'/'+f,kit+'/'+dir+'/'+f)}
const require=createRequire(import.meta.url),ajvRequire=createRequire(require.resolve('ajv/package.json'));
for(const dependency of ['ajv','fast-deep-equal','fast-uri','json-schema-traverse','require-from-string'])await fs.cp(path.dirname(ajvRequire.resolve(dependency+'/package.json')),kit+'/node_modules/'+dependency,{recursive:true,dereference:true,force:false});
const nobleRequire=createRequire(require.resolve('@noble/curves/bls12-381'));
for(const [dependency,entry] of [['@noble/curves','bls12-381'],['@noble/hashes','sha256']])await fs.cp(path.dirname(nobleRequire.resolve(dependency+'/'+entry)),kit+'/node_modules/'+dependency,{recursive:true,dereference:true,force:false});
await fs.copyFile('vendor/blst/LICENSE',kit+'/licenses/blst-Apache-2.0.txt');
await fs.appendFile(kit+'/THIRD-PARTY.md','\nTest11 adds blst v0.3.16 (Apache-2.0) and noble-curves/hashes (MIT); included dependency licenses apply.\n');
const verify=await fs.readFile(kit+'/Verify-Latest.ps1','utf8');await fs.writeFile(kit+'/Verify-Latest.ps1',verify.replace("$repoDir = (Resolve-Path (Join-Path $PSScriptRoot '..\\..')).Path","$repoDir = $PSScriptRoot"));
const installer=await fs.readFile(kit+'/Install-OBS.ps1','utf8');
await fs.writeFile(kit+'/Install-OBS.ps1',installer.replace('Start-Process powershell.exe -Verb RunAs -Wait','Start-Process powershell.exe -WindowStyle Hidden -Verb RunAs -Wait').replace('Close the old companion; it is no longer needed.','No companion program is needed.'));
const manifest={version:'0.3.0-test11',versionCode:13,androidPackage:'org.clappa.app',builtAt:new Date().toISOString(),signerSha256:'1586a024c4444989ee156d90f96ce4bb360b1f0df7de27bd9e6ee93cd3bb2417',files:[]};
for(const name of ['CLAPPA-0.3.0-test11.apk','clappa.dll']){const data=await fs.readFile(kit+'/'+name);manifest.files.push({name,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')})}
await fs.writeFile(kit+'/build.json',JSON.stringify(manifest,null,2));
await fs.writeFile(kit+'/SHA256SUMS.txt',manifest.files.map(x=>x.sha256+'  '+x.name).join('\n')+'\n');
await fs.mkdir('docs/review11/builds',{recursive:true});for(const name of ['CLAPPA-0.3.0-test11.apk','clappa.dll','build.json'])await fs.copyFile(kit+'/'+name,'docs/review11/builds/'+name);
console.log(JSON.stringify(manifest,null,2));


