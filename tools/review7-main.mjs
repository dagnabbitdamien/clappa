import fs from 'node:fs';
const path='android/app/src/main/java/org/clappa/app/MainActivity.kt';
let s=fs.readFileSync(path,'utf8');
s=s.replace('private var clapVisual', 'private var phase by mutableStateOf(BoardPhase.UNPAIRED)\n    private var savedPairing=""\n    private var settings by mutableStateOf(false)\n    private var pendingDelivery=false\n    private var clapVisual');
s=s.replace(/private val link=LocalLink\([\s\S]*?\n    private var claimTimer/,`private val link=LocalLink({msg->check(messages.trySend(msg).isSuccess){"Phone message queue full"}},{err->lifecycleScope.launch {connecting=false;connected=false;phase=BoardPhase.LOST;status=err;busy=false}})
    private var claimTimer`);
s=s.replace('SystemBarStyle.dark(android.graphics.Color.BLACK)','SystemBarStyle.dark(0xff24231f.toInt())').replace('navigationBarStyle=SystemBarStyle.dark(android.graphics.Color.BLACK)','navigationBarStyle=SystemBarStyle.dark(0xff24231f.toInt())');
s=s.replace('window.addFlags', 'window.isNavigationBarContrastEnforced=false;window.addFlags');
s=s.replace('status="Session error: ${e.message}";connectionNotice=status;busy=false','status="Session incomplete: ${e.message}";phase=BoardPhase.INCOMPLETE;busy=false');
s=s.replace('Proof.publicKey().getString("key_id")}}','Proof.publicKey().getString("key_id")};savedPairing=getSharedPreferences("connection",MODE_PRIVATE).getString("pairing","")?:"";if(savedPairing.isNotEmpty())beginPairing(savedPairing)}');
const begin=s.indexOf('    private fun beginPairing');
const end=s.indexOf('    private fun openCamera',begin);
s=s.slice(0,begin)+`    private fun beginPairing(data:String){
        check(session==null){"Stop the current recording before changing connection"}
        prompt="";canFinish=false;pendingSeal=null;claimTimer?.cancel();claimSeconds=0;connected=false;connecting=true;phase=BoardPhase.CONNECTING;status=""
        try{link.connect(data);savedPairing=data}catch(e:Exception){connecting=false;phase=BoardPhase.LOST;status=e.message?:"Pairing data is invalid"}
    }
    private suspend fun receive(m:JSONObject){when(m.getString("type")){
        "paired"->{connecting=false;connected=true;phase=BoardPhase.STANDBY;status="";pairing=false;cameraOpen=false;scanning=false;getSharedPreferences("connection",MODE_PRIVATE).edit().putString("pairing",savedPairing).apply()}
        "session"->{if(session?.sessionId==m.getString("session_id"))return;check(session==null||session!!.ended||session!!.hadFailure){"The previous session is still active"};startElapsed=SystemClock.elapsedRealtime();session=Session(this,m.getString("session_id"),m.getString("recording_id"),m.getJSONArray("descriptors"),link::send);withContext(Dispatchers.IO){session!!.start()};phase=BoardPhase.CONNECTING;status="Waiting for the first recording checkpoint…"}
        "checkpoint"->{withContext(Dispatchers.IO){session?.checkpoint(m.getJSONArray("outputs"))};if(phase==BoardPhase.CONNECTING){phase=BoardPhase.READY;status=""}}
        "seal-request"->{pendingSeal=m;phase=BoardPhase.ENDING;status="Recording closed — confirm the final seal"}
        "sealed"->{phase=BoardPhase.SEALED;status="";session=null;canFinish=false;pendingSeal=null;prompt="";claimTimer?.cancel();claimSeconds=0}
        "recording-stopped"->{phase=BoardPhase.INCOMPLETE;status="Recording stopped without a final seal";session=null;canFinish=false;prompt="";busy=false;claimSeconds=0}
        "error"->{status=m.optString("message","Something went wrong");phase=if(m.optBoolean("recording",session!=null))BoardPhase.INCOMPLETE else if(connected)BoardPhase.STANDBY else BoardPhase.LOST;connecting=false;busy=false;prompt=""}
        "ack"->{if(pendingDelivery&&m.optString("event_type")=="challenge-captured"){pendingDelivery=false;phase=BoardPhase.SENT;status="";claimSeconds=maxOf(0,((session!!.lastSuccessAt+6000-System.currentTimeMillis()+999)/1000).toInt());claimTimer?.cancel();claimTimer=lifecycleScope.launch{while(claimSeconds>0){delay(1000);claimSeconds--};if(phase==BoardPhase.SENT)phase=BoardPhase.READY}}}
    }}
    private fun startRecording(){
        if(!connected)return;phase=BoardPhase.CONNECTING;status="Starting OBS recording…"
        link.send(JSONObject().put("type","start-recording"))
        lifecycleScope.launch{delay(6000);if(phase==BoardPhase.CONNECTING&&session==null){phase=BoardPhase.STANDBY;status="OBS has not started recording. Check the recording settings in OBS."}}
    }
    private fun primary(){when(phase){
        BoardPhase.UNPAIRED->{openCamera(true)}
        BoardPhase.STANDBY,BoardPhase.SEALED->{startRecording()}
        BoardPhase.LOST->{if(session!=null){session=null;prompt=""};if(savedPairing.isEmpty())openCamera(true)else beginPairing(savedPairing)}
        BoardPhase.INCOMPLETE->{if(session!=null){link.send(JSONObject().put("type","stop-incomplete"));phase=BoardPhase.ENDING}else startRecording()}
        BoardPhase.CHALLENGE->{claimMode=false;openCamera()}
        BoardPhase.READY,BoardPhase.SENT->{issue()}
        else->Unit
    }}
    private fun issue(end:Boolean=false){val s=session?:return;if(busy||s.pending!=null||s.ended||s.hadFailure)return
        claimTimer?.cancel();claimSeconds=0;busy=true;clapVisual++;phase=BoardPhase.CLAPPING
        lifecycleScope.launch {try {
            val p=withContext(Dispatchers.IO){s.issue(if(end)"end" else if(!s.startDone)"start" else "verify",SystemClock.elapsedRealtime()-startElapsed)}
            prompt=Prompts.text(p.getString("prompt_id"));status=""
            playCadence(p,s)
            if(phase==BoardPhase.CLAPPING)phase=BoardPhase.CHALLENGE
        }catch(e:Exception){status=e.message?:"Challenge unavailable";phase=if(s.pending==null)BoardPhase.READY else BoardPhase.INCOMPLETE}finally{busy=false}}
    }
    private suspend fun playCadence(p:JSONObject,s:Session)=withContext(Dispatchers.Default){
        val seed=Cadence.seed(s.sessionId,s.key.getString("key_id"),p.getString("challenge_id"))
        val pcm=RiffAudio.render(assets.open("audio/clapper.pcm").use{it.readBytes()},p.getString("cadence"),p.getInt("slot_ms"),Cadence.pitches(seed))
        val a=AudioTrack.Builder().setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()).setAudioFormat(AudioFormat.Builder().setSampleRate(44100).setEncoding(AudioFormat.ENCODING_PCM_16BIT).setChannelMask(AudioFormat.CHANNEL_OUT_MONO).build()).setTransferMode(AudioTrack.MODE_STATIC).setBufferSizeInBytes(pcm.size*2).build()
        try{a.write(pcm,0,pcm.size);a.play();delay(pcm.size*1000L/44100+60)}finally{a.stop();a.release()}
    }
`+s.slice(end);
const ca=s.indexOf('    private fun capturePair');const cb=s.indexOf('    private var claimMode',ca);
s=s.slice(0,ca)+`    private fun capturePair(){if(busy)return;val s=session?:return;busy=true;lifecycleScope.launch {
        try{
            val (a,ta)=take();val selfie=s.pending?.getString("camera")=="front"
            val (b,tb)=take(if(selfie)ImageCapture.FLASH_MODE_SCREEN else ImageCapture.FLASH_MODE_ON)
            phase=BoardPhase.SENDING;pendingDelivery=true
            withContext(Dispatchers.IO){s.accept(a,b,ta,tb)}
            a.delete();b.delete();cameraOpen=false;prompt="";canFinish=s.endDone;status=""
        }catch(e:Exception){pendingDelivery=false;withContext(Dispatchers.IO){runCatching{s.fail("camera-error")}};status="Capture failed: "+(e.message?:"Camera unavailable");phase=BoardPhase.INCOMPLETE;cameraOpen=false;prompt=""}
        finally{flash=Color.Transparent;busy=false}
    }}
`+s.slice(cb);
s=s.replace('status="Claim sent"','status="Additional photo sent!"').replace('status="Claim not accepted: ${e.message}"','status="Additional photo not accepted: ${e.message}"');
const screen=s.indexOf('    @Composable private fun Screen()');const ident=s.indexOf('        identityFile?.let',screen);
s=s.slice(0,screen)+`    @Composable private fun Screen(){
        Box(Modifier.fillMaxSize().background(Slate)){
            Box(Modifier.fillMaxSize().safeDrawingPadding()){
                ClappaBoard(BoardState(phase,connected,prompt,status,claimSeconds,session?.startDone==true,canFinish,session!=null),clapVisual,
                    onPrimary=::primary,onSettings={settings=true},onEnd={issue(true)},
                    onFinish={phase=BoardPhase.ENDING;lifecycleScope.launch{runCatching{withContext(Dispatchers.IO){session?.finish()}}.onFailure{status=it.message?:"Cannot finish";phase=BoardPhase.INCOMPLETE}}},
                    onClaim={claimMode=true;openCamera()})
                if(cameraOpen)CameraScreen()
            }
            if(flash!=Color.Transparent)Box(Modifier.fillMaxSize().background(flash))
        }
        if(settings)AlertDialog(onDismissRequest={settings=false},title={Text("Settings")},text={Column(Modifier.verticalScroll(androidx.compose.foundation.rememberScrollState())){
            Text("Connection",style=MaterialTheme.typography.titleMedium)
            Text(if(connected)"Connected to OBS" else "Not connected",Modifier.padding(vertical=8.dp))
            TextButton(onClick={settings=false;pairing=true},enabled=session==null){Text(if(connected)"Connect to a different OBS" else "Connection options")}
            HorizontalDivider(Modifier.padding(vertical=16.dp))
            Text("Signing identity",style=MaterialTheme.typography.titleMedium)
            androidx.compose.foundation.text.selection.SelectionContainer{Text(identityId.chunked(8).joinToString(" "),Modifier.padding(vertical=8.dp),fontSize=11.sp)}
            Text("Your private signing key stays on this phone. Import a password-protected P-256 PKCS#12 file to use your own portable identity.",fontSize=13.sp)
            TextButton(onClick={link.disconnect();connected=false;session=null;phase=BoardPhase.UNPAIRED;getSharedPreferences("connection",MODE_PRIVATE).edit().remove("pairing").apply();savedPairing="";chooseIdentity.launch(arrayOf("application/x-pkcs12","application/octet-stream"))},enabled=session==null&&!busy){Text("Import identity (.p12)")}
        }},confirmButton={TextButton(onClick={settings=false}){Text("Done")}})
        if(pairing){var text by remember{mutableStateOf("")};AlertDialog(onDismissRequest={pairing=false},title={Text("Connection options")},text={Column{
            Text("Scan a new pairing code from the CLAPPA dock in OBS. Only do this when changing the connection.")
            TextButton(onClick={pairing=false;openCamera(true)}){Text("Scan pairing QR")}
            OutlinedTextField(text,{text=it},label={Text("Paste pairing data")})
        }},confirmButton={TextButton(enabled=text.isNotBlank(),onClick={beginPairing(text)}){Text("Connect")}},dismissButton={TextButton(onClick={pairing=false}){Text("Cancel")}})}
`+s.slice(ident);
const cs=s.indexOf('    @Composable private fun CameraScreen()');
s=s.slice(0,cs)+`    @Composable private fun CameraScreen(){
        val scope=rememberCoroutineScope();val frameClock=checkNotNull(scope.coroutineContext[MonotonicFrameClock])
        val ctx=androidx.compose.ui.platform.LocalContext.current
        val view=remember{PreviewView(ctx)}
        val selfie=!scanning&&!claimMode&&session?.pending?.optString("camera")=="front"
        var cameraReady by remember{mutableStateOf(false)}
        DisposableEffect(view){
            var provider:ProcessCameraProvider?=null;var disposed=false;val oldBrightness=window.attributes.screenBrightness
            val future=ProcessCameraProvider.getInstance(ctx)
            future.addListener({if(!disposed){try{
                val owner=future.get();provider=owner
                val preview=Preview.Builder().build().also{it.surfaceProvider=view.surfaceProvider}
                val imageCapture=ImageCapture.Builder().setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY).build()
                imageCapture.screenFlash=object:ImageCapture.ScreenFlash {
                    override fun apply(expirationTimeMillis:Long,listener:ImageCapture.ScreenFlashListener){
                        flash=when(session?.pending?.optString("flash")){"red"->Color.Red;"green"->Color.Green;else->Color.Blue}
                        window.attributes=window.attributes.apply{screenBrightness=1f}
                        scope.launch{try{awaitFlashFrames(frameClock);delay(60)}finally{listener.onCompleted()}}
                    }
                    override fun clear(){flash=Color.Transparent;window.attributes=window.attributes.apply{screenBrightness=oldBrightness}}
                }
                capture=imageCapture
                val analysis=ImageAnalysis.Builder().setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST).build()
                analysis.setAnalyzer(executor){image->try{if(scanning){val buffer=image.planes[0].buffer;val bytes=ByteArray(buffer.remaining());buffer.get(bytes);val source=com.google.zxing.PlanarYUVLuminanceSource(bytes,image.planes[0].rowStride,image.height,0,0,image.width,image.height,false);val result=com.google.zxing.MultiFormatReader().decode(com.google.zxing.BinaryBitmap(com.google.zxing.common.HybridBinarizer(source)));runOnUiThread{if(scanning){scanning=false;cameraOpen=false;beginPairing(result.text)}}}}catch(_:Exception){}finally{image.close()}}
                owner.unbindAll();val bound=owner.bindToLifecycle(this@MainActivity,if(selfie)CameraSelector.DEFAULT_FRONT_CAMERA else CameraSelector.DEFAULT_BACK_CAMERA,preview,imageCapture,analysis)
                if(!scanning&&!claimMode&&!selfie)check(bound.cameraInfo.hasFlashUnit()){"Rear camera flash is required"}
                cameraReady=true
            }catch(e:Exception){capture=null;cameraOpen=false;status="Camera unavailable: "+e.message;phase=BoardPhase.INCOMPLETE}}},ContextCompat.getMainExecutor(ctx))
            onDispose{disposed=true;provider?.unbindAll();capture=null;flash=Color.Transparent;window.attributes=window.attributes.apply{screenBrightness=oldBrightness}}
        }
        Box(Modifier.fillMaxSize().background(Color.Black)){
            AndroidView(factory={view},modifier=Modifier.fillMaxSize())
            Column(Modifier.fillMaxWidth().background(Slate.copy(alpha=.88f))){
                Canvas(Modifier.fillMaxWidth().height(6.dp)){drawRect(Chalk);val step=32.dp.toPx();var x=-step;while(x<size.width){drawPath(Path().apply{moveTo(x,0f);lineTo(x+step*.5f,0f);lineTo(x+step*.5f+size.height,size.height);lineTo(x+size.height,size.height);close()},Slate);x+=step}}
                Row(Modifier.fillMaxWidth().padding(12.dp),verticalAlignment=Alignment.CenterVertically){Wordmark(Modifier.weight(1f),24);Text(if(scanning)"Pair with OBS" else if(claimMode)"Additional photo" else prompt,Modifier.weight(2f),fontSize=13.sp,color=Chalk)}
            }
            Box(Modifier.align(Alignment.BottomCenter).fillMaxWidth().background(Slate.copy(alpha=.88f)).height(108.dp)){
                TextButton(onClick={cameraOpen=false;claimMode=false},enabled=!busy,modifier=Modifier.align(Alignment.CenterStart).padding(start=16.dp).size(56.dp).semantics{contentDescription="Back"}){Text("‹",fontSize=38.sp,color=Chalk)}
                if(!scanning)Canvas(Modifier.align(Alignment.Center).size(76.dp).semantics{contentDescription=if(busy)"Capturing" else "Capture photo"}.clickable(enabled=!busy&&cameraReady){if(claimMode)captureClaim()else capturePair()}){
                    drawCircle(Chalk.copy(alpha=if(busy).45f else 1f),radius=size.minDimension/2-2.dp.toPx(),style=androidx.compose.ui.graphics.drawscope.Stroke(3.dp.toPx()));drawCircle(Chalk.copy(alpha=if(busy).45f else 1f),radius=size.minDimension/2-9.dp.toPx())
                }
                else Text("Point the camera at the pairing code",Modifier.align(Alignment.Center).padding(start=72.dp,end=20.dp),fontSize=13.sp,color=Chalk)
            }
        }
    }
    override fun onDestroy(){super.onDestroy();link.close();executor.shutdown()}
}
`;
s=s.replace('import androidx.compose.ui.Alignment','import androidx.compose.ui.semantics.contentDescription\nimport androidx.compose.ui.semantics.semantics\nimport androidx.compose.ui.Alignment');
fs.writeFileSync(path,s);
