package org.clappa.app

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.BitmapFactory
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.os.Bundle
import android.os.SystemClock
import androidx.activity.enableEdgeToEdge
import androidx.activity.SystemBarStyle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.*
import org.json.JSONObject
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.Executors
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.math.*

open class MainActivity:ComponentActivity() {

    private var dualEnabled by mutableStateOf(false)
    private var dualAvailable by mutableStateOf(false)
    private val dualCapture=registerForActivityResult(ActivityResultContracts.StartActivityForResult()){result->
        val s=session
        if(s?.pending==null){runCatching{val name=JSONObject(result.data?.getStringExtra("capture")?:"{}").optString("folder");if(name.matches(Regex("dual-[0-9a-f]{32}")))File(cacheDir,name).deleteRecursively()};busy=false;return@registerForActivityResult}
        captureJob=lifecycleScope.launch{try{
            if(result.resultCode==RESULT_OK){phase=BoardPhase.SENDING;pendingDelivery=true;withContext(Dispatchers.IO){s.acceptDual(JSONObject(checkNotNull(result.data?.getStringExtra("capture"))))};prompt="";status=""}
            else{withContext(Dispatchers.IO){s.fail(result.data?.getStringExtra("reason")?:"cancelled")};phase=BoardPhase.READY;status="Two-camera attempt not completed. You can continue.";prompt=""}
        }catch(e:Exception){pendingDelivery=false;withContext(Dispatchers.IO){runCatching{s.fail("camera-error")}};phase=BoardPhase.READY;status="Two-camera capture was not accepted. You can continue.";prompt=""}finally{busy=false;canFinish=s.endDone}}
    }
    private var phase by mutableStateOf(BoardPhase.UNPAIRED)
    private var obsRecording by mutableStateOf(false)
    private var savedPairing=""
    private var settings by mutableStateOf(false)
    private var pendingDelivery=false
    private var reconnectAttempts=0
    private var clapVisual by mutableIntStateOf(0)
    private var status by mutableStateOf("")
    private var connected by mutableStateOf(false)
    private var connecting by mutableStateOf(false)
    private var busy by mutableStateOf(false)
    private var pairing by mutableStateOf(false)
    private var identityFile by mutableStateOf<android.net.Uri?>(null)
    private var identityId by mutableStateOf("")
    private var exportIdentityDialog by mutableStateOf(false)
    private var createIdentityDialog by mutableStateOf(false)
    private var encryptedExport:ByteArray?=null
    private val savePrivateIdentity=registerForActivityResult(ActivityResultContracts.CreateDocument("application/x-pkcs12")){uri->val bytes=encryptedExport;encryptedExport=null;if(bytes!=null)lifecycleScope.launch{try{if(uri!=null){withContext(Dispatchers.IO){contentResolver.openOutputStream(uri)!!.use{it.write(bytes)}};connectionNotice="Private backup saved. Keep the file and password secret; together they let another device sign as you."}}catch(e:Exception){connectionNotice="Backup could not be saved. Export it again to another folder."}finally{bytes.fill(0)}}}
    private val chooseIdentity=registerForActivityResult(ActivityResultContracts.OpenDocument()){uri->identityFile=uri}
    private var connectionNotice by mutableStateOf<String?>(null)
    private var cameraOpen by mutableStateOf(false)
    private var scanning by mutableStateOf(false)
    private var prompt by mutableStateOf("")
    private var flash by mutableStateOf(Color.Transparent)
    private var claimSeconds by mutableIntStateOf(0)
    private var canFinish by mutableStateOf(false)
    private var pendingSeal by mutableStateOf<JSONObject?>(null)
    private var session by mutableStateOf<Session?>(null)
    private var capture:ImageCapture?=null
    private var screenFlashPrepared=false
    private var startElapsed=0L
    private var clock by mutableStateOf("")
    private val executor=Executors.newSingleThreadExecutor()
    private val mint=Color(0xffa9cfbc)
    private val messages=kotlinx.coroutines.channels.Channel<JSONObject>(64)
    private val link=LocalLink({msg->check(messages.trySend(msg).isSuccess){"Phone message queue full"}},{err->lifecycleScope.launch {connecting=false;connected=false;phase=BoardPhase.LOST;status=err;busy=false;if(session==null&&savedPairing.isNotEmpty()&&!err.contains("pairing code has changed")&&reconnectAttempts<3){reconnectAttempts++;delay(2000L*reconnectAttempts);if(!connected&&!connecting&&session==null)beginPairing(savedPairing)}}})
    private var claimTimer:Job?=null
    private var responseTimer:Job?=null
    private var issueJob:Job?=null
    private var captureJob:Job?=null
    private val savePublicIdentity=registerForActivityResult(ActivityResultContracts.CreateDocument("application/json")){uri->if(uri!=null)lifecycleScope.launch{try{withContext(Dispatchers.IO){contentResolver.openOutputStream(uri)!!.use{it.write(Proof.canonical(Proof.publicKey()).toByteArray())}};connectionNotice="Public identity saved. It contains no private key and is safe to share."}catch(e:Exception){connectionNotice="Could not save public identity. Try another folder."}}}
    private var responseSeconds by mutableIntStateOf(0)
    private var responseDeadline by mutableLongStateOf(0L)
    private var claimDeadline by mutableLongStateOf(0L)
    private val chatRequestGate=ChatRequestGate()
    private var chatRequest by mutableStateOf<ChatChallengeRequest?>(null)
    private fun chatReady()=connected&&obsRecording&&session!=null&&!canFinish&&!busy&&!cameraOpen&&!settings&&!pairing&&connectionNotice==null&&phase in listOf(BoardPhase.READY,BoardPhase.SENT)
    protected fun receiveChatInvitation(m:JSONObject){
        if(m.optString("source")=="twitch"&&chatRequest==null){
            val request=chatRequestGate.accept(m.optString("request_id"),m.optString("session_id"),session?.sessionId,m.optInt("viewers"),m.optLong("expires_at"),System.currentTimeMillis(),SystemClock.elapsedRealtime(),chatReady())
            if(request!=null){chatRequest=request;runCatching{getSystemService(android.os.Vibrator::class.java)?.vibrate(android.os.VibrationEffect.createOneShot(160,android.os.VibrationEffect.DEFAULT_AMPLITUDE))}}
        }
    }
    private val permission=registerForActivityResult(ActivityResultContracts.RequestPermission()){ok->if(ok){refreshDualCapabilities();openCamera(scanning)} else status="Camera permission is required"}
    override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState);Proof.initialize(this);enableEdgeToEdge(statusBarStyle=SystemBarStyle.dark(0xff24231f.toInt()),navigationBarStyle=SystemBarStyle.dark(0xff24231f.toInt()));window.isNavigationBarContrastEnforced=false;window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        lifecycleScope.launch {for(msg in messages){try{receive(msg)}catch(e:Exception){status="Session incomplete: ${e.message}";phase=BoardPhase.INCOMPLETE;busy=false}}}
        lifecycleScope.launch {identityId=withContext(Dispatchers.IO){Proof.ensureKey();Proof.publicKey().getString("key_id")};savedPairing=getSharedPreferences("connection",MODE_PRIVATE).getString("pairing","")?:"";if(savedPairing.isNotEmpty())beginPairing(savedPairing)}
        dualEnabled=getSharedPreferences("capture",MODE_PRIVATE).getBoolean("dual",false)
        refreshDualCapabilities()
        setContent {MaterialTheme(colorScheme=darkColorScheme(primary=Color(0xffeeeade),onPrimary=Color(0xff24231f))){Screen()}}
    }
    private fun refreshDualCapabilities(){val cameras=ProcessCameraProvider.getInstance(this);cameras.addListener({dualAvailable=runCatching{cameras.get().availableConcurrentCameraInfos.any{it.any{c->c.lensFacing==CameraSelector.LENS_FACING_FRONT}&&it.any{c->c.lensFacing==CameraSelector.LENS_FACING_BACK&&c.hasFlashUnit()}}}.getOrDefault(false);if(session==null&&!obsRecording&&!getSharedPreferences("capture",MODE_PRIVATE).contains("dual"))dualEnabled=dualAvailable},ContextCompat.getMainExecutor(this))}
    protected fun beginPairing(data:String){
        check(session==null){"Stop the current recording before changing connection"}
        prompt="";canFinish=false;pendingSeal=null;hideClaimOffer();connected=false;connecting=true;phase=BoardPhase.CONNECTING;status=""
        try{link.connect(data);savedPairing=data}catch(e:Exception){connecting=false;phase=BoardPhase.LOST;status="That pairing code is incomplete. Scan the current code or paste all of its data";pairing=false}
    }
    private suspend fun receive(m:JSONObject){when(m.getString("type")){
        "chat-request"->receiveChatInvitation(m)
        "paired"->{reconnectAttempts=0;connecting=false;connected=true;obsRecording=m.optBoolean("recording",false);phase=if(obsRecording)BoardPhase.CONNECTING else BoardPhase.STANDBY;status="";pairing=false;cameraOpen=false;scanning=false;getSharedPreferences("connection",MODE_PRIVATE).edit().putString("pairing",savedPairing).apply()}
        "session"->{obsRecording=true;if(session?.sessionId==m.getString("session_id"))return;check(session==null||session!!.ended||session!!.hadFailure){"The previous session is still active"};startElapsed=SystemClock.elapsedRealtime();session=Session(this,m.getString("session_id"),m.getString("recording_id"),m.getJSONArray("descriptors"),link::send,dualEnabled);withContext(Dispatchers.IO){session!!.start()};phase=BoardPhase.CONNECTING;status="Waiting for the first recording checkpoint…"}
        "checkpoint"->{withContext(Dispatchers.IO){session?.checkpoint(m.getJSONArray("outputs"))};if(phase==BoardPhase.CONNECTING){phase=BoardPhase.READY;status=""}}
        "seal-request"->{obsRecording=false;phase=BoardPhase.ENDING;status="Signing the closed recording…";withContext(Dispatchers.IO){checkNotNull(session).seal(m)}}
        "recording-closed"->{obsRecording=false;pendingDelivery=false;issueJob?.cancelAndJoin();captureJob?.cancelAndJoin();responseTimer?.cancel();claimTimer?.cancel();cameraOpen=false;claimMode=false;claimSeconds=0;prompt="";phase=BoardPhase.ENDING;status="Finishing the signed transcript…";withContext(Dispatchers.IO){session?.let{if(!it.ended){it.fail("cancelled");it.finish(alreadyClosed=true)}}}}
        "sealed"->{obsRecording=false;phase=BoardPhase.SEALED;status="";session=null;canFinish=false;pendingSeal=null;prompt="";hideClaimOffer()}
        "recording-stopped"->{obsRecording=false;phase=BoardPhase.INCOMPLETE;status="Recording stopped without a final seal";session=null;canFinish=false;prompt="";busy=false;claimSeconds=0}
        "error"->{hideClaimOffer();obsRecording=m.optBoolean("recording",obsRecording);if(!status.startsWith("Capture failed:"))status=m.optString("message","Something went wrong");phase=if(obsRecording)BoardPhase.INCOMPLETE else if(connected)BoardPhase.STANDBY else BoardPhase.LOST;connecting=false;busy=false;prompt=""}
        "ack"->{
            val current=session
            val sequence=m.getInt("seq")
            when(m.optString("event_type")){
                "challenge-armed"->current?.acknowledgeArm(sequence)
                "challenge-captured"->if(pendingDelivery&&current?.acknowledgeCapture(sequence)==true){
                    pendingDelivery=false;phase=BoardPhase.SENT;status="";showClaimOffer(current)
                }
                "claim"->if(current?.acknowledgeClaim(sequence)==true){
                    hideClaimOffer()
                    if(phase==BoardPhase.SENDING){phase=BoardPhase.READY;status="Additional photo received by OBS!"}
                }
            }
        }
    }}
    private fun startRecording(){
        if(!connected)return;if(dualEnabled&&!dualAvailable){connectionNotice="Two-camera mode is selected but is unavailable here. Turn it off in Settings to use single-camera challenges.";return};phase=BoardPhase.CONNECTING;status="Starting OBS recording…"
        link.send(JSONObject().put("type","start-recording"))
        lifecycleScope.launch{delay(6000);if(phase==BoardPhase.CONNECTING&&session==null){phase=BoardPhase.STANDBY;status="OBS has not started recording. Check the recording settings in OBS."}}
    }
    private fun primary(){when(phase){
        BoardPhase.UNPAIRED->{openCamera(true)}
        BoardPhase.STANDBY,BoardPhase.SEALED->{startRecording()}
        BoardPhase.LOST->{if(session!=null){session=null;prompt=""};if(savedPairing.isEmpty()||status.contains("pairing code has changed"))openCamera(true)else beginPairing(savedPairing)}
        BoardPhase.INCOMPLETE->{if(obsRecording){link.send(JSONObject().put("type","stop-incomplete"));phase=BoardPhase.ENDING}else startRecording()}
        BoardPhase.CHALLENGE->{claimMode=false;openCamera()}
        BoardPhase.READY,BoardPhase.SENT->{issue()}
        else->Unit
    }}
    private fun issue(end:Boolean=false){val s=session?:return;if(busy||s.pending!=null||s.ended)return
        hideClaimOffer();busy=true;phase=BoardPhase.CLAPPING;status="Locking this challenge in OBS…"
        issueJob=lifecycleScope.launch {try {
            val round=withContext(Dispatchers.IO){s.arm(if(end)"end" else if(!s.startDone)"start" else "verify",SystemClock.elapsedRealtime()-startElapsed)}
            val target=Quicknet.roundTime(round)
            while(!s.armAcknowledged){check(System.currentTimeMillis()<target-200){"OBS did not lock this challenge before the beacon"};delay(50)}
            while(System.currentTimeMillis()<target+100){status="Waiting for fresh timing beacon · "+((target-System.currentTimeMillis()+999).coerceAtLeast(0)/1000)+"s";delay(100)}
            status="Checking the freshness signature…"
            val pulse=withContext(Dispatchers.IO){Quicknet.fetch(round)}
            val p=withContext(Dispatchers.IO){s.issue(pulse)};clapVisual++
            prompt=Prompts.text(p.getString("prompt_id"),s.dualView);status=""
            responseTimer?.cancel();responseSeconds=10;responseDeadline=SystemClock.elapsedRealtime()+s.remainingMillis()
            responseTimer=lifecycleScope.launch {
                while(s.pending!=null){
                    responseSeconds=((s.remainingMillis()+999)/1000).toInt()
                    if(responseSeconds==0&&!busy){
                        withContext(Dispatchers.IO){s.fail("timeout")};cameraOpen=false;prompt="";phase=BoardPhase.READY;canFinish=s.endDone
                        status="Time ran out. This attempt is recorded; you can continue.";break
                    }
                    delay(100)
                }
                responseSeconds=0
            }
            phase=BoardPhase.CHALLENGE
            lifecycleScope.launch {runCatching{playCadence(p,s)}.onFailure{status="Clack playback unavailable"}}
            if(phase==BoardPhase.CLAPPING)phase=BoardPhase.CHALLENGE
        }catch(e:Exception){if(e is CancellationException && e !is TimeoutCancellationException)throw e;android.util.Log.e("ClappaFreshness","Freshness challenge unavailable",e);withContext(Dispatchers.IO){runCatching{s.fail("timeout")}};status="Challenge not completed. You can continue. "+(e.message?:"");phase=BoardPhase.READY;canFinish=s.endDone}finally{busy=false}}
    }
    private suspend fun playCadence(p:JSONObject,s:Session)=withContext(Dispatchers.Default){
        val seed=Cadence.seed(s.sessionId,s.key.getString("key_id"),p.getString("challenge_id"),s.lastIssuedAt)
        val pcm=RiffAudio.render(assets.open("audio/clapper.pcm").use{it.readBytes()},p.getString("cadence"),p.getInt("slot_ms"),p.getJSONArray("pitches").let{a->(0 until a.length()).map{a.getInt(it)}})
        val a=AudioTrack.Builder().setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()).setAudioFormat(AudioFormat.Builder().setSampleRate(44100).setEncoding(AudioFormat.ENCODING_PCM_16BIT).setChannelMask(AudioFormat.CHANNEL_OUT_MONO).build()).setTransferMode(AudioTrack.MODE_STATIC).setBufferSizeInBytes(pcm.size*2).build()
        try{a.write(pcm,0,pcm.size);a.play();delay(pcm.size*1000L/44100+60)}finally{a.stop();a.release()}
    }
    private fun openCamera(scan:Boolean=false){scanning=scan
        if(ContextCompat.checkSelfPermission(this,Manifest.permission.CAMERA)!=PackageManager.PERMISSION_GRANTED){permission.launch(Manifest.permission.CAMERA);return}
        val s=session
        if(!scan&&!claimMode&&s?.dualView==true){busy=true;dualCapture.launch(android.content.Intent(this,DualCaptureActivity::class.java).putExtra("deadline",SystemClock.elapsedRealtime()+s.remainingMillis()).putExtra("prompt",prompt).putExtra("flash",s.pending!!.getString("flash")))}else cameraOpen=true
    }
    private data class PhotoResult(val file:File,val wall:Long,val monotonic:Long)
    private suspend fun take(flashMode:Int=ImageCapture.FLASH_MODE_OFF):PhotoResult = suspendCancellableCoroutine { cont->
        val c=capture;if(c==null){cont.resumeWithException(IllegalStateException("Camera is not ready"));return@suspendCancellableCoroutine}
        c.flashMode=flashMode;val f=File(cacheDir,Proof.id()+".jpg");c.takePicture(ImageCapture.OutputFileOptions.Builder(f).build(),executor,object:ImageCapture.OnImageSavedCallback{
            override fun onImageSaved(r:ImageCapture.OutputFileResults){if(cont.isActive)cont.resume(PhotoResult(f,System.currentTimeMillis(),SystemClock.elapsedRealtime()))else f.delete()}
            override fun onError(e:ImageCaptureException){if(cont.isActive)cont.resumeWithException(e)}
        })
    }
    private fun capturePair(){if(busy)return;val s=session?:return;busy=true;captureJob=lifecycleScope.launch {
        try{
            val selfie=s.pending?.getString("camera")=="front";screenFlashPrepared=false
            val (a,ta,ma)=withTimeout(s.remainingMillis().coerceAtLeast(1)){take()}
            val (b,tb,mb)=withTimeout(s.pending!!.getLong("pair_window_ms")){take(if(selfie)ImageCapture.FLASH_MODE_SCREEN else ImageCapture.FLASH_MODE_ON)}
            check(!selfie||screenFlashPrepared){"The screen flash was not ready in time"}
            android.util.Log.d("CLAPPA","Photo pair completed: camera="+(if(selfie)"front" else "rear")+", gapMs="+(tb-ta))
            phase=BoardPhase.SENDING;pendingDelivery=true
            withContext(Dispatchers.IO){s.accept(a,b,ta,tb,ma,mb)}
            a.delete();b.delete();cameraOpen=false;prompt="";canFinish=s.endDone;status=""
        }catch(e:Exception){if(e is CancellationException && e !is TimeoutCancellationException)throw e;pendingDelivery=false;withContext(Dispatchers.IO){runCatching{s.fail(if(e is TimeoutCancellationException||s.remainingMillis()==0L)"timeout" else "camera-error")}};status="Photo not completed. You can continue. "+(e.message?:"Camera unavailable");phase=BoardPhase.READY;canFinish=s.endDone;cameraOpen=false;prompt=""}
        finally{flash=Color.Transparent;busy=false}
    }}
    private var claimMode by mutableStateOf(false)
    private fun hideClaimOffer(){claimTimer?.cancel();claimTimer=null;claimSeconds=0;claimDeadline=0}
    private fun showClaimOffer(s:Session){
        hideClaimOffer()
        if(session!==s||!s.canClaim())return
        claimDeadline=SystemClock.elapsedRealtime()+(s.lastSuccessAt+30000-System.currentTimeMillis()).coerceAtLeast(0)
        claimSeconds=((claimDeadline-SystemClock.elapsedRealtime()+999).coerceAtLeast(0)/1000).toInt()
        claimTimer=lifecycleScope.launch{
            while(session===s&&s.canClaim()&&claimSeconds>0){
                delay(100)
                claimSeconds=((claimDeadline-SystemClock.elapsedRealtime()+999).coerceAtLeast(0)/1000).toInt()
            }
            claimSeconds=0;claimDeadline=0
            if(phase==BoardPhase.SENT)phase=BoardPhase.READY
        }
    }
    private fun beginClaim(){
        if(busy||phase!=BoardPhase.SENT||claimSeconds<=0||session?.canClaim()!=true)return
        claimMode=true;openCamera()
    }
    private fun captureClaim(){
        val s=session?:return
        if(busy)return
        if(!s.canClaim()){hideClaimOffer();claimMode=false;cameraOpen=false;phase=BoardPhase.READY;status="The additional-photo offer has ended.";return}
        busy=true;hideClaimOffer();phase=BoardPhase.SENDING;status="Sending your additional photo…"
        captureJob=lifecycleScope.launch{
            var photo:File?=null
            try{
                val result=withTimeout((s.lastSuccessAt+30000-System.currentTimeMillis()).coerceAtLeast(1)){take()};photo=result.file
                withContext(Dispatchers.IO){s.claim(result.file,result.wall)}
                // Only the matching OBS receipt announces success. Never blindly resend a
                // committed claim: an interrupted connection may have lost only its receipt.
            }catch(e:Exception){
                if(e is CancellationException && e !is TimeoutCancellationException)throw e
                if(connected&&session===s&&s.canClaim()){
                    phase=BoardPhase.SENT;status="Additional photo was not sent: "+(e.message?:"Camera unavailable")
                    showClaimOffer(s);connectionNotice=status
                }else if(phase !in listOf(BoardPhase.LOST,BoardPhase.INCOMPLETE,BoardPhase.ENDING,BoardPhase.SEALED)){
                    phase=BoardPhase.READY;status="Additional photo could not be confirmed: "+(e.message?:"Connection unavailable")
                }
            }finally{photo?.delete();busy=false;claimMode=false;cameraOpen=false}
        }
    }
    @Composable private fun Screen(){
        val invitation=chatRequest
        LaunchedEffect(invitation?.id,phase,connected,session?.sessionId){
            if(invitation!=null){
                if(!connected||invitation.sessionId!=session?.sessionId||phase !in listOf(BoardPhase.READY,BoardPhase.SENT))chatRequest=null
                else{delay((invitation.deadline-SystemClock.elapsedRealtime()).coerceAtLeast(0));if(chatRequest?.id==invitation.id)chatRequest=null}
            }
        }
        androidx.activity.compose.BackHandler(enabled=cameraOpen){if(!busy){cameraOpen=false;claimMode=false;scanning=false}}
        Box(Modifier.fillMaxSize().background(Slate)){
            Box(Modifier.fillMaxSize().safeDrawingPadding()){
                ClappaBoard(BoardState(phase,connected,prompt,status,claimSeconds,session?.startDone==true,canFinish,obsRecording,status.contains("pairing code has changed"),responseSeconds,responseDeadline,claimDeadline),clapVisual,
                    onPrimary=::primary,onSettings={settings=true},onEnd={issue(true)},
                    onFinish={phase=BoardPhase.ENDING;lifecycleScope.launch{runCatching{withContext(Dispatchers.IO){session?.finish()}}.onFailure{status=it.message?:"Cannot finish";phase=BoardPhase.INCOMPLETE}}},
                    onClaim=::beginClaim)
                if(cameraOpen)CameraScreen()
            }
            if(flash!=Color.Transparent)Box(Modifier.fillMaxSize().background(flash))
        }
        if(invitation!=null&&chatReady())ChatChallengeDialog(invitation.viewers,onDismiss={chatRequest=null},onAccept={
            chatRequest=null
            if(chatReady()&&session?.sessionId==invitation.sessionId&&SystemClock.elapsedRealtime()<invitation.deadline)issue()
        })
        if(settings)AlertDialog(onDismissRequest={settings=false},title={Text("Settings")},text={Column(Modifier.verticalScroll(androidx.compose.foundation.rememberScrollState())){
            TextButton(onClick={settings=false;startActivity(android.content.Intent(this@MainActivity,TwitchSignInActivity::class.java))},enabled=session==null&&!obsRecording&&!busy){Text("Twitch identity · sign in or manage")}
            TextButton(onClick={settings=false;startActivity(android.content.Intent(this@MainActivity,ViewerActivity::class.java))},enabled=session==null&&!obsRecording&&!busy){Text("Viewer mode · scan a stream")}
            Text("Connection",style=MaterialTheme.typography.titleMedium)
            Text(if(connected)"Connected to OBS" else "Not connected",Modifier.padding(vertical=8.dp))
            TextButton(onClick={settings=false;pairing=true},enabled=session==null&&!obsRecording){Text(if(connected)"Connect to a different OBS" else "Connection options")}
            HorizontalDivider(Modifier.padding(vertical=16.dp))
            Text("Camera mode",style=MaterialTheme.typography.titleMedium)
            Row(verticalAlignment=Alignment.CenterVertically){Switch(checked=dualEnabled,onCheckedChange={dualEnabled=it;getSharedPreferences("capture",MODE_PRIVATE).edit().putBoolean("dual",it).apply()},enabled=(dualAvailable||dualEnabled)&&session==null&&!obsRecording&&!busy);Text("Use both cameras",Modifier.padding(start=8.dp))}
            Text(if(dualAvailable)"Capture yourself and the view behind your phone. Hold your pose for both flashes." else "This phone uses one camera at a time.",fontSize=13.sp)
            HorizontalDivider(Modifier.padding(vertical=12.dp))
            Text("Your CLAPPA identity",style=MaterialTheme.typography.titleMedium)
            Text("This phone signs your recordings with a private key. Its matching public identity lets viewers recognise that future proofs came from the same signer. No CLAPPA account is needed.",fontSize=13.sp)
            Text("Public identity code · safe to share",Modifier.padding(top=12.dp),fontSize=13.sp)
            androidx.compose.foundation.text.selection.SelectionContainer{Text(identityId.chunked(8).joinToString(" "),Modifier.padding(vertical=8.dp),fontSize=11.sp)}
            Text("Put this public code in your Twitch About panel or another profile you control. Viewers can compare it with the identity in your proofs. Publishing it links your profile to the code; CLAPPA does not automatically verify account ownership.",fontSize=13.sp)
            TextButton(onClick={val clipboard=getSystemService(CLIPBOARD_SERVICE) as android.content.ClipboardManager;clipboard.setPrimaryClip(android.content.ClipData.newPlainText("CLAPPA public identity","CLAPPA public identity: "+identityId));connectionNotice="Public identity copied. Paste it into your profile."}){Text("Copy code for my profile")}
            TextButton(onClick={savePublicIdentity.launch("clappa-public-identity.json")}){Text("Save public identity file")}
            Text("The file contains your P-256 public key and its SHA-256 identity code. OBS and the verifier can import it. It contains no private signing key.",fontSize=13.sp)
            HorizontalDivider(Modifier.padding(vertical=12.dp))
            Text("Private signing key · keep secret",style=MaterialTheme.typography.titleSmall)
            Text("Your private key signs your proofs. A password-protected backup lets you use the same identity on another device. Keep private backups secret.",fontSize=13.sp)
            TextButton(onClick={if(Proof.canExportIdentity())exportIdentityDialog=true else connectionNotice="This signing key is secured to this device and cannot be exported. If you have its original backup, import it to enable backup export. Otherwise, create a new portable identity; this changes your public code."},enabled=session==null&&!obsRecording&&!busy){Text("Export private backup")}
            TextButton(onClick={createIdentityDialog=true},enabled=session==null&&!obsRecording&&!busy){Text("Create a new portable identity")}
            Text("Already have a portable identity? Import a password-protected .p12 or .pfx file containing a P-256 private key and its certificate (PKCS#12 format). Keep that original file and its password to use the same identity on another phone. Importing replaces the identity used for future recordings and requires pairing again.",fontSize=13.sp)
            TextButton(onClick={link.disconnect();connected=false;session=null;phase=BoardPhase.UNPAIRED;getSharedPreferences("connection",MODE_PRIVATE).edit().remove("pairing").apply();savedPairing="";chooseIdentity.launch(arrayOf("application/x-pkcs12","application/octet-stream"))},enabled=session==null&&!obsRecording&&!busy){Text("Import an existing private key")}
        }},confirmButton={TextButton(onClick={settings=false}){Text("Done")}})
        if(createIdentityDialog)AlertDialog(onDismissRequest={if(!busy)createIdentityDialog=false},title={Text("Create a new portable identity?")},text={Text("This replaces the identity for future recordings. Your public code changes, so update any profile where you published it and pair with OBS again. Previous recordings keep their original signatures. You can then export a private backup.")},confirmButton={TextButton(enabled=!busy,onClick={busy=true;lifecycleScope.launch{try{val newId=withContext(Dispatchers.IO){Proof.createPortableIdentity()};identityId=newId;link.disconnect();connected=false;session=null;savedPairing="";getSharedPreferences("connection",MODE_PRIVATE).edit().remove("pairing").apply();phase=BoardPhase.UNPAIRED;createIdentityDialog=false;exportIdentityDialog=true}catch(e:Exception){connectionNotice="Could not create the new identity. Your prior recordings are unchanged."}finally{busy=false}}}){Text("Create new identity")}},dismissButton={TextButton(enabled=!busy,onClick={createIdentityDialog=false}){Text("Keep current identity")}})
        if(exportIdentityDialog){var password by remember{mutableStateOf("")};var repeat by remember{mutableStateOf("")};AlertDialog(onDismissRequest={if(!busy)exportIdentityDialog=false},title={Text("Export private backup")},text={Column(Modifier.verticalScroll(androidx.compose.foundation.rememberScrollState())){Text("Choose a password of at least 12 characters. Save the .p12 file somewhere private and keep the password separately. CLAPPA cannot recover a forgotten password.");OutlinedTextField(password,{password=it},label={Text("Backup password")},singleLine=true,visualTransformation=androidx.compose.ui.text.input.PasswordVisualTransformation());OutlinedTextField(repeat,{repeat=it},label={Text("Repeat password")},singleLine=true,visualTransformation=androidx.compose.ui.text.input.PasswordVisualTransformation())}},confirmButton={TextButton(enabled=!busy&&password.length>=12&&password==repeat,onClick={busy=true;val secret=password.toCharArray();password="";repeat="";lifecycleScope.launch{try{encryptedExport=withContext(Dispatchers.IO){Proof.exportIdentity(secret)};exportIdentityDialog=false;savePrivateIdentity.launch("clappa-private-identity.p12")}catch(e:Exception){connectionNotice="Could not export this private identity."}finally{secret.fill('\u0000');busy=false}}}){Text("Choose where to save")}},dismissButton={TextButton(enabled=!busy,onClick={exportIdentityDialog=false}){Text("Cancel")}})}
        if(pairing){var text by remember{mutableStateOf("")};AlertDialog(onDismissRequest={pairing=false},title={Text("Connection options")},text={Column{
            Text("Scan a new pairing code from the CLAPPA dock in OBS. Only do this when changing the connection.")
            TextButton(onClick={pairing=false;openCamera(true)}){Text("Scan pairing QR")}
            OutlinedTextField(text,{text=it},label={Text("Paste pairing data")})
        }},confirmButton={TextButton(enabled=text.isNotBlank(),onClick={beginPairing(text)}){Text("Connect")}},dismissButton={TextButton(onClick={pairing=false}){Text("Cancel")}})}
        identityFile?.let { uri ->
            var password by remember(uri){mutableStateOf("")}
            AlertDialog(onDismissRequest={if(!busy)identityFile=null},title={Text("Import your private identity")},text={Column{
                Text("Enter your backup password. This identity will sign future recordings. Existing recordings keep their original signatures.")
                OutlinedTextField(password,{password=it},label={Text("File password")},visualTransformation=androidx.compose.ui.text.input.PasswordVisualTransformation(),singleLine=true)
            }},confirmButton={TextButton(enabled=!busy&&!connected&&!connecting&&session==null,onClick={busy=true;lifecycleScope.launch{
                val secret=password.toCharArray();password=""
                try{identityId=withContext(Dispatchers.IO){val data=contentResolver.openInputStream(uri)!!.use{input->val out=java.io.ByteArrayOutputStream();val buffer=ByteArray(4096);while(true){val n=input.read(buffer);if(n<0)break;check(out.size()+n<=1048576){"Identity file exceeds 1 MB"};out.write(buffer,0,n)};out.toByteArray()};try{Proof.importIdentity(data,secret)}finally{data.fill(0)}};status="Signing identity imported — pair with OBS!";identityFile=null}
                catch(e:Exception){connectionNotice="Identity import failed. Check the file password and use a P-256 PKCS#12 key with its certificate."}
                finally{secret.fill('\u0000');busy=false}
            }}){Text("Import")}},dismissButton={TextButton(onClick={identityFile=null},enabled=!busy){Text("Cancel")}})
        }
        connectionNotice?.let { notice -> AlertDialog(onDismissRequest={connectionNotice=null},title={Text("CLAPPA")},text={Text(notice)},confirmButton={TextButton(onClick={connectionNotice=null}){Text("OK")}}) }

    }
    @Composable private fun CameraScreen(){
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
                        screenFlashPrepared=false
                        scope.launch{try{awaitFlashFrames(frameClock);delay(60);screenFlashPrepared=System.currentTimeMillis()<expirationTimeMillis}catch(_:Exception){screenFlashPrepared=false}finally{listener.onCompleted()}}
                    }
                    override fun clear(){flash=Color.Transparent;window.attributes=window.attributes.apply{screenBrightness=oldBrightness}}
                }
                capture=imageCapture
                val analysis=ImageAnalysis.Builder().setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST).build()
                analysis.setAnalyzer(executor){image->try{if(scanning){val buffer=image.planes[0].buffer;val bytes=ByteArray(buffer.remaining());buffer.get(bytes);val source=com.google.zxing.PlanarYUVLuminanceSource(bytes,image.planes[0].rowStride,image.height,0,0,image.width,image.height,false);val result=com.google.zxing.MultiFormatReader().decode(com.google.zxing.BinaryBitmap(com.google.zxing.common.HybridBinarizer(source)));runOnUiThread{if(scanning){scanning=false;cameraOpen=false;beginPairing(result.text)}}}}catch(_:Exception){}finally{image.close()}}
                owner.unbindAll();val bound=owner.bindToLifecycle(this@MainActivity,if(selfie)CameraSelector.DEFAULT_FRONT_CAMERA else CameraSelector.DEFAULT_BACK_CAMERA,preview,imageCapture,analysis)
                imageCapture.targetRotation=view.display?.rotation?:android.view.Surface.ROTATION_0
                if(!scanning&&!claimMode&&!selfie)check(bound.cameraInfo.hasFlashUnit()){"Rear camera flash is required"}
                cameraReady=true
            }catch(e:Exception){capture=null;cameraOpen=false;status="Camera unavailable: "+e.message;if(scanning||claimMode){phase=if(obsRecording)BoardPhase.READY else if(connected)BoardPhase.STANDBY else BoardPhase.LOST}else{lifecycleScope.launch{withContext(Dispatchers.IO){session?.fail("camera-error")};phase=BoardPhase.READY;canFinish=session?.endDone==true;prompt=""}}}}},ContextCompat.getMainExecutor(ctx))
            onDispose{disposed=true;provider?.unbindAll();capture=null;flash=Color.Transparent;window.attributes=window.attributes.apply{screenBrightness=oldBrightness}}
        }
        Box(Modifier.fillMaxSize().background(Color.Black)){
            AndroidView(factory={view},modifier=Modifier.fillMaxSize())
            Column(Modifier.fillMaxWidth().background(Slate.copy(alpha=.88f))){
                Canvas(Modifier.fillMaxWidth().height(6.dp)){drawRect(Chalk);val step=32.dp.toPx();var x=-step;while(x<size.width){drawPath(Path().apply{moveTo(x,0f);lineTo(x+step*.5f,0f);lineTo(x+step*.5f+size.height,size.height);lineTo(x+size.height,size.height);close()},Slate);x+=step}}
                Row(Modifier.fillMaxWidth().padding(12.dp),verticalAlignment=Alignment.CenterVertically){Wordmark(Modifier.weight(1f),24);Text(if(scanning)"Pair with OBS" else if(claimMode)"Additional photo · ${claimSeconds}s" else prompt+(if(responseSeconds>0)"  ·  ${responseSeconds}s" else ""),Modifier.weight(2f),fontSize=13.sp,color=Chalk)}
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
