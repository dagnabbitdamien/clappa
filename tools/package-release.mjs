import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';import {execFileSync} from 'node:child_process';

// Package current source and verified build outputs. Never copy an earlier APK,
// verifier, or validation report into a new release and relabel it as current.
const release=process.argv[2];if(!/^test\d+(?:\.\d+)?$/.test(release??''))throw Error('Usage: node tools/package-release.mjs test13');
const gradle=await fs.readFile('android/app/build.gradle.kts','utf8');
const version=gradle.match(/versionName\s*=\s*"([^"]+)"/)[1],versionCode=Number(gradle.match(/versionCode\s*=\s*(\d+)/)[1]);
if(!version.endsWith('-'+release))throw Error('Release does not match Android source version');
const apk='android/app/build/outputs/apk/debug/app-debug.apk';
const badging=execFileSync('.tools/android-sdk/build-tools/35.0.0/aapt.exe',['dump','badging',apk],{encoding:'utf8'});
if(!badging.includes(`versionCode='${versionCode}'`)||!badging.includes(`versionName='${version}'`)||!badging.includes("name='org.clappa.app'"))throw Error('APK is stale or is the review-only package');
const java='C:/Program Files/Eclipse Adoptium/jdk-21.0.7.6-hotspot/bin/java.exe';
const cert=execFileSync(java,['-jar','.tools/android-sdk/build-tools/35.0.0/lib/apksigner.jar','verify','--print-certs',apk],{encoding:'utf8'});
const signerSha256=cert.match(/certificate SHA-256 digest:\s*([a-f0-9]{64})/)[1];
if(signerSha256!=='1586a024c4444989ee156d90f96ce4bb360b1f0df7de27bd9e6ee93cd3bb2417')throw Error('APK signer changed; existing installations would not update');
const suffix=release.slice(4),kit=`output/test-kit-v${suffix}`,review=`docs/review${suffix}`;
await fs.mkdir(kit,{recursive:true});await fs.mkdir(review+'/builds',{recursive:true});
await fs.cp('tools/distribution',kit,{recursive:true});
for(const dir of ['protocol','verifier']){
 await fs.mkdir(kit+'/'+dir,{recursive:true});
 for(const name of await fs.readdir(dir))if(/\.(mjs|json)$/.test(name))await fs.copyFile(dir+'/'+name,kit+'/'+dir+'/'+name);
}
const require=createRequire(import.meta.url),ajv=createRequire(require.resolve('ajv/package.json'));
for(const name of ['ajv','fast-deep-equal','fast-uri','json-schema-traverse','require-from-string'])await fs.cp(path.dirname(ajv.resolve(name+'/package.json')),kit+'/node_modules/'+name,{recursive:true,dereference:true});
const noble=createRequire(require.resolve('@noble/curves/bls12-381'));
for(const [name,entry] of [['@noble/curves','bls12-381'],['@noble/hashes','sha256']])await fs.cp(path.dirname(noble.resolve(name+'/'+entry)),kit+'/node_modules/'+name,{recursive:true,dereference:true});
await fs.copyFile(apk,kit+`/CLAPPA-${version}.apk`);await fs.copyFile('obs-plugin/build/Release/clappa.dll',kit+'/clappa.dll');
await fs.copyFile(`docs/${release}.md`,kit+'/TESTING.md');
for(const name of ['SESSION-POLICY.md','QR-PAYLOAD.md'])await fs.copyFile('docs/review12/'+name,kit+'/'+name);
await fs.copyFile('docs/CURRENT-ARCHITECTURE.md',kit+'/ARCHITECTURE.md');
if(Number(suffix)>=13)await fs.copyFile('docs/review13/TWITCH.md',kit+'/TWITCH.md');
if(Number(suffix)>=14)await fs.copyFile('docs/review14/TWITCH-IDENTITY.md',kit+'/TWITCH-IDENTITY.md');
const manifest={version,versionCode,androidPackage:'org.clappa.app',builtAt:new Date().toISOString(),signerSha256,files:[]};
for(const name of [`CLAPPA-${version}.apk`,'clappa.dll']){const data=await fs.readFile(kit+'/'+name);manifest.files.push({name,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});await fs.copyFile(kit+'/'+name,review+'/builds/'+name);}
await fs.writeFile(kit+'/build.json',JSON.stringify(manifest,null,2));await fs.copyFile(kit+'/build.json',review+'/builds/build.json');await fs.writeFile(kit+'/SHA256SUMS.txt',manifest.files.map(f=>f.sha256+'  '+f.name).join('\n')+'\n');
console.log(JSON.stringify({kit,review,manifest},null,2));
