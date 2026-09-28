package com.workhub.app

import androidx.compose.runtime.Composable
import androidx.navigation.compose.rememberNavController
import com.workhub.app.ui.navigation.AppNavGraph
import com.workhub.app.ui.theme.WorkHubTheme

@Composable
fun WorkHubApp() {
    WorkHubTheme {
        val navController = rememberNavController()
        AppNavGraph(navController = navController)
    }
}
