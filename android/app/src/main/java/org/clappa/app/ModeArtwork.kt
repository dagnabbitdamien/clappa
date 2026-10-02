package org.clappa.app

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp

internal val MenuOrange=Color(0xFFFFAD66)

/** Small app-native icons; never dependent on emoji fonts or remote assets. */
@Composable internal fun ModeArtwork(viewer:Boolean){
 Canvas(Modifier.size(44.dp)){
  val u=size.width/44f
  fun p(x:Float,y:Float)=Offset(x*u,y*u)
  if(viewer){
   val eye=Path().apply{moveTo(4*u,22*u);cubicTo(13*u,7*u,31*u,7*u,40*u,22*u);cubicTo(31*u,37*u,13*u,37*u,4*u,22*u);close()}
   drawPath(eye,MenuOrange,style=Stroke(2.5f*u));drawCircle(MenuOrange,6*u,p(22f,22f));drawCircle(Color.White,1.6f*u,p(24f,20f))
  }else{
   drawRoundRect(MenuOrange,p(5f,17f),Size(34*u,22*u),androidx.compose.ui.geometry.CornerRadius(3*u))
   val jaw=Path().apply{moveTo(5*u,13*u);lineTo(36*u,5*u);lineTo(38*u,12*u);lineTo(7*u,20*u);close()};drawPath(jaw,MenuOrange)
   for(x in listOf(12f,23f,33f))drawLine(Slate,p(x,11f-(x-12)/4),p(x-2,17f-(x-12)/4),3*u)
   val play=Path().apply{moveTo(19*u,23*u);lineTo(27*u,28*u);lineTo(19*u,33*u);close()};drawPath(play,Slate)
  }
 }
}

internal fun beaconAgeText(ageSeconds:Long):String {
 if(ageSeconds<0)return "Beacon time is ahead of this phone"
 if(ageSeconds<5)return "Beacon created just now"
 val (n,unit)=when{ageSeconds<60->ageSeconds to "second";ageSeconds<3600->ageSeconds/60 to "minute";ageSeconds<86400->ageSeconds/3600 to "hour";else->ageSeconds/86400 to "day"}
 return "Beacon created $n $unit${if(n==1L)"" else "s"} ago"
}
