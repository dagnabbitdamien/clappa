package org.clappa.app
import org.junit.Assert.*
import org.junit.Test
import java.time.Instant
import java.time.ZoneId
class BoardClockTest {
 @Test fun localAndGmtRemainIndependentAcrossDatesAndDaylightSaving(){
  val winter=Instant.parse("2026-09-14T05:08:23.917Z").toEpochMilli()
  assertEquals("2026:09:14 05:08:23:917",BoardClock.gmt(winter))
  assertEquals("2026:09:14 15:08:23:917",BoardClock.local(winter,ZoneId.of("Australia/Sydney")))
  val summer=Instant.parse("2026-12-31T16:00:00Z").toEpochMilli()
  assertEquals("2027:01:01 03:00:00:000",BoardClock.local(summer,ZoneId.of("Australia/Sydney")))
  assertEquals("2026:12:31 16:00:00:000",BoardClock.gmt(summer))
 }
}
