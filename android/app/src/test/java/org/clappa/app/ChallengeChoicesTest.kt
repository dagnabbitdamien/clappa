package org.clappa.app
import org.junit.Assert.*
import org.junit.Test

class ChallengeChoicesTest {
 @Test fun negativeMusicalIntervalsHaveCanonicalIntegers(){assertEquals("-5",Proof.canonical(-5));assertEquals("0",Proof.canonical(0));assertEquals("7",Proof.canonical(7))}
 @Test fun sharedVectorsMatchEveryChoice(){
  javaClass.classLoader!!.getResourceAsStream("choices-v1.tsv")!!.bufferedReader().useLines{lines->lines.forEach{line->
   val row=line.split('\t');val seed=row[0].chunked(2).map{it.toInt(16).toByte()}.toByteArray();val c=ChallengeChoices.fromSeed(seed)
   assertEquals(row[1],c.prompt);assertEquals(row[2],c.camera);assertEquals(row[3],c.flash);assertEquals(row[4],c.cadence);assertEquals(row[5].toInt(),c.slotMs);assertEquals(row[6],c.pitches.joinToString(","))
  }}
 }
}
