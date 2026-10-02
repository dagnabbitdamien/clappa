import path from 'node:path';
import {execFileSync} from 'node:child_process';
const cp=[path.resolve('android/app/build/tmp/kotlin-classes/debug'),path.resolve('.tools/gradle-home/caches/modules-2/files-2.1/org.jetbrains.kotlin/kotlin-stdlib/2.2.20/5380b19fa1924399b62ce3a1faffebb2b4f82272/kotlin-stdlib-2.2.20.jar')].join(path.delimiter);
console.log(execFileSync('C:/Program Files/Eclipse Adoptium/jdk-21.0.7.6-hotspot/bin/java.exe',['-cp',cp,'tools/RiffPreview.java'],{encoding:'utf8'}));
