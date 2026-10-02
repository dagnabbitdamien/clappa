import fs from 'node:fs';
import {schema} from '../protocol/schema.mjs';
fs.writeFileSync('protocol/schema.json',JSON.stringify(schema,null,2)+'\n');
fs.writeFileSync('android/app/src/main/assets/proof-schema.json',JSON.stringify(schema)+'\n');
const json=JSON.stringify(schema);
// MSVC limits individual string literals; adjacent literals form one JSON value.
fs.writeFileSync('obs-plugin/src/schema.inc',json.match(/[\s\S]{1,8000}/g).map(chunk=>'R"schema('+chunk+')schema"').join('\n')+'\n');
