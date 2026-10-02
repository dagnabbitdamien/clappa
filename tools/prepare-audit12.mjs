import fs from 'node:fs';
let audit=fs.readFileSync('obs-plugin/qr-transcode-audit.mjs','utf8');
audit=audit.replace("const {media}=JSON.parse(await readFile(reportPath));","const source=JSON.parse(await readFile(reportPath));const {media}=source;const expectedEvents=source.expectedQrEvents??(source.captures?.length??source.result?.timed_responses??0)+(source.extraPhotos??0);");
audit=audit.replace('crop=${Math.floor(width*.75)}:${Math.floor(height*.65)}:${Math.floor(width*.25)}:${Math.floor(height*.35)}','crop=${Math.floor(320*width/1920)}:${Math.floor(320*height/1080)}:${Math.floor(1572*width/1920)}:${Math.floor(700*height/1080)}');
audit=audit.replace("if(p.event.payload.type==='challenge-captured')recovered++","if(['challenge-captured','claim'].includes(p.event.payload.type))recovered++").replace('expectedEvents:2','expectedEvents');
audit=audit.replace("limitation:'Local x264", "qrCropAt1080p:[1572,700,320,320],limitation:'Local x264");
fs.writeFileSync('obs-plugin/qr-transcode-audit12.mjs',audit);
const report=JSON.parse(fs.readFileSync('docs/review12/emulator-flow-result.json'));report.extraPhotos=1;report.expectedQrEvents=3;fs.writeFileSync('docs/review12/emulator-flow-result.json',JSON.stringify(report,null,2)+'\n');
let collect=fs.readFileSync('tools/collect-review10.mjs','utf8').replaceAll('review10','review12').replace('1592:720','1064:800');fs.writeFileSync('tools/collect-review12.mjs',collect);
