package com.workhub.app

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.compose.rememberNavController
import com.workhub.app.data.settings.AppState
import com.workhub.app.ui.navigation.AppNavGraph
import com.workhub.app.ui.theme.LocalThemeMode
import com.workhub.app.ui.theme.ThemeMode
import com.workhub.app.ui.theme.WorkHubTheme

@Composable
fun WorkHubApp() {
    val context = LocalContext.current
    val appState = remember { AppState.load(context) }
    val themeModeState = remember { mutableStateOf(ThemeMode.SYSTEM) }

    CompositionLocalProvider(LocalThemeMode provides themeModeState) {
        WorkHubTheme(
            themeMode = themeModeState.value,
            appState = appState
        ) {
            val navController = rememberNavController()
            AppNavGraph(
                navController = navController,
                appState = appState
            )
        }
    }
}
