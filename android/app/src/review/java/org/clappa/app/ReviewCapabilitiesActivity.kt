package org.clappa.app
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.camera.core.CameraSelector
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import org.json.JSONObject
import org.json.JSONArray
import java.io.File
class ReviewCapabilitiesActivity:ComponentActivity(){
 override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState);val f=ProcessCameraProvider.getInstance(this);f.addListener({
  val result=runCatching{val p=f.get();JSONObject().put("concurrentCombinations",JSONArray(p.availableConcurrentCameraInfos.map{list->JSONArray(list.map{c->JSONObject().put("facing",c.lensFacing).put("flash",c.hasFlashUnit())})})).put("dualFlashSupported",p.availableConcurrentCameraInfos.any{it.any{c->c.lensFacing==CameraSelector.LENS_FACING_FRONT}&&it.any{c->c.lensFacing==CameraSelector.LENS_FACING_BACK&&c.hasFlashUnit()}})}.getOrElse{JSONObject().put("error",it.toString())}
  File(filesDir,"review-capabilities.json").writeText(result.toString(2));finish()
 },ContextCompat.getMainExecutor(this))}
}
