package org.clappa.app

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.foundation.layout.size
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable internal fun ChatChallengeDialog(viewers:Int,onDismiss:()->Unit,onAccept:()->Unit){
    AlertDialog(onDismissRequest=onDismiss,containerColor=Slate,titleContentColor=Chalk,textContentColor=Chalk,
        icon={MenuPossum(3,Modifier.size(100.dp))},title={Text("Chat would like a challenge!")},
        text={Text("$viewers viewers sent 🎬. Fancy a quick photo?")},
        confirmButton={TextButton(onClick=onAccept){Text("Take a challenge",color=MenuOrange)}},
        dismissButton={TextButton(onClick=onDismiss){Text("Not now")}})
}
