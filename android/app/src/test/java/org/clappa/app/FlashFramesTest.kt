package org.clappa.app

import androidx.compose.runtime.MonotonicFrameClock
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import org.junit.Assert.*
import org.junit.Test
import kotlin.coroutines.coroutineContext

class FlashFramesTest {
    private class DisplayClock:MonotonicFrameClock {
        val frames=Channel<Long>(Channel.UNLIMITED)
        var waits=0
        override suspend fun <R> withFrameNanos(onFrame:(Long)->R):R {
            waits++
            return onFrame(frames.receive())
        }
    }
    @Test fun lifecycleCallerWithoutAClockWaitsForBothDisplayFrames()=runBlocking {
        assertNull(coroutineContext[MonotonicFrameClock])
        val display=DisplayClock()
        val wait=async(start=CoroutineStart.UNDISPATCHED){awaitFlashFrames(display)}
        assertEquals(1,display.waits)
        display.frames.send(1);yield()
        assertEquals(2,display.waits)
        assertFalse(wait.isCompleted)
        display.frames.send(2);wait.await()
        assertTrue(wait.isCompleted)
    }
    @Test fun cancellingCaptureCancelsTheDisplayWait()=runBlocking {
        val display=DisplayClock()
        val wait=launch(start=CoroutineStart.UNDISPATCHED){awaitFlashFrames(display)}
        wait.cancelAndJoin()
        assertTrue(wait.isCancelled)
    }
}

