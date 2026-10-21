import fs from 'node:fs';
function edit(p,a,b){let s=fs.readFileSync(p,'utf8');if(!s.includes(a))throw Error(p+' missing '+a.slice(0,30));fs.writeFileSync(p,s.replace(a,b));}
const main='android/app/src/main/java/org/clappa/app/MainActivity.kt';
edit(main,'if(ok)openCamera(scanning) else status=', 'if(ok){refreshDualCapabilities();openCamera(scanning)} else status=');
edit(main,'        val cameras=ProcessCameraProvider.getInstance(this);cameras.addListener({runCatching{dualAvailable=cameras.get().availableConcurrentCameraInfos.any{it.any{c->c.lensFacing==CameraSelector.LENS_FACING_FRONT}&&it.any{c->c.lensFacing==CameraSelector.LENS_FACING_BACK&&c.hasFlashUnit()}}};if(!dualAvailable)dualEnabled=false},ContextCompat.getMainExecutor(this))','        refreshDualCapabilities()');
edit(main,'    protected fun beginPairing(data:String){',`    private fun refreshDualCapabilities(){val cameras=ProcessCameraProvider.getInstance(this);cameras.addListener({dualAvailable=runCatching{cameras.get().availableConcurrentCameraInfos.any{it.any{c->c.lensFacing==CameraSelector.LENS_FACING_FRONT}&&it.any{c->c.lensFacing==CameraSelector.LENS_FACING_BACK&&c.hasFlashUnit()}}}.getOrDefault(false)},ContextCompat.getMainExecutor(this))}
    protected fun beginPairing(data:String){`);
edit(main,'link::send,::choosePrompt,dualEnabled&&dualAvailable);','link::send,::choosePrompt,dualEnabled);');
edit(main,'if(!connected)return;phase=BoardPhase.CONNECTING;status="Starting OBS recording…"','if(!connected)return;if(dualEnabled&&!dualAvailable){connectionNotice="Two-camera mode is selected but is unavailable here. Turn it off in Settings to use single-camera challenges.";return};phase=BoardPhase.CONNECTING;status="Starting OBS recording…"');
edit(main,'enabled=dualAvailable&&session==null&&!obsRecording&&!busy','enabled=(dualAvailable||dualEnabled)&&session==null&&!obsRecording&&!busy');
edit(main,'if(scanning||claimMode){phase=if(connected)BoardPhase.STANDBY else BoardPhase.LOST}', 'if(scanning||claimMode){phase=if(obsRecording)BoardPhase.READY else if(connected)BoardPhase.STANDBY else BoardPhase.LOST}');
edit('android/app/src/main/java/org/clappa/app/Quicknet.kt','Could not verify the fresh beacon. This recording is incomplete.','Could not verify the fresh beacon for this attempt. Try another challenge.');
let assets=fs.readFileSync('tools/review7-assets.mjs','utf8');assets=assets.slice(0,assets.indexOf('const prompts='))+"import './generate-prompts.mjs';\n"+assets.slice(assets.indexOf('const pcm='));fs.writeFileSync('tools/review7-assets.mjs',assets);
edit('android/app/src/review/java/org/clappa/app/ReviewActivity.kt','if(phase==BoardPhase.SENT)5 else 0','if(phase==BoardPhase.SENT)25 else 0');
