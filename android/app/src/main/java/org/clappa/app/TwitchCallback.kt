package org.clappa.app

import java.net.InetAddress
import java.net.ServerSocket
import java.net.SocketTimeoutException
import java.util.concurrent.atomic.AtomicBoolean

/** Short-lived browser callback, bound exclusively to this device's loopback interface. */
internal class TwitchCallback : AutoCloseable {
 private val closed=AtomicBoolean(false)
 private val server=ServerSocket(3000,4,InetAddress.getByName("127.0.0.1")).apply{soTimeout=1000}
 fun awaitResponse():String {
  val until=System.nanoTime()+600_000_000_000L
  while(!closed.get()&&System.nanoTime()<until){
   val socket=try{server.accept()}catch(_:SocketTimeoutException){continue}
   socket.use{s->s.soTimeout=3000
    try{
     val input=s.getInputStream()
     fun line():String {val out=StringBuilder();while(true){val b=input.read();require(b>=0&&out.length<8192);if(b==10)break;out.append(b.toChar())};return out.toString().removeSuffix("\r")}
     val request=line().split(' ');require(request.size==3&&request[2]=="HTTP/1.1")
     val headers=mutableMapOf<String,String>();var size=0
     while(true){val l=line();if(l.isEmpty())break;size+=l.length;require(size<=16384);val i=l.indexOf(':');require(i>0);val k=l.substring(0,i).lowercase();require(!headers.containsKey(k));headers[k]=l.substring(i+1).trim()}
     require(headers["host"]=="localhost:3000")
     fun reply(body:String,type:String="text/html; charset=utf-8") {val bytes=body.toByteArray();val head="HTTP/1.1 200 OK\r\nContent-Type: $type\r\nContent-Length: ${bytes.size}\r\nCache-Control: no-store\r\nReferrer-Policy: no-referrer\r\nX-Content-Type-Options: nosniff\r\nContent-Security-Policy: default-src 'none'; script-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'\r\nConnection: close\r\n\r\n";s.getOutputStream().apply{write(head.toByteArray());write(bytes);flush()}}
     if(request[0]=="GET"&&request[1].substringBefore('?')=="/"){
      reply("""<!doctype html><meta name="viewport" content="width=device-width"><title>CLAPPA · Twitch sign-in</title><h1>CLAPPA</h1><p id="status">Returning your sign-in to CLAPPA…</p><script>const data=location.hash.slice(1)||location.search.slice(1);history.replaceState(null,'','/');if(data){fetch('/complete',{method:'POST',headers:{'Content-Type':'text/plain'},body:data}).then(r=>{if(!r.ok)throw Error();document.getElementById('status').textContent='Return to CLAPPA to see the verification result.'}).catch(()=>document.getElementById('status').textContent='Return to CLAPPA and try signing in again.')}else{document.getElementById('status').textContent='Start sign-in from CLAPPA.'}</script>""")
     }else if(request[0]=="POST"&&request[1]=="/complete"){
      require(headers["origin"]=="http://localhost:3000"&&!headers.containsKey("transfer-encoding"))
      require(headers["content-type"]?.substringBefore(';')=="text/plain")
      val length=headers["content-length"]?.toIntOrNull()?:0;require(length in 1..16384)
      val bytes=ByteArray(length);var read=0;while(read<length){val n=input.read(bytes,read,length-read);require(n>0);read+=n}
      val response=String(bytes,Charsets.UTF_8);reply("Response received. Return to CLAPPA.","text/plain");return response
     }
    }catch(_:Exception){/* Malformed local requests do not consume the pending login. */}
   }
  }
  error("Sign-in expired. Please try again.")
 }
 override fun close(){closed.set(true);server.close()}
}
