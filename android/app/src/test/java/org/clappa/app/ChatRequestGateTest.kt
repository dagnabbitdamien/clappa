package org.clappa.app

import org.junit.Assert.*
import org.junit.Test

class ChatRequestGateTest {
    @Test fun requestMustBeCurrentFreshAndActionable(){
        val gate=ChatRequestGate()
        assertNull(gate.accept("vote1","wrong","session",3,2000,1000,500,false))
        assertNull(gate.accept("vote1","session","session",3,2000,1000,500,false))
        assertNull(gate.accept("vote1","session","session",3,1000,1000,500,true))
        assertNull(gate.accept("vote1","session","session",3,100000,1000,500,true))
        assertNull(gate.accept("vote1","session","session",1,2000,1000,500,true))
        val request=gate.accept("vote1","session","session",3,2000,1000,500,true)
        assertNotNull(request);assertEquals(1500L,request!!.deadline)
    }
    @Test fun repeatedDeliveryCannotBuzzAgain(){
        val gate=ChatRequestGate()
        assertNotNull(gate.accept("vote1","session","session",3,2000,1000,500,true))
        assertNull(gate.accept("vote1","session","session",3,2000,1100,600,true))
        assertNotNull(gate.accept("vote2","session","session",3,2000,1100,600,true))
    }
}
