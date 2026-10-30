package com.workhub.app.ui.theme

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.graphics.Color
import com.workhub.app.data.settings.AppState

enum class ThemeMode {
    LIGHT,
    DARK,
    SYSTEM
}

val LocalThemeMode = compositionLocalOf { mutableStateOf(ThemeMode.SYSTEM) }
val LocalAppState = compositionLocalOf<AppState?> { null }

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
    appState: AppState? = null,
    content: @Composable () -> Unit
) {
    val systemInDark = isSystemInDarkTheme()
    val isDark = if (appState != null) {
        appState.pendingDark
    } else {
        when (themeMode) {
            ThemeMode.LIGHT -> false
            ThemeMode.DARK -> true
            ThemeMode.SYSTEM -> systemInDark
        }
    }

    val primaryColor = appState?.pendingAccent ?: if (isDark) WorkHubPrimaryLight else WorkHubPrimary
    val baseScheme = if (isDark) DarkColorScheme else LightColorScheme

    val targetScheme = baseScheme.copy(
        primary = primaryColor,
        primaryContainer = primaryColor.copy(alpha = if (isDark) 0.25f else 0.12f)
    )

    // Animated color interpolation between light and dark
    val animatedPrimary by animateColorAsState(targetScheme.primary, tween(350), label = "ThemePrimary")
    val animatedBg by animateColorAsState(targetScheme.background, tween(450), label = "ThemeBg")
    val animatedSurface by animateColorAsState(targetScheme.surface, tween(450), label = "ThemeSurface")
    val animatedSurfaceVar by animateColorAsState(targetScheme.surfaceVariant, tween(450), label = "ThemeSurfaceVar")

    val animatedScheme = targetScheme.copy(
        primary = animatedPrimary,
        background = animatedBg,
        surface = animatedSurface,
        surfaceVariant = animatedSurfaceVar
    )

    CompositionLocalProvider(LocalAppState provides appState) {
        MaterialTheme(
            colorScheme = animatedScheme,
            content = content
        )
    }
}
