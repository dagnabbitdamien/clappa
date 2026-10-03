package org.clappa.app

/** Finishing may reuse only an acknowledged capture, for 30 seconds of monotonic time. */
internal class RecentFinishWindow {
    private var sequence:Int?=null
    private var deadline=0L
    private var acknowledged=false
    fun captured(seq:Int,now:Long){sequence=seq;deadline=now+30000;acknowledged=false}
    fun acknowledge(seq:Int){if(sequence==seq)acknowledged=true}
    fun available(now:Long)=acknowledged&&now<deadline
    fun clear(){sequence=null;deadline=0;acknowledged=false}
}
