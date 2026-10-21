package org.clappa.app
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.nio.ByteBuffer
import java.security.MessageDigest
import java.util.concurrent.TimeUnit
internal object Quicknet {
 const val PROFILE="CLAPPA-QUICKNET-v1"
 const val CHAIN="52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971"
 init{System.loadLibrary("clappa_beacon")}
 private external fun nativeVerify(digest:ByteArray,signature:ByteArray):Boolean
 private val http=OkHttpClient.Builder().connectTimeout(3,TimeUnit.SECONDS).readTimeout(4,TimeUnit.SECONDS).callTimeout(5,TimeUnit.SECONDS).followRedirects(false).build()
 fun sha(bytes:ByteArray)=MessageDigest.getInstance("SHA-256").digest(bytes)
 fun roundTime(round:Long):Long{require(round in 1..10000000000);return (1692803367+(round-1)*3)*1000}
 fun futureRound(now:Long)=(now/1000-1692803367+8)/3+1
 fun verify(p:JSONObject):ByteArray{
  val round=p.getLong("round");require(p.getString("chain")==CHAIN&&p.getLong("at")==roundTime(round))
  val hex=p.getString("signature");require(hex.matches(Regex("[0-9a-f]{96}")));val sig=hex.chunked(2).map{it.toInt(16).toByte()}.toByteArray()
  require(nativeVerify(sha(ByteBuffer.allocate(8).putLong(round).array()),sig)){"Freshness signature did not verify"};return sha(sig)
 }
 fun fetch(round:Long):JSONObject{
  var last:Exception?=null
  for(host in listOf("api.drand.sh","api2.drand.sh","api3.drand.sh"))try{
   http.newCall(Request.Builder().url("https://$host/$CHAIN/public/$round").build()).execute().use{r->
    check(r.isSuccessful){"Freshness pulse is not available"};val body=checkNotNull(r.body);check(body.contentLength()<=8192);val input=body.byteStream();val buffer=ByteArray(8193);var size=0;while(size<buffer.size){val n=input.read(buffer,size,buffer.size-size);if(n<0)break;size+=n};check(size<=8192);val data=buffer.copyOf(size)
    val obj=JSONObject(String(data,Charsets.UTF_8));require(obj.getLong("round")==round)
    val p=JSONObject().put("chain",CHAIN).put("round",round).put("at",roundTime(round)).put("signature",obj.getString("signature").lowercase());verify(p);return p
   }
  }catch(e:Exception){last=e}
  throw IllegalStateException("Could not verify the fresh beacon for this attempt. Try another challenge.",last)
 }
 fun seed(armed:JSONObject,pulse:JSONObject)=sha("CLAPPA-QUICKNET-SEED-v1\u0000".toByteArray()+Proof.canonical(armed.getJSONObject("payload")).toByteArray()+byteArrayOf(0)+verify(pulse))
}
