package org.clappa.app
import android.os.Bundle
import android.graphics.BitmapFactory
import org.json.JSONArray
import org.json.JSONObject
import com.google.zxing.*
import com.google.zxing.common.HybridBinarizer

/** Test-only entry: decode actual rendered QR images, then exercise production verifier/UI. */
class ReviewViewerActivity:ViewerActivity(){
 override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState)
  try{
   val frames=JSONArray(assets.open("viewer/frames.json").bufferedReader().use{it.readText()});val c=QrCollector();var bytes:ByteArray?=null
   for(i in (0 until frames.length()).reversed()){
    val bitmap=assets.open("viewer/frame-$i.png").use{BitmapFactory.decodeStream(it)};val pixels=IntArray(bitmap.width*bitmap.height);bitmap.getPixels(pixels,0,bitmap.width,0,0,bitmap.width,bitmap.height)
    val text=MultiFormatReader().decode(BinaryBitmap(HybridBinarizer(RGBLuminanceSource(bitmap.width,bitmap.height,pixels)))).text;check(text==frames.getString(i));bytes=c.add(text);bitmap.recycle()
   }
   val proof=checkNotNull(bytes);val verified=ViewerProof.verify(proof,this)
   var rejected=0
   for(mutation in listOf("signature","beacon","duplicate")){
    val root=StrictJson.parse(String(proof));val bad=when(mutation){"duplicate"->("{\"key\":null,"+String(proof).drop(1)).toByteArray();"signature"->{val event=root.getJSONObject("event");val sig=Proof.unb64(event.getString("signature"));sig[0]=(sig[0].toInt() xor 1).toByte();event.put("signature",Proof.b64(sig));root.toString().toByteArray()};else->{root.getJSONObject("context").getJSONObject("challenge").getJSONObject("payload").getJSONObject("data").getJSONObject("freshness").getJSONObject("pulse").put("round",1);root.toString().toByteArray()}}
    try{ViewerProof.verify(bad,this)}catch(_:Exception){rejected++}
   };check(rejected==3)
   Proof.atomic(java.io.File(filesDir,"viewer-review.json"),JSONObject().put("qr_frames_decoded",frames.length()).put("verified_prompt",verified.prompt).put("mutations_rejected",rejected))
   verifyDecodedProof(proof)
  }catch(e:Exception){android.util.Log.e("ClappaViewerReview","Review failed",e);throw e}
 }
}
