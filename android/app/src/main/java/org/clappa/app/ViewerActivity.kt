package org.clappa.app

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.*
import java.util.concurrent.Executors

@Composable internal fun ClappaScreenTheme(content:@Composable ()->Unit){
 MaterialTheme(colorScheme=darkColorScheme(primary=MenuOrange,onPrimary=Slate,secondary=MenuOrange,surface=Slate)){
  Surface(Modifier.fillMaxSize(),color=Slate,contentColor=Chalk,content=content)
 }
}

class HomeActivity:ComponentActivity(){
 override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState);enableEdgeToEdge(statusBarStyle=androidx.activity.SystemBarStyle.dark(0xff24231f.toInt()),navigationBarStyle=androidx.activity.SystemBarStyle.dark(0xff24231f.toInt()));setContent{
  ClappaScreenTheme{BoxWithConstraints(Modifier.fillMaxSize().safeDrawingPadding(),contentAlignment=androidx.compose.ui.Alignment.Center){val wide=maxWidth>maxHeight;Column(Modifier.widthIn(max=if(wide)840.dp else 560.dp).fillMaxWidth().verticalScroll(rememberScrollState()).padding(24.dp),verticalArrangement=Arrangement.spacedBy(if(wide)8.dp else 16.dp)){
   Wordmark(size=if(wide)32 else 40)
   Text("No cap! Clap!",color=MenuOrange,fontStyle=androidx.compose.ui.text.font.FontStyle.Italic,style=MaterialTheme.typography.titleMedium,modifier=Modifier.padding(bottom=if(wide)0.dp else 12.dp))
   @Composable fun ModeCard(viewer:Boolean,modifier:Modifier){
    OutlinedCard(onClick={startActivity(Intent(this@HomeActivity,if(viewer)ViewerActivity::class.java else MainActivity::class.java))},modifier=modifier,colors=CardDefaults.outlinedCardColors(containerColor=androidx.compose.ui.graphics.Color(0xff302d29)),border=androidx.compose.foundation.BorderStroke(1.dp,MenuOrange.copy(alpha=.35f))){
     Row(Modifier.padding(20.dp),verticalAlignment=androidx.compose.ui.Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(16.dp)){
      MenuPossum(1,Modifier.size(if(wide)88.dp else 104.dp),asset="mascot/menu/"+(if(viewer)"viewer" else "streamer")+".png");Column(Modifier.weight(1f)){Text(if(viewer)"Viewer" else "Streamer",style=MaterialTheme.typography.titleLarge);Text(if(viewer)"Scan a proof" else "Connect to OBS",style=MaterialTheme.typography.bodySmall,color=Chalk.copy(alpha=.7f),modifier=Modifier.padding(top=6.dp))};Text("›",color=MenuOrange,style=MaterialTheme.typography.headlineMedium)
     }
    }
   }
   if(wide)Row(horizontalArrangement=Arrangement.spacedBy(16.dp)){ModeCard(false,Modifier.weight(1f));ModeCard(true,Modifier.weight(1f))}
   else{ModeCard(false,Modifier.fillMaxWidth());ModeCard(true,Modifier.fillMaxWidth())}
  }}}
 }}
}

open class ViewerActivity:ComponentActivity(){
 private var cameraAllowed by mutableStateOf(false)
 private var scanning by mutableStateOf(false)
 private var progress by mutableStateOf("Point at the animated QR code")
 private var error by mutableStateOf<String?>(null)
 private var result by mutableStateOf<ViewerProof.Result?>(null)
 private var playing by mutableStateOf(false)
 private var verifying by mutableStateOf(false)
 private var twitchStatus by mutableStateOf("")
 private var twitchDetails by mutableStateOf("")
 private val identities=mutableMapOf<String,org.json.JSONObject>()
 private var provider:ProcessCameraProvider?=null
 private val worker=Executors.newSingleThreadExecutor()
 private val collector=QrCollector()
 private var audio:android.media.AudioTrack?=null
 private val permission=registerForActivityResult(ActivityResultContracts.RequestPermission()){ok->cameraAllowed=ok;if(!ok)error="Camera permission is needed to scan a stream." else scanning=true}
 override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState);enableEdgeToEdge(statusBarStyle=androidx.activity.SystemBarStyle.dark(0xff24231f.toInt()),navigationBarStyle=androidx.activity.SystemBarStyle.dark(0xff24231f.toInt()));cameraAllowed=ContextCompat.checkSelfPermission(this,Manifest.permission.CAMERA)==PackageManager.PERMISSION_GRANTED
  setContent{ClappaScreenTheme{Column(Modifier.fillMaxSize().background(Slate).safeDrawingPadding().padding(16.dp)){
   Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween){Wordmark(size=28);TextButton(onClick={finish()}){Text("Modes")}}
   if(scanning&&cameraAllowed){Camera(Modifier.weight(1f).fillMaxWidth());Text(progress,Modifier.padding(vertical=12.dp));Text("Keep the whole code visible while its frames change.");TextButton(onClick={stopScan()}){Text("Cancel scan")}}
   else{Column(Modifier.weight(1f).verticalScroll(rememberScrollState())){
    result?.let{r->
     Row(verticalAlignment=androidx.compose.ui.Alignment.CenterVertically,modifier=Modifier.padding(top=12.dp)){MenuPossum(11,Modifier.size(80.dp));Text("Signed challenge verified",style=MaterialTheme.typography.headlineSmall,modifier=Modifier.weight(1f).padding(start=12.dp))}
     Text(r.prompt,style=MaterialTheme.typography.titleLarge,modifier=Modifier.padding(vertical=16.dp))
     var now by remember{mutableLongStateOf(System.currentTimeMillis())};LaunchedEffect(r){while(true){now=System.currentTimeMillis();delay(1000)}}
     val age=(now-r.beaconAt)/1000
     Surface(color=MenuOrange.copy(alpha=.13f),shape=MaterialTheme.shapes.medium,modifier=Modifier.fillMaxWidth()){
      Text(beaconAgeText(age),color=MenuOrange,style=MaterialTheme.typography.titleMedium,modifier=Modifier.padding(16.dp))
     }
     Button(onClick={play(r)},enabled=!playing,modifier=Modifier.padding(top=16.dp)){Text(if(playing)"Playing…" else "▶ Replay the claps")}
     Text(twitchStatus,Modifier.padding(vertical=12.dp))
     Text("Do the photos match what you see on stream?",style=MaterialTheme.typography.titleMedium,modifier=Modifier.padding(vertical=12.dp))
     var details by remember(r){mutableStateOf(false)}
     TextButton(onClick={details=!details}){Text(if(details)"Hide proof details −" else "Proof details +")}
     if(details){
      if(twitchDetails.isNotEmpty())Text(twitchDetails,Modifier.padding(bottom=12.dp))
      Text("Beacon time: "+java.time.Instant.ofEpochMilli(r.beaconAt))
      Text("Age is based on your phone’s clock. Allow for the stream’s delay.",style=MaterialTheme.typography.bodySmall,modifier=Modifier.padding(vertical=8.dp))
      Text("Camera: "+if(r.challenge.optString("capture_profile")=="CLAPPA-DUAL-v1")"Front and rear" else r.challenge.getString("camera"))
      Text("Signing identity",style=MaterialTheme.typography.titleMedium,modifier=Modifier.padding(top=12.dp))
      SelectionContainer{Text(r.key.getString("key_id"),style=MaterialTheme.typography.bodySmall)}
      Text("Public key (P-256)",Modifier.padding(top=12.dp));SelectionContainer{Text(r.key.getString("spki"),style=MaterialTheme.typography.bodySmall)}
      Text("Signatures and beacon checked. Exact photo and recording checks need the original files.",Modifier.padding(vertical=16.dp),style=MaterialTheme.typography.bodySmall)
     }
    }?:Column(Modifier.padding(vertical=24.dp)){MenuPossum(1,Modifier.size(160.dp));Text("Scan a proof",style=MaterialTheme.typography.headlineSmall);Text("Point at the CLAPPA code on a stream.",Modifier.padding(top=12.dp))}
    error?.let{Text(it,color=MaterialTheme.colorScheme.error,modifier=Modifier.padding(vertical=12.dp))}
    if(verifying){LinearProgressIndicator(Modifier.fillMaxWidth());Text("Checking signatures and freshness beacon…",Modifier.padding(vertical=12.dp))}
   };Spacer(Modifier.height(12.dp));Button(onClick={startScan()},enabled=!verifying,modifier=Modifier.fillMaxWidth().heightIn(min=56.dp)){Text(if(result==null)"Scan a stream" else "Scan another proof")}}
  }}}
 }
 private fun startScan(){result=null;error=null;collector.reset();progress="Point at the animated QR code";if(cameraAllowed)scanning=true else permission.launch(Manifest.permission.CAMERA)}
 private fun stopScan(){scanning=false;provider?.unbindAll()}
 @Composable private fun Camera(modifier:Modifier){
  DisposableEffect(Unit){onDispose{provider?.unbindAll()}}
  AndroidView(modifier=modifier,factory={context->val view=PreviewView(context);val future=ProcessCameraProvider.getInstance(context)
   future.addListener({if(!scanning||isDestroyed)return@addListener
    runCatching{provider=future.get();val preview=Preview.Builder().build().also{it.surfaceProvider=view.surfaceProvider};val analysis=ImageAnalysis.Builder().setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST).build()
     analysis.setAnalyzer(worker){frame->try{
      val plane=frame.planes[0];val bytes=ByteArray(plane.buffer.remaining());plane.buffer.get(bytes)
      val source=com.google.zxing.PlanarYUVLuminanceSource(bytes,plane.rowStride,frame.height,0,0,frame.width,frame.height,false)
      val reader=com.google.zxing.MultiFormatReader();val qr=reader.decode(com.google.zxing.BinaryBitmap(com.google.zxing.common.HybridBinarizer(source))).text
      if(qr.startsWith("CLAPPA2:"))runOnUiThread{if(scanning)try{val proof=collector.add(qr);val(n,total)=collector.progress;progress="Reading proof · $n of $total frames"
       if(proof!=null)verifyDecodedProof(proof)
      }catch(_:Exception){collector.reset();progress="Damaged sequence · collecting again"}}
     }catch(_:Exception){}finally{frame.close()}}
     provider!!.unbindAll();provider!!.bindToLifecycle(this@ViewerActivity,CameraSelector.DEFAULT_BACK_CAMERA,preview,analysis)
    }.onFailure{stopScan();error="Camera unavailable. Close other camera apps and try again."}
   },ContextCompat.getMainExecutor(context));view})
 }
 protected fun verifyDecodedProof(proof:ByteArray){stopScan();verifying=true;lifecycleScope.launch{try{val checked=withContext(Dispatchers.Default){ViewerProof.verify(proof,this@ViewerActivity)};twitchStatus=checkIdentity(checked);result=checked}catch(_:Exception){error="This proof could not be verified. Try scanning again; do not rely on its identity or timing."}finally{verifying=false}}}
 private suspend fun checkIdentity(r:ViewerProof.Result):String {
  twitchDetails=""
  val record=r.envelope.optJSONObject("identity")?:return "No Twitch account linked."
  val digest=record.getJSONObject("binding").getJSONObject("payload").getString("identity_sha256")
  val evidence=record.optJSONObject("evidence")?:identities[digest]?:return "Twitch account · scan the first proof to check it."
  return try{val who=withContext(Dispatchers.IO){TwitchIdentity.verify(this@ViewerActivity,evidence,r.key.getString("key_id"))};if(identities.size>=32)identities.clear();identities[digest]=evidence
   twitchDetails="Account ID: ${who.id}\nLinked: ${java.time.Instant.ofEpochMilli(who.issuedAt)}"
   "✓ Twitch · ${who.name}"
  }catch(_:Exception){"Twitch account not checked. Connect to the internet and scan again."}
 }
 private fun play(r:ViewerProof.Result){playing=true;lifecycleScope.launch{try{withContext(Dispatchers.Default){val d=r.challenge;val pitches=d.getJSONArray("pitches");val pcm=RiffAudio.render(assets.open("audio/clapper.pcm").use{it.readBytes()},d.getString("cadence"),d.getInt("slot_ms"),(0 until pitches.length()).map{pitches.getInt(it)})
   val a=android.media.AudioTrack.Builder().setAudioAttributes(android.media.AudioAttributes.Builder().setUsage(android.media.AudioAttributes.USAGE_MEDIA).setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION).build()).setAudioFormat(android.media.AudioFormat.Builder().setSampleRate(44100).setEncoding(android.media.AudioFormat.ENCODING_PCM_16BIT).setChannelMask(android.media.AudioFormat.CHANNEL_OUT_MONO).build()).setTransferMode(android.media.AudioTrack.MODE_STATIC).setBufferSizeInBytes(pcm.size*2).build();audio=a
   try{a.write(pcm,0,pcm.size);a.play();delay(pcm.size*1000L/44100+100)}finally{if(audio===a)audio=null;runCatching{a.release()}}
  }}finally{playing=false}}}
 override fun onDestroy(){provider?.unbindAll();worker.shutdown();audio?.let{runCatching{it.stop()}};super.onDestroy()}
}

