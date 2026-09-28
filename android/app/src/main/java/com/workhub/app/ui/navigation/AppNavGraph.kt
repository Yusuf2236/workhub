package com.workhub.app.ui.navigation

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.*
import androidx.navigation.navArgument
import com.workhub.app.data.repository.JobRepository
import com.workhub.app.ui.screens.*

@Composable
fun AppNavGraph(
    navController: NavHostController,
    repository: JobRepository = remember { JobRepository() }
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
                    /* Navigate or show toast */
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

    if (isWebMirrorMode) {
        Box(modifier = Modifier.fillMaxSize()) {
            WebBridgeScreen(
                url = "http://10.0.2.2:3000",
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
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text("🤖", fontSize = 12.sp)
                    Text(
                        text = "Native UI",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
        }
    } else {
        Scaffold(
            bottomBar = {
                NavigationBar(
                    tonalElevation = 8.dp
                ) {
                    NavigationBarItem(
                        selected = selectedTab == "feed",
                        onClick = { selectedTab = "feed" },
                        icon = { Text("🏠", fontSize = 18.sp) },
                        label = { Text("Bosh sahifa", fontSize = 10.sp, fontWeight = if (selectedTab == "feed") FontWeight.Bold else FontWeight.Normal) }
                    )
                    NavigationBarItem(
                        selected = selectedTab == "vacancies",
                        onClick = { selectedTab = "vacancies" },
                        icon = { Text("💼", fontSize = 18.sp) },
                        label = { Text("Vakansiyalar", fontSize = 10.sp, fontWeight = if (selectedTab == "vacancies") FontWeight.Bold else FontWeight.Normal) }
                    )
                    NavigationBarItem(
                        selected = selectedTab == "chat",
                        onClick = { selectedTab = "chat" },
                        icon = { Text("💬", fontSize = 18.sp) },
                        label = { Text("Chat", fontSize = 10.sp, fontWeight = if (selectedTab == "chat") FontWeight.Bold else FontWeight.Normal) }
                    )
                    NavigationBarItem(
                        selected = selectedTab == "applications",
                        onClick = { selectedTab = "applications" },
                        icon = { Text("📋", fontSize = 18.sp) },
                        label = { Text("Arizalar", fontSize = 10.sp, fontWeight = if (selectedTab == "applications") FontWeight.Bold else FontWeight.Normal) }
                    )
                    NavigationBarItem(
                        selected = selectedTab == "profile",
                        onClick = { selectedTab = "profile" },
                        icon = { Text("👤", fontSize = 18.sp) },
                        label = { Text("Profil", fontSize = 10.sp, fontWeight = if (selectedTab == "profile") FontWeight.Bold else FontWeight.Normal) }
                    )
                }
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

                // Quick Floating Switch to Web Mirror Mode (100% sayt bilan sinxron)
                Surface(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(top = 10.dp, end = 12.dp)
                        .clip(CircleShape)
                        .clickable { isWebMirrorMode = true },
                    color = Color(0xFF1E293B).copy(alpha = 0.9f),
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
    }
}
