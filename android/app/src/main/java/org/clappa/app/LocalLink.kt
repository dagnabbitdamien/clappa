package org.clappa.app

import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import org.json.JSONArray
import java.net.*
import java.security.SecureRandom
import java.security.cert.X509Certificate
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import javax.net.ssl.*

class LocalLink(private val onMessage:(JSONObject)->Unit,private val onError:(String)->Unit) {
    private val sender=Executors.newSingleThreadExecutor()
    private val poller=Executors.newSingleThreadScheduledExecutor()
    private class Connection(val generation:Int,val client:OkHttpClient,var url:String,val token:String,val pin:String){
        @Volatile var active=false
        var cursor=0L
        var failures=0
    }
    @Volatile private var current:Connection?=null
    private var generation=0
    init {poller.scheduleWithFixedDelay({current?.let{if(it.active)poll(it)}},0,250,TimeUnit.MILLISECONDS)}
    fun connect(pairing:String){
        val p=JSONObject(pairing);val target=p.getString("url");val uri=URI(target)
        require(uri.scheme=="https"&&uri.host!=null&&uri.userInfo==null&&p.optString("transport")=="https-poll-v1"){"Unsupported pairing code"}
        val pin=p.getString("cert_sha256");require(pin.matches(Regex("[0-9a-f]{64}")))
        val token=p.getString("token");require(token.isNotBlank())
        disconnect()
        val trust=object:X509TrustManager {
            override fun getAcceptedIssuers()=emptyArray<X509Certificate>()
            override fun checkClientTrusted(c:Array<out X509Certificate>,a:String)=error("Client cert unsupported")
            override fun checkServerTrusted(c:Array<out X509Certificate>,a:String){if(c.isEmpty()||Proof.hash(c[0].encoded)!=pin)throw java.security.cert.CertificateException("Pairing certificate mismatch");c[0].checkValidity()}
        }
        val ssl=SSLContext.getInstance("TLS").apply{init(null,arrayOf(trust),SecureRandom())}
        val client=OkHttpClient.Builder().sslSocketFactory(ssl.socketFactory,trust).hostnameVerifier{_,s->Proof.hash(s.peerCertificates[0].encoded)==pin}.proxy(Proxy.NO_PROXY).connectTimeout(4,TimeUnit.SECONDS).readTimeout(15,TimeUnit.SECONDS).callTimeout(30,TimeUnit.SECONDS).build()
        val c=Connection(++generation,client,target,token,pin);current=c
        sender.execute {
            try{
                try{hello(c)}catch(e:java.io.IOException){
                    if(current!==c)return@execute
                    val found=discover(c,uri.port.takeIf{it>0}?:443)?:throw e
                    c.url=found;hello(c)
                }
                if(current===c)c.active=true
            }catch(e:Exception){failed(e,c)}
        }
    }
    private fun hello(c:Connection)=post(JSONObject().put("type","hello").put("key",Proof.publicKey()),c,true)
    private fun request(c:Connection,path:String)=Request.Builder().url(c.url+path).header("Authorization","Bearer ${c.token}")
    private fun post(o:JSONObject,c:Connection,hello:Boolean=false){
        if(current!==c)return
        val body=Proof.canonical(o).toRequestBody("application/json".toMediaType())
        val call=c.client.newCall(request(c,"/message").post(body).build());if(hello)call.timeout().timeout(8,TimeUnit.SECONDS)
        call.execute().use{check(it.isSuccessful){if(it.code==401)"pairing code has changed" else "OBS could not accept the connection (${it.code})"}}
    }
    private fun poll(c:Connection){try{
        c.client.newCall(request(c,"/poll?after=${c.cursor}").build()).execute().use{r->
            check(r.isSuccessful){if(r.code==401)"pairing code has changed" else "OBS could not read connection (${r.code})"}
            val list=JSONArray(r.body!!.string());if(current!==c)return;c.failures=0
            for(i in 0 until list.length()){if(current!==c)return;val row=list.getJSONObject(i);val id=row.getLong("id");if(id>c.cursor){val message=row.getJSONObject("message");if(message.optString("type")=="paired")message.put("connection_url",c.url);onMessage(message);c.cursor=id}}
        }
    }catch(e:Exception){if(current!==c)return;if(e is java.io.IOException&&e !is SSLException&&++c.failures<3)return;failed(e,c)}}
    private fun failed(e:Exception,c:Connection){
        if(current!==c)return;c.active=false
        android.util.Log.w("CLAPPA","Transport stopped: "+e.javaClass.simpleName,e)
        val changed=e is SSLException||e.message?.contains("pairing code has changed")==true
        onError(if(changed)"The pairing code has changed. Scan the code currently shown in OBS." else "OBS isn't reachable. Open OBS and check that both devices can access the same local network. If a VPN is on, allow local network access in its settings.")
    }
    // Broadcast carries no bearer token. An answer cannot bypass the TLS pin, even if spoofed.
    private fun discover(c:Connection,port:Int):String? {
        val nonce=java.util.UUID.randomUUID().toString().replace("-","")
        val data=JSONObject().put("type","CLAPPA-DISCOVER-v1").put("pin",c.pin).put("nonce",nonce).toString().toByteArray()
        return runCatching{DatagramSocket().use{s->
            s.broadcast=true;s.soTimeout=250
            val targets=mutableSetOf(InetAddress.getByName("255.255.255.255"))
            NetworkInterface.getNetworkInterfaces()?.toList()?.filter{it.isUp&&!it.isLoopback}?.forEach{nic->nic.interfaceAddresses.forEach{it.broadcast?.let(targets::add)}}
            targets.forEach{runCatching{s.send(DatagramPacket(data,data.size,it,port))}}
            val deadline=System.nanoTime()+TimeUnit.MILLISECONDS.toNanos(1500)
            while(current===c&&System.nanoTime()<deadline){
                val packet=DatagramPacket(ByteArray(1024),1024)
                try{s.receive(packet);val reply=JSONObject(String(packet.data,0,packet.length))
                    if(reply.optString("type")=="CLAPPA-FOUND-v1"&&reply.optString("nonce")==nonce&&reply.optInt("port")==port&&packet.address.isSiteLocalAddress)return@use "https://${packet.address.hostAddress}:$port"
                }catch(_:SocketTimeoutException){}catch(_:org.json.JSONException){}
            };null
        }}.getOrNull()
    }
    fun send(o:JSONObject){val c=checkNotNull(current){"Phone is not connected"};check(c.active){"Phone is not connected"};sender.execute{try{post(o,c)}catch(e:Exception){failed(e,c)}}}
    fun disconnect(){val old=current;current=null;old?.active=false;old?.client?.dispatcher?.cancelAll()}
    fun close(){disconnect();sender.shutdownNow();poller.shutdownNow()}
}
