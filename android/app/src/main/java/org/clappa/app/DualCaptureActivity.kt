package org.clappa.app

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Matrix
import android.os.Bundle
import android.os.SystemClock
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.enableEdgeToEdge
import androidx.activity.compose.setContent
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import kotlinx.coroutines.*
import org.json.JSONObject
import java.io.File
import java.util.concurrent.Executors

/** Concurrent streams, two bounded sampling groups. Never claims simultaneous exposure. */
class DualCaptureActivity:ComponentActivity(){
 private val worker=Executors.newSingleThreadExecutor()
 private val lock=Any()
 private var provider:ProcessCameraProvider?=null
 private var rearControl:CameraControl?=null
 private var request:CompletableDeferred<Map<String,Sample>>?=null
 private val samples=mutableMapOf<String,Sample>()
 private val seen=mutableMapOf<String,Int>()
 private data class Sample(val bitmap:Bitmap,val wall:Long,val delivered:Long,val sensor:Long)
 private var ready by mutableStateOf(false)
 private var busy by mutableStateOf(false)
 private var illumination by mutableStateOf(Color.Transparent)
 private var seconds by mutableIntStateOf(10)
 private var status by mutableStateOf("Opening both cameras…")
 private val folder by lazy{File(cacheDir,"dual-"+Proof.id()).apply{mkdirs()}}
 private var returned=false
 private var oldBrightness=-1f
 override fun onCreate(state:Bundle?){super.onCreate(state)
  requestedOrientation=android.content.pm.ActivityInfo.SCREEN_ORIENTATION_LOCKED;enableEdgeToEdge(statusBarStyle=SystemBarStyle.dark(0xff24231f.toInt()),navigationBarStyle=SystemBarStyle.dark(0xff24231f.toInt()));window.isNavigationBarContrastEnforced=false
  window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);oldBrightness=window.attributes.screenBrightness
  setContent{MaterialTheme(colorScheme=darkColorScheme(primary=Chalk,onPrimary=Slate)){
   val scope=rememberCoroutineScope();val front=remember{PreviewView(this).apply{implementationMode=PreviewView.ImplementationMode.COMPATIBLE}};val rear=remember{PreviewView(this).apply{implementationMode=PreviewView.ImplementationMode.COMPATIBLE}}
   LaunchedEffect(Unit){while(!busy){val left=intent.getLongExtra("deadline",0)-SystemClock.elapsedRealtime();seconds=((left+999).coerceAtLeast(0)/1000).toInt();if(left<=0){reject("timeout");break};delay(100)}}
   DisposableEffect(Unit){var disposed=false;val future=ProcessCameraProvider.getInstance(this@DualCaptureActivity)
    future.addListener({if(!disposed)try{val p=future.get();provider=p;val infos=p.availableConcurrentCameraInfos.firstOrNull{it.any{c->c.lensFacing==CameraSelector.LENS_FACING_FRONT}&&it.any{c->c.lensFacing==CameraSelector.LENS_FACING_BACK&&c.hasFlashUnit()}}?:error("Two-camera flash mode is unavailable")
     val configs=listOf(CameraSelector.LENS_FACING_FRONT to front,CameraSelector.LENS_FACING_BACK to rear).map{(facing,view)->
      val info=infos.first{it.lensFacing==facing};val preview=Preview.Builder().build().also{it.surfaceProvider=view.surfaceProvider}
      val analysis=ImageAnalysis.Builder().setTargetResolution(android.util.Size(1280,720)).setTargetRotation(windowManager.defaultDisplay.rotation).setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST).build()
      analysis.setAnalyzer(worker){frame->try{sample(if(facing==CameraSelector.LENS_FACING_FRONT)"front" else "rear",frame)}catch(e:Exception){synchronized(lock){request?.completeExceptionally(e)}}finally{frame.close()}}
      ConcurrentCamera.SingleCameraConfig(info.cameraSelector,UseCaseGroup.Builder().addUseCase(preview).addUseCase(analysis).build(),this@DualCaptureActivity)
     }
     p.unbindAll();val cameras=p.bindToLifecycle(configs).cameras;rearControl=cameras.first{it.cameraInfo.lensFacing==CameraSelector.LENS_FACING_BACK}.cameraControl;ready=true;status="Hold the pose through both flashes!"
    }catch(e:Exception){reject("camera-error")}},ContextCompat.getMainExecutor(this@DualCaptureActivity))
    onDispose{disposed=true;rearControl?.enableTorch(false);provider?.unbindAll()}
   }
   Box(Modifier.fillMaxSize().background(Slate)){
    Column(Modifier.fillMaxSize().safeDrawingPadding()){
     Row(Modifier.fillMaxWidth().padding(12.dp),verticalAlignment=Alignment.CenterVertically){Wordmark(Modifier.weight(1f),26);Text("Both views · "+seconds+"s",color=Chalk,fontSize=14.sp)}
     Text(intent.getStringExtra("prompt")?:"Show yourself and your setup!",Modifier.padding(horizontal=16.dp,vertical=6.dp),color=Chalk,fontSize=16.sp)
     BoxWithConstraints(Modifier.weight(1f).fillMaxWidth().padding(8.dp)){
      @Composable fun pane(view:PreviewView,label:String,modifier:Modifier){Box(modifier.clipToBounds()){AndroidView(factory={view},modifier=Modifier.fillMaxSize());Text(label,Modifier.align(Alignment.TopStart).background(Slate.copy(alpha=.8f)).padding(6.dp),color=Chalk,fontSize=12.sp)}}
      if(maxWidth>maxHeight)Row(Modifier.fillMaxSize(),horizontalArrangement=Arrangement.spacedBy(8.dp)){pane(front,"You · preview mirrored",Modifier.weight(1f).fillMaxHeight());pane(rear,"Your setup",Modifier.weight(1f).fillMaxHeight())}
      else Column(Modifier.fillMaxSize(),verticalArrangement=Arrangement.spacedBy(8.dp)){pane(front,"You · preview mirrored",Modifier.weight(1f).fillMaxWidth());pane(rear,"Your setup",Modifier.weight(1f).fillMaxWidth())}
     }
     Text(status,Modifier.padding(horizontal=16.dp,vertical=6.dp),color=Chalk,fontSize=13.sp)
     Box(Modifier.fillMaxWidth().height(94.dp)){
      TextButton(onClick={finish()},enabled=!busy,modifier=Modifier.align(Alignment.CenterStart).padding(start=12.dp).size(56.dp)){Text("‹",fontSize=38.sp)}
      Canvas(Modifier.align(Alignment.Center).size(72.dp).semantics{contentDescription="Capture both views"}.clickable(enabled=ready&&!busy){busy=true;scope.launch{capture()}}){drawCircle(Chalk.copy(alpha=if(busy).4f else 1f),radius=size.minDimension/2-2.dp.toPx(),style=androidx.compose.ui.graphics.drawscope.Stroke(3.dp.toPx()));drawCircle(Chalk.copy(alpha=if(busy).4f else 1f),radius=size.minDimension/2-9.dp.toPx())}
     }
    }
    if(illumination!=Color.Transparent)Box(Modifier.fillMaxSize().background(illumination))
   }
  }}
 }
 private fun sample(role:String,frame:ImageProxy){synchronized(lock){
  val pending=request?:return;if(!pending.isActive||samples.containsKey(role))return
  val count=(seen[role]?:0)+1;seen[role]=count;if(count<3)return // discard queued/pre-illumination frames on each stream
  val delivered=SystemClock.elapsedRealtime();val wall=System.currentTimeMillis();val original=frame.toBitmap()
  val bitmap=if(frame.imageInfo.rotationDegrees==0)original else Bitmap.createBitmap(original,0,0,original.width,original.height,Matrix().apply{postRotate(frame.imageInfo.rotationDegrees.toFloat())},true).also{original.recycle()}
  require(bitmap.width>=240&&bitmap.height>=240){"Camera sample too small"}
  samples[role]=Sample(bitmap,wall,delivered,frame.imageInfo.timestamp/1000)
  if(samples.size==2){val pair=samples.toMap();samples.clear();request=null;pending.complete(pair)}
 }}
 private suspend fun group(timeout:Long):Map<String,Sample>{val deferred=CompletableDeferred<Map<String,Sample>>();synchronized(lock){check(request==null);samples.clear();seen.clear();request=deferred}
  return try{withTimeout(timeout.coerceAtLeast(1)){deferred.await()}.also{check(kotlin.math.abs(it.getValue("front").delivered-it.getValue("rear").delivered)<=120){"Camera delivery gap too large"}}}finally{synchronized(lock){if(request===deferred){request=null;samples.values.forEach{it.bitmap.recycle()};samples.clear()}}}
 }
 private suspend fun torch(on:Boolean)=suspendCancellableCoroutine<Unit>{continuation->val future=checkNotNull(rearControl).enableTorch(on);future.addListener({try{future.get();if(continuation.isActive)continuation.resumeWith(Result.success(Unit))}catch(e:Exception){if(continuation.isActive)continuation.resumeWith(Result.failure(e))}},ContextCompat.getMainExecutor(this))}
 private suspend fun capture(){var normal:Map<String,Sample>?=null;var lit:Map<String,Sample>?=null
  try{
   normal=group(intent.getLongExtra("deadline",0)-SystemClock.elapsedRealtime());val aMono=normal.values.maxOf{it.delivered};val aAt=normal.values.maxOf{it.wall}
   withTimeout((aMono+3000-SystemClock.elapsedRealtime()).coerceAtLeast(1)){
    illumination=when(intent.getStringExtra("flash")){"red"->Color.Red;"green"->Color.Green;else->Color.Blue};window.attributes=window.attributes.apply{screenBrightness=1f}
    withFrameNanos{};withFrameNanos{};torch(true);delay(150);lit=group(aMono+3000-SystemClock.elapsedRealtime())
   }
   val illuminated=checkNotNull(lit);torch(false);illumination=Color.Transparent;window.attributes=window.attributes.apply{screenBrightness=oldBrightness}
   fun metadata(g:Map<String,Sample>)=JSONObject().apply{for((role,s)in g){put(role+"_delivered_ms",s.delivered);put(role+"_sensor_us",s.sensor);put(role+"_width",s.bitmap.width);put(role+"_height",s.bitmap.height)}}
   val normalGroup=checkNotNull(normal)
   val result=JSONObject().put("folder",folder.name).put("a_at",aAt).put("b_at",illuminated.values.maxOf{it.wall}).put("a_mono",aMono).put("b_mono",illuminated.values.maxOf{it.delivered}).put("normal",metadata(normalGroup)).put("illuminated",metadata(illuminated))
   withContext(Dispatchers.IO){for((suffix,g)in listOf("a" to normalGroup,"b" to illuminated))for((role,s)in g){File(folder,"$role-$suffix.jpg").outputStream().use{check(s.bitmap.compress(Bitmap.CompressFormat.JPEG,92,it))}}}
   returned=true;setResult(RESULT_OK,Intent().putExtra("capture",result.toString()));finish()
  }catch(e:Exception){reject(if(e is TimeoutCancellationException)"timeout" else "camera-error")}
  finally{rearControl?.enableTorch(false);illumination=Color.Transparent;window.attributes=window.attributes.apply{screenBrightness=oldBrightness};normal?.values?.forEach{it.bitmap.recycle()};lit?.values?.forEach{it.bitmap.recycle()}}
 }
 private fun reject(reason:String){setResult(RESULT_CANCELED,Intent().putExtra("reason",reason));finish()}
 override fun onDestroy(){synchronized(lock){request?.cancel();request=null;samples.values.forEach{it.bitmap.recycle()};samples.clear()};rearControl?.enableTorch(false);provider?.unbindAll();worker.shutdown();if(!returned&&folder.exists())folder.deleteRecursively();super.onDestroy()}
}
