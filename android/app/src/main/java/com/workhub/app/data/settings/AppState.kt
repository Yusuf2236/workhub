package com.workhub.app.data.settings

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.floatPreferencesKey
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking

val Context.settingsDataStore by preferencesDataStore("settings")

data class AppState(
    var dark: Boolean = false,
    var accent: Color = Color(0xFF7C5CFF),
    var textScale: Float = 1f,
    var radius: Float = 22f,
    var lang: String = "en",
    var push: Boolean = true,
    var messages: Boolean = true,
    var promos: Boolean = false,
    var sound: Boolean = true,
    var vibration: Boolean = true
) {
    // Pending (staged changes)
    var pendingDark by mutableStateOf(dark)
    var pendingAccent by mutableStateOf(accent)
    var pendingTextScale by mutableFloatStateOf(textScale)
    var pendingRadius by mutableFloatStateOf(radius)
    var pendingLang by mutableStateOf(lang)
    var pendingPush by mutableStateOf(push)
    var pendingMessages by mutableStateOf(messages)
    var pendingPromos by mutableStateOf(promos)
    var pendingSound by mutableStateOf(sound)
    var pendingVibration by mutableStateOf(vibration)

    val hasChanges: Boolean
        get() = dark != pendingDark || accent != pendingAccent ||
                textScale != pendingTextScale || radius != pendingRadius ||
                lang != pendingLang || push != pendingPush ||
                messages != pendingMessages || promos != pendingPromos ||
                sound != pendingSound || vibration != pendingVibration

    val changesCount: Int
        get() {
            var n = 0
            if (dark != pendingDark) n++
            if (accent != pendingAccent) n++
            if (textScale != pendingTextScale) n++
            if (radius != pendingRadius) n++
            if (lang != pendingLang) n++
            if (push != pendingPush) n++
            if (messages != pendingMessages) n++
            if (promos != pendingPromos) n++
            if (sound != pendingSound) n++
            if (vibration != pendingVibration) n++
            return n
        }

    fun discard() {
        pendingDark = dark
        pendingAccent = accent
        pendingTextScale = textScale
        pendingRadius = radius
        pendingLang = lang
        pendingPush = push
        pendingMessages = messages
        pendingPromos = promos
        pendingSound = sound
        pendingVibration = vibration
    }

    suspend fun save(context: Context) {
        dark = pendingDark
        accent = pendingAccent
        textScale = pendingTextScale
        radius = pendingRadius
        lang = pendingLang
        push = pendingPush
        messages = pendingMessages
        promos = pendingPromos
        sound = pendingSound
        vibration = pendingVibration

        context.settingsDataStore.edit { prefs ->
            prefs[booleanPreferencesKey("dark")] = dark
            prefs[intPreferencesKey("accent")] = accent.toArgb()
            prefs[floatPreferencesKey("textScale")] = textScale
            prefs[floatPreferencesKey("radius")] = radius
            prefs[stringPreferencesKey("lang")] = lang
            prefs[booleanPreferencesKey("push")] = push
            prefs[booleanPreferencesKey("messages")] = messages
            prefs[booleanPreferencesKey("promos")] = promos
            prefs[booleanPreferencesKey("sound")] = sound
            prefs[booleanPreferencesKey("vibration")] = vibration
        }
    }

    fun appearanceSummary(): String {
        val color = colorName(pendingAccent)
        val size = textScaleName(pendingTextScale)
        val style = radiusStyleName(pendingRadius)
        return "$color · $size · $style"
    }

    companion object {
        fun colorName(color: Color): String = when (color) {
            Color(0xFF7C5CFF) -> "Violet"
            Color(0xFFFF4D8D) -> "Rose"
            Color(0xFF3B82F6) -> "Blue"
            Color(0xFF22C55E) -> "Green"
            Color(0xFFF59E0B) -> "Amber"
            else -> "Custom"
        }

        fun textScaleName(scale: Float): String = when {
            scale <= 0.9f -> "Small"
            scale <= 1.0f -> "Default"
            scale <= 1.15f -> "Large"
            else -> "X-Large"
        }

        fun radiusStyleName(r: Float): String = when {
            r >= 20f -> "Rounded"
            r >= 12f -> "Soft"
            else -> "Crisp"
        }

        fun languageName(code: String): String = when (code) {
            "en" -> "English"
            "fr" -> "Français"
            "es" -> "Español"
            "de" -> "Deutsch"
            "pt" -> "Português"
            "it" -> "Italiano"
            "uz" -> "O‘zbekcha"
            "ru" -> "Русский"
            else -> code.uppercase()
        }

        fun load(context: Context): AppState {
            return runBlocking {
                val prefs = try {
                    context.settingsDataStore.data.first()
                } catch (_: Exception) {
                    null
                }

                val accentArgb = prefs?.get(intPreferencesKey("accent"))
                val accentColor = if (accentArgb != null) Color(accentArgb) else Color(0xFF7C5CFF)

                AppState(
                    dark = prefs?.get(booleanPreferencesKey("dark")) ?: false,
                    accent = accentColor,
                    textScale = prefs?.get(floatPreferencesKey("textScale")) ?: 1f,
                    radius = prefs?.get(floatPreferencesKey("radius")) ?: 22f,
                    lang = prefs?.get(stringPreferencesKey("lang")) ?: "en",
                    push = prefs?.get(booleanPreferencesKey("push")) ?: true,
                    messages = prefs?.get(booleanPreferencesKey("messages")) ?: true,
                    promos = prefs?.get(booleanPreferencesKey("promos")) ?: false,
                    sound = prefs?.get(booleanPreferencesKey("sound")) ?: true,
                    vibration = prefs?.get(booleanPreferencesKey("vibration")) ?: true
                ).also { it.discard() }
            }
        }
    }
}
