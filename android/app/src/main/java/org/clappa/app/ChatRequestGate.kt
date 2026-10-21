package org.clappa.app

/** A chat vote is an invitation only; it never selects or starts a signed challenge. */
internal data class ChatChallengeRequest(val id:String,val sessionId:String,val viewers:Int,val deadline:Long)

internal class ChatRequestGate {
    private val seen=LinkedHashSet<String>()
    fun accept(id:String,sessionId:String,currentSession:String?,viewers:Int,expiresAt:Long,wallNow:Long,monotonicNow:Long,ready:Boolean):ChatChallengeRequest? {
        if(!id.matches(Regex("[A-Za-z0-9_-]{1,80}"))||sessionId!=currentSession||!ready||viewers !in 2..100000)return null
        if(expiresAt<=wallNow||expiresAt-wallNow>90000||id in seen)return null
        seen.add(id);while(seen.size>128)seen.remove(seen.first())
        return ChatChallengeRequest(id,sessionId,viewers,monotonicNow+(expiresAt-wallNow))
    }
}
