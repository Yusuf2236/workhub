package com.workhub.app

import androidx.compose.runtime.Composable
import androidx.navigation.compose.rememberNavController

@Composable
fun WorkHubApp() {
    val navController = rememberNavController()
    AppNavGraph(navController = navController)
}
