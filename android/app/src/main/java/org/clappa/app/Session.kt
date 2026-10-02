package org.clappa.app

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import org.json.JSONObject
import org.json.JSONArray
import java.io.ByteArrayOutputStream
import java.io.File

class Session(private val context: Context, val sessionId:String, val recordingId:String, private val descriptors:JSONArray, private val send:(JSONObject)->Unit, val dualView:Boolean=false) {
    val folder=File(context.filesDir,"proof/$sessionId")
    val key=Proof.publicKey()
    private val cameraProfile:String=if(dualView)"front-only" else run {
        val manager=context.getSystemService(Context.CAMERA_SERVICE) as android.hardware.camera2.CameraManager
        val cameras=manager.cameraIdList.map{manager.getCameraCharacteristics(it)}
        val front=cameras.any{it.get(android.hardware.camera2.CameraCharacteristics.LENS_FACING)==android.hardware.camera2.CameraCharacteristics.LENS_FACING_FRONT}
        val rear=cameras.any{it.get(android.hardware.camera2.CameraCharacteristics.LENS_FACING)==android.hardware.camera2.CameraCharacteristics.LENS_FACING_BACK&&it.get(android.hardware.camera2.CameraCharacteristics.FLASH_INFO_AVAILABLE)==true}
        check(front||rear){"No supported challenge camera"};if(front&&rear)"front-rear" else if(front)"front-only" else "rear-only"
    }
    private var seq=0
    private val additionalPhoto=AdditionalPhotoOffer()
    @Synchronized fun canClaim(at:Long=System.currentTimeMillis())=!ended&&pending==null&&additionalPhoto.available(at)
    @Synchronized fun acknowledgeCapture(seq:Int)=additionalPhoto.acknowledgeResponse(seq)
    @Synchronized fun acknowledgeClaim(seq:Int)=additionalPhoto.acknowledgeClaim(seq)
    var head:String?=null;private set
    private var lastAt=0L
    var pending:JSONObject?=null;private set
    var lastSuccessAt=0L;private set
    var lastChallenge="";private set
    var lastIssuedAt=0L;private set
    var ended=false;private set
    var hadFailure=false;private set
    var startDone=false;private set
    var endDone=false;private set
    private var snapshots=JSONArray()
    private var snapshotTime=0L
    private var issuedEvent:JSONObject?=null
    private var armedEvent:JSONObject?=null
    @Volatile var armAcknowledged=false;private set
    @Synchronized fun acknowledgeArm(seq:Int){if(armedEvent?.getJSONObject("payload")?.getInt("seq")==seq)armAcknowledged=true}
    private var responseWindow:ResponseWindow?=null
    @Synchronized fun remainingMillis()=if(pending==null)0L else responseWindow?.remaining(android.os.SystemClock.elapsedRealtime())?:0L
    init {folder.mkdirs();Proof.atomic(File(folder,"session.json"),JSONObject().put("protocol","0.3").put("session_id",sessionId).put("key_id",key.getString("key_id")));Proof.atomic(File(folder,"public-key.json"),key)}
    private val twitchIdentity=TwitchIdentity.stored(context,key.getString("key_id"))
    private fun now()=maxOf(System.currentTimeMillis(),lastAt)
    @Synchronized fun emit(type:String,data:JSONObject,issuedAt:Long?=null):JSONObject {
        check(!ended);val at=issuedAt?:now();check(at>=lastAt);val payload=JSONObject().put("protocol","0.3").put("algorithm","ES256-P1363").put("key_id",key.getString("key_id")).put("session_id",sessionId).put("seq",seq).put("prev",head?:JSONObject.NULL).put("at",at).put("type",type).put("data",data)
        val event=Proof.signed(payload)
        val message=JSONObject().put("type","event").put("event",event)
        if(type=="session-start"&&twitchIdentity!=null)message.put("twitch_identity_linked",true)
        if(type=="challenge-captured"||type=="claim"){
            check(snapshots.length()>0&&android.os.SystemClock.elapsedRealtime()-snapshotTime<3000){"Waiting for fresh OBS media checkpoint"}
            val issued=checkNotNull(issuedEvent)
            val proof=Proof.signed(JSONObject().put("profile","CLAPPA-MEDIA-PROOF-v1").put("algorithm","ES256-P1363").put("key_id",key.getString("key_id"))
                .put("session_id",sessionId).put("recording_id",recordingId).put("event_sha256",Proof.hash(Proof.canonical(event).toByteArray()))
                .put("challenge_sha256",Proof.hash(Proof.canonical(issued).toByteArray())).put("at",at).put("outputs",JSONArray(snapshots.toString())).put("descriptors",descriptors))
            val evidence=JSONObject().put("proof",proof).put("challenge",issued).put("armed",checkNotNull(armedEvent))
            message.put("context",evidence);Proof.atomic(File(folder,"media-proofs/%06d.json".format(seq)),evidence)
            twitchIdentity?.let{identity->
                val binding=Proof.signed(JSONObject().put("profile","CLAPPA-TWITCH-BINDING-v1").put("algorithm","ES256-P1363").put("key_id",key.getString("key_id")).put("session_id",sessionId).put("event_sha256",Proof.hash(Proof.canonical(event).toByteArray())).put("identity_sha256",Proof.hash(Proof.canonical(identity).toByteArray())))
                val record=JSONObject().put("binding",binding).put("evidence",identity)
                message.put("identity",record);Proof.atomic(File(folder,"identities/%06d.json".format(seq)),record)
            }
        }
        val images=JSONObject()
        fun addPair(pair:JSONObject){for(k in listOf("original","proof")){val p=pair.getJSONObject(k).getString("path");images.put(p,Proof.b64(File(folder,p).readBytes()))}}
        if(type=="challenge-captured"){addPair(data.getJSONObject("photo_a"));addPair(data.getJSONObject("photo_b"));data.optJSONObject("dual")?.let{addPair(it.getJSONObject("rear_a"));addPair(it.getJSONObject("rear_b"))}}
        if(type=="claim")addPair(data.getJSONObject("photo"))
        Proof.atomic(File(folder,"events/%06d.json".format(seq)),event);seq++;head=Proof.hash(Proof.canonical(event).toByteArray());lastAt=at
        send(message.put("images",images));return event
    }
    fun start(){emit("session-start",JSONObject().put("recording_id",recordingId).put("outputs",descriptors).put("session_policy","CLAPPA-SESSION-v2").put("claim_window_ms",30000).put("response_profile","CLAPPA-RESPONSE-v1").put("freshness_profile",Quicknet.PROFILE).put("camera_profile",cameraProfile).apply{if(dualView)put("capture_profile","CLAPPA-DUAL-v1")})}
    @Synchronized fun checkpoint(outputs:JSONArray){if(ended)return;require(outputs.length()==descriptors.length());for(i in 0 until outputs.length()){require(outputs.getJSONObject(i).getBoolean("complete"))};snapshots=JSONArray(outputs.toString());snapshotTime=android.os.SystemClock.elapsedRealtime();emit("output-checkpoint",JSONObject().put("outputs",snapshots))}
    @Synchronized fun arm(phase:String,elapsed:Long):Long {
        check(snapshots.length()>0&&android.os.SystemClock.elapsedRealtime()-snapshotTime<3000){"Waiting for fresh OBS media checkpoint"}
        check(pending==null&&!endDone);additionalPhoto.close();check(phase=="start"&&!startDone||phase!="start"&&startDone)
        check(armedEvent==null||issuedEvent!=null){"A challenge is already locked"};val round=Quicknet.futureRound(System.currentTimeMillis());armAcknowledged=false;issuedEvent=null
        armedEvent=emit("challenge-armed",JSONObject().put("camera_profile",cameraProfile).put("challenge_id",Proof.id()).put("phase",phase).put("mapping",ChallengeChoices.MAPPING).put("chain",Quicknet.CHAIN).put("round",round)
            .put("obs",JSONObject().put("recording_id",recordingId).put("outputs",JSONArray(snapshots.toString())).put("elapsed_ms",elapsed)).apply{if(dualView)put("capture_profile","CLAPPA-DUAL-v1")})
        return round
    }
    @Synchronized fun issue(pulse:JSONObject):JSONObject {
        check(armAcknowledged&&pending==null);val armed=checkNotNull(armedEvent);val a=armed.getJSONObject("payload").getJSONObject("data")
        require(pulse.getLong("round")==a.getLong("round"));val at=now();require(at in pulse.getLong("at")..pulse.getLong("at")+10000){"Freshness pulse arrived too late"}
        val choices=ChallengeChoices.fromSeed(Quicknet.seed(armed,pulse),cameraProfile,ChallengeChoices.MAPPING);responseWindow=ResponseWindow(android.os.SystemClock.elapsedRealtime())
        val data=JSONObject().put("challenge_id",a.getString("challenge_id")).put("prompt_id",choices.prompt).put("phase",a.getString("phase")).put("response_window_ms",10000).put("pair_window_ms",3000).put("cadence",choices.cadence).put("slot_ms",choices.slotMs).put("camera",choices.camera).put("flash",choices.flash).put("pitches",JSONArray(choices.pitches)).put("qr_profile","hashes-v1").put("obs",a.getJSONObject("obs"))
            .put("freshness",JSONObject().put("profile",Quicknet.PROFILE).put("arm_sha256",Proof.hash(Proof.canonical(armed).toByteArray())).put("pulse",pulse))
        if(dualView)data.put("capture_profile","CLAPPA-DUAL-v1").put("rear_flash","torch")
        issuedEvent=emit("challenge-issued",data,at);lastIssuedAt=at;pending=data;return data
    }
    private fun imagePair(file:File,name:String):JSONObject {
        val imageDir=File(folder,"images").apply{mkdirs()};val original=File(imageDir,"$name-original.jpg");file.copyTo(original,true)
        val bounds=BitmapFactory.Options().apply{inJustDecodeBounds=true};BitmapFactory.decodeFile(file.path,bounds)
        var sample=1;while(bounds.outWidth/sample>1024||bounds.outHeight/sample>1024)sample*=2
        val bitmap=BitmapFactory.decodeFile(file.path,BitmapFactory.Options().apply{inSampleSize=sample})?:error("Cannot decode capture")
        val w=64;val h=maxOf(1,(bitmap.height.toFloat()/bitmap.width*w).toInt());val small=Bitmap.createScaledBitmap(bitmap,w,h,true)
        val out=ByteArrayOutputStream();small.compress(Bitmap.CompressFormat.JPEG,35,out);bitmap.recycle();if(small!==bitmap)small.recycle()
        val compact=File(imageDir,"$name-proof.jpg");compact.writeBytes(out.toByteArray());check(compact.length()<=2500){"Proof image too large"}
        fun ref(f:File)=JSONObject().put("path","images/${f.name}").put("bytes",f.length()).put("sha256",Proof.hash(f.readBytes()))
        return JSONObject().put("original",ref(original)).put("proof",ref(compact))
    }
    @Synchronized fun accept(a:File,b:File,aAt:Long,bAt:Long,aMono:Long,bMono:Long,dual:JSONObject?=null){val p=checkNotNull(pending);val limit=p.getInt("pair_window_ms");check(bAt-aAt in 0..limit){"The camera took too long between photos (${bAt-aAt} ms; limit $limit ms)"};val id=p.getString("challenge_id");val window=checkNotNull(responseWindow);val responseMs=window.first(aMono);val pairMs=window.pair(aMono,bMono,p.getString("camera")=="front",limit.toLong())
        check(aAt-lastIssuedAt in 0..10000 && kotlin.math.abs(aAt-lastIssuedAt-responseMs)<=250 && kotlin.math.abs(bAt-aAt-pairMs)<=250){"Phone clocks changed during capture"}
        check(dualView==(dual!=null)){"Two-camera proof is missing"}
        val e=emit("challenge-captured",JSONObject().put("challenge_id",id).put("photo_a",imagePair(a,"$seq-a")).put("photo_b",imagePair(b,"$seq-b")).put("a_at",aAt).put("b_at",bAt).put("response_ms",responseMs).put("pair_ms",pairMs).apply{if(dual!=null)put("dual",dual)});lastSuccessAt=e.getJSONObject("payload").getLong("at");lastChallenge=id;additionalPhoto.open(e.getJSONObject("payload").getInt("seq"),lastSuccessAt)
        if(p.getString("phase")=="start")startDone=true;if(p.getString("phase")=="end")endDone=true;pending=null
    }
    @Synchronized fun acceptDual(result:JSONObject){
        check(dualView&&pending!=null)
        val name=result.getString("folder");require(name.matches(Regex("dual-[0-9a-f]{32}")))
        val dir=File(context.cacheDir,name);val normal=result.getJSONObject("normal");val lit=result.getJSONObject("illuminated")
        for(g in listOf(normal,lit))require(kotlin.math.abs(g.getLong("front_delivered_ms")-g.getLong("rear_delivered_ms"))<=120)
        require(lit.getLong("front_sensor_us")>normal.getLong("front_sensor_us")&&lit.getLong("rear_sensor_us")>normal.getLong("rear_sensor_us"))
        val extra=JSONObject().put("profile","CLAPPA-DUAL-v1").put("rear_a",imagePair(File(dir,"rear-a.jpg"),"$seq-rear-a")).put("rear_b",imagePair(File(dir,"rear-b.jpg"),"$seq-rear-b")).put("normal",normal).put("illuminated",lit).put("exposure_synchronization","not-established")
        try{accept(File(dir,"front-a.jpg"),File(dir,"front-b.jpg"),result.getLong("a_at"),result.getLong("b_at"),result.getLong("a_mono"),result.getLong("b_mono"),extra)}finally{dir.deleteRecursively()}
    }
    @Synchronized fun fail(reason:String){val p=pending?:if(issuedEvent==null)armedEvent?.getJSONObject("payload")?.getJSONObject("data") else null;p?:return;emit("challenge-failed",JSONObject().put("challenge_id",p.getString("challenge_id")).put("reason",reason));pending=null;hadFailure=true;if(p.getString("phase")=="start")startDone=true;if(p.getString("phase")=="end")endDone=true;armedEvent=null;issuedEvent=null;lastSuccessAt=0;additionalPhoto.close()}
    @Synchronized fun claim(file:File,at:Long){
        check(canClaim(at)){"The additional-photo offer has ended"}
        val before=seq
        try{emit("claim",JSONObject().put("challenge_id",lastChallenge).put("photo",imagePair(file,"$seq-claim")).put("captured_at",at))}
        finally{
            // emit advances the local signed chain before queuing transport. Never sign another
            // claim after that point, even if enqueueing throws or the receipt is lost.
            if(seq>before){additionalPhoto.commit(before);lastSuccessAt=0}
        }
    }
    @Synchronized fun finish(alreadyClosed:Boolean=false){check((alreadyClosed||startDone&&endDone)&&pending==null);emit("session-end",JSONObject());ended=true;if(!alreadyClosed)send(JSONObject().put("type","stop-request").put("session_id",sessionId))}
    @Synchronized fun seal(request:JSONObject){check(ended);check(request.getString("recording_id")==recordingId&&request.getString("session_id")==sessionId&&request.getString("head")==head&&request.getInt("event_count")==seq)
        val m=request.getJSONObject("media");require(m.getLong("bytes")>0&&m.getString("sha256").matches(Regex("[0-9a-f]{64}")));require(!m.getString("name").contains(Regex("[/\\\\:]")))
        val terminal=request.getJSONArray("outputs");require(terminal.length()==descriptors.length());for(i in 0 until terminal.length()){require(terminal.getJSONObject(i).getBoolean("complete")&&terminal.getJSONObject(i).getLong("packets")>0)}
        val payload=JSONObject().put("protocol","0.3").put("algorithm","ES256-P1363").put("key_id",key.getString("key_id")).put("session_id",sessionId).put("type","final-seal").put("at",now()).put("event_count",seq).put("head",head).put("recording_id",recordingId).put("outputs",terminal).put("media",m)
        val seal=Proof.signed(payload);Proof.atomic(File(folder,"final-seal.json"),seal);send(JSONObject().put("type","final-seal").put("seal",seal))
    }
}
