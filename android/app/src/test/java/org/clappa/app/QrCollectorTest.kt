package org.clappa.app
import org.junit.Test
import org.junit.Assert.*
import java.util.zip.Deflater
import java.util.zip.CRC32
import java.security.MessageDigest

class QrCollectorTest {
 private fun frames(bytes:ByteArray):List<String>{val d=Deflater(9,true);d.setInput(bytes);d.finish();val buffer=ByteArray(bytes.size+1024);val packed=buffer.copyOf(d.deflate(buffer));d.end();val digest=MessageDigest.getInstance("SHA-256").digest(packed);val count=(packed.size+199)/200
  val alphabet="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:"
  return (0 until count).map{i->val part=packed.copyOfRange(i*200,minOf(packed.size,(i+1)*200));val header=java.nio.ByteBuffer.allocate(40).put(digest).putShort(i.toShort()).putShort(count.toShort()).putInt(CRC32().apply{update(part)}.value.toInt()).array();val all=header+part;val out=StringBuilder("CLAPPA2:");var at=0;while(at<all.size){val pair=at+1<all.size;var n=(all[at++].toInt() and 255)*(if(pair)256 else 1);if(pair)n+=all[at++].toInt() and 255;repeat(if(pair)3 else 2){out.append(alphabet[n%45]);n/=45}};out.toString()}
 }
 @Test fun reorderedRepeatedFramesRecover(){val bytes=ByteArray(3000).also{java.util.Random(42).nextBytes(it)};val frames=frames(bytes);val collector=QrCollector();assertNull(collector.add(frames.last()));assertNull(collector.add(frames.last()));var result:ByteArray?=null;for(f in frames.dropLast(1).reversed())result=collector.add(f);assertArrayEquals(bytes,result)}
 @Test fun unrelatedSequencesNeverMix(){val one=frames(ByteArray(3000).also{java.util.Random(1).nextBytes(it)});val two=frames(ByteArray(3000).also{java.util.Random(2).nextBytes(it)});val c=QrCollector();c.add(one[0]);two.forEach{assertNull(c.add(it))};assertEquals(1,c.progress.first)}
 @Test fun missingFramesNeverComplete(){val f=frames(ByteArray(3000).also{java.util.Random(3).nextBytes(it)});val c=QrCollector();f.drop(1).forEach{assertNull(c.add(it))}}
 @Test fun invalidBase45Rejected(){for(s in listOf("CLAPPA2:A","CLAPPA2::::","CLAPPA2:aa","not a proof")){try{QrCollector().add(s);fail("Accepted bad frame")}catch(_:IllegalArgumentException){}}}
 @Test fun decompressionBombRejected(){try{val c=QrCollector();frames(ByteArray(131073){65}).forEach{c.add(it)};fail("Accepted oversized proof")}catch(_:IllegalArgumentException){}}
}
