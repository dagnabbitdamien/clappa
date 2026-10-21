import fs from 'node:fs';
function edit(p,from,to){let s=fs.readFileSync(p,'utf8');if(!s.includes(from))throw Error('Missing edit: '+p+' '+from.slice(0,60));fs.writeFileSync(p,s.replace(from,to));}
const p='android/app/src/main/java/org/clappa/app/Session.kt';
edit(p,'private val pickPrompt:(Int)->Int=Proof::choice)', 'private val pickPrompt:(Int)->Int=Proof::choice, val dualView:Boolean=false)');
edit(p,'private val cameraProfile:String=run {','private val cameraProfile:String=if(dualView)"front-only" else run {');
edit(p,'addPair(data.getJSONObject("photo_b"))','addPair(data.getJSONObject("photo_b"));data.optJSONObject("dual")?.let{addPair(it.getJSONObject("rear_a"));addPair(it.getJSONObject("rear_b"))}');
edit(p,'.put("camera_profile",cameraProfile))}', '.put("camera_profile",cameraProfile).apply{if(dualView)put("capture_profile","CLAPPA-DUAL-v1")})}');
edit(p,'.put("elapsed_ms",elapsed)))','.put("elapsed_ms",elapsed)).apply{if(dualView)put("capture_profile","CLAPPA-DUAL-v1")})');
edit(p,'issuedEvent=emit("challenge-issued",data,at);','if(dualView)data.put("capture_profile","CLAPPA-DUAL-v1").put("rear_flash","torch")\n        issuedEvent=emit("challenge-issued",data,at);');
edit(p,'aMono:Long,bMono:Long){val p=', 'aMono:Long,bMono:Long,dual:JSONObject?=null){val p=');
edit(p,'val e=emit("challenge-captured",JSONObject()', 'check(dualView==(dual!=null)){"Two-camera proof is missing"}\n        val e=emit("challenge-captured",JSONObject()');
edit(p,'.put("response_ms",responseMs).put("pair_ms",pairMs));','.put("response_ms",responseMs).put("pair_ms",pairMs).apply{if(dual!=null)put("dual",dual)});');
edit(p,'    @Synchronized fun fail(reason:String)',`    @Synchronized fun acceptDual(result:JSONObject){
        check(dualView&&pending!=null)
        val name=result.getString("folder");require(name.matches(Regex("dual-[0-9a-f]{32}")))
        val dir=File(context.cacheDir,name);val normal=result.getJSONObject("normal");val lit=result.getJSONObject("illuminated")
        for(g in listOf(normal,lit))require(kotlin.math.abs(g.getLong("front_delivered_ms")-g.getLong("rear_delivered_ms"))<=120)
        require(lit.getLong("front_sensor_us")>normal.getLong("front_sensor_us")&&lit.getLong("rear_sensor_us")>normal.getLong("rear_sensor_us"))
        val extra=JSONObject().put("profile","CLAPPA-DUAL-v1").put("rear_a",imagePair(File(dir,"rear-a.jpg"),"$seq-rear-a")).put("rear_b",imagePair(File(dir,"rear-b.jpg"),"$seq-rear-b")).put("normal",normal).put("illuminated",lit).put("exposure_synchronization","not-established")
        try{accept(File(dir,"front-a.jpg"),File(dir,"front-b.jpg"),result.getLong("a_at"),result.getLong("b_at"),result.getLong("a_mono"),result.getLong("b_mono"),extra)}finally{dir.deleteRecursively()}
    }
    @Synchronized fun fail(reason:String)`);
const m='android/app/src/main/java/org/clappa/app/MainActivity.kt';
edit(m,'private var phase by mutableStateOf',`private var dualEnabled by mutableStateOf(false)
    private var dualAvailable by mutableStateOf(false)
    private val dualCapture=registerForActivityResult(ActivityResultContracts.StartActivityForResult()){result->
        val s=session
        if(s?.pending==null){busy=false;return@registerForActivityResult}
        captureJob=lifecycleScope.launch{try{
            if(result.resultCode==RESULT_OK){phase=BoardPhase.SENDING;pendingDelivery=true;withContext(Dispatchers.IO){s.acceptDual(JSONObject(checkNotNull(result.data?.getStringExtra("capture"))))};prompt="";status=""}
            else{withContext(Dispatchers.IO){s.fail(result.data?.getStringExtra("reason")?:"cancelled")};phase=BoardPhase.READY;status="Two-camera attempt not completed. You can continue.";prompt=""}
        }catch(e:Exception){pendingDelivery=false;withContext(Dispatchers.IO){runCatching{s.fail("camera-error")}};phase=BoardPhase.READY;status="Two-camera capture was not accepted. You can continue.";prompt=""}finally{busy=false;canFinish=s.endDone}}
    }
    private var phase by mutableStateOf`);
edit(m,'if(ok)cameraOpen=true else status=', 'if(ok)openCamera(scanning) else status=');
edit(m,'        setContent {MaterialTheme',`        dualEnabled=getSharedPreferences("capture",MODE_PRIVATE).getBoolean("dual",false)
        val cameras=ProcessCameraProvider.getInstance(this);cameras.addListener({runCatching{dualAvailable=cameras.get().availableConcurrentCameraInfos.any{it.any{c->c.lensFacing==CameraSelector.LENS_FACING_FRONT}&&it.any{c->c.lensFacing==CameraSelector.LENS_FACING_BACK&&c.hasFlashUnit()}}};if(!dualAvailable)dualEnabled=false},ContextCompat.getMainExecutor(this))
        setContent {MaterialTheme`);
edit(m,'link::send,::choosePrompt);','link::send,::choosePrompt,dualEnabled&&dualAvailable);');
edit(m,'prompt=Prompts.text(p.getString("prompt_id"));','prompt=Prompts.text(p.getString("prompt_id"),s.dualView);');
edit(m,'private fun openCamera(scan:Boolean=false){scanning=scan;if(ContextCompat.checkSelfPermission(this,Manifest.permission.CAMERA)==PackageManager.PERMISSION_GRANTED)cameraOpen=true else permission.launch(Manifest.permission.CAMERA)}',`private fun openCamera(scan:Boolean=false){scanning=scan
        if(ContextCompat.checkSelfPermission(this,Manifest.permission.CAMERA)!=PackageManager.PERMISSION_GRANTED){permission.launch(Manifest.permission.CAMERA);return}
        val s=session
        if(!scan&&!claimMode&&s?.dualView==true){busy=true;dualCapture.launch(android.content.Intent(this,DualCaptureActivity::class.java).putExtra("deadline",SystemClock.elapsedRealtime()+s.remainingMillis()).putExtra("prompt",prompt).putExtra("flash",s.pending!!.getString("flash")))}else cameraOpen=true
    }`);
edit(m,'TextButton(onClick={settings=false;startActivity(android.content.Intent(this@MainActivity,DualCameraActivity::class.java))},enabled=session==null&&!obsRecording&&!busy){Text("Try two cameras · experimental")}',`Text("Camera mode",style=MaterialTheme.typography.titleMedium)
            Row(verticalAlignment=Alignment.CenterVertically){Switch(checked=dualEnabled,onCheckedChange={dualEnabled=it;getSharedPreferences("capture",MODE_PRIVATE).edit().putBoolean("dual",it).apply()},enabled=dualAvailable&&session==null&&!obsRecording&&!busy);Text("Use both cameras",Modifier.padding(start=8.dp))}
            Text(if(dualAvailable)"Both views are signed and shown in OBS. Hold your pose and point the rear camera at your setup. The phone takes a normal pair, then uses screen colour and the rear light for a second pair. Choose before recording." else "Concurrent front/rear capture with a rear light is unavailable on this device. Single-camera challenges remain available.",fontSize=13.sp)
            HorizontalDivider(Modifier.padding(vertical=12.dp))`);
edit(m,'phase=BoardPhase.INCOMPLETE}}},ContextCompat.getMainExecutor(ctx))','if(scanning||claimMode){phase=if(connected)BoardPhase.STANDBY else BoardPhase.LOST}else{lifecycleScope.launch{withContext(Dispatchers.IO){session?.fail("camera-error")};phase=BoardPhase.READY;canFinish=session?.endDone==true;prompt=""}}}}},ContextCompat.getMainExecutor(ctx))');
edit('android/app/src/main/AndroidManifest.xml','<activity android:name=".DualCameraActivity"','<activity android:name=".DualCaptureActivity" android:exported="false" android:configChanges="orientation|screenSize" />\n        <activity android:name=".DualCameraActivity"');
const prompts={selfie:'Show yourself and your setup!',selfie_cover_left:'Cover your left eye · show your setup!',selfie_cover_right:'Cover your right eye · show your setup!',selfie_wink:'Hold a wink · show your setup!',selfie_turn:'Turn your face · show your setup!'};
fs.writeFileSync('protocol/dual-prompts.json',JSON.stringify(prompts,null,2)+'\n');
edit('android/app/src/main/java/org/clappa/app/Prompts.kt',' fun text(id:String)=all[id]?:error("Unknown prompt")',' private val dual=mapOf('+Object.entries(prompts).map(([k,v])=>JSON.stringify(k)+' to '+JSON.stringify(v)).join(',')+')\n fun text(id:String,both:Boolean=false)=(if(both)dual else all)[id]?:error("Unknown prompt")');
edit('obs-plugin/src/prompts.h','inline QString promptText(const std::string &id){','inline QString promptText(const std::string &id,bool both=false){\n if(both){'+Object.entries(prompts).map(([k,v])=>'if(id=='+JSON.stringify(k)+')return QStringLiteral('+JSON.stringify(v)+');').join('')+'throw std::runtime_error("Unknown dual prompt");}\n');
