package org.clappa.app

import android.content.Context
import org.json.JSONObject
import okhttp3.OkHttpClient
import okhttp3.Request
import java.math.BigInteger
import java.security.KeyFactory
import java.security.Signature
import java.security.spec.RSAPublicKeySpec
import java.util.concurrent.TimeUnit

internal object TwitchIdentity {
 const val PROFILE="CLAPPA-TWITCH-OIDC-v1"
 const val REDIRECT="http://localhost:3000"
 private val http=OkHttpClient.Builder().followRedirects(false).connectTimeout(5,TimeUnit.SECONDS).readTimeout(5,TimeUnit.SECONDS).callTimeout(8,TimeUnit.SECONDS).build()
 private var trustedKeys:JSONObject?=null
 private var keysAt=0L
 data class Identity(val id:String,val name:String,val issuedAt:Long,val expiresAt:Long,val digest:String)
 fun config(ctx:Context)=ctx.assets.open("twitch-config.json").bufferedReader().use{JSONObject(it.readText())}
 fun nonce(keyId:String,salt:String):String {require(keyId.matches(Regex("[0-9a-f]{64}"))&&salt.matches(Regex("[0-9a-f]{64}")));return Proof.hash("CLAPPA-TWITCH-OIDC-v1\u0000$keyId\u0000$salt".toByteArray())}
 fun stored(ctx:Context,keyId:String):JSONObject?=runCatching{val p=ctx.getSharedPreferences("twitch-identity",Context.MODE_PRIVATE);if(p.getString("key_id",null)!=keyId)null else p.getString("evidence",null)?.let{StrictJson.parse(it)}}.getOrNull()
 fun clear(ctx:Context){ctx.getSharedPreferences("twitch-identity",Context.MODE_PRIVATE).edit().clear().apply()}
 fun save(ctx:Context,keyId:String,evidence:JSONObject){check(ctx.getSharedPreferences("twitch-identity",Context.MODE_PRIVATE).edit().putString("key_id",keyId).putString("evidence",evidence.toString()).commit())}
 @Synchronized private fun keys():JSONObject {
  if(trustedKeys!=null&&System.currentTimeMillis()-keysAt<3600000)return trustedKeys!!
  http.newCall(Request.Builder().url("https://id.twitch.tv/oauth2/keys").build()).execute().use{r->
   check(r.isSuccessful){"Twitch signing keys are unavailable"};val stream=checkNotNull(r.body).byteStream();val bytes=stream.readBytesBounded(65536)
   return StrictJson.parse(String(bytes,Charsets.UTF_8)).also{trustedKeys=it;keysAt=System.currentTimeMillis()}
  }
 }
 private fun java.io.InputStream.readBytesBounded(limit:Int):ByteArray{val out=java.io.ByteArrayOutputStream();val buffer=ByteArray(4096);while(true){val n=read(buffer);if(n<0)break;require(out.size()+n<=limit);out.write(buffer,0,n)};return out.toByteArray()}
 fun verify(ctx:Context,evidence:JSONObject,keyId:String,login:Boolean=false):Identity {
  require(evidence.keys().asSequence().toSet()==setOf("profile","client_id","salt","id_token")&&evidence.getString("profile")==PROFILE)
  val client=config(ctx).getString("client_id");check(client.isNotBlank()){"Twitch sign-in is not configured in this build"}
  require(evidence.getString("client_id")==client)
  val token=evidence.getString("id_token");require(token.length in 100..8192);val parts=token.split('.');require(parts.size==3)
  fun part(i:Int):ByteArray {val b=Proof.unb64(parts[i]);require(Proof.b64(b)==parts[i]);return b}
  val header=StrictJson.parse(String(part(0),Charsets.UTF_8));val claims=StrictJson.parse(String(part(1),Charsets.UTF_8))
  require(header.getString("alg")=="RS256"&&!header.has("crit")&&!header.has("jku")&&!header.has("jwk")&&!header.has("x5u"))
  val kid=header.getString("kid");val list=keys().getJSONArray("keys");val matches=(0 until list.length()).map{list.getJSONObject(it)}.filter{it.optString("kid")==kid}
  require(matches.size==1){"Twitch signing key is not currently available"};val jwk=matches.single();require(jwk.getString("kty")=="RSA"&&jwk.optString("alg","RS256")=="RS256"&&jwk.optString("use","sig")=="sig")
  val n=BigInteger(1,Proof.unb64(jwk.getString("n")));val e=BigInteger(1,Proof.unb64(jwk.getString("e")));require(n.bitLength() in 2048..4096&&e==BigInteger.valueOf(65537))
  val public=KeyFactory.getInstance("RSA").generatePublic(RSAPublicKeySpec(n,e))
  require(Signature.getInstance("SHA256withRSA").run{initVerify(public);update((parts[0]+"."+parts[1]).toByteArray(Charsets.US_ASCII));verify(part(2))}){"Twitch signature did not verify"}
  require(claims.getString("iss")=="https://id.twitch.tv/oauth2"&&claims.get("aud")==client&&claims.optString("azp",client)==client)
  require(claims.getString("nonce")==nonce(keyId,evidence.getString("salt"))){"Twitch identity is bound to another signing key"}
  val id=claims.getString("sub");val name=claims.getString("preferred_username");require(id.matches(Regex("[0-9]{1,30}"))&&name.length in 1..64&&name.none{it.code<32||it.code==127||it.code in 0x202a..0x202e||it.code in 0x2066..0x2069})
  val iat=claims.getLong("iat");val exp=claims.getLong("exp");val now=System.currentTimeMillis()/1000
  require(iat in 0..now+60&&exp>iat&&exp<=8640000000000L);if(login)require(now<exp){"Twitch sign-in expired; sign in again"}
  return Identity(id,name,iat*1000,exp*1000,Proof.hash(token.toByteArray(Charsets.US_ASCII)))
 }
}
