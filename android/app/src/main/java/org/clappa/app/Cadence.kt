package org.clappa.app

import java.security.MessageDigest
import kotlin.math.*

// CLAPPA-RIFF-v2 is reproducible from signed identifiers. The random challenge
// ID supplies freshness; a short phrase is not an authentication channel.
internal object Cadence {
    fun seed(session:String,key:String,challenge:String,at:Long=0):ByteArray=MessageDigest.getInstance("SHA-256").digest("CLAPPA-RIFF-v2\u0000$session\u0000$key\u0000$challenge\u0000$at".toByteArray(Charsets.UTF_8))
    private fun ByteArray.u(i:Int)=this[i%size].toInt() and 255
    fun pattern(seed:ByteArray):Pair<String,Int>{
        val slots=mutableSetOf(0,4,8,12)
        val offbeats=listOf(2,6,10,14).sortedBy{seed.u(it)}
        slots.addAll(offbeats.take(2+seed.u(0)%2))
        return (0..15).joinToString(""){if(it in slots)"1" else "0"} to if(seed.u(1)%2==0)125 else 111
    }
    fun pitches(seed:ByteArray,count:Int):List<Int>{
        val scale=intArrayOf(-5,-3,0,2,4,7);var note=2
        return (0 until count).map{i->if(i==count-1)0 else {if(i>0)note=(note+(seed.u(i+16)%3-1)).coerceIn(0,5);scale[note]}}
    }
}

internal object RiffAudio {
    const val RATE=44100
    fun render(sample:ByteArray,bits:String,slotMs:Int,pitches:List<Int>):ShortArray{
        require(sample.size%2==0&&sample.isNotEmpty());require(pitches.size==bits.count{it=='1'})
        val strike=DoubleArray(sample.size/2){i->((sample[i*2].toInt() and 255) or (sample[i*2+1].toInt() shl 8)).toShort().toDouble()}
        val slot=RATE*slotMs/1000;val lead=RATE*60/1000
        val mix=DoubleArray(lead+slot*bits.length+strike.size*2);var note=0
        for(j in bits.indices)if(bits[j]=='1'){
            val rate=2.0.pow(pitches[note++]/12.0);var i=0
            while(i*rate<strike.size-1){val source=i*rate;val base=source.toInt();val value=strike[base]*(1-source+base)+strike[base+1]*(source-base);mix[lead+j*slot+i]+=value;i++}
        }
        val peak=mix.maxOf{abs(it)}.coerceAtLeast(27000.0)
        return ShortArray(mix.size){(mix[it]*27000/peak).roundToInt().coerceIn(-32768,32767).toShort()}
    }
}
