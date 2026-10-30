package com.workhub.app.ui.screens

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.automirrored.outlined.ArrowForward
import androidx.compose.material.icons.automirrored.outlined.VolumeUp
import androidx.compose.material.icons.outlined.*
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.workhub.app.data.settings.AppState
import kotlinx.coroutines.launch

@Composable
fun SettingsAppHost(
    state: AppState,
    onBack: () -> Unit = {}
) {
    val isDark = state.pendingDark
    val targetColors = if (isDark) {
        darkColorScheme(
            primary = state.pendingAccent,
            background = Color(0xFF10121A),
            surface = Color(0xFF181B26),
            surfaceVariant = Color(0xFF1F2333),
            onBackground = Color(0xFFF1F5F9),
            onSurface = Color(0xFFF1F5F9)
        )
    } else {
        lightColorScheme(
            primary = state.pendingAccent,
            background = Color(0xFFF8F9FD),
            surface = Color(0xFFFFFFFF),
            surfaceVariant = Color(0xFFF1F3F9),
            onBackground = Color(0xFF0F172A),
            onSurface = Color(0xFF0F172A)
        )
    }

    // Smooth fluid animation when transitioning between White (Light) and Black (Dark)
    val animatedBg by animateColorAsState(targetColors.background, tween(450), label = "BgAnim")
    val animatedSurface by animateColorAsState(targetColors.surface, tween(450), label = "SurfaceAnim")
    val animatedSurfaceVariant by animateColorAsState(targetColors.surfaceVariant, tween(450), label = "SurfaceVarAnim")
    val animatedOnBg by animateColorAsState(targetColors.onBackground, tween(450), label = "OnBgAnim")
    val animatedOnSurface by animateColorAsState(targetColors.onSurface, tween(450), label = "OnSurfaceAnim")
    val animatedPrimary by animateColorAsState(targetColors.primary, tween(350), label = "PrimaryAnim")

    val animatedColorScheme = targetColors.copy(
        primary = animatedPrimary,
        background = animatedBg,
        surface = animatedSurface,
        surfaceVariant = animatedSurfaceVariant,
        onBackground = animatedOnBg,
        onSurface = animatedOnSurface
    )

    MaterialTheme(colorScheme = animatedColorScheme) {
        val navController = rememberNavController()
        NavHost(navController = navController, startDestination = "settings") {
            composable("settings") {
                SettingsScreen(state = state, navController = navController, onBack = onBack)
            }
            composable("appearance") {
                AppearanceScreen(state = state, navController = navController)
            }
            composable("language") {
                LanguageScreen(state = state, navController = navController)
            }
            composable("notifications") {
                NotificationsScreen(state = state, navController = navController)
            }
        }
    }
}

// ==================== SETTINGS SCREEN ====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    state: AppState,
    navController: NavController,
    onBack: () -> Unit = {}
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var showReview by remember { mutableStateOf(false) }

    Scaffold(
        bottomBar = {
            if (state.hasChanges) {
                Surface(
                    tonalElevation = 8.dp,
                    shadowElevation = 8.dp
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .navigationBarsPadding()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "• ${state.changesCount} ${if (state.changesCount == 1) "change" else "changes"}",
                            color = state.pendingAccent,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(Modifier.weight(1f))
                        TextButton(onClick = { state.discard() }) {
                            Text("Discard")
                        }
                        Spacer(Modifier.width(8.dp))
                        Button(
                            onClick = { showReview = true },
                            colors = ButtonDefaults.buttonColors(containerColor = state.pendingAccent)
                        ) {
                            Text("Review")
                        }
                    }
                }
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back")
                }
                Spacer(Modifier.width(8.dp))
                Column {
                    Text(
                        text = "Settings",
                        fontSize = (32 * state.pendingTextScale).sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Make the app feel like yours.",
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        fontSize = 14.sp
                    )
                }
            }

            Spacer(Modifier.height(24.dp))

            // Dark mode with spring icon morph and smooth state transition
            val iconRotation by animateFloatAsState(
                targetValue = if (state.pendingDark) 0f else 360f,
                animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessLow),
                label = "ThemeIconRotation"
            )
            val cardContainerColor by animateColorAsState(
                targetValue = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = if (state.pendingDark) 0.45f else 0.7f),
                animationSpec = tween(durationMillis = 400),
                label = "CardContainerColor"
            )

            Card(
                shape = RoundedCornerShape(state.pendingRadius.dp),
                colors = CardDefaults.cardColors(containerColor = cardContainerColor)
            ) {
                ListItem(
                    headlineContent = { Text("Dark mode", fontWeight = FontWeight.SemiBold) },
                    supportingContent = { Text("Tap to switch the mood") },
                    leadingContent = {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(state.pendingAccent.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            AnimatedContent(
                                targetState = state.pendingDark,
                                transitionSpec = {
                                    (fadeIn(animationSpec = tween(300)) + scaleIn(initialScale = 0.5f))
                                        .togetherWith(fadeOut(animationSpec = tween(200)) + scaleOut(targetScale = 0.5f))
                                },
                                label = "ThemeIconMorph"
                            ) { isDark ->
                                Icon(
                                    imageVector = if (isDark) Icons.Outlined.DarkMode else Icons.Outlined.LightMode,
                                    contentDescription = null,
                                    tint = state.pendingAccent,
                                    modifier = Modifier.graphicsLayer { rotationZ = iconRotation }
                                )
                            }
                        }
                    },
                    trailingContent = {
                        Switch(
                            checked = state.pendingDark,
                            onCheckedChange = { state.pendingDark = it },
                            colors = SwitchDefaults.colors(checkedTrackColor = state.pendingAccent)
                        )
                    }
                )
            }

            Spacer(Modifier.height(24.dp))
            SectionTitle("PERSONALIZATION")
            Card(
                shape = RoundedCornerShape(state.pendingRadius.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
            ) {
                ListItem(
                    headlineContent = { Text("Appearance", fontWeight = FontWeight.SemiBold) },
                    supportingContent = { Text(state.appearanceSummary()) },
                    leadingContent = { Icon(Icons.Outlined.Palette, null, tint = state.pendingAccent) },
                    trailingContent = { Icon(Icons.Outlined.ChevronRight, null) },
                    modifier = Modifier.clickable { navController.navigate("appearance") }
                )
                HorizontalDivider(Modifier.padding(horizontal = 16.dp))
                ListItem(
                    headlineContent = { Text("Language", fontWeight = FontWeight.SemiBold) },
                    supportingContent = { Text(AppState.languageName(state.pendingLang)) },
                    leadingContent = { Icon(Icons.Outlined.Language, null, tint = state.pendingAccent) },
                    trailingContent = { Icon(Icons.Outlined.ChevronRight, null) },
                    modifier = Modifier.clickable { navController.navigate("language") }
                )
            }

            Spacer(Modifier.height(24.dp))
            SectionTitle("ALERTS")
            Card(
                shape = RoundedCornerShape(state.pendingRadius.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
            ) {
                ListItem(
                    headlineContent = { Text("Notifications", fontWeight = FontWeight.SemiBold) },
                    supportingContent = { Text("Messages and promos") },
                    leadingContent = { Icon(Icons.Outlined.Notifications, null, tint = state.pendingAccent) },
                    trailingContent = { Icon(Icons.Outlined.ChevronRight, null) },
                    modifier = Modifier.clickable { navController.navigate("notifications") }
                )
            }

            Spacer(Modifier.height(24.dp))
            SectionTitle("PRIVACY & SECURITY")
            Card(
                shape = RoundedCornerShape(state.pendingRadius.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
            ) {
                ListItem(
                    headlineContent = { Text("Privacy", fontWeight = FontWeight.SemiBold) },
                    supportingContent = { Text("Visible to everyone") },
                    leadingContent = { Icon(Icons.Outlined.Lock, null, tint = state.pendingAccent) },
                    trailingContent = { Icon(Icons.Outlined.ChevronRight, null) }
                )
                HorizontalDivider(Modifier.padding(horizontal = 16.dp))
                ListItem(
                    headlineContent = { Text("Security", fontWeight = FontWeight.SemiBold) },
                    supportingContent = { Text("Basic protection") },
                    leadingContent = { Icon(Icons.Outlined.Shield, null, tint = state.pendingAccent) },
                    trailingContent = { Icon(Icons.Outlined.ChevronRight, null) }
                )
            }
        }
    }

    if (showReview) {
        ReviewSheet(
            state = state,
            onDismiss = { showReview = false },
            onSave = {
                scope.launch {
                    state.save(context)
                    showReview = false
                }
            }
        )
    }
}

// ==================== APPEARANCE ====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppearanceScreen(state: AppState, navController: NavController) {
    val colors = listOf(
        Color(0xFF7C5CFF), Color(0xFFFF4D8D), Color(0xFF3B82F6),
        Color(0xFF22C55E), Color(0xFFF59E0B)
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Appearance") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(20.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // Preview card
            Card(
                shape = RoundedCornerShape(state.pendingRadius.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Outlined.AutoAwesome, null, tint = state.pendingAccent)
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text("Weekly summary", fontWeight = FontWeight.SemiBold)
                        Text("Your plan for the week is ready.", fontSize = 13.sp)
                    }
                    Button(
                        onClick = {},
                        colors = ButtonDefaults.buttonColors(containerColor = state.pendingAccent),
                        shape = RoundedCornerShape((state.pendingRadius * 0.7f).dp)
                    ) {
                        Text("Open")
                    }
                }
            }

            Spacer(Modifier.height(32.dp))
            SectionTitle("THEME COLOR")
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                colors.forEach { c ->
                    val selected = state.pendingAccent == c
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .clip(CircleShape)
                            .background(c)
                            .border(
                                width = if (selected) 3.dp else 0.dp,
                                color = if (selected) MaterialTheme.colorScheme.onSurface else Color.Transparent,
                                shape = CircleShape
                            )
                            .clickable { state.pendingAccent = c }
                    )
                }
            }

            Spacer(Modifier.height(32.dp))
            SectionTitle("TEXT SIZE")
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                listOf(0.85f, 1f, 1.15f, 1.3f).forEach { scale ->
                    val selected = state.pendingTextScale == scale
                    Box(
                        modifier = Modifier
                            .width(72.dp)
                            .height(48.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(
                                if (selected) state.pendingAccent.copy(alpha = 0.15f)
                                else MaterialTheme.colorScheme.surfaceVariant
                            )
                            .border(
                                width = if (selected) 2.dp else 0.dp,
                                color = if (selected) state.pendingAccent else Color.Transparent,
                                shape = RoundedCornerShape(12.dp)
                            )
                            .clickable { state.pendingTextScale = scale },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Aa",
                            fontSize = (18 * scale).sp,
                            fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium
                        )
                    }
                }
            }

            Spacer(Modifier.height(32.dp))
            SectionTitle("UI STYLE")
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                listOf(22f to "Rounded", 14f to "Soft", 6f to "Crisp").forEach { (r, label) ->
                    val selected = state.pendingRadius == r
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(
                            modifier = Modifier
                                .width(94.dp)
                                .height(44.dp)
                                .clip(RoundedCornerShape(r.dp))
                                .background(if (selected) state.pendingAccent else state.pendingAccent.copy(alpha = 0.3f))
                                .border(
                                    width = if (selected) 2.dp else 0.dp,
                                    color = if (selected) MaterialTheme.colorScheme.onSurface else Color.Transparent,
                                    shape = RoundedCornerShape(r.dp)
                                )
                                .clickable { state.pendingRadius = r }
                        )
                        Spacer(Modifier.height(8.dp))
                        Text(
                            text = label,
                            color = if (selected) state.pendingAccent else MaterialTheme.colorScheme.onSurface,
                            fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal
                        )
                    }
                }
            }
        }
    }
}

// ==================== LANGUAGE ====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LanguageScreen(state: AppState, navController: NavController) {
    val languages = listOf(
        "en" to "English", "uz" to "O‘zbekcha", "ru" to "Русский",
        "fr" to "Français", "es" to "Español", "de" to "Deutsch",
        "pt" to "Português", "it" to "Italiano"
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Language") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(Modifier.padding(padding)) {
            languages.forEach { (code, name) ->
                val selected = state.pendingLang == code
                ListItem(
                    headlineContent = { Text(name, fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal) },
                    supportingContent = { Text(code.uppercase()) },
                    leadingContent = {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(if (selected) state.pendingAccent else MaterialTheme.colorScheme.surfaceVariant),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = code.uppercase(),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (selected) Color.White else MaterialTheme.colorScheme.onSurface
                            )
                        }
                    },
                    trailingContent = {
                        if (selected) Icon(Icons.Rounded.CheckCircle, null, tint = state.pendingAccent)
                    },
                    modifier = Modifier.clickable { state.pendingLang = code }
                )
                HorizontalDivider(Modifier.padding(start = 70.dp))
            }
        }
    }
}

// ==================== NOTIFICATIONS ====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationsScreen(state: AppState, navController: NavController) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Notifications") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(20.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Card(shape = RoundedCornerShape(state.pendingRadius.dp)) {
                SwitchRow("Push notifications", "On this device", state.pendingPush,
                    { state.pendingPush = it }, state.pendingAccent, Icons.Outlined.NotificationsActive)
            }
            Spacer(Modifier.height(24.dp))
            SectionTitle("NOTIFY ME ABOUT")
            Card(shape = RoundedCornerShape(state.pendingRadius.dp)) {
                SwitchRow("Messages", "Replies and new chats", state.pendingMessages,
                    { state.pendingMessages = it }, state.pendingAccent, Icons.Outlined.ChatBubbleOutline)
                HorizontalDivider()
                SwitchRow("Promotions", "Offers and news", state.pendingPromos,
                    { state.pendingPromos = it }, state.pendingAccent, Icons.Outlined.LocalOffer)
            }
            Spacer(Modifier.height(24.dp))
            SectionTitle("SOUND & VIBRATION")
            Card(shape = RoundedCornerShape(state.pendingRadius.dp)) {
                SwitchRow("Sound", "A soft tone for alerts", state.pendingSound,
                    { state.pendingSound = it }, state.pendingAccent, Icons.AutoMirrored.Outlined.VolumeUp)
                HorizontalDivider()
                SwitchRow("Vibration", "A gentle buzz", state.pendingVibration,
                    { state.pendingVibration = it }, state.pendingAccent, Icons.Outlined.Vibration)
            }
        }
    }
}

// ==================== REVIEW SHEET ====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReviewSheet(state: AppState, onDismiss: () -> Unit, onSave: () -> Unit) {
    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .padding(20.dp)
                .navigationBarsPadding()
        ) {
            Text("Review changes", fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Text(
                "${state.changesCount} changes ready to apply",
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
            Spacer(Modifier.height(20.dp))

            if (state.dark != state.pendingDark) {
                ChangeRow("Dark mode", if (state.dark) "On" else "Off", if (state.pendingDark) "On" else "Off", state.pendingAccent)
            }
            if (state.accent != state.pendingAccent) {
                ChangeRow("Theme color", AppState.colorName(state.accent), AppState.colorName(state.pendingAccent), state.pendingAccent)
            }
            if (state.textScale != state.pendingTextScale) {
                ChangeRow("Text size", AppState.textScaleName(state.textScale), AppState.textScaleName(state.pendingTextScale), state.pendingAccent)
            }
            if (state.radius != state.pendingRadius) {
                ChangeRow("UI style", AppState.radiusStyleName(state.radius), AppState.radiusStyleName(state.pendingRadius), state.pendingAccent)
            }
            if (state.lang != state.pendingLang) {
                ChangeRow("Language", AppState.languageName(state.lang), AppState.languageName(state.pendingLang), state.pendingAccent)
            }
            if (state.push != state.pendingPush) {
                ChangeRow("Push", if (state.push) "On" else "Off", if (state.pendingPush) "On" else "Off", state.pendingAccent)
            }
            if (state.messages != state.pendingMessages) {
                ChangeRow("Messages", if (state.messages) "On" else "Off", if (state.pendingMessages) "On" else "Off", state.pendingAccent)
            }
            if (state.promos != state.pendingPromos) {
                ChangeRow("Promotions", if (state.promos) "On" else "Off", if (state.pendingPromos) "On" else "Off", state.pendingAccent)
            }
            if (state.sound != state.pendingSound) {
                ChangeRow("Sound", if (state.sound) "On" else "Off", if (state.pendingSound) "On" else "Off", state.pendingAccent)
            }
            if (state.vibration != state.pendingVibration) {
                ChangeRow("Vibration", if (state.vibration) "On" else "Off", if (state.pendingVibration) "On" else "Off", state.pendingAccent)
            }

            Spacer(Modifier.height(24.dp))
            Button(
                onClick = onSave,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = state.pendingAccent),
                shape = RoundedCornerShape(14.dp)
            ) {
                Text("Save changes", Modifier.padding(vertical = 8.dp))
            }
            Spacer(Modifier.height(16.dp))
        }
    }
}

// ==================== HELPERS ====================
@Composable
fun SectionTitle(text: String) {
    Text(
        text = text,
        fontSize = 12.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 0.5.sp,
        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
        modifier = Modifier.padding(bottom = 8.dp)
    )
}

@Composable
fun SwitchRow(
    title: String,
    subtitle: String,
    checked: Boolean,
    onChecked: (Boolean) -> Unit,
    accent: Color,
    icon: androidx.compose.ui.graphics.vector.ImageVector
) {
    ListItem(
        headlineContent = { Text(title, fontWeight = FontWeight.SemiBold) },
        supportingContent = { Text(subtitle) },
        leadingContent = { Icon(icon, null, tint = accent) },
        trailingContent = {
            Switch(checked = checked, onCheckedChange = onChecked, colors = SwitchDefaults.colors(checkedTrackColor = accent))
        }
    )
}

@Composable
fun ChangeRow(label: String, from: String, to: String, accent: Color) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, Modifier.weight(1f))
        Text(from, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
        Icon(
            Icons.AutoMirrored.Outlined.ArrowForward,
            contentDescription = null,
            modifier = Modifier
                .size(16.dp)
                .padding(horizontal = 4.dp),
            tint = accent
        )
        Text(to, color = accent, fontWeight = FontWeight.Bold)
    }
}
