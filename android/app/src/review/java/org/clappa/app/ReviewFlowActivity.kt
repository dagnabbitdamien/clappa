package org.clappa.app

import android.os.Bundle
import android.util.Base64
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay

// Exercises the real camera/transport flow with the actual beacon-derived challenge.
// This class is absent from the installable debug APK.
class ReviewFlowActivity:MainActivity(){

 override fun onCreate(savedInstanceState:Bundle?){getSharedPreferences("capture",MODE_PRIVATE).edit().putBoolean("dual",intent.getBooleanExtra("dual",false)).commit();super.onCreate(savedInstanceState)
  intent.getStringExtra("pairingData")?.let { encoded->lifecycleScope.launch{delay(1000);beginPairing(String(Base64.decode(encoded,Base64.URL_SAFE),Charsets.UTF_8))} }
  if(intent.getBooleanExtra("chatFixture",false))lifecycleScope.launch{
   // Local fixture only: use the production invitation handler, never impersonate live Twitch.
   val phaseField=MainActivity::class.java.getDeclaredField("phase\$delegate").apply{isAccessible=true}
   val sessionField=MainActivity::class.java.getDeclaredField("session\$delegate").apply{isAccessible=true}
   repeat(600){
    val phase=(phaseField.get(this@ReviewFlowActivity) as androidx.compose.runtime.State<*>).value
    val s=(sessionField.get(this@ReviewFlowActivity) as androidx.compose.runtime.State<*>).value as? Session
    if(phase==BoardPhase.READY&&s!=null){
     val m=org.json.JSONObject().put("type","chat-request").put("source","twitch").put("request_id","review-chat-1").put("session_id",s.sessionId).put("viewers",3).put("expires_at",System.currentTimeMillis()+60000)
     receiveChatInvitation(m);receiveChatInvitation(m);return@launch
    };delay(100)
   }
  }
 }
}
