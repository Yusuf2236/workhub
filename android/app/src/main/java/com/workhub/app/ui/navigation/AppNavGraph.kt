package com.workhub.app.ui.navigation

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.*
import androidx.navigation.navArgument
import com.workhub.app.BuildConfig
import com.workhub.app.data.repository.JobRepository
import com.workhub.app.ui.screens.*
import kotlinx.coroutines.delay

@Composable
fun AppNavGraph(
    navController: NavHostController,
    context: android.content.Context = androidx.compose.ui.platform.LocalContext.current,
    repository: JobRepository = remember { JobRepository(context) }
) {
    NavHost(
        navController = navController,
        startDestination = "main_tabs"
    ) {
        composable("login") {
            LoginScreen(
                repository = repository,
                onLoginSuccess = {
                    navController.navigate("main_tabs") {
                        popUpTo("login") { inclusive = true }
                    }
                },
                onSkipToHome = {
                    navController.navigate("main_tabs") {
                        popUpTo("login") { inclusive = true }
                    }
                }
            )
        }

        composable("main_tabs") {
            MainTabsContainer(
                repository = repository,
                onVacancyClick = { vacancyId ->
                    navController.navigate("vacancy_detail/$vacancyId")
                },
                onRequireLogin = {
                    navController.navigate("login")
                }
            )
        }

        composable(
            route = "vacancy_detail/{vacancyId}",
            arguments = listOf(navArgument("vacancyId") { type = NavType.StringType })
        ) { backStackEntry ->
            val vacancyId = backStackEntry.arguments?.getString("vacancyId") ?: ""
            VacancyDetailScreen(
                vacancyId = vacancyId,
                repository = repository,
                onBack = { navController.popBackStack() },
                onApplySuccess = {
                    /* Navigate or toast */
                }
            )
        }
    }
}

@Composable
fun MainTabsContainer(
    repository: JobRepository,
    onVacancyClick: (vacancyId: String) -> Unit,
    onRequireLogin: () -> Unit
) {
    var selectedTab by remember { mutableStateOf("feed") }
    var isWebMirrorMode by remember { mutableStateOf(false) }
    var isSplashActive by remember { mutableStateOf(true) }
    var splashTargetScale by remember { mutableStateOf(1f) }
    var splashAlpha by remember { mutableStateOf(1f) }
    val applications by repository.applications.collectAsState()
    val vacancies by repository.vacancies.collectAsState()

    LaunchedEffect(Unit) {
        delay(1000)
        splashTargetScale = 15f
        splashAlpha = 0f
        delay(600)
        isSplashActive = false
    }

    Box(modifier = Modifier.fillMaxSize()) {
        if (isWebMirrorMode) {
        Box(modifier = Modifier.fillMaxSize()) {
            WebBridgeScreen(
                url = BuildConfig.WEB_URL,
                onSwitchToNative = { isWebMirrorMode = false }
            )

            // Floating Switcher back to Native Compose UI
            Surface(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(top = 40.dp, end = 16.dp)
                    .clip(CircleShape)
                    .clickable { isWebMirrorMode = false },
                color = MaterialTheme.colorScheme.primaryContainer,
                shadowElevation = 6.dp
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text("📱", fontSize = 14.sp)
                    Text(
                        text = "Native UI ga qaytish",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
        }
    } else {
        var showAddDialog by remember { mutableStateOf(false) }

        if (showAddDialog) {
            AlertDialog(
                onDismissRequest = { showAddDialog = false },
                title = {
                    Text(
                        text = "WZone E'lon / Rezyume",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                },
                text = {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    showAddDialog = false
                                    selectedTab = "profile"
                                },
                            shape = RoundedCornerShape(16.dp),
                            color = Color(0xFFF3E8FF)
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Text("📄", fontSize = 24.sp)
                                Column {
                                    Text("Yangi Rezyume yaratish", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color(0xFF2E1C59))
                                    Text("OneID va AI yordamida tezkor CV", fontSize = 11.sp, color = Color.Gray)
                                }
                            }
                        }

                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    showAddDialog = false
                                    selectedTab = "vacancies"
                                },
                            shape = RoundedCornerShape(16.dp),
                            color = Color(0xFFEFF6FF)
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Text("💼", fontSize = 24.sp)
                                Column {
                                    Text("Vakansiya e'lon qilish", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color(0xFF1E3A8A))
                                    Text("Kompaniya uchun yangi xodim topish", fontSize = 11.sp, color = Color.Gray)
                                }
                            }
                        }
                    }
                },
                confirmButton = {
                    TextButton(onClick = { showAddDialog = false }) {
                        Text("Yopish", color = Color(0xFF6C47D8), fontWeight = FontWeight.Bold)
                    }
                }
            )
        }

        Scaffold(
            bottomBar = {
                WZoneAndroidBottomNav(
                    selectedTab = selectedTab,
                    onTabSelected = { tab ->
                        selectedTab = when (tab) {
                            "home" -> "feed"
                            "jobs" -> "vacancies"
                            else -> tab
                        }
                    },
                    onAddClick = { showAddDialog = true }
                )
            }
        ) { paddingValues ->
            Box(modifier = Modifier.padding(paddingValues).fillMaxSize()) {
                when (selectedTab) {
                    "feed" -> HomeScreen(
                        repository = repository,
                        onNavigateToVacancies = { selectedTab = "vacancies" },
                        onVacancyClick = onVacancyClick,
                        onNavigateToChat = { selectedTab = "chat" }
                    )
                    "vacancies" -> VacancyListScreen(
                        repository = repository,
                        onVacancyClick = onVacancyClick,
                        onBack = { selectedTab = "feed" }
                    )
                    "saved" -> SavedVacanciesScreen(
                        repository = repository,
                        onNavigateToVacancies = { selectedTab = "vacancies" },
                        onVacancyClick = onVacancyClick
                    )
                    "chat" -> ChatScreen(
                        repository = repository,
                        onBack = { selectedTab = "feed" }
                    )
                    "applications" -> ApplicationScreen(
                        repository = repository,
                        onBack = { selectedTab = "feed" }
                    )
                    "profile" -> ProfileScreen(
                        repository = repository,
                        onLogout = onRequireLogin
                    )
                }

                // Quick Floating Switch to Web Mirror Mode
                Surface(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(top = 10.dp, end = 12.dp)
                        .clip(CircleShape)
                        .clickable { isWebMirrorMode = true },
                    color = Color(0xFF0F172A).copy(alpha = 0.85f),
                    shadowElevation = 4.dp
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text("🌐", fontSize = 11.sp)
                        Text(
                            text = "Jonli Sayt",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF60A5FA)
                        )
                    }
                }
            }
        }

        // Native WZone Launch Splash Animation (W ochiladi, kattalashadi)
        if (isSplashActive) {
            val scale by animateFloatAsState(
                targetValue = splashTargetScale,
                animationSpec = tween(durationMillis = 650, easing = FastOutSlowInEasing),
                label = "splashScale"
            )
            val alpha by animateFloatAsState(
                targetValue = splashAlpha,
                animationSpec = tween(durationMillis = 500),
                label = "splashAlpha"
            )

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .alpha(alpha)
                    .background(Color(0xFF0C061A)),
                contentAlignment = Alignment.Center
            ) {
                // Radial glow
                Box(
                    modifier = Modifier
                        .size(280.dp)
                        .background(
                            brush = Brush.radialGradient(
                                colors = listOf(Color(0xFF6C47D8).copy(alpha = 0.45f), Color.Transparent)
                            ),
                            shape = CircleShape
                        )
                )

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Box(
                        modifier = Modifier
                            .graphicsLayer(scaleX = scale, scaleY = scale)
                            .size(96.dp)
                            .clip(RoundedCornerShape(28.dp))
                            .background(
                                brush = Brush.linearGradient(
                                    colors = listOf(Color(0xFF4A1FB8), Color(0xFF6C47D8), Color(0xFF9D6FFF))
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "W",
                            fontSize = 56.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                    }

                    if (scale < 2f) {
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "WZone",
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "O‘zbekiston vakansiyalar platformasi",
                            fontSize = 11.sp,
                            color = Color(0xFFC4B5FD)
                        )
                    }
                }
            }
        }
    }
}

/**
 * 1. Bosh sahifa (Home) Icon
 */
@Composable
fun HomeTabIcon(selected: Boolean) {
    androidx.compose.foundation.Canvas(modifier = Modifier.size(22.dp)) {
        val color = if (selected) Color(0xFF2563EB) else Color(0xFF94A3B8)
        val w = size.width
        val h = size.height

        val roof = androidx.compose.ui.graphics.Path().apply {
            moveTo(w * 0.5f, h * 0.12f)
            lineTo(w * 0.9f, h * 0.48f)
            lineTo(w * 0.78f, h * 0.48f)
            lineTo(w * 0.78f, h * 0.88f)
            lineTo(w * 0.22f, h * 0.88f)
            lineTo(w * 0.22f, h * 0.48f)
            lineTo(w * 0.1f, h * 0.48f)
            close()
        }

        if (selected) {
            drawPath(roof, color)
            // Door cutout in white
            drawRoundRect(
                color = Color.White,
                topLeft = androidx.compose.ui.geometry.Offset(w * 0.4f, h * 0.55f),
                size = androidx.compose.ui.geometry.Size(w * 0.2f, h * 0.33f),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(2f, 2f)
            )
        } else {
            drawPath(
                roof,
                color,
                style = androidx.compose.ui.graphics.drawscope.Stroke(width = 3.5f)
            )
        }
    }
}

/**
 * 2. Vakansiyalar (Cards/Layers) Icon
 */
@Composable
fun VacanciesTabIcon(selected: Boolean) {
    androidx.compose.foundation.Canvas(modifier = Modifier.size(22.dp)) {
        val color = if (selected) Color(0xFF2563EB) else Color(0xFF94A3B8)
        val w = size.width
        val h = size.height

        // Top-left card
        drawRoundRect(
            color = color,
            topLeft = androidx.compose.ui.geometry.Offset(w * 0.15f, h * 0.15f),
            size = androidx.compose.ui.geometry.Size(w * 0.55f, h * 0.55f),
            cornerRadius = androidx.compose.ui.geometry.CornerRadius(4f, 4f),
            style = androidx.compose.ui.graphics.drawscope.Stroke(width = 3.5f)
        )

        // Bottom-right card
        drawRoundRect(
            color = color,
            topLeft = androidx.compose.ui.geometry.Offset(w * 0.32f, h * 0.32f),
            size = androidx.compose.ui.geometry.Size(w * 0.55f, h * 0.55f),
            cornerRadius = androidx.compose.ui.geometry.CornerRadius(4f, 4f),
            style = androidx.compose.ui.graphics.drawscope.Stroke(width = 3.5f)
        )
    }
}

/**
 * 3. Saqlanganlar (Bookmark) Icon
 */
@Composable
fun SavedTabIcon(selected: Boolean) {
    androidx.compose.foundation.Canvas(modifier = Modifier.size(22.dp)) {
        val color = if (selected) Color(0xFF2563EB) else Color(0xFF94A3B8)
        val w = size.width
        val h = size.height

        val path = androidx.compose.ui.graphics.Path().apply {
            moveTo(w * 0.22f, h * 0.14f)
            lineTo(w * 0.78f, h * 0.14f)
            lineTo(w * 0.78f, h * 0.88f)
            lineTo(w * 0.50f, h * 0.68f)
            lineTo(w * 0.22f, h * 0.88f)
            close()
        }

        if (selected) {
            drawPath(path, color)
        } else {
            drawPath(
                path,
                color,
                style = androidx.compose.ui.graphics.drawscope.Stroke(
                    width = 3.5f,
                    join = androidx.compose.ui.graphics.StrokeJoin.Round
                )
            )
        }
    }
}

/**
 * 4. Ariza holati (Briefcase) Icon
 */
@Composable
fun ApplicationsTabIcon(selected: Boolean) {
    androidx.compose.foundation.Canvas(modifier = Modifier.size(22.dp)) {
        val color = if (selected) Color(0xFF2563EB) else Color(0xFF94A3B8)
        val w = size.width
        val h = size.height

        // Handle
        val handle = androidx.compose.ui.graphics.Path().apply {
            moveTo(w * 0.35f, h * 0.3f)
            lineTo(w * 0.35f, h * 0.15f)
            lineTo(w * 0.65f, h * 0.15f)
            lineTo(w * 0.65f, h * 0.3f)
        }
        drawPath(
            handle,
            color,
            style = androidx.compose.ui.graphics.drawscope.Stroke(width = 3f)
        )

        // Bag body
        drawRoundRect(
            color = color,
            topLeft = androidx.compose.ui.geometry.Offset(w * 0.12f, h * 0.3f),
            size = androidx.compose.ui.geometry.Size(w * 0.76f, h * 0.58f),
            cornerRadius = androidx.compose.ui.geometry.CornerRadius(6f, 6f),
            style = androidx.compose.ui.graphics.drawscope.Stroke(width = 3.5f)
        )

        // Center clasp
        drawLine(
            color = color,
            start = androidx.compose.ui.geometry.Offset(w * 0.12f, h * 0.52f),
            end = androidx.compose.ui.geometry.Offset(w * 0.88f, h * 0.52f),
            strokeWidth = 2.5f
        )
    }
}

/**
 * 5. Profil (User) Icon
 */
@Composable
fun ProfileTabIcon(selected: Boolean) {
    androidx.compose.foundation.Canvas(modifier = Modifier.size(22.dp)) {
        val color = if (selected) Color(0xFF2563EB) else Color(0xFF94A3B8)
        val w = size.width
        val h = size.height

        // Head circle
        drawCircle(
            color = color,
            radius = w * 0.22f,
            center = androidx.compose.ui.geometry.Offset(w * 0.5f, h * 0.32f),
            style = androidx.compose.ui.graphics.drawscope.Stroke(width = 3.5f)
        )

        // Shoulder arc
        val shoulders = androidx.compose.ui.graphics.Path().apply {
            moveTo(w * 0.18f, h * 0.88f)
            cubicTo(w * 0.22f, h * 0.62f, w * 0.78f, h * 0.62f, w * 0.82f, h * 0.88f)
        }
        drawPath(
            shoulders,
            color,
            style = androidx.compose.ui.graphics.drawscope.Stroke(
                width = 3.5f,
                cap = androidx.compose.ui.graphics.StrokeCap.Round
            )
        )
    }
}
