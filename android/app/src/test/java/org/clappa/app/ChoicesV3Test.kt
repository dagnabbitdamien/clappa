package org.clappa.app

import org.junit.Assert.*
import org.junit.Test

class ChoicesV3Test {
 @Test fun sharedChoicesAndCompletePromptCoverage(){
  val seen=mutableSetOf<String>()
  javaClass.classLoader!!.getResourceAsStream("choices-v3.tsv")!!.bufferedReader().useLines{lines->lines.forEach{line->
   val r=line.split('\t')
   val c=ChallengeChoices.fromSeed(r[0].chunked(2).map{it.toInt(16).toByte()}.toByteArray(),r[1],"CLAPPA-CHOICES-v3")
   assertEquals(r[2],c.prompt);assertEquals(r[3],c.camera);assertEquals(r[4],c.flash)
   assertEquals(r[5],c.cadence);assertEquals(r[6].toInt(),c.slotMs);assertEquals(r[7],c.pitches.joinToString(","))
   if(r[1]=="front-only"){assertEquals("front",c.camera);seen.add(c.prompt);assertTrue(Prompts.text(c.prompt,true).isNotBlank())}
  }}
  assertEquals(32,seen.size)
  assertEquals("CLAPPA-CHOICES-v3",ChallengeChoices.MAPPING)
  assertTrue(ChallengeChoices.supportedMappings.containsAll(listOf("CLAPPA-CHOICES-v1","CLAPPA-CHOICES-v2","CLAPPA-CHOICES-v3")))
 }
}
