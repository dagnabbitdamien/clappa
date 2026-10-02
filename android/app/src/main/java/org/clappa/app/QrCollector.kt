package org.clappa.app

import java.io.ByteArrayOutputStream
import java.security.MessageDigest
import java.util.zip.CRC32
import java.util.zip.Inflater

/** One bounded animated QR sequence. Never combine different proof digests. */
internal class QrCollector {
 private var digest:ByteArray?=null
 private var count=0
 private var version=0
 private var length=0
 private val chunks=sortedMapOf<Int,ByteArray>()
 val progress get()=chunks.size to count
 fun reset(){digest=null;count=0;version=0;length=0;chunks.clear()}
 fun add(text:String):ByteArray? {
  require((text.startsWith("CLAPPA2:")||text.startsWith("CLAPPA3:"))&&text.length<=1500){"This is not a supported CLAPPA proof code"}
  val alphabet="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:"
  val s=text.substring(8);require(s.length%3!=1)
  val out=ByteArrayOutputStream();var i=0
  while(i<s.length){val n=minOf(3,s.length-i);var value=0;var factor=1
   repeat(n){val a=alphabet.indexOf(s[i++]);require(a>=0);value+=a*factor;factor*=45}
   require(value<=if(n==3)65535 else 255)
   if(n==3)out.write(value/256);out.write(value%256)
  }
  val b=out.toByteArray();require(b.size in 41..240)
  fun u(p:Int)=b[p].toInt() and 255
  val index=u(32)*256+u(33);val total=u(34)*256+u(35)
  val resilient=text.startsWith("CLAPPA3:");val incomingVersion=if(resilient)3 else 2
  val incomingLength=if(resilient)u(36)*256+u(37) else 0
  require(total in 1..(if(resilient)42 else 41)&&index in 0 until (if(resilient)2*total else total))
  if(resilient)require(b.size==238&&incomingLength in 1..8192&&(incomingLength+195)/196==total)
  val offset=if(resilient)38 else 36
  val part=b.copyOfRange(offset+4,b.size);val crc=CRC32().apply{update(part)}.value
  val expected=(offset..offset+3).fold(0L){v,p->(v shl 8)+u(p)};require(crc==expected){"Damaged QR frame; keep scanning"}
  val incoming=b.copyOfRange(0,32)
  if(digest!=null&&!digest!!.contentEquals(incoming))return null
  if(digest==null){digest=incoming;count=total;version=incomingVersion;length=incomingLength};require(count==total&&version==incomingVersion&&length==incomingLength)
  chunks[index]?.let{require(it.contentEquals(part)){"Conflicting QR frames"}}
  chunks[index]=part
  if(chunks.size<count)return null
  val packed=if(version==3)QrErasure.recover(chunks,count,length) else chunks.values.fold(ByteArray(0)){a,v->a+v};require(packed.size<=8192)
  if(!MessageDigest.getInstance("SHA-256").digest(packed).contentEquals(digest)){reset();error("Proof checksum mismatch")}
  val inflater=Inflater(true);val decoded=ByteArrayOutputStream()
  try{inflater.setInput(packed);val buffer=ByteArray(4096)
   while(!inflater.finished()){val n=inflater.inflate(buffer);require(n>0){"Truncated proof"};require(decoded.size()+n<=131072){"Proof exceeds size limit"};decoded.write(buffer,0,n)}
   require(inflater.remaining==0){"Unexpected compressed trailing bytes"}
  }finally{inflater.end()}
  return decoded.toByteArray()
 }
}
