package org.clappa.app

/** One optional photo per response. A committed event consumes the offer even if delivery is uncertain. */
internal class AdditionalPhotoOffer {
    private var responseSeq: Int? = null
    private var responseAcknowledged = false
    private var responseAt = 0L
    private var consumed = false
    private var claimSeq: Int? = null

    fun open(seq: Int, at: Long) {
        responseSeq = seq; responseAt = at; responseAcknowledged = false
        consumed = false; claimSeq = null
    }

    fun acknowledgeResponse(seq: Int): Boolean {
        if (responseSeq != seq || responseAcknowledged || consumed) return false
        responseAcknowledged = true
        return true
    }

    fun available(at: Long) = responseSeq != null && !consumed && at in responseAt..responseAt + 30_000

    fun commit(seq: Int) { consumed = true; claimSeq = seq }

    fun acknowledgeClaim(seq: Int): Boolean {
        if (claimSeq != seq) return false
        claimSeq = null
        return true
    }

    fun close() { responseSeq = null; consumed = true; claimSeq = null }
}
