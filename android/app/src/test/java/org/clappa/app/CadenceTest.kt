package org.clappa.app
import org.junit.Assert.*
import org.junit.Test
class CadenceTest {
 @Test fun sixOrSevenHitsAnchoredToFourBeatsWithPitchResolution(){
  val phrases=(0..999).map{i->val seed=Cadence.seed("session","key",i.toString());val (bits,ms)=Cadence.pattern(seed);val notes=Cadence.pitches(seed,bits.count{it=='1'});assertTrue(notes.size in 6..7);assertEquals(0,notes.last());assertEquals(16,bits.length);listOf(0,4,8,12).forEach{assertEquals('1',bits[it])};assertFalse(bits.contains("111"));assertTrue(ms in listOf(125,111));assertEquals('0',bits.last());assertEquals(bits to ms,Cadence.pattern(seed));assertTrue(notes.all{it in listOf(-5,-3,0,2,4,7)});Triple(bits,ms,notes)}
  assertTrue(phrases.toSet().size>100)
 }
 @Test fun identityAndChallengeAffectThePhrase(){assertFalse(Cadence.seed("s","k","c").contentEquals(Cadence.seed("s","other","c")));assertFalse(Cadence.seed("s","k","c").contentEquals(Cadence.seed("s","k","new")))}
 @Test fun issuedTimeAlsoBindsThePhrase(){assertFalse(Cadence.seed("s","k","c",1000).contentEquals(Cadence.seed("s","k","c",1001)))}
 @Test fun audioPreservesLeadingSilenceAndSampleTimedAttacks(){
  val strike=byteArrayOf(0,32,0,16,0,0,0,0)
  val pcm=RiffAudio.render(strike,"1010101010101000",125,List(7){0})
  assertTrue(pcm.take(2646).all{it==0.toShort()})
  for(slot in listOf(0,2,4,6,8,10,12))assertTrue(pcm[2646+slot*(44100*125/1000)]>0)
 }
}
