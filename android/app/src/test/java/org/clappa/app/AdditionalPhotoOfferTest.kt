package org.clappa.app

import org.junit.Assert.*
import org.junit.Test

class AdditionalPhotoOfferTest {
    @Test fun onlyTheCurrentResponseReceiptOpensTheOfferOnce() {
        val offer=AdditionalPhotoOffer();offer.open(8,1000)
        assertFalse(offer.acknowledgeResponse(7))
        assertTrue(offer.acknowledgeResponse(8))
        assertFalse(offer.acknowledgeResponse(8))
    }

    @Test fun committedClaimCannotBeOfferedAgainWhileWaitingForReceipt() {
        val offer=AdditionalPhotoOffer();offer.open(8,1000)
        offer.acknowledgeResponse(8);offer.commit(10)
        for(now in 1000L..31000L step 100)assertFalse(offer.available(now))
        assertFalse(offer.acknowledgeResponse(8))
    }

    @Test fun lostReceiptCannotPermitAnotherSignedClaim() {
        val offer=AdditionalPhotoOffer();offer.open(8,1000);offer.commit(10)
        assertFalse(offer.available(1200))
        assertFalse(offer.acknowledgeClaim(9))
        assertFalse(offer.available(2000))
    }

    @Test fun receiptIsMatchedAndConsumedExactlyOnce() {
        val offer=AdditionalPhotoOffer();offer.open(8,1000);offer.commit(10)
        assertFalse(offer.acknowledgeClaim(8))
        assertTrue(offer.acknowledgeClaim(10))
        assertFalse(offer.acknowledgeClaim(10))
        assertFalse(offer.available(2000))
    }

    @Test fun CameraFailureBeforeCommitAllowsRetryOnlyInsideOriginalWindow() {
        val offer=AdditionalPhotoOffer();offer.open(8,1000)
        assertFalse(offer.available(999));assertTrue(offer.available(1000))
        assertTrue(offer.available(31000));assertFalse(offer.available(31001))
    }

    @Test fun nextChallengeInvalidatesThePreviousOfferAndLateReceipts() {
        val offer=AdditionalPhotoOffer();offer.open(8,1000);offer.close()
        assertFalse(offer.available(1500));assertFalse(offer.acknowledgeResponse(8))
        offer.open(15,5000)
        assertFalse(offer.acknowledgeResponse(8));assertTrue(offer.acknowledgeResponse(15))
        assertTrue(offer.available(5000))
    }

    @Test fun nextResponseGetsItsOwnSinglePhotoAllowance() {
        val offer=AdditionalPhotoOffer();offer.open(8,1000);offer.commit(10)
        offer.acknowledgeClaim(10);offer.open(15,5000)
        assertTrue(offer.available(5000));assertFalse(offer.acknowledgeClaim(10))
        offer.commit(17);assertFalse(offer.available(5001))
    }
}
