package com.workhub.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.workhub.app.data.models.Vacancy
import com.workhub.app.data.repository.JobRepository
import kotlinx.coroutines.launch

@Composable
fun VacancyDetailScreen(
    vacancyId: String,
    repository: JobRepository,
    onBack: () -> Unit,
    onApplySuccess: () -> Unit = {}
) {
    val vacancies by repository.vacancies.collectAsState()
    val scope = rememberCoroutineScope()

    var vacancy by remember {
        mutableStateOf(vacancies.find { it.id == vacancyId } ?: Vacancy(id = vacancyId, title = "Vakansiya", company = "WZone"))
    }
    var showApplyDialog by remember { mutableStateOf(false) }
    var coverLetter by remember { mutableStateOf("Assalomu alaykum! Ushbu vakansiyaga o‘z nomzodimni taqdim etmoqchiman.") }
    var isApplying by remember { mutableStateOf(false) }
    var applicationDone by remember { mutableStateOf(false) }

    LaunchedEffect(vacancyId) {
        val found = vacancies.find { it.id == vacancyId }
        if (found != null) {
            vacancy = found
        }
    }

    Scaffold(
        topBar = {
            Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 1.dp) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onBack) {
                        Text("← Orqaga", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                    Text(
                        text = "Vakansiya Tafsilotlari",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(start = 8.dp)
                    )
                }
            }
        },
        bottomBar = {
            Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 8.dp) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Maosh:",
                            fontSize = 10.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = if (vacancy.salaryMin > 0) "${vacancy.salaryMin} - ${vacancy.salaryMax} ${vacancy.salaryCurrency}" else "Kelishilgan",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFF059669)
                        )
                    }

                    Button(
                        onClick = {
                            if (!applicationDone) {
                                showApplyDialog = true
                            }
                        },
                        enabled = !applicationDone,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (applicationDone) Color(0xFF10B981) else MaterialTheme.colorScheme.primary
                        ),
                        shape = RoundedCornerShape(12.dp),
                        contentPadding = PaddingValues(horizontal = 24.dp, vertical = 12.dp)
                    ) {
                        Text(
                            text = if (applicationDone) "✓ Ariza yuborildi" else "Ariza topshirish",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }
                }
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Surface(
                        color = MaterialTheme.colorScheme.primaryContainer,
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = vacancy.company,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }

                    Text(
                        text = vacancy.title,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black,
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text(
                            text = "📍 ${vacancy.location}",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "💼 ${vacancy.employmentType}",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // Description card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "Vakansiya haqida",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Text(
                        text = vacancy.description.ifBlank { "Kompaniya jamoasiga tajribali mutaxassis qidirilmoqda. Yuqori oylik maosh va zamonaviy ofis muhiti kafolatlanadi." },
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurface,
                        lineHeight = 18.sp
                    )

                    if (vacancy.requirements.isNotBlank()) {
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Talablar",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = vacancy.requirements,
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            lineHeight = 17.sp
                        )
                    }
                }
            }
        }
    }

    // Apply Confirmation Dialog
    if (showApplyDialog) {
        AlertDialog(
            onDismissRequest = { if (!isApplying) showApplyDialog = false },
            confirmButton = {
                Button(
                    onClick = {
                        isApplying = true
                        scope.launch {
                            val res = repository.apply(vacancy, coverLetter)
                            isApplying = false
                            showApplyDialog = false
                            if (res.isSuccess) {
                                applicationDone = true
                                onApplySuccess()
                            }
                        }
                    },
                    enabled = !isApplying
                ) {
                    Text(if (isApplying) "Yuborilmoqda..." else "Tasdiqlash va yuborish")
                }
            },
            dismissButton = {
                TextButton(onClick = { showApplyDialog = false }, enabled = !isApplying) {
                    Text("Bekor qilish")
                }
            },
            title = { Text("Arizani tasdiqlang", fontSize = 16.sp, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "${vacancy.title} (${vacancy.company})",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    OutlinedTextField(
                        value = coverLetter,
                        onValueChange = { coverLetter = it },
                        label = { Text("Qo‘shimcha xabar / Xat") },
                        modifier = Modifier.fillMaxWidth(),
                        maxLines = 4
                    )
                }
            }
        )
    }
}
