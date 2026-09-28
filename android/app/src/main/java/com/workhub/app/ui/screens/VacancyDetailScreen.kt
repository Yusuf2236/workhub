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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import com.workhub.app.ui.theme.WorkHubBackground
import com.workhub.app.ui.theme.WorkHubMuted
import com.workhub.app.ui.theme.WorkHubPrimary
import com.workhub.app.ui.theme.WorkHubSuccess
import com.workhub.app.ui.theme.WorkHubSurface
import com.workhub.app.ui.theme.WorkHubText

@Composable
fun VacancyDetailScreen(
    vacancyId: String,
    onBack: () -> Unit,
    onApplySuccess: () -> Unit
) {
    var isApplied by remember { mutableStateOf(false) }

    Scaffold(
        containerColor = WorkHubBackground
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(20.dp)
        ) {
            TextButton(
                onClick = onBack,
                modifier = Modifier.align(Alignment.Start)
            ) {
                Text("← Back to listings", color = WorkHubPrimary)
            }

            Spacer(modifier = Modifier.height(12.dp))

            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = WorkHubSurface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "Senior Go Backend Architect",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = WorkHubText
                    )
                    Text(
                        text = "WorkHub Global • Tashkent / Remote",
                        fontSize = 14.sp,
                        color = WorkHubMuted,
                        modifier = Modifier.padding(top = 4.dp, bottom = 12.dp)
                    )

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(WorkHubSuccess.copy(alpha = 0.12f))
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = "Compensation: $4000 - $6000 / month",
                            color = WorkHubSuccess,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    Text(
                        text = "About the Role",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = WorkHubText
                    )
                    Text(
                        text = "We are seeking a high-caliber Go Backend Architect to design distributed systems, manage PostgreSQL partitioning, Redis cache layers, and real-time WebSocket communication pipelines.",
                        fontSize = 14.sp,
                        color = WorkHubMuted,
                        lineHeight = 22.sp,
                        modifier = Modifier.padding(top = 8.dp)
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "Requirements",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = WorkHubText
                    )
                    Text(
                        text = "• 5+ years with Golang and distributed architecture\n• Deep expertise in PostgreSQL and Redis\n• Experience with Docker and Kubernetes infrastructure\n• High commitment to code quality and testing",
                        fontSize = 14.sp,
                        color = WorkHubMuted,
                        lineHeight = 22.sp,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            if (isApplied) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(WorkHubSuccess.copy(alpha = 0.15f))
                        .padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "✓ Application submitted successfully!",
                        color = WorkHubSuccess,
                        fontWeight = FontWeight.Bold
                    )
                }
            } else {
                Button(
                    onClick = {
                        isApplied = true
                        onApplySuccess()
                    },
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = WorkHubPrimary),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                ) {
                    Text(
                        text = "Apply Now",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
            }
        }
    }
}
