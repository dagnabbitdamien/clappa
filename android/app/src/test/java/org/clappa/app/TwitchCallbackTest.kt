package org.clappa.app
import org.junit.Test
import org.junit.Assert.*
import java.net.Socket
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

class TwitchCallbackTest {
 @Test fun localCallbackServesFragmentBridgeAndReceivesPost(){
  TwitchCallback().use{callback->val worker=Executors.newSingleThreadExecutor();try{val result=worker.submit<String>{callback.awaitResponse()}
   fun request(s:String)=Socket("127.0.0.1",3000).use{socket->socket.soTimeout=5000;socket.getOutputStream().write(s.toByteArray());socket.getInputStream().bufferedReader().readText()}
   val page=request("GET / HTTP/1.1\r\nHost: localhost:3000\r\n\r\n");assertTrue(page.contains("Cache-Control: no-store"));assertTrue(page.contains("history.replaceState"));assertTrue(page.contains("location.hash"))
   val body="id_token=test-token&state=test-state"
   request("POST /complete HTTP/1.1\r\nHost: localhost:3000\r\nOrigin: https://evil.example\r\nContent-Type: text/plain\r\nContent-Length: ${body.length}\r\n\r\n$body");assertFalse(result.isDone)
   val reply=request("POST /complete HTTP/1.1\r\nHost: localhost:3000\r\nOrigin: http://localhost:3000\r\nContent-Type: text/plain\r\nContent-Length: ${body.length}\r\n\r\n$body");assertTrue(reply.contains("200 OK"));assertEquals(body,result.get(5,TimeUnit.SECONDS))
  }finally{worker.shutdownNow()}}
 }
}
