package com.workhub.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

enum class ThemeMode {
    LIGHT,
    DARK,
    SYSTEM
}

val LocalThemeMode = compositionLocalOf { mutableStateOf(ThemeMode.SYSTEM) }

private val LightColorScheme = lightColorScheme(
    primary = WorkHubPrimary,
    onPrimary = WorkHubSurfaceLight,
    primaryContainer = WorkHubPrimaryLight.copy(alpha = 0.12f),
    onPrimaryContainer = WorkHubPrimaryDark,
    secondary = WorkHubSecondary,
    onSecondary = WorkHubSurfaceLight,
    background = WorkHubBackgroundLight,
    onBackground = WorkHubTextLight,
    surface = WorkHubSurfaceLight,
    onSurface = WorkHubTextLight,
    surfaceVariant = WorkHubSurfaceVariantLight,
    onSurfaceVariant = WorkHubMutedLight,
    outline = WorkHubBorderLight,
    error = WorkHubDanger,
    onError = WorkHubSurfaceLight
)

private val DarkColorScheme = darkColorScheme(
    primary = WorkHubPrimaryLight,
    onPrimary = WorkHubSurfaceDark,
    primaryContainer = WorkHubPrimary.copy(alpha = 0.25f),
    onPrimaryContainer = WorkHubTextDark,
    secondary = WorkHubSecondary,
    onSecondary = WorkHubSurfaceDark,
    background = WorkHubBackgroundDark,
    onBackground = WorkHubTextDark,
    surface = WorkHubSurfaceDark,
    onSurface = WorkHubTextDark,
    surfaceVariant = WorkHubSurfaceVariantDark,
    onSurfaceVariant = WorkHubMutedDark,
    outline = WorkHubBorderDark,
    error = WorkHubDanger,
    onError = WorkHubTextDark
)

@Composable
fun WorkHubTheme(
    themeMode: ThemeMode = ThemeMode.SYSTEM,
    content: @Composable () -> Unit
) {
    val systemInDark = isSystemInDarkTheme()
    val isDark = when (themeMode) {
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
        ThemeMode.SYSTEM -> systemInDark
    }

    val colorScheme = if (isDark) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}

