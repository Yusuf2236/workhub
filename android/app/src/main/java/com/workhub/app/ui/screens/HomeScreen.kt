package com.workhub.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.workhub.app.data.models.Vacancy
import com.workhub.app.ui.theme.WorkHubBackground
import com.workhub.app.ui.theme.WorkHubMuted
import com.workhub.app.ui.theme.WorkHubPrimary
import com.workhub.app.ui.theme.WorkHubSuccess
import com.workhub.app.ui.theme.WorkHubSurface
import com.workhub.app.ui.theme.WorkHubText

@Composable
fun HomeScreen(
    onVacancyClick: (vacancyId: String) -> Unit = {},
    onNavigateToChat: () -> Unit = {},
    onNavigateToApplications: () -> Unit = {}
) {
    var searchQuery by remember { mutableStateOf("") }

    val sampleVacancies = remember {
        listOf(
            Vacancy(
                id = "1",
                title = "Senior Go Backend Architect",
                company = "WorkHub Global",
                location = "Tashkent / Remote",
                salary = "$4000 - $6000",
                description = "Designing high-concurrency microservices, PostgreSQL, and Redis caching systems."
            ),
            Vacancy(
                id = "2",
                title = "Android Mobile Engineer",
                company = "FinTech Labs",
                location = "Remote",
                salary = "$3000 - $4500",
                description = "Building native Android apps with Kotlin, Jetpack Compose and clean architecture."
            ),
            Vacancy(
                id = "3",
                title = "iOS Lead Developer",
                company = "Global Mobile Studio",
                location = "Tashkent",
                salary = "$3500 - $5000",
                description = "SwiftUI native platform development with real-time WebSocket communication."
            )
        )
    }

    val filtered = sampleVacancies.filter {
        it.title.contains(searchQuery, ignoreCase = true) ||
        it.company.contains(searchQuery, ignoreCase = true)
    }

    Scaffold(
        containerColor = WorkHubBackground
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Find your dream job",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = WorkHubText
                        )
                        Text(
                            text = "Discover opportunities matched for you",
                            fontSize = 14.sp,
                            color = WorkHubMuted
                        )
                    }
                }
            }

            item {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search by title, skill, or company...") },
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                )
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = onNavigateToApplications,
                        colors = ButtonDefaults.buttonColors(containerColor = WorkHubPrimary),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("My Applications", fontSize = 13.sp)
                    }

                    Button(
                        onClick = onNavigateToChat,
                        colors = ButtonDefaults.buttonColors(containerColor = WorkHubSurface),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Messages", color = WorkHubPrimary, fontSize = 13.sp)
                    }
                }
            }

            item {
                Text(
                    text = "Recommended Vacancies (${filtered.size})",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = WorkHubText,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }

            items(filtered) { vacancy ->
                VacancyCard(
                    vacancy = vacancy,
                    onClick = { onVacancyClick(vacancy.id) }
                )
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}

@Composable
fun VacancyCard(
    vacancy: Vacancy,
    onClick: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = WorkHubSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = vacancy.title,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = WorkHubText
                    )
                    Text(
                        text = "${vacancy.company} • ${vacancy.location}",
                        fontSize = 13.sp,
                        color = WorkHubMuted,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(WorkHubSuccess.copy(alpha = 0.12f))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = vacancy.salary,
                        color = WorkHubSuccess,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Text(
                text = vacancy.description,
                fontSize = 13.sp,
                color = WorkHubMuted,
                maxLines = 2,
                modifier = Modifier.padding(top = 10.dp, bottom = 12.dp)
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                Text(
                    text = "View details →",
                    color = WorkHubPrimary,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}
