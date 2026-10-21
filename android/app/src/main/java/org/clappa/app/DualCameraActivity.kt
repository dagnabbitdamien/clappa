package org.clappa.app

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Matrix
import android.os.Bundle
import android.os.SystemClock
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.enableEdgeToEdge
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.io.File
import java.util.concurrent.Executors

/** Capability-gated experiment. These samples never enter a signed proof. */
class DualCameraActivity:ComponentActivity(){
    private var permission by mutableStateOf(false)
    private var ready by mutableStateOf(false)
    private var busy by mutableStateOf(false)
    private var status by mutableStateOf("Checking this phone's camera support…")
    private var provider:ProcessCameraProvider?=null
    private val worker=Executors.newSingleThreadExecutor()
    private val lock=Any()
    private var request=0L
    private var requestAt=0L
    private data class Sample(val bitmap:Bitmap,val delivered:Long,val sensor:Long)
    private val samples=mutableMapOf<String,Sample>()
    private val permissionRequest=registerForActivityResult(ActivityResultContracts.RequestPermission()){granted->permission=granted;if(!granted)status="Camera access is needed to open this preview."}

    override fun onCreate(savedInstanceState:Bundle?){
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(statusBarStyle=SystemBarStyle.dark(0xff24231f.toInt()),navigationBarStyle=SystemBarStyle.dark(0xff24231f.toInt()))
        window.isNavigationBarContrastEnforced=false
        permission=ContextCompat.checkSelfPermission(this,Manifest.permission.CAMERA)==PackageManager.PERMISSION_GRANTED
        if(!permission)permissionRequest.launch(Manifest.permission.CAMERA)
        setContent{MaterialTheme(colorScheme=darkColorScheme(primary=Chalk,onPrimary=Slate)){
            val front=remember{PreviewView(this).apply{implementationMode=PreviewView.ImplementationMode.COMPATIBLE}}
            val rear=remember{PreviewView(this).apply{implementationMode=PreviewView.ImplementationMode.COMPATIBLE}}
            DisposableEffect(permission){
                var disposed=false
                if(permission){val future=ProcessCameraProvider.getInstance(this@DualCameraActivity)
                    future.addListener({if(!disposed)try{
                        val p=future.get();provider=p
                        val combination=p.availableConcurrentCameraInfos.firstOrNull{c->c.any{it.lensFacing==CameraSelector.LENS_FACING_FRONT}&&c.any{it.lensFacing==CameraSelector.LENS_FACING_BACK}}
                        if(combination==null){status="This phone does not expose a front + rear camera combination. Ordinary challenges still work."}
                        else {
                            val configs=listOf(CameraSelector.LENS_FACING_FRONT to front,CameraSelector.LENS_FACING_BACK to rear).map{(facing,view)->
                                val info=combination.first{it.lensFacing==facing}
                                val preview=Preview.Builder().build().also{it.surfaceProvider=view.surfaceProvider}
                                val analysis=ImageAnalysis.Builder().setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST).build()
                                analysis.setAnalyzer(worker){frame->try{sample(if(facing==CameraSelector.LENS_FACING_FRONT)"front" else "rear",frame)}finally{frame.close()}}
                                ConcurrentCamera.SingleCameraConfig(info.cameraSelector,UseCaseGroup.Builder().addUseCase(preview).addUseCase(analysis).build(),this@DualCameraActivity)
                            }
                            p.unbindAll();p.bindToLifecycle(configs);ready=true
                            status="Both cameras are open. Hold the phone still and include your setup in the rear view."
                        }
                    }catch(e:Exception){provider?.unbindAll();ready=false;status="This camera combination cannot run here. Ordinary challenges still work."}},ContextCompat.getMainExecutor(this@DualCameraActivity))
                }
                onDispose{disposed=true;ready=false;provider?.unbindAll()}
            }
            CompositionLocalProvider(LocalContentColor provides Chalk){
            Column(Modifier.fillMaxSize().background(Slate).safeDrawingPadding().verticalScroll(rememberScrollState()).padding(20.dp),verticalArrangement=Arrangement.spacedBy(16.dp)){
                Row{Wordmark(Modifier.weight(1f),28);TextButton(onClick={finish()}){Text("Done")}}
                Text("Two-camera preview",style=MaterialTheme.typography.headlineSmall)
                Text("Experimental · separate front and rear images. These samples are not signed or sent to OBS.")
                Text(status)
                if(ready){
                    Text("Front · preview is mirrored; saved image is not")
                    AndroidView(factory={front},modifier=Modifier.fillMaxWidth().height(160.dp).clipToBounds())
                    Text("Rear")
                    AndroidView(factory={rear},modifier=Modifier.fillMaxWidth().height(160.dp).clipToBounds())
                    Button(onClick=::requestPair,enabled=!busy,modifier=Modifier.fillMaxWidth().heightIn(min=52.dp)){Text(if(busy)"Sampling both cameras…" else "Sample both views")}
                    Text("Frame delivery times are measured separately. This does not claim simultaneous exposure. Flash is disabled in this experiment.")
                }
            }
            }
        }}
    }
    private fun requestPair(){
        synchronized(lock){samples.values.forEach{it.bitmap.recycle()};samples.clear();requestAt=SystemClock.elapsedRealtimeNanos();request=requestAt}
        busy=true
        val id=request
        lifecycleScope.launch{delay(2500);synchronized(lock){if(request==id){request=0;samples.values.forEach{it.bitmap.recycle()};samples.clear();busy=false;status="Both frames did not arrive in time. No pair was saved."}}}
    }
    private fun sample(role:String,frame:ImageProxy){
        synchronized(lock){
            if(request==0L||samples.containsKey(role))return
            val delivered=SystemClock.elapsedRealtimeNanos()
            val original=frame.toBitmap()
            val bitmap=if(frame.imageInfo.rotationDegrees==0)original else Bitmap.createBitmap(original,0,0,original.width,original.height,Matrix().apply{postRotate(frame.imageInfo.rotationDegrees.toFloat())},true).also{original.recycle()}
            samples[role]=Sample(bitmap,delivered,frame.imageInfo.timestamp)
            if(samples.size!=2)return
            val values=samples.toMap();samples.clear();request=0
            try{
                val skew=kotlin.math.abs(values.getValue("front").delivered-values.getValue("rear").delivered)/1000000
                check(skew<=120){"Frame delivery was too far apart (${skew} ms). No pair was saved."}
                val folder=File(filesDir,"dual-camera-samples/${System.currentTimeMillis()}").apply{mkdirs()}
                val data=JSONObject().put("profile","CLAPPA-DUAL-CAMERA-EXPERIMENT-v1").put("signed",false).put("delivery_skew_ms",skew).put("exposure_synchronization","not-established").put("request_elapsed_ns",requestAt)
                for((name,v) in values){File(folder,"$name.jpg").outputStream().use{v.bitmap.compress(Bitmap.CompressFormat.JPEG,92,it)};data.put(name,JSONObject().put("delivered_elapsed_ns",v.delivered).put("sensor_timestamp_ns",v.sensor).put("width",v.bitmap.width).put("height",v.bitmap.height))}
                File(folder,"sample.json").writeText(data.toString(2))
                runOnUiThread{busy=false;status="Two separate images saved on this phone. Frame delivery gap: ${skew} ms. Exposure synchronisation has not been established."}
            }catch(e:Exception){runOnUiThread{busy=false;status=e.message?:"Could not save the camera samples."}}
            finally{values.values.forEach{it.bitmap.recycle()}}
        }
    }
    override fun onDestroy(){synchronized(lock){request=0;samples.values.forEach{it.bitmap.recycle()};samples.clear()};provider?.unbindAll();worker.shutdown();super.onDestroy()}
}
