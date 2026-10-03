package org.clappa.app
import org.junit.Assert.*
import org.junit.Test
class RecentFinishWindowTest {
 @Test fun requiresReceiptAndExpiresExactly(){val w=RecentFinishWindow();w.captured(4,1000);assertFalse(w.available(1001));w.acknowledge(3);assertFalse(w.available(1001));w.acknowledge(4);assertTrue(w.available(30999));assertFalse(w.available(31000))}
 @Test fun anotherChallengeOrFailureInvalidatesReceipt(){val w=RecentFinishWindow();w.captured(4,1000);w.acknowledge(4);w.clear();assertFalse(w.available(2000));w.captured(8,3000);w.acknowledge(4);assertFalse(w.available(4000));w.acknowledge(8);assertTrue(w.available(4000))}
}
