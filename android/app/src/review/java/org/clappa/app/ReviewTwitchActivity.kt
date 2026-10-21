package org.clappa.app
import android.os.Bundle
import android.content.Intent
import androidx.activity.ComponentActivity
import org.json.JSONObject

/** Synthetic issuer key injection exists exclusively in this unshipped review activity. */
class ReviewTwitchActivity:ComponentActivity(){
 override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState)
  val fixture=StrictJson.parse(assets.open("twitch-test-fixture.json").bufferedReader().use{it.readText()})
  val keys=TwitchIdentity::class.java.getDeclaredField("trustedKeys").apply{isAccessible=true}
  val time=TwitchIdentity::class.java.getDeclaredField("keysAt").apply{isAccessible=true}
  var checked=0
  try{keys.set(null,fixture.getJSONObject("jwks"));time.setLong(null,System.currentTimeMillis())
   val cases=fixture.getJSONArray("cases");for(i in 0 until cases.length()){val c=cases.getJSONObject(i);val valid=runCatching{TwitchIdentity.verify(this,c.getJSONObject("evidence"),c.getString("key_id"))}.isSuccess;check(valid==c.getBoolean("valid")){c.getString("name")};checked++}
   for(bad in listOf("{\"a\":1,\"\\u0061\":2}","{\"a\":\"\\q\"}","{\"a\":\"\\ud800\"}","{\"a\":1e3}","{\"a\":1} trailing")){check(runCatching{StrictJson.parse(bad)}.isFailure);checked++}
   Proof.atomic(java.io.File(filesDir,"twitch-review.json"),JSONObject().put("identity_cases",10).put("strict_json_rejections",5).put("passed",checked))
  }finally{keys.set(null,null);time.setLong(null,0)}
  startActivity(Intent(this,TwitchSignInActivity::class.java));finish()
 }
}
