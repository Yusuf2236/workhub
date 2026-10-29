package com.workhub.app.ui.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.outlined.AccountCircle
import androidx.compose.material.icons.outlined.DateRange
import androidx.compose.material.icons.outlined.WorkOutline
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * WZone Android Bottom Navigation Bar
 * Material 3 & Jetpack Compose
 * Floating Action Button (+) with signature Purple Glow (oq ramkasiz)
 */
@Composable
fun WZoneAndroidBottomNav(
    selectedTab: String,
    onTabSelected: (String) -> Unit,
    onAddClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .navigationBarsPadding(),
        contentAlignment = Alignment.BottomCenter
    ) {
        // Asosiy oq panel (Tepasi 32dp yumaloq burchak)
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .height(72.dp),
            shape = RoundedCornerShape(topStart = 32.dp, topEnd = 32.dp),
            color = Color.White,
            shadowElevation = 10.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 8.dp),
                horizontalArrangement = Arrangement.SpaceAround,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 1. Home
                NavItem(
                    title = "Home",
                    icon = Icons.Filled.Home,
                    isSelected = selectedTab == "home" || selectedTab == "feed",
                    onClick = { onTabSelected("home") }
                )

                // 2. Vakansiyalar
                NavItem(
                    title = "Vakansiyalar",
                    icon = Icons.Outlined.WorkOutline,
                    isSelected = selectedTab == "jobs" || selectedTab == "vacancies",
                    onClick = { onTabSelected("jobs") }
                )

                // 3. Markaziy bo'shliq (FAB sig'ishi uchun)
                Spacer(modifier = Modifier.width(56.dp))

                // 4. Arizalarim
                NavItem(
                    title = "Arizalarim",
                    icon = Icons.Outlined.DateRange,
                    isSelected = selectedTab == "applications",
                    onClick = { onTabSelected("applications") }
                )

                // 5. Profil
                NavItem(
                    title = "Profil",
                    icon = Icons.Outlined.AccountCircle,
                    isSelected = selectedTab == "profile",
                    onClick = { onTabSelected("profile") }
                )
            }
        }

        // Asl rasmdagi suzuvchi binafsha "+" FAB tugmasi (Aura glow bilan, oq ramkasiz)
        Box(
            modifier = Modifier
                .offset(y = (-20).dp)
                .size(54.dp)
                .shadow(
                    elevation = 14.dp,
                    shape = CircleShape,
                    spotColor = Color(0xFF6C47D8),
                    ambientColor = Color(0xFF6C47D8)
                )
                .clip(CircleShape)
                .background(Color(0xFF6C47D8))
                .clickable { onAddClick() },
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Add,
                contentDescription = "Qo'shish",
                tint = Color.White,
                modifier = Modifier.size(28.dp)
            )
        }
    }
}

@Composable
fun RowScope.NavItem(
    title: String,
    icon: ImageVector,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val activeColor = Color(0xFF2E1C59)
    val inactiveColor = Color(0xFF8E8E93)

    Column(
        modifier = Modifier
            .weight(1f)
            .clickable(onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = title,
            tint = if (isSelected) activeColor else inactiveColor,
            modifier = Modifier.size(24.dp)
        )
        Spacer(modifier = Modifier.height(3.dp))
        Text(
            text = title,
            fontSize = 11.sp,
            color = if (isSelected) activeColor else inactiveColor
        )
    }
}

@Preview(showBackground = true)
@Composable
fun WZoneAndroidBottomNavPreview() {
    var tab by remember { mutableStateOf("home") }
    WZoneAndroidBottomNav(
        selectedTab = tab,
        onTabSelected = { tab = it },
        onAddClick = {}
    )
}
