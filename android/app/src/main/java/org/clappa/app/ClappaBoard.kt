package org.clappa.app

import android.graphics.BitmapFactory
import android.graphics.Paint
import android.graphics.RectF
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.layout.SubcomposeLayout
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.*

internal val Slate=Color(0xff24231f)
internal val Chalk=Color(0xffeeeade)
internal enum class BoardPhase { UNPAIRED, CONNECTING, STANDBY, READY, CLAPPING, CHALLENGE, SENDING, SENT, ENDING, SEALED, LOST, INCOMPLETE }
internal data class BoardState(val phase:BoardPhase,val connected:Boolean=false,val prompt:String="",val detail:String="",val claimSeconds:Int=0,val canEnd:Boolean=false,val canFinish:Boolean=false,val recording:Boolean=false,val needsPairing:Boolean=false,val responseSeconds:Int=0,val responseDeadline:Long=0,val claimDeadline:Long=0)

@Composable private fun CountdownBar(deadline:Long,totalMillis:Long,fallbackSeconds:Int){
 var remaining by remember(deadline){mutableLongStateOf(if(deadline>0)(deadline-android.os.SystemClock.elapsedRealtime()).coerceAtLeast(0) else fallbackSeconds*1000L)}
 LaunchedEffect(deadline){if(deadline>0)while(remaining>0){withFrameNanos{remaining=(deadline-android.os.SystemClock.elapsedRealtime()).coerceAtLeast(0)}}}
 LinearProgressIndicator(progress={(remaining.toFloat()/totalMillis).coerceIn(0f,1f)},color=Color(0xffa9cfbc),trackColor=Chalk.copy(alpha=.12f),modifier=Modifier.fillMaxWidth().padding(bottom=12.dp))
}

@Composable internal fun Wordmark(modifier:Modifier=Modifier,size:Int=32){
 Text("CLAPPA",modifier,fontSize=size.sp,fontWeight=FontWeight.ExtraBold,fontStyle=FontStyle.Italic,letterSpacing=(-1).sp,color=Chalk)
}

@Composable internal fun ClappaBoard(state:BoardState,clap:Int,onPrimary:()->Unit,onSettings:()->Unit,onEnd:()->Unit,onFinish:()->Unit,onClaim:()->Unit){
 val motion=remember{Animatable(1f)}
 LaunchedEffect(clap){if(clap>0){motion.snapTo(0f);motion.animateTo(1f,tween(430,easing=LinearEasing))}}
 val t=motion.value
 fun key(vararg points:Pair<Float,Float>):Float {val end=points.indexOfFirst{t<=it.first};if(end<=0)return if(end==0)points[0].second else points.last().second;val a=points[end-1];val b=points[end];val u=(t-a.first)/(b.first-a.first);return a.second+(b.second-a.second)*u}
 val angle=key(0f to 0f,.28f to 8f,.43f to 12f,.56f to 0f,.64f to 1.7f,.73f to 0f,1f to 0f)
 val bounce=key(0f to 0f,.43f to -2f,.56f to 3f,.72f to -1.4f,1f to 0f)
 BoxWithConstraints(Modifier.fillMaxSize().background(Slate).clipToBounds()){
  val landscape=maxWidth>maxHeight
  val boardWidth=maxWidth-20.dp
  val guide=state.phase in listOf(BoardPhase.CHALLENGE,BoardPhase.SENT,BoardPhase.LOST,BoardPhase.INCOMPLETE)
  val panelShape=RoundedCornerShape(6.dp)
  Column(Modifier.padding(horizontal=10.dp,vertical=6.dp).width(boardWidth)
   .height(maxHeight-12.dp)
   .graphicsLayer{translationY=bounce*density}.shadow(12.dp,panelShape,clip=false)
   .background(Color(0xff302f2a),panelShape)
   .border(1.dp,Brush.verticalGradient(listOf(Color(0xff646258),Color(0xff181814))),panelShape).clip(panelShape)){
   ClapperBar(angle)
   Row(Modifier.fillMaxWidth().padding(start=20.dp,end=16.dp,top=if(landscape)6.dp else 12.dp,bottom=if(landscape)8.dp else 16.dp),verticalAlignment=Alignment.CenterVertically){
    Column(Modifier.weight(1f)){
     Wordmark(size=if(landscape)28 else 32)
     Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(6.dp)){
      Canvas(Modifier.size(6.dp)){drawCircle(if(state.connected)Color(0xffa9cfbc)else Color(0xff87867c))}
      Text(if(state.connected)"OBS connected" else if(state.phase==BoardPhase.CONNECTING)"Connecting…" else "OBS disconnected",fontSize=11.sp,color=Chalk.copy(alpha=.78f))
     }
    }
    Surface(onClick=onSettings,shape=RoundedCornerShape(8.dp),color=Color(0xff36352f),border=BorderStroke(1.dp,Color(0xff646258)),modifier=Modifier.size(48.dp).semantics{contentDescription="Settings"}){
     Canvas(Modifier.padding(12.dp)){
      val r=size.minDimension/2;val gear=Path().apply{fillType=PathFillType.EvenOdd}
      // Solid teeth and a single bore: no wheel spokes.
      for(i in 0 until 8)for((j,a)in listOf(-22.5,-13.0,-10.0,10.0,13.0,22.5).withIndex()){
       val radius=r*(if(j in 2..3)1f else .76f);val rad=(i*45+a)*Math.PI/180
       val x=center.x+kotlin.math.cos(rad).toFloat()*radius;val y=center.y+kotlin.math.sin(rad).toFloat()*radius
       if(i==0&&j==0)gear.moveTo(x,y)else gear.lineTo(x,y)
      }
      gear.close();gear.addOval(androidx.compose.ui.geometry.Rect(center.x-r*.32f,center.y-r*.32f,center.x+r*.32f,center.y+r*.32f));drawPath(gear,Chalk)
     }
    }
   }
   val controls:@Composable (Modifier)->Unit={controlModifier->
   Column(controlModifier.verticalScroll(rememberScrollState()).padding(start=20.dp,end=20.dp,bottom=20.dp)){
    ClockBand()
    Spacer(Modifier.height(12.dp))
    if(state.phase==BoardPhase.CHALLENGE){Text("Capture within ${state.responseSeconds}s",color=Chalk,fontSize=13.sp,modifier=Modifier.padding(bottom=8.dp));CountdownBar(state.responseDeadline,10000,state.responseSeconds)}
    val offer=state.phase==BoardPhase.SENT&&state.claimSeconds>0
    if(offer){Text("Photo offer · ${state.claimSeconds}s remaining",color=Chalk,fontSize=13.sp,modifier=Modifier.padding(bottom=8.dp));CountdownBar(state.claimDeadline,30000,state.claimSeconds)}
    val label=if(offer)"Add a photo" else if(state.canFinish&&state.phase in listOf(BoardPhase.READY,BoardPhase.SENT))"Stop & seal" else when(state.phase){BoardPhase.UNPAIRED->"Pair with OBS";BoardPhase.CONNECTING->"Connecting…";BoardPhase.STANDBY->"Start recording";BoardPhase.SEALED->"Start another recording";BoardPhase.READY,BoardPhase.SENT->"Tap to clap!";BoardPhase.CLAPPING->"Waiting for fresh timing beacon…";BoardPhase.CHALLENGE->"Capture";BoardPhase.SENDING->"Sending proof…";BoardPhase.ENDING->"Finishing recording…";BoardPhase.LOST->if(state.needsPairing)"Scan pairing code" else "Reconnect";BoardPhase.INCOMPLETE->if(state.recording)"Stop incomplete recording" else "Start another recording"}
    AnimatedContent(label,label="primary action",transitionSpec={fadeIn(tween(140))+slideInVertically{it/8} togetherWith fadeOut(tween(80))}){text->
     Button(onClick=if(offer)onClaim else if(state.canFinish&&state.phase in listOf(BoardPhase.READY,BoardPhase.SENT))onFinish else onPrimary,enabled=state.phase !in listOf(BoardPhase.CONNECTING,BoardPhase.CLAPPING,BoardPhase.SENDING,BoardPhase.ENDING)&&(state.phase!=BoardPhase.CHALLENGE||state.responseSeconds>0),shape=RoundedCornerShape(8.dp),colors=ButtonDefaults.buttonColors(containerColor=Chalk,contentColor=Slate),contentPadding=PaddingValues(horizontal=16.dp,vertical=14.dp),modifier=Modifier.fillMaxWidth().heightIn(min=56.dp)){
      Text(text,fontSize=18.sp,fontWeight=FontWeight.SemiBold)
     }
    }
    if(state.phase==BoardPhase.UNPAIRED)Text("Scan the pairing code in the CLAPPA dock.",Modifier.padding(top=12.dp),fontSize=13.sp,lineHeight=19.sp,color=Chalk.copy(alpha=.72f))
    if(state.phase==BoardPhase.STANDBY)Text("Start OBS recording from your phone.",Modifier.padding(top=12.dp),fontSize=13.sp,color=Chalk.copy(alpha=.72f))
    if(state.phase==BoardPhase.SEALED)Text("Recording sealed. Your proof is saved.",Modifier.padding(top=12.dp),fontSize=13.sp,color=Chalk.copy(alpha=.72f))
    if(!state.canFinish&&state.canEnd&&state.phase in listOf(BoardPhase.READY,BoardPhase.SENT))TextButton(onClick=onEnd,modifier=Modifier.heightIn(min=48.dp)){Text("End session")}
    if(offer&&state.canFinish)TextButton(onClick=onFinish,modifier=Modifier.heightIn(min=48.dp)){Text("Stop & seal")}
    if(state.detail.isNotEmpty()&&state.phase !in listOf(BoardPhase.CHALLENGE,BoardPhase.SENT))Text(state.detail,Modifier.padding(top=12.dp),fontSize=13.sp,lineHeight=19.sp,color=Chalk.copy(alpha=.8f))
   }}
   if(landscape){
    Row(Modifier.weight(1f).fillMaxWidth()){
     controls(Modifier.weight(if(guide).43f else 1f).fillMaxHeight())
     if(guide)MascotGuide(state,true,Modifier.weight(.57f).fillMaxHeight())
    }
   }else{
    Column(Modifier.weight(1f).fillMaxWidth()){
     controls(Modifier.weight(if(guide).43f else 1f).fillMaxWidth())
     if(guide)MascotGuide(state,false,Modifier.weight(.57f).fillMaxWidth())
    }
   }
  }
 }
}

@Composable internal fun MenuStripe(){
 Canvas(Modifier.fillMaxWidth().height(8.dp).clipToBounds()){
  drawRect(Chalk)
  val h=size.height;val step=h*3
  var x=-step
  while(x<size.width){drawPath(androidx.compose.ui.graphics.Path().apply{moveTo(x,0f);lineTo(x+step/2,0f);lineTo(x+step/2+h,h);lineTo(x+h,h);close()},Color(0xff171715));x+=step}
 }
}

@Composable internal fun ClapperBar(angle:Float=0f){
 Canvas(Modifier.fillMaxWidth().height(64.dp).clipToBounds()){
  val c=drawContext.canvas.nativeCanvas;val p=Paint(Paint.ANTI_ALIAS_FLAG);val unit=size.height/64
  c.save();c.scale(unit,unit);val w=size.width/unit
  fun jaw(fixed:Boolean){
   c.save();c.clipRect(0f,if(fixed)32f else 0f,w,if(fixed)64f else 32f)
   p.color=(if(fixed)0xffd8d4c9 else 0xffeeeade).toInt();c.drawRect(0f,0f,w,64f,p);p.color=0xff171715.toInt()
   for(i in -1..(w/80).toInt()){val x=i*80f;c.drawPath(android.graphics.Path().apply{
    if(fixed){moveTo(x+32,32f);lineTo(x+72,32f);lineTo(x+40,64f);lineTo(x,64f)}
    else {moveTo(x,0f);lineTo(x+40,0f);lineTo(x+72,32f);lineTo(x+32,32f)};close()
   },p)}
   if(fixed){p.shader=android.graphics.LinearGradient(0f,32f,0f,39f,0x69000000,0x00000000,android.graphics.Shader.TileMode.CLAMP);c.drawRect(0f,32f,w,39f,p);p.shader=null}
   else {p.color=0x41ffffff;c.drawRect(0f,0f,w,1f,p);p.color=0x46000000;c.drawRect(0f,30.5f,w,32f,p)}
   c.restore()
  }
  jaw(true);c.save();c.rotate(-angle,14f,16f);jaw(false);c.restore()
  val plate=android.graphics.Path().apply{moveTo(0f,0f);lineTo(23f,0f);lineTo(46f,59f);lineTo(42f,64f);lineTo(0f,64f);close()}
  p.color=0xff777970.toInt();c.drawPath(plate,p);p.style=Paint.Style.STROKE;p.strokeWidth=1f;p.color=0xffa7a79f.toInt();c.drawPath(plate,p);p.style=Paint.Style.FILL
  for(v in listOf(14f to 16f,11f to 52f,33f to 52f)){p.color=0xffd2d2c8.toInt();c.drawCircle(v.first,v.second,4f,p);p.color=0xff777970.toInt();c.drawLine(v.first-2,v.second,v.first+2,v.second,p)};c.restore()
 }
}

private data class GuideSprite(val image:ImageBitmap,val mouthX:Float,val mouthY:Float,val baseline:Float)

@Composable private fun MascotGuide(state:BoardState,landscape:Boolean,modifier:Modifier){
 val ctx=LocalContext.current
 val sprites=remember{
  val poses=ctx.assets.open("mascot/approved/manifest.json").bufferedReader().use{org.json.JSONObject(it.readText())}.getJSONArray("poses")
  listOf(3,8,11).associateWith{id->
   val record=(0 until poses.length()).map{poses.getJSONObject(it)}.first{it.getInt("pose")==id}
   val mouth=record.getJSONArray("muzzleNormalized")
   val image=ctx.assets.open("mascot/approved/"+record.getString("file")).use{BitmapFactory.decodeStream(it).asImageBitmap()}
   GuideSprite(image,mouth.getDouble(0).toFloat(),mouth.getDouble(1).toFloat(),record.getDouble("baselineNormalized").toFloat())
  }
 }
 val target=when(state.phase){BoardPhase.SENT->11;BoardPhase.LOST,BoardPhase.INCOMPLETE->8;else->3}
 var pose by remember{mutableIntStateOf(target)};val squash=remember{Animatable(0f)};val entrance=remember{Animatable(1.15f)}
 LaunchedEffect(Unit){entrance.animateTo(0f,spring(dampingRatio=.84f,stiffness=320f))}
 LaunchedEffect(target){if(pose!=target){squash.animateTo(1f,tween(65));pose=target;squash.animateTo(-.4f,tween(60));squash.animateTo(0f,spring(dampingRatio=.8f,stiffness=420f))}}
 val sprite=sprites.getValue(pose);val sx=1f+.035f*squash.value;val sy=1f-.045f*squash.value;val rise=entrance.value
 val words=when(state.phase){BoardPhase.CHALLENGE->state.prompt;BoardPhase.SENT->"Sent to OBS!";BoardPhase.INCOMPLETE->"Let's try a fresh recording!";else->"Let's reconnect!"}.trimEnd('!')+"!"
 // Text stays left of the face; transparent canvas padding may overlap, anatomy does not.
 SubcomposeLayout(modifier.clipToBounds()){constraints->
  val w=constraints.maxWidth;val h=constraints.maxHeight;val gap=12.dp.roundToPx();val edge=12.dp.roundToPx()
  val bw=(w*(if(landscape).42f else .40f)).toInt().coerceAtLeast(1)
  val bh=(h*(if(landscape).9f else .43f)).toInt().coerceAtLeast(1)
  val bubble=subcompose("bubble"){
   Surface(shape=RoundedCornerShape(12.dp),color=Chalk,contentColor=Slate,modifier=Modifier.graphicsLayer{alpha=(1f-rise/1.15f).coerceIn(0f,1f)}){Text(words,Modifier.verticalScroll(rememberScrollState()).padding(12.dp),fontSize=17.sp,fontWeight=FontWeight.Medium,lineHeight=22.sp)}
  }.single().measure(Constraints(minWidth=bw,maxWidth=bw,maxHeight=bh))
  // Shared foot baseline sits just beneath the board's true bottom edge, not an internal line.
  val visibleHeight=sprite.baseline-.035f
  val aw=if(landscape)w-bubble.width-gap-edge else (w*.72f).toInt()
  val ah=h-edge
  val side=minOf(aw.toFloat(),ah/visibleHeight).coerceAtLeast(1f).toInt()
  val left=if(landscape)w-edge-side else w-side
  val top=h-side*visibleHeight
  // Same bottom-centre affine transform as the Image, including its negative X reflection.
  val mx=left+side*.5f+(sprite.mouthX*side-side*.5f)*-sx
  val my=top+side+(sprite.mouthY*side-side)*sy+side*rise
  val bx=if(landscape)0 else edge
  val by=(if(landscape)my-bubble.height*.6f else my-16.dp.toPx()).toInt().coerceIn(0,(h-bubble.height).coerceAtLeast(0))
  val pointer=subcompose("pointer"){
   Canvas(Modifier.fillMaxSize()){
    if(rise<.15f){
     val tx=mx-7.dp.toPx();val path=Path()
     run{
      val anchor=(my-by).coerceIn(12.dp.toPx(),(bubble.height-12.dp.toPx()).coerceAtLeast(12.dp.toPx()))+by
      path.moveTo((bx+bubble.width-1).toFloat(),anchor-5.dp.toPx());path.lineTo(tx,my);path.lineTo((bx+bubble.width-1).toFloat(),anchor+5.dp.toPx())
     }
     path.close();drawPath(path,Chalk.copy(alpha=(1f-rise/.15f).coerceIn(0f,1f)))
    }
   }
  }.single().measure(Constraints.fixed(w,h))
  val art=subcompose("sprite"){
   Image(sprite.image,"Brushtail possum guide",modifier=Modifier.graphicsLayer{transformOrigin=TransformOrigin(.5f,1f);scaleX=-sx;scaleY=sy;translationY=size.height*rise})
  }.single().measure(Constraints.fixed(side,side))
  layout(w,h){pointer.place(0,0);art.place(left,top.toInt());bubble.place(bx,by)}
 }
}

@Composable private fun ClockBand(){
 var time by remember{mutableLongStateOf(System.currentTimeMillis())};LaunchedEffect(Unit){while(true){time=System.currentTimeMillis();delay(50)}}
 Canvas(Modifier.fillMaxWidth().height(64.dp)){
  val c=drawContext.canvas.nativeCanvas;val p=Paint(Paint.ANTI_ALIAS_FLAG);val d=density;c.save();c.scale(d,d);val w=size.width/d
  p.color=0xff969388.toInt();p.strokeWidth=1f;c.drawLine(0f,0f,w,0f,p);c.drawLine(0f,63f,w,63f,p)
  p.color=0xffeeeade.toInt();p.typeface=android.graphics.Typeface.create("sans-serif-medium",0)
  val local=BoardClock.local(time);val gmt=BoardClock.gmt(time)
  p.textSize=9f;c.drawText("LOCAL",0f,15f,p);c.drawText("GMT",0f,43f,p);p.textSize=8f;c.drawText(local.take(10).replace(':','-'),0f,26f,p);c.drawText(gmt.take(10).replace(':','-'),0f,54f,p)
  val scale=minOf(.64f,(w-65)/270f);digitalClock(c,p,local.drop(11),65f,7f,scale);digitalClock(c,p,gmt.drop(11),65f,35f,scale);c.restore()
 }
}
private fun digitalClock(c:android.graphics.Canvas,p:Paint,s:String,x:Float,y:Float,scale:Float){
 c.save();c.translate(x,y);c.scale(scale,scale);p.color=0xffeeeade.toInt()
 val masks=intArrayOf(119,36,93,109,46,107,123,37,127,111)
 val seg=arrayOf(RectF(4f,0f,16f,3.4f),RectF(0f,4f,3.4f,14f),RectF(17f,4f,20.4f,14f),RectF(4f,14.5f,16f,18f),RectF(0f,18.5f,3.4f,28.5f),RectF(17f,18.5f,20.4f,28.5f),RectF(4f,29f,16f,32.4f))
 for(ch in s){if(ch.isDigit()){p.color=0x26000000;c.drawRoundRect(RectF(-1f,-1f,21.4f,33.4f),1f,1f,p);p.color=0xffeeeade.toInt();for(i in 0..6)if(masks[ch-'0'] and (1 shl i)!=0)c.drawRoundRect(seg[i],.8f,.8f,p);c.translate(24f,0f)}else{if(ch==':'){c.drawCircle(3f,10f,1.8f,p);c.drawCircle(3f,23f,1.8f,p)};c.translate(9f,0f)}};c.restore()
}
