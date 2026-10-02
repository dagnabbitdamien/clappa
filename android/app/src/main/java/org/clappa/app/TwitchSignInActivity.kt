package org.clappa.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.*
import org.json.JSONObject

class TwitchSignInActivity:ComponentActivity(){
 private var receiver:TwitchCallback?=null
 private var receiverJob:Job?=null
 private var message by mutableStateOf("Show your Twitch name on your stream’s proofs.")
 private var busy by mutableStateOf(false)
 override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState);enableEdgeToEdge(statusBarStyle=androidx.activity.SystemBarStyle.dark(0xff24231f.toInt()),navigationBarStyle=androidx.activity.SystemBarStyle.dark(0xff24231f.toInt()));Proof.initialize(this)
  setContent{ClappaScreenTheme{Column(Modifier.fillMaxSize().background(Slate).safeDrawingPadding().verticalScroll(rememberScrollState()).padding(24.dp),verticalArrangement=Arrangement.Center){MenuStripe();Spacer(Modifier.height(16.dp));Wordmark(size=36);Text("Your Twitch account",style=MaterialTheme.typography.headlineSmall,modifier=Modifier.padding(vertical=16.dp));Text(message)
   Button(onClick={begin()},enabled=!busy,modifier=Modifier.padding(top=24.dp).fillMaxWidth()){Text("Sign in with Twitch")}
   TextButton(onClick={TwitchIdentity.clear(this@TwitchSignInActivity);message="Twitch identity removed from future sessions."},enabled=!busy){Text("Remove linked account")}
   TextButton(onClick={finish()}){Text("Back")}
  }}}
  TwitchIdentity.stored(this,Proof.publicKey().getString("key_id"))?.let{saved->lifecycleScope.launch{try{val who=withContext(Dispatchers.IO){TwitchIdentity.verify(this@TwitchSignInActivity,saved,Proof.publicKey().getString("key_id"))};message="✓ ${who.name} is linked."}catch(_:Exception){message="A Twitch account link is saved, but its signature could not be checked now. Connect to the internet to check it, or sign in again."}}}
 }
 private fun begin(){try{val client=TwitchIdentity.config(this).getString("client_id");check(client.isNotBlank()){"Twitch sign-in will be available after the CLAPPA application registration is configured."}
  val key=Proof.publicKey().getString("key_id");val salt=Proof.id()+Proof.id();val state=Proof.id()+Proof.id()
  getSharedPreferences("twitch-pending",MODE_PRIVATE).edit().putString("state",state).putString("salt",salt).putString("key",key).putLong("created",System.currentTimeMillis()).commit()
  val url=Uri.parse("https://id.twitch.tv/oauth2/authorize").buildUpon().appendQueryParameter("client_id",client).appendQueryParameter("redirect_uri",TwitchIdentity.REDIRECT).appendQueryParameter("response_type","id_token").appendQueryParameter("scope","openid").appendQueryParameter("state",state).appendQueryParameter("nonce",TwitchIdentity.nonce(key,salt)).appendQueryParameter("force_verify","true").appendQueryParameter("claims","{\"id_token\":{\"preferred_username\":null}}").build()
  receiver?.close();receiverJob?.cancel();val listening=TwitchCallback();receiver=listening
  receiverJob=lifecycleScope.launch{try{val response=withContext(Dispatchers.IO){listening.awaitResponse()};busy=false;callback(Uri.parse(TwitchIdentity.REDIRECT+"/#"+response))}catch(e:Exception){if(e !is CancellationException){busy=false;message="Sign-in did not finish. Please try again."}}finally{listening.close();if(receiver===listening)receiver=null}}
  busy=true;startActivity(Intent(Intent.ACTION_VIEW,url));message="Complete sign-in in your browser, then return here."
 }catch(e:Exception){receiver?.close();receiverJob?.cancel();busy=false;message="Could not start Twitch sign-in. Close any other local sign-in attempt and try again."}}
 private fun callback(uri:Uri){if(busy)return;try{
  require(uri.scheme=="http"&&uri.host=="localhost"&&uri.path=="/"&&uri.port==3000&&uri.userInfo==null)
  val p=getSharedPreferences("twitch-pending",MODE_PRIVATE);val created=p.getLong("created",0);require(System.currentTimeMillis()-created in 0..600000)
  val params=Uri.parse("https://callback.invalid/?"+(uri.encodedFragment?:uri.encodedQuery?:""));for(name in params.queryParameterNames)require(params.getQueryParameters(name).size==1)
  require(params.getQueryParameter("state")==p.getString("state",null)&&p.contains("state"))
  val salt=checkNotNull(p.getString("salt",null));val key=checkNotNull(p.getString("key",null));p.edit().clear().commit()
  require(key==Proof.publicKey().getString("key_id"));check(params.getQueryParameter("error")==null){"Twitch sign-in was cancelled."}
  val evidence=JSONObject().put("profile",TwitchIdentity.PROFILE).put("client_id",TwitchIdentity.config(this).getString("client_id")).put("salt",salt).put("id_token",checkNotNull(params.getQueryParameter("id_token")))
  busy=true;message="Checking Twitch's signature…"
  lifecycleScope.launch{try{val who=withContext(Dispatchers.IO){TwitchIdentity.verify(this@TwitchSignInActivity,evidence,key,true)};TwitchIdentity.save(this@TwitchSignInActivity,key,evidence);message="✓ ${who.name} is linked."}catch(_:Exception){message="Twitch identity could not be verified. Please sign in again."}finally{busy=false}}
 }catch(e:Exception){message=e.message?:"Unexpected sign-in response. Please try again."}}
 override fun onDestroy(){receiver?.close();receiverJob?.cancel();super.onDestroy()}
}
