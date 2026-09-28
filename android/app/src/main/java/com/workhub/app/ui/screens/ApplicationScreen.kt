package com.workhub.app.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.workhub.app.ui.theme.WorkHubBackground
import com.workhub.app.ui.theme.WorkHubMuted
import com.workhub.app.ui.theme.WorkHubPrimary
import com.workhub.app.ui.theme.WorkHubSuccess
import com.workhub.app.ui.theme.WorkHubSurface
import com.workhub.app.ui.theme.WorkHubText
import com.workhub.app.ui.theme.WorkHubWarning

data class ApplicationUiModel(
    val id: String,
    val title: String,
    val company: String,
    val status: String,
    val appliedDate: String
)

@Composable
fun ApplicationScreen(
    onBack: () -> Unit = {}
) {
    val applications = listOf(
        ApplicationUiModel("1", "Senior Go Backend Architect", "WorkHub Global", "in_review", "2026-09-24"),
        ApplicationUiModel("2", "Android Lead Engineer", "FinTech Labs", "submitted", "2026-09-22"),
        ApplicationUiModel("3", "Staff Cloud Architect", "TechCorp", "interview", "2026-09-20")
    )

    Scaffold(containerColor = WorkHubBackground) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                TextButton(onClick = onBack) {
                    Text("← Back to jobs", color = WorkHubPrimary)
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "My Applications",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = WorkHubText
                )
                Text(
                    text = "Track the status of all your submitted jobs",
                    fontSize = 14.sp,
                    color = WorkHubMuted,
                    modifier = Modifier.padding(bottom = 12.dp)
                )
            }

            items(applications) { app ->
                Card(
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = WorkHubSurface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = app.title,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = WorkHubText
                            )
                            Text(
                                text = "${app.company} • Applied on ${app.appliedDate}",
                                fontSize = 13.sp,
                                color = WorkHubMuted,
                                modifier = Modifier.padding(top = 4.dp)
                            )
                        }

                        val (statusColor, statusText) = when (app.status) {
                            "accepted" -> WorkHubSuccess to "Accepted"
                            "interview" -> WorkHubPrimary to "Interview"
                            "in_review" -> WorkHubWarning to "In Review"
                            else -> WorkHubMuted to "Submitted"
                        }

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(statusColor.copy(alpha = 0.12f))
                                .padding(horizontal = 10.dp, vertical = 5.dp)
                        ) {
                            Text(
                                text = statusText,
                                color = statusColor,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }
        }
    }
}
