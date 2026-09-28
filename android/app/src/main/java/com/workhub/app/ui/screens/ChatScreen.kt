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
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
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
import com.workhub.app.ui.theme.WorkHubSurface
import com.workhub.app.ui.theme.WorkHubText

data class ChatUiMessage(
    val id: String,
    val sender: String,
    val text: String,
    val isMe: Boolean,
    val time: String
)

@Composable
fun ChatScreen(
    onBack: () -> Unit = {}
) {
    var inputMessage by remember { mutableStateOf("") }
    val messages = remember {
        mutableStateListOf(
            ChatUiMessage("1", "Recruiter", "Hello! We reviewed your Go Backend resume. Are you available for an interview?", false, "10:30 AM"),
            ChatUiMessage("2", "Me", "Hello! Yes, absolutely. I am available anytime tomorrow afternoon.", true, "10:32 AM"),
            ChatUiMessage("3", "Recruiter", "Great, I will send an invitation for 3:00 PM Tashkent time.", false, "10:35 AM")
        )
    }

    Scaffold(containerColor = WorkHubBackground) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                TextButton(onClick = onBack) {
                    Text("← Back", color = WorkHubPrimary)
                }
                Spacer(modifier = Modifier.weight(1f))
                Column(horizontalAlignment = Alignment.End) {
                    Text("Recruiter (WorkHub)", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = WorkHubText)
                    Text("Online", fontSize = 12.sp, color = Color(0xFF10B981))
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(messages) { msg ->
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = if (msg.isMe) Alignment.CenterEnd else Alignment.CenterStart
                    ) {
                        Column(
                            modifier = Modifier
                                .clip(
                                    RoundedCornerShape(
                                        topStart = 14.dp,
                                        topEnd = 14.dp,
                                        bottomStart = if (msg.isMe) 14.dp else 2.dp,
                                        bottomEnd = if (msg.isMe) 2.dp else 14.dp
                                    )
                                )
                                .background(if (msg.isMe) WorkHubPrimary else WorkHubSurface)
                                .padding(horizontal = 14.dp, vertical = 10.dp)
                        ) {
                            Text(
                                text = msg.text,
                                color = if (msg.isMe) Color.White else WorkHubText,
                                fontSize = 14.sp
                            )
                            Text(
                                text = msg.time,
                                color = if (msg.isMe) Color.White.copy(alpha = 0.7f) else WorkHubMuted,
                                fontSize = 10.sp,
                                modifier = Modifier.align(Alignment.End).padding(top = 4.dp)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = inputMessage,
                    onValueChange = { inputMessage = it },
                    placeholder = { Text("Type your message...") },
                    shape = RoundedCornerShape(24.dp),
                    modifier = Modifier.weight(1f)
                )

                Button(
                    onClick = {
                        if (inputMessage.isNotBlank()) {
                            messages.add(
                                ChatUiMessage(
                                    id = System.currentTimeMillis().toString(),
                                    sender = "Me",
                                    text = inputMessage.trim(),
                                    isMe = true,
                                    time = "Just now"
                                )
                            )
                            inputMessage = ""
                        }
                    },
                    shape = RoundedCornerShape(24.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = WorkHubPrimary)
                ) {
                    Text("Send", color = Color.White)
                }
            }
        }
    }
}
