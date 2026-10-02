import {readFileSync,writeFileSync} from 'node:fs';
const schema=JSON.stringify(JSON.parse(readFileSync(new URL('../protocol/schema.json',import.meta.url),'utf8')));
writeFileSync(new URL('src/schema.inc',import.meta.url),schema.match(/.{1,7000}/gs).map(s=>'R"CLAPPA('+s+')CLAPPA"').join('\n'));
