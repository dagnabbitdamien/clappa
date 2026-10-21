package org.clappa.app
import java.time.Instant
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.util.Locale
internal object BoardClock {
 private val format=DateTimeFormatter.ofPattern("uuuu:MM:dd HH:mm:ss:SSS",Locale.ROOT)
 fun local(at:Long,zone:ZoneId=ZoneId.systemDefault())=format.withZone(zone).format(Instant.ofEpochMilli(at))
 fun gmt(at:Long)=format.withZone(ZoneOffset.UTC).format(Instant.ofEpochMilli(at))
}
