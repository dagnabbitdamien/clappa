import fs from 'node:fs';
const p='obs-plugin/src/native-service.cpp';let s=fs.readFileSync(p,'utf8');
function edit(from,to){if(!s.includes(from))throw Error(from);s=s.replace(from,to)}
edit('auto photo=reader.read();need(!photo.isNull(),"Photo cannot be displayed");','auto photo=reader.read();need(!photo.isNull(),"Photo cannot be displayed");bool dual=!claim&&d.contains("dual");auto rearPhoto=[&](const char *which){QImageReader r(folder()+"/"+QString::fromStdString(d["dual"][which]["original"]["path"]));r.setAutoTransform(true);if(r.size().isValid())r.setScaledSize(r.size().scaled(1348,984,Qt::KeepAspectRatio));auto image=r.read();need(!image.isNull(),"Rear photo cannot be displayed");return image;};if(dual)photo=BoardArt::dualPhoto(photo,rearPhoto("rear_a"));');
edit('promptText(lastPrompt),freshSession','promptText(lastPrompt,dual),freshSession');
edit('auto b=flashReader.read();need(!b.isNull(),"Flash photo cannot be displayed");','auto b=flashReader.read();need(!b.isNull(),"Flash photo cannot be displayed");if(dual)b=BoardArt::dualPhoto(b,rearPhoto("rear_b"));');
fs.writeFileSync(p,s);
