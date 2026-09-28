package com.workhub.app.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
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
        androidx.compose.foundation.layout.Box(modifier = Modifier.padding(paddingValues)) {
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
        }
    }
}
