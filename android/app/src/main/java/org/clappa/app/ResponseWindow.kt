package org.clappa.app

/** Counts to completed Photo A, including the riff and camera opening. */
internal class ResponseWindow(private val issued:Long) {
    fun remaining(now:Long)=(10000L-(now-issued)).coerceIn(0,10000)
    fun first(now:Long):Long=(now-issued).also{require(it in 0..10000){"The 10-second capture window expired"}}
    fun pair(a:Long,b:Long,selfie:Boolean,limit:Long=if(selfie)1500L else 3000L):Long {
        first(a)
        return (b-a).also{require(it in 0..limit){"The two photos were too far apart"}}
    }
}
