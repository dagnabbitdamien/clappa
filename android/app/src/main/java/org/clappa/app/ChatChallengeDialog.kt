package org.clappa.app

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable

@Composable internal fun ChatChallengeDialog(viewers:Int,onDismiss:()->Unit,onAccept:()->Unit){
    AlertDialog(onDismissRequest=onDismiss,title={Text("Chat would like a challenge!")},
        text={Text("$viewers viewers sent 🎬 in Twitch chat. Ready to take a fresh photo challenge?")},
        confirmButton={TextButton(onClick=onAccept){Text("Take a challenge")}},
        dismissButton={TextButton(onClick=onDismiss){Text("Not now")}})
}
