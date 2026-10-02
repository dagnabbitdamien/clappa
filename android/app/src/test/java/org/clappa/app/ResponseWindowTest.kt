package org.clappa.app
import org.junit.Assert.*
import org.junit.Test

class ResponseWindowTest {
 @Test fun explicitThreeSecondSelfiePolicy(){val w=ResponseWindow(0);assertEquals(2500,w.pair(9000,11500,true,3000));assertThrows(IllegalArgumentException::class.java){w.pair(9000,12001,true,3000)}}
 @Test fun deadlineIncludesOpeningAndAudio(){val w=ResponseWindow(500);assertEquals(10000,w.remaining(500));assertEquals(7600,w.remaining(2900));assertEquals(10000,w.first(10500));assertThrows(IllegalArgumentException::class.java){w.first(10501)}}
 @Test fun secondPhotoHasItsOwnBound(){val w=ResponseWindow(0);assertEquals(1500,w.pair(9990,11490,true));assertThrows(IllegalArgumentException::class.java){w.pair(9990,11491,true)};assertEquals(3000,w.pair(9900,12900,false))}
 @Test fun monotonicClockCannotRunBackwards(){assertThrows(IllegalArgumentException::class.java){ResponseWindow(100).first(99)};assertThrows(IllegalArgumentException::class.java){ResponseWindow(0).pair(100,99,false)}}
}
