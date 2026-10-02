import fs from 'node:fs';
function edit(file,fn){const before=fs.readFileSync(file,'utf8').replaceAll('\r\n','\n');const after=fn(before);if(before===after)throw Error('No change: '+file);fs.writeFileSync(file,after);}
function replace(s,a,b){if(!s.includes(a))throw Error('Missing target: '+a.slice(0,100));return s.replace(a,b)}
const additions={selfie_cover_left:'Cover your left eye with your left hand!',selfie_cover_right:'Cover your right eye with your right hand!',selfie_wink:'Hold a wink for both photos!',selfie_turn:'Turn your face slightly to one side!'};
const prompts=JSON.parse(fs.readFileSync('protocol/prompts.json'));Object.assign(prompts,additions);fs.writeFileSync('protocol/prompts.json',JSON.stringify(prompts,null,2)+'\n');
const front=['selfie',...Object.keys(additions)];
edit('protocol/schema.mjs',s=>{
 s=replace(s,"'room_setup','selfie']","'room_setup','selfie',"+Object.keys(additions).map(x=>`'${x}'`).join(',')+"]");
 s=replace(s,"prompt_id:{const:'selfie'}",`prompt_id:{enum:${JSON.stringify(front)}}`);
 s=replace(s,'challenge.oneOf=[',"challenge.properties.response_window_ms={const:10000};\nchallenge.oneOf=[");
 s=replace(s,'export const schema={',"eventData['session-start'].properties.response_profile={const:'CLAPPA-RESPONSE-v1'};\neventData['challenge-captured'].properties.response_ms=num;\neventData['challenge-captured'].properties.pair_ms=num;\nexport const schema={");return s;
});
edit('verifier/proof.mjs',s=>{
 s="import {validateResponseWindow,RESPONSE_PROFILE} from '../protocol/response-window.mjs';\n"+s;
 s=replace(s,'let issuedEvent=null,mediaProofs=0;','let issuedEvent=null,mediaProofs=0,timedResponses=0,responseProfile=null;');
 s=replace(s,"case 'session-start':recording=d.recording_id;","case 'session-start':responseProfile=d.response_profile??null;recording=d.recording_id;");
 s=replace(s,"collect(d.obs.outputs);lastElapsed=", "if(responseProfile===RESPONSE_PROFILE&&d.response_window_ms!==10000)throw Error('Missing response deadline');collect(d.obs.outputs);lastElapsed=");
 s=replace(s,'await photo(root,d.photo_a);await photo(root,d.photo_b);',"if(validateResponseWindow(issuedEvent.payload,p,{required:responseProfile===RESPONSE_PROFILE})===RESPONSE_PROFILE)timedResponses++;\n          await photo(root,d.photo_a);await photo(root,d.photo_b);");
 return replace(s,'detached_media_proofs:mediaProofs,media_binding:binding','detached_media_proofs:mediaProofs,response_profile:responseProfile??"legacy-unbounded",timed_responses:timedResponses,media_binding:binding');
});
edit('protocol/evidence.mjs',s=>{
 s="import {validateResponseWindow} from './response-window.mjs';\n"+s;
 return replace(s,'return context;',"if(e.type==='challenge-captured')validateResponseWindow(c,e);\n return context;");
});
edit('android/app/src/main/java/org/clappa/app/Session.kt',s=>{
 s=replace(s,'private var issuedEvent:JSONObject?=null','private var issuedEvent:JSONObject?=null\n    private var responseWindow:ResponseWindow?=null\n    @Synchronized fun remainingMillis()=if(pending==null)0L else responseWindow?.remaining(android.os.SystemClock.elapsedRealtime())?:0L');
 s=replace(s,'.put("outputs",descriptors))}', '.put("outputs",descriptors).put("response_profile","CLAPPA-RESPONSE-v1"))}');
 s=replace(s,'"room_setup","selfie")','"room_setup","selfie",'+Object.keys(additions).map(x=>JSON.stringify(x)).join(',')+')');
 s=replace(s,'val selfie=chosen=="selfie"','val selfie=chosen.startsWith("selfie")');
 s=replace(s,'val id=Proof.id();val at=now();','val id=Proof.id();val at=now();responseWindow=ResponseWindow(android.os.SystemClock.elapsedRealtime());');
 s=replace(s,'.put("phase",phase).put("cadence",beats)', '.put("phase",phase).put("response_window_ms",10000).put("cadence",beats)');
 s=replace(s,'fun accept(a:File,b:File,aAt:Long,bAt:Long)', 'fun accept(a:File,b:File,aAt:Long,bAt:Long,aMono:Long,bMono:Long)');
 s=replace(s,'val id=p.getString("challenge_id")\n        val e=', 'val id=p.getString("challenge_id");val window=checkNotNull(responseWindow);val responseMs=window.first(aMono);val pairMs=window.pair(aMono,bMono,p.getString("camera")=="front")\n        check(aAt-lastIssuedAt in 0..10000 && kotlin.math.abs(aAt-lastIssuedAt-responseMs)<=250 && kotlin.math.abs(bAt-aAt-pairMs)<=250){"Phone clocks changed during capture"}\n        val e=');
 return replace(s,'.put("a_at",aAt).put("b_at",bAt)', '.put("a_at",aAt).put("b_at",bAt).put("response_ms",responseMs).put("pair_ms",pairMs)');
});
edit('android/app/src/main/java/org/clappa/app/MainActivity.kt',s=>{
 s=replace(s,'private var claimTimer:Job?=null','private var claimTimer:Job?=null\n    private var responseTimer:Job?=null\n    private var responseSeconds by mutableIntStateOf(0)');
 s=replace(s,'playCadence(p,s)',`responseTimer?.cancel();responseSeconds=10
            responseTimer=lifecycleScope.launch {
                while(s.pending!=null){
                    responseSeconds=((s.remainingMillis()+999)/1000).toInt()
                    if(responseSeconds==0&&!busy){
                        withContext(Dispatchers.IO){s.fail("timeout")};cameraOpen=false;prompt="";phase=BoardPhase.INCOMPLETE
                        status="Time ran out. This recording remains incomplete.";break
                    }
                    delay(100)
                }
                responseSeconds=0
            }
            phase=BoardPhase.CHALLENGE
            playCadence(p,s)`);
 // The deadline begins at issuance; show the challenge while its phrase plays.
 s=replace(s,'private suspend fun take(flashMode:Int=ImageCapture.FLASH_MODE_OFF):Pair<File,Long>', 'private data class PhotoResult(val file:File,val wall:Long,val monotonic:Long)\n    private suspend fun take(flashMode:Int=ImageCapture.FLASH_MODE_OFF):PhotoResult');
 s=replace(s,'if(cont.isActive)cont.resume(f to System.currentTimeMillis())','if(cont.isActive)cont.resume(PhotoResult(f,System.currentTimeMillis(),SystemClock.elapsedRealtime()))else f.delete()');
 s=replace(s,'val (a,ta)=take()\n            val (b,tb)=take(', 'val (a,ta,ma)=withTimeout(s.remainingMillis().coerceAtLeast(1)){take()}\n            val (b,tb,mb)=withTimeout(if(selfie)1500L else 3000L){take(');
 s=replace(s,'else ImageCapture.FLASH_MODE_ON)\n            check', 'else ImageCapture.FLASH_MODE_ON)}\n            check');
 s=replace(s,'s.accept(a,b,ta,tb)', 's.accept(a,b,ta,tb,ma,mb)');
 s=replace(s,'s.fail("camera-error")','s.fail(if(e is TimeoutCancellationException||s.remainingMillis()==0L)"timeout" else "camera-error")');
 s=replace(s,'status.contains("pairing code has changed")),clapVisual', 'status.contains("pairing code has changed"),responseSeconds),clapVisual');
 s=replace(s,'Text("Your identity",style=', `TextButton(onClick={settings=false;startActivity(android.content.Intent(this@MainActivity,DualCameraActivity::class.java))},enabled=session==null&&!obsRecording&&!busy){Text("Try two cameras · experimental")}
            Text("Your identity",style=`);
 s=replace(s,'else prompt,Modifier.weight(2f)', 'else prompt+(if(responseSeconds>0)"  ·  ${responseSeconds}s" else ""),Modifier.weight(2f)');
 return s;
});
edit('android/app/src/main/java/org/clappa/app/ClappaBoard.kt',s=>{
 s=replace(s,'val needsPairing:Boolean=false)', 'val needsPairing:Boolean=false,val responseSeconds:Int=0)');
 s=replace(s,'.then(if(landscape)Modifier.height(maxHeight-12.dp)else Modifier.heightIn(max=maxHeight*.57f))', '.height(maxHeight-12.dp)');
 s=replace(s,'Modifier.weight(1f,fill=landscape)', 'Modifier.weight(1f,fill=true)');
 s=replace(s,'Spacer(Modifier.height(20.dp))','Spacer(Modifier.height(12.dp))\n    if(state.phase==BoardPhase.CHALLENGE){Text("Capture within ${state.responseSeconds}s",color=Chalk,fontSize=13.sp,modifier=Modifier.padding(bottom=8.dp));LinearProgressIndicator(progress={state.responseSeconds/10f},color=Color(0xffa9cfbc),trackColor=Chalk.copy(alpha=.12f),modifier=Modifier.fillMaxWidth().padding(bottom=12.dp))}');
 s=replace(s,'if(state.claimSeconds>0)OutlinedButton', 'if(state.claimSeconds>0)OutlinedButton');
 s=replace(s,'else minOf(w*.84f,h*.49f)','else minOf(w*1.10f,h*.62f)');
 s=replace(s,'else w-side*.78f','else w*.37f');
 return s;
});
edit('android/app/build.gradle.kts',s=>replace(replace(s,'versionCode = 11','versionCode = 12'),'0.3.0-test9','0.3.0-test10'));
edit('android/app/src/main/AndroidManifest.xml',s=>replace(s,'        <activity android:name=".MainActivity"','        <activity android:name=".DualCameraActivity" android:exported="false" android:configChanges="orientation|screenSize" />\n        <activity android:name=".MainActivity"'));
edit('obs-plugin/src/native-service.cpp',s=>{
 s=replace(s,'bool startOK=false,endOK=false;', 'bool startOK=false,endOK=false,timedSession=false;');
 s=replace(s,'startOK=false;endOK=false;', 'startOK=false;endOK=false;timedSession=false;');
 s=replace(s,'else if(t=="challenge-issued"){need', 'else if(t=="challenge-issued"){need(!timedSession||d.value("response_window_ms",0)==10000,"Missing response deadline");need');
 s=replace(s,'startOK|=pending["phase"]=="start";',`if(pending.contains("response_window_ms")){
     need(d.contains("response_ms")&&d.contains("pair_ms"),"Missing capture timing");
     auto a=d["a_at"].get<long long>(),b=d["b_at"].get<long long>(),issued=pending["at"].get<long long>(),r=d["response_ms"].get<long long>(),gap=d["pair_ms"].get<long long>();
     need(a-issued<=10000&&r<=10000&&gap<=(pending["flash"]=="led"?3000:1500)&&std::abs(a-issued-r)<=250&&std::abs(b-a-gap)<=250,"Response deadline or clocks invalid");
    }else need(!d.contains("response_ms")&&!d.contains("pair_ms"),"Timing without policy");startOK|=pending["phase"]=="start";`);
 s=replace(s,'if(t=="session-start")need', 'if(t=="session-start")timedSession=d.value("response_profile",std::string())=="CLAPPA-RESPONSE-v1";\n   if(t=="session-start")need');
 return s;
});
console.log('Test10 changes applied.');
