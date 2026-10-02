package org.clappa.app

import java.nio.ByteBuffer
import java.security.MessageDigest

/** Portable deterministic mapping activated by the authenticated Quicknet profile. */
internal object ChallengeChoices {
 const val MAPPING="CLAPPA-CHOICES-v2"
 val supportedMappings=setOf("CLAPPA-CHOICES-v1",MAPPING)
 private val promptsV2=listOf("left","right","up","down","front","back","selfie","selfie_left","selfie_right","selfie_around","selfie_nose_left","selfie_nose_right","selfie_chin","selfie_palm","selfie_smile","selfie_tilt","selfie_wink")
 val prompts=listOf("left","right","up","down","front","back","recording_camera","main_subject_alt_angle","room_setup","selfie","selfie_cover_left","selfie_cover_right","selfie_wink","selfie_turn")
 data class Choices(val prompt:String,val camera:String,val flash:String,val cadence:String,val slotMs:Int,val pitches:List<Int>)
 private class Stream(private val seed:ByteArray,private val label:String){
  private var counter=0
  fun next(n:Int):Int{
   require(n in 1..256);val limit=4294967296L/n*n
   while(true){
    val bytes=MessageDigest.getInstance("SHA-256").digest(seed+(label+"\u0000").toByteArray(Charsets.UTF_8)+ByteBuffer.allocate(4).putInt(counter++).array())
    val v=ByteBuffer.wrap(bytes).int.toLong() and 0xffffffffL
    if(v<limit)return (v%n).toInt()
   }
  }
 }
 fun fromSeed(seed:ByteArray,cameraProfile:String="front-rear",mapping:String="CLAPPA-CHOICES-v1"):Choices{
  require(seed.size==32);require(mapping in supportedMappings)
  require(cameraProfile in listOf("front-rear","front-only","rear-only"));val available=(if(mapping==MAPPING)promptsV2 else prompts).filter{cameraProfile=="front-rear"||it.startsWith("selfie")== (cameraProfile=="front-only")}
  val prompt=available[Stream(seed,"prompt").next(available.size)];val front=prompt.startsWith("selfie")
  val flash=if(front)listOf("red","green","blue")[Stream(seed,"illumination").next(3)]else "led"
  val rhythm=Stream(seed,"rhythm");val off=mutableListOf(2,6,10,14)
  for(i in 3 downTo 1){val j=rhythm.next(i+1);val v=off[i];off[i]=off[j];off[j]=v}
  val slots=(listOf(0,4,8,12)+off.take(2+rhythm.next(2))).toSet()
  val notes=Stream(seed,"notes");val scale=listOf(-5,-3,0,2,4,7);var note=2
  val pitches=(0 until slots.size).map{i->if(i==slots.size-1)0 else {if(i>0)note=(note+notes.next(3)-1).coerceIn(0,5);scale[note]}}
  return Choices(prompt,if(front)"front" else "rear",flash,(0..15).joinToString(""){if(it in slots)"1"else "0"},if(Stream(seed,"tempo").next(2)==0)125 else 111,pitches)
 }
}
