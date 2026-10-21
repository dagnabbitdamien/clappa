package org.clappa.app

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/** The decorative stripe reaches both edges; only interactive content consumes side insets. */
@Composable internal fun MenuLayout(
    title: String,
    backLabel: String? = null,
    onBack: () -> Unit = {},
    content: @Composable ColumnScope.() -> Unit
) {
    Column(Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Vertical))) {
        MenuStripe()
        Column(Modifier.weight(1f).fillMaxWidth()
            .windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Horizontal))
            .padding(horizontal = 20.dp)) {
            Row(Modifier.fillMaxWidth().padding(vertical = 12.dp).heightIn(min = 48.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween) {
                Wordmark(size = 32)
                if (backLabel != null) OutlinedButton(onClick = onBack,
                    modifier = Modifier.heightIn(min = 48.dp)) { Text(backLabel) }
            }
            Text(title, style = MaterialTheme.typography.titleLarge,
                modifier = Modifier.padding(bottom = 16.dp))
            content()
        }
    }
}
