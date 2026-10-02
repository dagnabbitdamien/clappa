import fs from 'node:fs';
const script=fs.readFileSync('tools/implement-test10.mjs','utf8');
// Resume only the native edit after the guarded target mismatch; earlier files were saved.
eval(script.slice(script.indexOf('function edit'),script.indexOf('const additions'))+script.slice(script.indexOf("edit('obs-plugin/src/native-service.cpp'")));
