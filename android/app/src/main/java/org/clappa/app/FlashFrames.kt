package org.clappa.app

import androidx.compose.runtime.MonotonicFrameClock
import androidx.compose.runtime.withFrameNanos
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout

// The capture job belongs to the Activity. Only the display wait needs the
// live composition's clock; lifecycleScope does not provide one itself.
internal suspend fun awaitFlashFrames(clock: MonotonicFrameClock) {
    withTimeout(750) {
        withContext(clock) {
            withFrameNanos { }
            withFrameNanos { }
        }
    }
}

