package com.workhub.app.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.workhub.app.data.models.Vacancy
import com.workhub.app.data.repository.JobRepository
import kotlinx.coroutines.launch
import kotlin.math.cos
import kotlin.math.sin

data class FeaturedVacancyItem(
    val id: String,
    val title: String,
    val company: String,
    val location: String,
    val salary: String,
    val category: String,
    val logoType: String // "uzum", "epam", "akfa"
)

@Composable
fun HomeScreen(
    repository: JobRepository,
    onNavigateToVacancies: () -> Unit = {},
    onVacancyClick: (vacancyId: String) -> Unit = {},
    onNavigateToChat: () -> Unit = {}
) {
    val scope = rememberCoroutineScope()
    var isNotificationDismissed by remember { mutableStateOf(false) }
    var selectedCategory by remember { mutableStateOf("IT & Dasturlash") }
    var searchQuery by remember { mutableStateOf("") }
    var showAiResumeModal by remember { mutableStateOf(false) }
    var showNotificationsModal by remember { mutableStateOf(false) }
    var applyToastMessage by remember { mutableStateOf<String?>(null) }

    // Featured vacancies matching screenshot exactly
    val initialFeatured = remember {
        listOf(
            FeaturedVacancyItem(
                id = "uzum-fe",
                title = "Frontend Developer",
                company = "Uzum",
                location = "Toshkent · Full-time",
                salary = "18 000 000 so'm",
                category = "IT & Dasturlash",
                logoType = "uzum"
            ),
            FeaturedVacancyItem(
                id = "epam-be",
                title = "Backend Developer (Node.js)",
                company = "Epam Uzbekistan",
                location = "Toshkent · Full-time",
                salary = "20 000 000 so'm",
                category = "IT & Dasturlash",
                logoType = "epam"
            ),
            FeaturedVacancyItem(
                id = "akfa-uiux",
                title = "UI/UX Designer",
                company = "AKFA Group",
                location = "Toshkent · Full-time",
                salary = "12 000 000 so'm",
                category = "Dizayn",
                logoType = "akfa"
            )
        )
    }

    val categories = listOf(
        Pair("</>", "IT & Dasturlash"),
        Pair("💬", "Dizayn"),
        Pair("📢", "Marketing"),
        Pair("🧾", "Moliya"),
        Pair("👥", "HR")
    )

    val displayedVacancies = remember(selectedCategory, searchQuery) {
        initialFeatured.filter { item ->
            val matchesCat = selectedCategory == "all" || item.category == selectedCategory || selectedCategory == "IT & Dasturlash"
            val matchesQuery = searchQuery.isBlank() ||
                item.title.contains(searchQuery, ignoreCase = true) ||
                item.company.contains(searchQuery, ignoreCase = true)
            matchesCat && matchesQuery
        }
    }

    Scaffold(
        topBar = {
            Surface(
                color = Color.White,
                shadowElevation = 0.5.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // WZone Logo (Stylized W + WZone bold text)
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        WZoneLogoIcon(modifier = Modifier.size(28.dp))
                        Text(
                            text = "WZone",
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFF2563EB)
                        )
                    }

                    // Bell icon with blue unread badge dot
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .clip(CircleShape)
                            .clickable { showNotificationsModal = true },
                        contentAlignment = Alignment.Center
                    ) {
                        Canvas(modifier = Modifier.size(20.dp)) {
                            // Bell icon outline
                            val path = Path().apply {
                                moveTo(size.width * 0.5f, size.height * 0.1f)
                                cubicTo(size.width * 0.28f, size.height * 0.15f, size.width * 0.2f, size.height * 0.45f, size.width * 0.2f, size.height * 0.65f)
                                lineTo(size.width * 0.1f, size.height * 0.8f)
                                lineTo(size.width * 0.9f, size.height * 0.8f)
                                lineTo(size.width * 0.8f, size.height * 0.65f)
                                cubicTo(size.width * 0.8f, size.height * 0.45f, size.width * 0.72f, size.height * 0.15f, size.width * 0.5f, size.height * 0.1f)
                                close()
                            }
                            drawPath(
                                path = path,
                                color = Color(0xFF1E293B),
                                style = Stroke(width = 4f)
                            )
                            // Bell clapper
                            drawCircle(
                                color = Color(0xFF1E293B),
                                radius = 3.5f,
                                center = Offset(size.width * 0.5f, size.height * 0.9f)
                            )
                        }

                        // Blue Unread Dot on Top Right
                        Box(
                            modifier = Modifier
                                .size(9.dp)
                                .align(Alignment.TopEnd)
                                .offset(x = (-4).dp, y = 4.dp)
                                .background(Color(0xFF2563EB), CircleShape)
                                .border(1.5.dp, Color.White, CircleShape)
                        )
                    }
                }
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(Color(0xFFFAFAFA))
        ) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = 32.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // 1. TOP NOTIFICATION BANNER (Dismissible)
                item {
                    AnimatedVisibility(
                        visible = !isNotificationDismissed,
                        enter = fadeIn(),
                        exit = fadeOut()
                    ) {
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 6.dp),
                            shape = RoundedCornerShape(16.dp),
                            color = Color(0xFFEFF6FF),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFDBEAFE))
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 12.dp, vertical = 10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Surface(
                                        modifier = Modifier.size(26.dp),
                                        shape = RoundedCornerShape(8.dp),
                                        color = Color(0xFF2563EB)
                                    ) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Text("💼", fontSize = 12.sp)
                                        }
                                    }

                                    Text(
                                        text = buildAnnotatedString {
                                            append("Yangi vakansiya: ")
                                            withStyle(SpanStyle(fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))) {
                                                append("Frontend Developer - Uzum")
                                            }
                                        },
                                        fontSize = 11.5.sp,
                                        color = Color(0xFF1E293B),
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }

                                IconButton(
                                    onClick = { isNotificationDismissed = true },
                                    modifier = Modifier.size(24.dp)
                                ) {
                                    Text("✕", fontSize = 12.sp, color = Color(0xFF94A3B8), fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }

                // 2. HERO AI RESUME BANNER
                item {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp),
                        shape = RoundedCornerShape(22.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(
                                    Brush.linearGradient(
                                        colors = listOf(
                                            Color(0xFF09122C),
                                            Color(0xFF0D1B3F),
                                            Color(0xFF060C1D)
                                        )
                                    )
                                )
                                .border(1.dp, Color(0xFF1E3A8A).copy(alpha = 0.4f), RoundedCornerShape(22.dp))
                                .padding(18.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Left Side
                                Column(
                                    modifier = Modifier.weight(1f),
                                    verticalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    Text(
                                        text = buildAnnotatedString {
                                            withStyle(SpanStyle(color = Color.White, fontWeight = FontWeight.Black)) {
                                                append("AI bilan ")
                                            }
                                            withStyle(SpanStyle(color = Color(0xFFA78BFA), fontWeight = FontWeight.Black)) {
                                                append("10 soniyada")
                                            }
                                            withStyle(SpanStyle(color = Color.White, fontWeight = FontWeight.Black)) {
                                                append("\nprofessional rezyume\nyarating")
                                            }
                                        },
                                        fontSize = 17.sp,
                                        lineHeight = 23.sp
                                    )

                                    // Gradient Pill Button
                                    Surface(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(100.dp))
                                            .clickable { showAiResumeModal = true },
                                        color = Color.Transparent
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .background(
                                                    Brush.horizontalGradient(
                                                        colors = listOf(
                                                            Color(0xFF2563EB),
                                                            Color(0xFF6366F1),
                                                            Color(0xFF9333EA)
                                                        )
                                                    )
                                                )
                                                .padding(horizontal = 14.dp, vertical = 8.dp),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                                            ) {
                                                Text(
                                                    text = "✨ AI Rezyume Yaratish",
                                                    color = Color.White,
                                                    fontSize = 11.5.sp,
                                                    fontWeight = FontWeight.ExtraBold
                                                )
                                                Text(
                                                    text = "→",
                                                    color = Color.White,
                                                    fontSize = 12.sp,
                                                    fontWeight = FontWeight.Black
                                                )
                                            }
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.width(12.dp))

                                // Right Glowing Circuit Brain Frame
                                Box(
                                    modifier = Modifier
                                        .size(width = 82.dp, height = 96.dp)
                                        .clip(RoundedCornerShape(18.dp))
                                        .background(Color(0xFF070F26))
                                        .border(
                                            width = 1.5.dp,
                                            brush = Brush.linearGradient(
                                                colors = listOf(
                                                    Color(0xFF38BDF8),
                                                    Color(0xFFA855F7)
                                                )
                                            ),
                                            shape = RoundedCornerShape(18.dp)
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    BrainCircuitGraphic(modifier = Modifier.size(54.dp))
                                }
                            }
                        }
                    }
                }

                // 3. SEARCH BAR WITH FILTER ICON
                item {
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp),
                        shape = RoundedCornerShape(16.dp),
                        color = Color(0xFFF1F5F9),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0).copy(alpha = 0.8f))
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 14.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text("🔍", fontSize = 13.sp)

                            Box(modifier = Modifier.weight(1f)) {
                                if (searchQuery.isEmpty()) {
                                    Text(
                                        text = "Kasb, kompaniya yoki kalit so'z bo'yicha qidiruv",
                                        color = Color(0xFF94A3B8),
                                        fontSize = 11.5.sp,
                                        fontWeight = FontWeight.Medium,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                                BasicTextField(
                                    value = searchQuery,
                                    onValueChange = { searchQuery = it },
                                    textStyle = TextStyle(
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Color(0xFF0F172A)
                                    ),
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }

                            // Filter sliders icon
                            IconButton(
                                onClick = onNavigateToVacancies,
                                modifier = Modifier.size(24.dp)
                            ) {
                                FilterSlidersIcon(modifier = Modifier.size(16.dp))
                            }
                        }
                    }
                }

                // 4. MASHHUR KATEGORIYALAR
                item {
                    Column(
                        modifier = Modifier.padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Mashhur kategoriyalar",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Black,
                                color = Color(0xFF0F172A)
                            )
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(2.dp),
                                modifier = Modifier.clickable {
                                    selectedCategory = "all"
                                }
                            ) {
                                Text(
                                    text = "Barchasi",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color(0xFF64748B)
                                )
                                Text(
                                    text = ">",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF64748B)
                                )
                            }
                        }

                        // Category Chips Row
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            categories.forEach { (emoji, label) ->
                                val isSelected = selectedCategory == label
                                Surface(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(100.dp))
                                        .clickable { selectedCategory = label },
                                    shape = RoundedCornerShape(100.dp),
                                    color = if (isSelected) Color(0xFFEBF2FE) else Color.White,
                                    border = androidx.compose.foundation.BorderStroke(
                                        width = 1.dp,
                                        color = if (isSelected) Color(0xFFBFDBFE) else Color(0xFFE2E8F0)
                                    )
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Text(emoji, fontSize = 11.sp)
                                        Text(
                                            text = label,
                                            fontSize = 11.5.sp,
                                            fontWeight = if (isSelected) FontWeight.ExtraBold else FontWeight.SemiBold,
                                            color = if (isSelected) Color(0xFF2563EB) else Color(0xFF334155)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // 5. MASHHUR VAKANSIYALAR HEADER
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, top = 6.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Mashhur vakansiyalar",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFF0F172A)
                        )
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(2.dp),
                            modifier = Modifier.clickable { onNavigateToVacancies() }
                        ) {
                            Text(
                                text = "Barchasini ko'rish",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color(0xFF64748B)
                            )
                            Text(
                                text = ">",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF64748B)
                            )
                        }
                    }
                }

                // 6. THREE VAKANSIYA CARDS
                items(displayedVacancies, key = { it.id }) { item ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp)
                            .clip(RoundedCornerShape(20.dp))
                            .clickable { onVacancyClick(item.id) },
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF1F5F9)),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // Top Info Row
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.Top
                            ) {
                                Row(
                                    modifier = Modifier.weight(1f),
                                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                                    verticalAlignment = Alignment.Top
                                ) {
                                    // Company Logo
                                    CompanyLogoBox(logoType = item.logoType)

                                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                        Text(
                                            text = item.title,
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color(0xFF0F172A)
                                        )
                                        Text(
                                            text = item.company,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Medium,
                                            color = Color(0xFF64748B)
                                        )
                                        Text(
                                            text = item.location,
                                            fontSize = 11.sp,
                                            color = Color(0xFF94A3B8)
                                        )
                                    }
                                }

                                Text(
                                    text = item.salary,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = Color(0xFF10B981)
                                )
                            }

                            // Full Width "✈ Ariza yuborish" Pill Button
                            Button(
                                onClick = {
                                    scope.launch {
                                        repository.apply(
                                            Vacancy(
                                                id = item.id,
                                                title = item.title,
                                                company = item.company,
                                                location = item.location
                                            )
                                        )
                                        applyToastMessage = "${item.company} (${item.title}) ga arizangiz muvaffaqiyatli yuborildi!"
                                    }
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(42.dp),
                                shape = RoundedCornerShape(100.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB))
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Text("✈", fontSize = 12.sp, color = Color.White)
                                    Text(
                                        text = "Ariza yuborish",
                                        fontSize = 12.5.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = Color.White
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Snackbar confirmation
            applyToastMessage?.let { msg ->
                Snackbar(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(16.dp),
                    shape = RoundedCornerShape(14.dp),
                    containerColor = Color(0xFF0F172A),
                    contentColor = Color.White,
                    action = {
                        TextButton(onClick = { applyToastMessage = null }) {
                            Text("OK", color = Color(0xFF60A5FA), fontWeight = FontWeight.Bold)
                        }
                    }
                ) {
                    Text(msg, fontSize = 11.5.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }

    // AI RESUME INSTANT MODAL
    if (showAiResumeModal) {
        var resumeProfession by remember { mutableStateOf("Frontend Developer") }
        var isGenerating by remember { mutableStateOf(false) }
        var generatedDone by remember { mutableStateOf(false) }

        AlertDialog(
            onDismissRequest = { showAiResumeModal = false },
            title = {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text("✨", fontSize = 18.sp)
                    Text("AI Rezyume Yaratish", fontSize = 16.sp, fontWeight = FontWeight.Black)
                }
            },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = "WZone AI sizning kasbingiz bo'yicha 10 soniyada professional ko'nikmalar, vazifalar va tavsiyalarni avtomatik tuzib beradi.",
                        fontSize = 12.sp,
                        color = Color(0xFF64748B)
                    )

                    OutlinedTextField(
                        value = resumeProfession,
                        onValueChange = { resumeProfession = it },
                        label = { Text("Kasbingiz yoki ixtisosligingiz", fontSize = 11.sp) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )

                    if (generatedDone) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = Color(0xFFEFF6FF),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFBFDBFE))
                        ) {
                            Column(
                                modifier = Modifier.padding(10.dp),
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text("✅ Rezyume tayyor!", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1D4ED8))
                                Text("• React, TypeScript, Next.js, Redux, Tailwind", fontSize = 11.sp, color = Color(0xFF334155))
                                Text("• REST API integratsiyasi va yuqori tezlikdagi web ilovalar", fontSize = 11.sp, color = Color(0xFF334155))
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (!generatedDone) {
                            isGenerating = true
                            generatedDone = true
                            isGenerating = false
                        } else {
                            showAiResumeModal = false
                            applyToastMessage = "Professional rezyume saqlandi va profilga biriktirildi!"
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB)),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text(if (generatedDone) "Saqlash va yuklash" else "10 soniyada tuzish ✨", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showAiResumeModal = false }) {
                    Text("Bekor qilish", fontSize = 11.sp)
                }
            }
        )
    }

    // NOTIFICATIONS MODAL
    if (showNotificationsModal) {
        AlertDialog(
            onDismissRequest = { showNotificationsModal = false },
            title = {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text("🔔", fontSize = 18.sp)
                    Text("Bildirishnomalar", fontSize = 16.sp, fontWeight = FontWeight.Black)
                }
            },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = Color(0xFFEFF6FF),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Text("Yangi mos vakansiya", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1D4ED8))
                            Text("Uzum: Frontend Developer uchun yangi qabul boshlandi.", fontSize = 11.sp, color = Color(0xFF334155))
                            Text("10 daqiqa oldin", fontSize = 10.sp, color = Color(0xFF94A3B8))
                        }
                    }
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = Color(0xFFF8FAFC),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Text("Ariza ko‘rib chiqildi", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                            Text("Epam Uzbekistan vakansiyangizga javob qaytardi.", fontSize = 11.sp, color = Color(0xFF334155))
                            Text("1 soat oldin", fontSize = 10.sp, color = Color(0xFF94A3B8))
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = { showNotificationsModal = false },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB)),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Tushunarli", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        )
    }
}

/**
 * Stylized Blue 'W' Logo matching screenshot
 */
@Composable
fun WZoneLogoIcon(modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) {
        val strokeWidth = size.width * 0.18f
        val color = Color(0xFF2563EB)
        val w = size.width
        val h = size.height

        val path = Path().apply {
            moveTo(w * 0.12f, h * 0.18f)
            lineTo(w * 0.32f, h * 0.82f)
            lineTo(w * 0.50f, h * 0.40f)
            lineTo(w * 0.68f, h * 0.82f)
            lineTo(w * 0.88f, h * 0.18f)
        }

        drawPath(
            path = path,
            color = color,
            style = Stroke(
                width = strokeWidth,
                cap = androidx.compose.ui.graphics.StrokeCap.Round,
                join = androidx.compose.ui.graphics.StrokeJoin.Round
            )
        )
    }
}

/**
 * Brain Circuit AI Graphic inside Hero Banner
 */
@Composable
fun BrainCircuitGraphic(modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val cyan = Color(0xFF38BDF8)
        val purple = Color(0xFFA855F7)

        // Draw outer document corner notch
        val docPath = Path().apply {
            moveTo(w * 0.18f, h * 0.1f)
            lineTo(w * 0.65f, h * 0.1f)
            lineTo(w * 0.88f, h * 0.3f)
            lineTo(w * 0.88f, h * 0.9f)
            lineTo(w * 0.18f, h * 0.9f)
            close()
        }
        drawPath(
            path = docPath,
            color = Color(0xFF0F1F45),
            style = androidx.compose.ui.graphics.drawscope.Fill
        )
        drawPath(
            path = docPath,
            color = cyan.copy(alpha = 0.5f),
            style = Stroke(width = 2.5f)
        )

        // Brain halves outline
        val brainLeft = Path().apply {
            moveTo(w * 0.48f, h * 0.28f)
            cubicTo(w * 0.28f, h * 0.32f, w * 0.24f, h * 0.45f, w * 0.34f, h * 0.55f)
            cubicTo(w * 0.26f, h * 0.62f, w * 0.30f, h * 0.78f, w * 0.48f, h * 0.78f)
        }
        drawPath(path = brainLeft, color = cyan, style = Stroke(width = 3f))

        val brainRight = Path().apply {
            moveTo(w * 0.52f, h * 0.28f)
            cubicTo(w * 0.72f, h * 0.32f, w * 0.76f, h * 0.45f, w * 0.66f, h * 0.55f)
            cubicTo(w * 0.74f, h * 0.62f, w * 0.70f, h * 0.78f, w * 0.52f, h * 0.78f)
        }
        drawPath(path = brainRight, color = cyan, style = Stroke(width = 3f))

        // Center spine & nodes
        drawLine(
            color = cyan,
            start = Offset(w * 0.5f, h * 0.28f),
            end = Offset(w * 0.5f, h * 0.78f),
            strokeWidth = 3f
        )
        drawCircle(color = purple, radius = 3.5f, center = Offset(w * 0.5f, h * 0.36f))
        drawCircle(color = cyan, radius = 4f, center = Offset(w * 0.5f, h * 0.52f))
        drawCircle(color = purple, radius = 3.5f, center = Offset(w * 0.5f, h * 0.68f))

        // Circuit side connectors
        drawLine(color = cyan.copy(alpha = 0.8f), start = Offset(w * 0.5f, h * 0.42f), end = Offset(w * 0.38f, h * 0.42f), strokeWidth = 2f)
        drawCircle(color = cyan, radius = 2.5f, center = Offset(w * 0.38f, h * 0.42f))

        drawLine(color = cyan.copy(alpha = 0.8f), start = Offset(w * 0.5f, h * 0.62f), end = Offset(w * 0.62f, h * 0.62f), strokeWidth = 2f)
        drawCircle(color = cyan, radius = 2.5f, center = Offset(w * 0.62f, h * 0.62f))
    }
}

/**
 * Filter Sliders Icon
 */
@Composable
fun FilterSlidersIcon(modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) {
        val color = Color(0xFF64748B)
        val stroke = 3f

        // Line 1
        drawLine(color = color, start = Offset(0f, size.height * 0.25f), end = Offset(size.width, size.height * 0.25f), strokeWidth = stroke)
        drawCircle(color = color, radius = 4f, center = Offset(size.width * 0.65f, size.height * 0.25f))

        // Line 2
        drawLine(color = color, start = Offset(0f, size.height * 0.75f), end = Offset(size.width, size.height * 0.75f), strokeWidth = stroke)
        drawCircle(color = color, radius = 4f, center = Offset(size.width * 0.35f, size.height * 0.75f))
    }
}

/**
 * Company Logo Box: Uzum (purple 8-petal geometric flower), Epam (green square with e), AKFA (red square with AKFA)
 */
@Composable
fun CompanyLogoBox(logoType: String) {
    Box(
        modifier = Modifier
            .size(42.dp)
            .clip(RoundedCornerShape(12.dp)),
        contentAlignment = Alignment.Center
    ) {
        when (logoType) {
            "uzum" -> {
                // Uzum Purple 8-Petal Flower
                Canvas(modifier = Modifier.size(38.dp)) {
                    val center = Offset(size.width / 2f, size.height / 2f)
                    val petalColor = Color(0xFF7C3AED)
                    val petalWidth = size.width * 0.24f
                    val petalHeight = size.height * 0.42f

                    for (i in 0 until 8) {
                        rotate(degrees = i * 45f, pivot = center) {
                            drawRoundRect(
                                color = petalColor,
                                topLeft = Offset(center.x - petalWidth / 2f, center.y - petalHeight),
                                size = Size(petalWidth, petalHeight),
                                cornerRadius = CornerRadius(petalWidth / 2f, petalWidth / 2f)
                            )
                        }
                    }
                    drawCircle(
                        color = Color.White,
                        radius = size.width * 0.14f,
                        center = center
                    )
                }
            }
            "epam" -> {
                // Epam Green Square with 'e'
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .background(Color(0xFF00C292), RoundedCornerShape(10.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "e",
                        color = Color.White,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Black
                    )
                }
            }
            "akfa" -> {
                // AKFA Red Square
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .background(Color(0xFFDC2626), RoundedCornerShape(10.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = "▲",
                            color = Color.White,
                            fontSize = 9.sp
                        )
                        Text(
                            text = "AKFA",
                            color = Color.White,
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 0.5.sp
                        )
                    }
                }
            }
            else -> {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .background(Color(0xFF2563EB), RoundedCornerShape(10.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text("💼", fontSize = 16.sp)
                }
            }
        }
    }
}
