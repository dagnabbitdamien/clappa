$ErrorActionPreference='Stop'
$workspacePath=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$clang=Join-Path $workspacePath '.tools/android-sdk/ndk/27.2.12479018/toolchains/llvm/prebuilt/windows-x86_64/bin/clang.exe'
foreach($entry in @(@('arm64-v8a','aarch64-linux-android28'),@('x86_64','x86_64-linux-android28'))){
 $targetDir=Join-Path $workspacePath ('android/app/src/main/jniLibs/'+$entry[0]);New-Item -ItemType Directory -Force $targetDir | Out-Null
 & $clang ('--target='+$entry[1]) -shared -fPIC -O2 -D__BLST_PORTABLE__ -I "$workspacePath/vendor/blst/bindings" -I "$workspacePath/shared/beacon" "$workspacePath/vendor/blst/src/server.c" "$workspacePath/vendor/blst/build/assembly.S" "$workspacePath/shared/beacon/quicknet.c" "$workspacePath/shared/beacon/android.c" '-Wl,-z,max-page-size=16384' -o "$targetDir/libclappa_beacon.so"
 if($LASTEXITCODE-ne0){throw 'Beacon native Android build failed'}
}
