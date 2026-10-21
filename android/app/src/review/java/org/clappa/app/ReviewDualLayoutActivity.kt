package org.clappa.app
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
class ReviewDualLayoutActivity:ComponentActivity(){
 override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState);enableEdgeToEdge(statusBarStyle=androidx.activity.SystemBarStyle.dark(0xff24231f.toInt()),navigationBarStyle=androidx.activity.SystemBarStyle.dark(0xff24231f.toInt()));setContent{ClappaScreenTheme{
  DualCameraLayout(resources.configuration.orientation==android.content.res.Configuration.ORIENTATION_LANDSCAPE,
   "Cover your nose with your left hand!",8,"Hold the pose!",true,false,{finish()},{},
   front={Box(Modifier.fillMaxSize().background(Color(0xff514b43)),contentAlignment=Alignment.Center){Text("Front preview · layout fixture")}},
   rear={Box(Modifier.fillMaxSize().background(Color(0xff393e3b)),contentAlignment=Alignment.Center){Text("Rear preview · layout fixture")}})
 }}}
}
