package org.clappa.app

/** Systematic Cauchy erasure rows; matches protocol/erasure.mjs. */
internal object QrErasure {
 private fun mul(aa:Int,bb:Int):Int {var a=aa;var b=bb;var r=0;while(b>0){if(b and 1!=0)r=r xor a;b=b ushr 1;a=a shl 1;if(a and 256!=0)a=a xor 0x11d};return r}
 private fun inv(a:Int):Int {require(a!=0);var v=a;var n=254;var r=1;while(n>0){if(n and 1!=0)r=mul(r,v);v=mul(v,v);n=n ushr 1};return r}
 fun recover(chunks:Map<Int,ByteArray>,k:Int,length:Int):ByteArray{
  require(k in 1..42&&chunks.size>=k);val selected=chunks.entries.take(k)
  val a=selected.map{(i,_)->IntArray(k){j->if(i<k){if(i==j)1 else 0}else inv((i-k) xor (k+j))}}.toMutableList()
  val b=selected.map{(_,v)->IntArray(196){v[it].toInt() and 255}}.toMutableList()
  for(col in 0 until k){val p=(col until k).first{a[it][col]!=0};val ar=a[col];a[col]=a[p];a[p]=ar;val br=b[col];b[col]=b[p];b[p]=br
   val v=inv(a[col][col]);for(j in 0 until k)a[col][j]=mul(a[col][j],v);for(j in 0 until 196)b[col][j]=mul(b[col][j],v)
   for(r in 0 until k)if(r!=col){val f=a[r][col];for(j in 0 until k)a[r][j]=a[r][j] xor mul(f,a[col][j]);for(j in 0 until 196)b[r][j]=b[r][j] xor mul(f,b[col][j])}
  };return ByteArray(length){b[it/196][it%196].toByte()}
 }
}
