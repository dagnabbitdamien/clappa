package org.clappa.app
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.*
import org.json.JSONObject
import java.io.File

/** Test-only package and keys. Never exported by the installable APK. */
class ReviewIdentityActivity:ComponentActivity(){
 override fun onCreate(state:Bundle?){super.onCreate(state);lifecycleScope.launch(Dispatchers.IO){
  val result=runCatching{
   Proof.initialize(this@ReviewIdentityActivity);Proof.ensureKey();val old=Proof.publicKey().getString("key_id");Proof.ensureKey();check(Proof.publicKey().getString("key_id")==old)
   Proof.createPortableIdentity();val id=Proof.publicKey().getString("key_id");check(id!=old&&Proof.canExportIdentity())
   val password="review-only-backup-password".toCharArray();val backup=Proof.exportIdentity(password)
   check(runCatching{PortableIdentity.read(backup,"wrong-password".toCharArray())}.isFailure)
   Proof.importIdentity(backup,password);check(Proof.publicKey().getString("key_id")==id&&Proof.canExportIdentity())
   val again=Proof.exportIdentity(password);check(PortableIdentity.read(again,password).certificate.publicKey.encoded.contentEquals(PortableIdentity.read(backup,password).certificate.publicKey.encoded))
   File(filesDir,"review-public.json").writeText(Proof.publicKey().toString());File(filesDir,"review-signature.json").writeText(Proof.signed(JSONObject().put("test","identity round trip")).toString())
   backup.fill(0);again.fill(0);password.fill('\u0000');JSONObject().put("passed",true).put("key_id",id).put("checks","preserve existing; generate; Android Keystore wrap; password export; wrong password; restore; same public code; re-export; sign")
  }.getOrElse{JSONObject().put("passed",false).put("error",it.stackTraceToString())}
  File(filesDir,"review-identity.json").writeText(result.toString(2));withContext(Dispatchers.Main){finish()}
 }}
}
