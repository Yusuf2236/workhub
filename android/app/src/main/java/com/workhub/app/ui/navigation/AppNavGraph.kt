package com.workhub.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.workhub.app.ui.screens.ApplicationScreen
import com.workhub.app.ui.screens.ChatScreen
import com.workhub.app.ui.screens.HomeScreen
import com.workhub.app.ui.screens.LoginScreen
import com.workhub.app.ui.screens.VacancyDetailScreen

@Composable
fun AppNavGraph(navController: NavHostController) {
    NavHost(
        navController = navController,
        startDestination = "login"
    ) {
        composable("login") {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate("home") {
                        popUpTo("login") { inclusive = true }
                    }
                }
            )
        }

        composable("home") {
            HomeScreen(
                onVacancyClick = { vacancyId ->
                    navController.navigate("vacancy_detail/$vacancyId")
                },
                onNavigateToChat = {
                    navController.navigate("chat")
                },
                onNavigateToApplications = {
                    navController.navigate("applications")
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
                onBack = { navController.popBackStack() },
                onApplySuccess = { /* Handle successful application */ }
            )
        }

        composable("applications") {
            ApplicationScreen(
                onBack = { navController.popBackStack() }
            )
        }

        composable("chat") {
            ChatScreen(
                onBack = { navController.popBackStack() }
            )
        }
    }
}
