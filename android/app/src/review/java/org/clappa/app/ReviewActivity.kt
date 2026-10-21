package org.clappa.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.enableEdgeToEdge
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import kotlinx.coroutines.delay

// Layout fixtures use the production component, in a separate, unshipped APK.
// They are not evidence of successful pairing, camera capture or verification.
class ReviewActivity:ComponentActivity(){
 override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState)
  enableEdgeToEdge(statusBarStyle=SystemBarStyle.dark(0xff24231f.toInt()),navigationBarStyle=SystemBarStyle.dark(0xff24231f.toInt()));window.isNavigationBarContrastEnforced=false
  val initial=BoardPhase.valueOf(intent.getStringExtra("phase")?:"UNPAIRED")
  setContent{MaterialTheme(colorScheme=darkColorScheme(primary=Chalk,onPrimary=Slate)){
   var phase by remember{mutableStateOf(initial)};var clap by remember{mutableIntStateOf(0)}
   var showChat by remember{mutableStateOf(intent.getBooleanExtra("chat",false))}
   val timed=intent.getBooleanExtra("timed",false)
   val deadline=remember(phase){android.os.SystemClock.elapsedRealtime()+if(phase==BoardPhase.SENT)30000 else 10000}
   var seconds by remember(phase){mutableIntStateOf(if(phase==BoardPhase.SENT)30 else 10)}
   LaunchedEffect(phase){if(timed)while(seconds>0){delay(100);seconds=((deadline-android.os.SystemClock.elapsedRealtime()+999).coerceAtLeast(0)/1000).toInt()}}
   LaunchedEffect(clap){if(clap>0){delay(430);phase=BoardPhase.CHALLENGE}}
   Box(Modifier.fillMaxSize().background(Slate).safeDrawingPadding()){
    ClappaBoard(BoardState(phase,phase !in listOf(BoardPhase.UNPAIRED,BoardPhase.LOST),intent.getStringExtra("prompt")?:"Cover your left eye with your left hand!",if(phase==BoardPhase.LOST)"Let's reconnect" else "",if(phase==BoardPhase.SENT)(if(timed)seconds else 25)else 0,phase==BoardPhase.READY,false,responseSeconds=if(phase==BoardPhase.CHALLENGE)(if(timed)seconds else 8)else 0,responseDeadline=if(timed)deadline else 0,claimDeadline=if(timed)deadline else 0),clap,{clap++},{},{},{},{})
    if(showChat)ChatChallengeDialog(3,onDismiss={showChat=false},onAccept={showChat=false;clap++})
   }
  }}
 }
}
