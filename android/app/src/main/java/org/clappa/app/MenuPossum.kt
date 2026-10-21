package org.clappa.app

import android.graphics.BitmapFactory
import androidx.compose.foundation.Image
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext

/** Approved complete character artwork. No anatomical crops or part transforms. */
@Composable internal fun MenuPossum(pose:Int,modifier:Modifier=Modifier,asset:String?=null){
 val context=LocalContext.current
 val bitmap=remember(pose,asset){context.assets.open(asset?:"mascot/approved/pose-${pose.toString().padStart(2,'0')}.png").use{BitmapFactory.decodeStream(it).asImageBitmap()}}
 Image(bitmap,"CLAPPA possum",modifier,contentScale=ContentScale.Fit)
}
