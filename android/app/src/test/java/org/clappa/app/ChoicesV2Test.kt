package org.clappa.app
import org.junit.Assert.*
import org.junit.Test
class ChoicesV2Test {
 @Test fun sharedChoicesAcrossAllCameraProfiles(){
  javaClass.classLoader!!.getResourceAsStream("choices-v2.tsv")!!.bufferedReader().useLines{lines->lines.forEach{line->
   val r=line.split('\t');val c=ChallengeChoices.fromSeed(r[0].chunked(2).map{it.toInt(16).toByte()}.toByteArray(),r[1],"CLAPPA-CHOICES-v2")
   assertEquals(r[2],c.prompt);assertEquals(r[3],c.camera);assertEquals(r[4],c.flash);assertEquals(r[5],c.cadence);assertEquals(r[6].toInt(),c.slotMs);assertEquals(r[7],c.pitches.joinToString(","))
  }}
 }
 @Test fun humanTimeLabels(){
  assertEquals("Beacon created just now",beaconAgeText(0))
  assertEquals("Beacon created 12 seconds ago",beaconAgeText(12))
  assertEquals("Beacon created 1 minute ago",beaconAgeText(60))
  assertEquals("Beacon created 2 hours ago",beaconAgeText(7200))
  assertEquals("Beacon created 3 days ago",beaconAgeText(259200))
  assertEquals("Beacon time is ahead of this phone",beaconAgeText(-1))
 }
}
