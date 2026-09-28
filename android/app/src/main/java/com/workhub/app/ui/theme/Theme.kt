package com.workhub.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColorScheme = lightColorScheme(
    primary = WorkHubPrimary,
    secondary = WorkHubSecondary,
    background = WorkHubBackground,
    surface = WorkHubSurface,
    onPrimary = WorkHubSurface,
    onSecondary = WorkHubSurface,
    onBackground = WorkHubText,
    onSurface = WorkHubText,
    error = WorkHubDanger
)

@Composable
fun WorkHubTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        content = content
    )
}
