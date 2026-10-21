package org.clappa.app

import org.json.JSONObject
import org.json.JSONArray
import java.math.BigInteger
import java.security.KeyFactory
import java.security.Signature
import java.security.spec.X509EncodedKeySpec

internal object ViewerProof {
 data class Result(val envelope:JSONObject,val prompt:String,val beaconAt:Long,val key:JSONObject,val challenge:JSONObject,val additional:Boolean)
 private fun same(a:Any,b:Any)=Proof.canonical(a)==Proof.canonical(b)
 private fun hash(o:JSONObject)=Proof.hash(Proof.canonical(o).toByteArray(Charsets.UTF_8))
 fun verify(bytes:ByteArray,app:android.content.Context):Result {
  require(bytes.size<=131072)
  val text=Charsets.UTF_8.newDecoder().decode(java.nio.ByteBuffer.wrap(bytes)).toString()
  val root=StrictJson.parse(text);val key=root.getJSONObject("key");val schema=ProofSchema(app);schema.requireValid("key",key)
  schema.requireValid("event",root.getJSONObject("event"));val ctx=root.getJSONObject("context");schema.requireValid("event",ctx.getJSONObject("armed"));schema.requireValid("event",ctx.getJSONObject("challenge"));schema.requireValid("media-proof",ctx.getJSONObject("proof"))
  require(key.getString("protocol")=="0.3"&&key.getString("algorithm")=="ES256-P1363")
  val der=Proof.unb64(key.getString("spki"));require(Proof.b64(der)==key.getString("spki"))
  // Exact named-curve P-256 SPKI prefix, not a caller-selected curve.
  val prefix="3059301306072a8648ce3d020106082a8648ce3d030107034200".chunked(2).map{it.toInt(16).toByte()}.toByteArray()
  require(der.size==91&&der.copyOfRange(0,prefix.size).contentEquals(prefix))
  val kid=Proof.hash(der);require(kid==key.getString("key_id"))
  val pub=KeyFactory.getInstance("EC").generatePublic(X509EncodedKeySpec(der))
  val order=BigInteger("ffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551",16)
  fun signed(e:JSONObject):JSONObject {
   val p=e.getJSONObject("payload");require(p.getString("algorithm")=="ES256-P1363"&&p.getString("key_id")==kid)
   val raw=Proof.unb64(e.getString("signature"));require(raw.size==64&&Proof.b64(raw)==e.getString("signature"))
   val r=BigInteger(1,raw.copyOfRange(0,32));val s=BigInteger(1,raw.copyOfRange(32,64));require(r>BigInteger.ZERO&&r<order&&s>BigInteger.ZERO&&s<=order.shiftRight(1))
   fun integer(v:BigInteger):ByteArray{val b=v.toByteArray();return byteArrayOf(2,b.size.toByte())+b}
   val body=integer(r)+integer(s);val sig=byteArrayOf(48,body.size.toByte())+body
   require(Signature.getInstance("SHA256withECDSA").run{initVerify(pub);update(Proof.canonical(p).toByteArray());verify(sig)}){"Phone signature does not match"}
   return p
  }
  val event=root.getJSONObject("event");val e=signed(event);val context=root.getJSONObject("context")
  val armed=context.getJSONObject("armed");val a=signed(armed);val challenge=context.getJSONObject("challenge");val c=signed(challenge);val media=context.getJSONObject("proof");val p=signed(media)
  require(e.getString("type") in listOf("challenge-captured","claim")&&a.getString("type")=="challenge-armed"&&c.getString("type")=="challenge-issued")
  require(listOf(a,c,e).all{it.getString("protocol")=="0.3"&&it.getLong("seq")>=0&&it.getLong("at")>=0})
  val sid=e.getString("session_id");require(sid.matches(Regex("[0-9a-f]{32}"))&&listOf(a,c,p).all{it.getString("session_id")==sid})
  require(p.getString("profile")=="CLAPPA-MEDIA-PROOF-v1"&&p.getString("event_sha256")==hash(event)&&p.getString("challenge_sha256")==hash(challenge))
  val d=c.getJSONObject("data");val ad=a.getJSONObject("data");val ed=e.getJSONObject("data");val f=d.getJSONObject("freshness");val pulse=f.getJSONObject("pulse")
  require(f.getString("profile")==Quicknet.PROFILE&&f.getString("arm_sha256")==hash(armed))
  require(a.getLong("seq")<c.getLong("seq")&&c.getLong("seq")<e.getLong("seq"))
  val at=pulse.getLong("at");require(a.getLong("at")<at&&c.getLong("at") in at..at+10000&&e.getLong("at")>=c.getLong("at")&&p.getLong("at")>=e.getLong("at"))
  require(ad.getLong("round")==pulse.getLong("round")&&ad.getString("chain")==Quicknet.CHAIN&&ad.getString("mapping") in ChallengeChoices.supportedMappings)
  require(ad.getString("challenge_id")==d.getString("challenge_id")&&ed.getString("challenge_id")==d.getString("challenge_id")&&ad.getString("phase")==d.getString("phase")&&same(ad.getJSONObject("obs"),d.getJSONObject("obs")))
  require(d.getString("challenge_id").matches(Regex("[0-9a-f]{32}"))&&d.getString("phase") in listOf("start","verify","end")&&ad.getString("camera_profile") in listOf("front-only","rear-only","front-rear"))
  val choices=ChallengeChoices.fromSeed(Quicknet.seed(armed,pulse),ad.getString("camera_profile"),ad.getString("mapping"))
  require(d.getString("prompt_id")==choices.prompt&&d.getString("camera")==choices.camera&&d.getString("flash")==choices.flash&&d.getString("cadence")==choices.cadence&&d.getInt("slot_ms")==choices.slotMs)
  require(same(d.getJSONArray("pitches"),JSONArray(choices.pitches))&&d.getInt("response_window_ms")==10000&&d.getInt("pair_window_ms")==3000&&d.getString("qr_profile")=="hashes-v1")
  require(root.getJSONArray("photos").length()==0){"Only current hash-based proofs are supported"}
  val obs=d.getJSONObject("obs");require(p.getString("recording_id")==obs.getString("recording_id")&&obs.getString("recording_id").matches(Regex("[0-9a-f]{32}"))&&obs.getLong("elapsed_ms")>=0)
  val old=obs.getJSONArray("outputs");val outputs=p.getJSONArray("outputs");val descriptors=p.getJSONArray("descriptors")
  require(outputs.length() in 1..2&&outputs.length()==old.length()&&descriptors.length()==outputs.length())
  val seen=mutableSetOf<String>();var recording=false
  for(i in 0 until outputs.length()){
   val o=outputs.getJSONObject(i);val id=o.getString("output_id");require(seen.add(id)&&id.matches(Regex("[0-9a-f]{32}")))
   val prev=(0 until old.length()).map{old.getJSONObject(it)}.single{it.getString("output_id")==id}
   val desc=(0 until descriptors.length()).map{descriptors.getJSONObject(it)}.single{it.getString("output_id")==id}
   val role=o.getString("role");require(role in listOf("recording","streaming")&&prev.getString("role")==role&&desc.getString("role")==role&&desc.getString("session_id")==sid)
   if(role=="recording")recording=true
   require(prev.getLong("packets")>=0&&prev.getLong("bytes")>=0&&o.getBoolean("complete")&&prev.getBoolean("complete")&&o.getLong("packets")>=maxOf(1,prev.getLong("packets"))&&o.getLong("bytes")>=prev.getLong("bytes"))
   require(o.getString("head").matches(Regex("[0-9a-f]{64}"))&&prev.getString("head").matches(Regex("[0-9a-f]{64}")))
   if(o.getLong("packets")==prev.getLong("packets"))require(same(o,prev))
  };require(recording)
  fun photo(pair:JSONObject){for(k in listOf("original","proof")){val r=pair.getJSONObject(k);require(r.getString("sha256").matches(Regex("[0-9a-f]{64}"))&&r.getLong("bytes") in 4..25000000&&r.getString("path").matches(Regex("images/[a-zA-Z0-9_-]+\\.jpg")))}}
  val claim=e.getString("type")=="claim"
  if(claim){photo(ed.getJSONObject("photo"));require(ed.getLong("captured_at") in c.getLong("at")..e.getLong("at"))}
  else{
   photo(ed.getJSONObject("photo_a"));photo(ed.getJSONObject("photo_b"))
   val aa=ed.getLong("a_at");val ba=ed.getLong("b_at");val response=ed.getLong("response_ms");val pair=ed.getLong("pair_ms")
   require(aa-c.getLong("at") in 0..10000&&ba-aa in 0..3000&&e.getLong("at")>=ba&&response in 0..10000&&pair in 0..3000)
   require(kotlin.math.abs(aa-c.getLong("at")-response)<=250&&kotlin.math.abs(ba-aa-pair)<=250)
  }
  val dual=d.optString("capture_profile")=="CLAPPA-DUAL-v1"
  require(ad.optString("capture_profile")==d.optString("capture_profile"))
  if(dual){require(d.getString("camera")=="front"&&ad.getString("camera_profile")=="front-only"&&d.getString("rear_flash")=="torch")
   if(!claim){val x=ed.getJSONObject("dual");require(x.getString("profile")=="CLAPPA-DUAL-v1"&&x.getString("exposure_synchronization")=="not-established");photo(x.getJSONObject("rear_a"));photo(x.getJSONObject("rear_b"))
    val normal=x.getJSONObject("normal");val lit=x.getJSONObject("illuminated")
    for(g in listOf(normal,lit)){for(k in listOf("front_delivered_ms","rear_delivered_ms","front_sensor_us","rear_sensor_us"))require(g.getLong(k)>=0);require(kotlin.math.abs(g.getLong("front_delivered_ms")-g.getLong("rear_delivered_ms"))<=120);for(k in listOf("front_width","front_height","rear_width","rear_height"))require(g.getInt(k) in 240..4096)}
    for(cam in listOf("front","rear"))require(lit.getLong(cam+"_sensor_us")>normal.getLong(cam+"_sensor_us"))
    val end=maxOf(normal.getLong("front_delivered_ms"),normal.getLong("rear_delivered_ms"));val gap=maxOf(lit.getLong("front_delivered_ms"),lit.getLong("rear_delivered_ms"))-end
    require(minOf(lit.getLong("front_delivered_ms"),lit.getLong("rear_delivered_ms"))>=end&&gap in 0..3000&&kotlin.math.abs(gap-ed.getLong("pair_ms"))<=1)
   }
  }else require(!ed.has("dual")&&!d.has("capture_profile")&&!d.has("rear_flash"))
  root.optJSONObject("identity")?.let{identity->val binding=signed(identity.getJSONObject("binding"));require(binding.getString("profile")=="CLAPPA-TWITCH-BINDING-v1"&&binding.getString("session_id")==sid&&binding.getString("event_sha256")==hash(event)&&binding.getString("identity_sha256").matches(Regex("[0-9a-f]{64}")));identity.optJSONObject("evidence")?.let{require(hash(it)==binding.getString("identity_sha256"))}}
  return Result(root,if(claim)"Additional photo after: "+Prompts.text(choices.prompt,dual) else Prompts.text(choices.prompt,dual),at,key,d,claim)
 }
}
