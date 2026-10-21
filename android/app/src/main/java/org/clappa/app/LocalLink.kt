package org.clappa.app

import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import org.json.JSONArray
import java.net.URI
import java.security.SecureRandom
import java.security.cert.X509Certificate
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import javax.net.ssl.*

class LocalLink(private val onMessage:(JSONObject)->Unit,private val onError:(String)->Unit) {
    private val sender=Executors.newSingleThreadExecutor()
    private val poller=Executors.newSingleThreadScheduledExecutor()
    @Volatile private var generation=0
    @Volatile private var active=false
    private var client:OkHttpClient?=null
    private var url=""
    private var token=""
    private var cursor=0L
    private var pollFailures=0
    init {poller.scheduleWithFixedDelay({if(active)poll()},0,250,TimeUnit.MILLISECONDS)}
    fun connect(pairing:String){
        val p=JSONObject(pairing);val target=p.getString("url")
        require(URI(target).scheme=="https"&&p.optString("transport")=="https-poll-v1"){"This pairing code is not supported. Update CLAPPA on both devices and scan the current OBS pairing code."}
        val pin=p.getString("cert_sha256");require(pin.matches(Regex("[0-9a-f]{64}")))
        active=false;generation++;client?.dispatcher?.cancelAll();url=target;token=p.getString("token");cursor=0;pollFailures=0
        val trust=object:X509TrustManager {
            override fun getAcceptedIssuers()=emptyArray<X509Certificate>()
            override fun checkClientTrusted(c:Array<out X509Certificate>,a:String)=error("Client cert unsupported")
            override fun checkServerTrusted(c:Array<out X509Certificate>,a:String){require(c.isNotEmpty()&&Proof.hash(c[0].encoded)==pin){"Pairing certificate mismatch"};c[0].checkValidity()}
        }
        val ssl=SSLContext.getInstance("TLS").apply{init(null,arrayOf(trust),SecureRandom())}
        client=OkHttpClient.Builder().sslSocketFactory(ssl.socketFactory,trust).hostnameVerifier{_,s->Proof.hash(s.peerCertificates[0].encoded)==pin}.connectTimeout(6,TimeUnit.SECONDS).readTimeout(15,TimeUnit.SECONDS).callTimeout(30,TimeUnit.SECONDS).build()
        val g=generation
        sender.execute {try{post(JSONObject().put("type","hello").put("key",Proof.publicKey()),g);if(g==generation)active=true}catch(e:Exception){failed(e,g)}}
    }
    private fun request(path:String)=Request.Builder().url(url+path).header("Authorization","Bearer $token")
    private fun post(o:JSONObject,g:Int){if(g!=generation)return;val body=Proof.canonical(o).toRequestBody("application/json".toMediaType());client!!.newCall(request("/message").post(body).build()).execute().use{check(it.isSuccessful){"OBS rejected the connection (${it.code}). Scan the current QR again."}}}
    private fun poll(){val g=generation;try{client!!.newCall(request("/poll?after=$cursor").build()).execute().use{r->check(r.isSuccessful){"OBS pairing expired. Scan its QR again."};val list=JSONArray(r.body!!.string());if(g!=generation)return;pollFailures=0;for(i in 0 until list.length()){val row=list.getJSONObject(i);val id=row.getLong("id");if(id>cursor){onMessage(row.getJSONObject("message"));cursor=id}}}}catch(e:Exception){if(e is java.io.IOException&&e !is javax.net.ssl.SSLHandshakeException&&++pollFailures<3)return;failed(e,g)}}
    private fun failed(e:Exception,g:Int){if(g!=generation)return;active=false;android.util.Log.w("CLAPPA","Transport stopped: "+e.javaClass.simpleName,e);val changed=e is javax.net.ssl.SSLException||e.message?.contains("pairing",true)==true||e.message?.contains("rejected",true)==true;onError(if(changed)"This pairing code has changed. Open Settings → Connection options and scan the current OBS code" else "Connection interrupted. Check Wi-Fi, then reconnect")}
    fun send(o:JSONObject){check(active){"Phone is not connected"};val g=generation;sender.execute{try{post(o,g)}catch(e:Exception){failed(e,g)}}}
    fun disconnect(){active=false;generation++;client?.dispatcher?.cancelAll()}
    fun close(){disconnect();sender.shutdownNow();poller.shutdownNow()}
}

