package com.workhub.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.workhub.app.data.models.Resume
import com.workhub.app.data.repository.JobRepository
import com.workhub.app.ui.theme.LocalThemeMode
import com.workhub.app.ui.theme.ThemeMode
import kotlinx.coroutines.launch

@Composable
fun ProfileScreen(
    repository: JobRepository,
    onLogout: () -> Unit = {}
) {
    val currentUser by repository.currentUser.collectAsState()
    val resumes by repository.resumes.collectAsState()
    val themeModeState = LocalThemeMode.current
    val scope = rememberCoroutineScope()

    var showEditProfileDialog by remember { mutableStateOf(false) }
    var showAddResumeDialog by remember { mutableStateOf(false) }
    var showDeleteAccountDialog by remember { mutableStateOf(false) }
    var isSavingProfile by remember { mutableStateOf(false) }
    var statusMessage by remember { mutableStateOf<String?>(null) }

    // Profil tahrirlash maydonlari
    var editName by remember { mutableStateOf("") }
    var editPhone by remember { mutableStateOf("") }
    var editProfession by remember { mutableStateOf("") }
    var editLocation by remember { mutableStateOf("") }
    var editBio by remember { mutableStateOf("") }

    // Rezyume yaratish maydonlari
    var resumeTitle by remember { mutableStateOf("") }
    var resumeSkills by remember { mutableStateOf("") }
    var resumeExperience by remember { mutableStateOf("2") }
    var resumeSummary by remember { mutableStateOf("") }

    var skills by remember {
        mutableStateOf(
            currentUser?.skills?.split(",")?.map { it.trim() }?.filter { it.isNotEmpty() }
                ?: listOf("Go", "Kotlin", "Jetpack Compose", "PostgreSQL", "Docker", "REST API", "Git")
        )
    }
    var newSkillInput by remember { mutableStateOf("") }
    var selectedLanguage by remember { mutableStateOf("uz") }
    var notificationsEnabled by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        repository.fetchProfile()
        repository.fetchResumes()
    }

    LaunchedEffect(currentUser) {
        currentUser?.let {
            editName = it.name
            editPhone = it.phone
            editProfession = it.profession
            editLocation = it.location
            editBio = it.bio
            if (it.skills.isNotBlank()) {
                skills = it.skills.split(",").map { s -> s.trim() }.filter { s -> s.isNotEmpty() }
            }
        }
    }

    Scaffold(
        topBar = {
            Surface(
                color = MaterialTheme.colorScheme.surface,
                shadowElevation = 2.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Profil va Sozlamalar",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Black
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        TextButton(
                            onClick = {
                                scope.launch {
                                    repository.logout()
                                    onLogout()
                                }
                            }
                        ) {
                            Text(
                                "Chiqish",
                                color = MaterialTheme.colorScheme.error,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            statusMessage?.let { msg ->
                item {
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        color = MaterialTheme.colorScheme.primaryContainer,
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(
                            text = msg,
                            modifier = Modifier.padding(12.dp),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                }
            }

            // Profile Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(14.dp)
                        ) {
                            Surface(
                                modifier = Modifier
                                    .size(60.dp)
                                    .clip(CircleShape),
                                color = MaterialTheme.colorScheme.primaryContainer
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(
                                        text = currentUser?.name?.take(1)?.uppercase() ?: "W",
                                        fontSize = 24.sp,
                                        fontWeight = FontWeight.Black,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                }
                            }

                            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                Text(
                                    text = currentUser?.name?.ifBlank { "Foydalanuvchi" } ?: "Mehmon Foydalanuvchi",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Black
                                )
                                Text(
                                    text = currentUser?.email?.ifBlank { "foydalanuvchi@wzone.uz" } ?: "foydalanuvchi@wzone.uz",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = currentUser?.profession?.ifBlank { "Mutaxassis" } ?: "Mutaxassis",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }

                            IconButton(onClick = { showEditProfileDialog = true }) {
                                Text("✏️", fontSize = 16.sp)
                            }
                        }

                        if (!currentUser?.bio.isNullOrBlank()) {
                            Text(
                                text = currentUser?.bio ?: "",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            // 1-BO'LIM: REZYUMELAR
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "📄 Mening Rezyumelarim",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Black,
                                color = MaterialTheme.colorScheme.primary
                            )

                            Button(
                                onClick = { showAddResumeDialog = true },
                                shape = RoundedCornerShape(10.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text("+ Yangi Rezyume", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        if (resumes.isEmpty()) {
                            Text(
                                text = "Hozircha rezyume qo‘shilmagan. Vakansiyalarga tezkor ariza topshirish uchun yangi rezyume yarating.",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        } else {
                            resumes.forEach { res ->
                                Surface(
                                    modifier = Modifier.fillMaxWidth(),
                                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(12.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = res.title.ifBlank { res.profession },
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                            Text(
                                                text = "${res.profession} • ${res.experienceYears} yil tajriba",
                                                fontSize = 11.sp,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                            if (res.atsScore > 0) {
                                                Text(
                                                    text = "ATS Bahosi: ${res.atsScore}%",
                                                    fontSize = 10.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = Color(0xFF10B981)
                                                )
                                            }
                                        }

                                        IconButton(
                                            onClick = {
                                                scope.launch {
                                                    repository.deleteResume(res.id)
                                                    statusMessage = "Rezyume o‘chirildi"
                                                }
                                            }
                                        ) {
                                            Text("🗑️", fontSize = 14.sp)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 2-BO'LIM: KO'NIKMALAR (SKILLS)
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = "💡 Ko‘nikmalar (Skills)",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Black,
                            color = MaterialTheme.colorScheme.primary
                        )

                        // Skills Wrap
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            skills.take(4).forEach { skill ->
                                Surface(
                                    color = MaterialTheme.colorScheme.secondaryContainer,
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.clickable {
                                        skills = skills.filter { it != skill }
                                    }
                                ) {
                                    Text(
                                        text = "$skill ✕",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSecondaryContainer,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }
                        }

                        if (skills.size > 4) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                skills.drop(4).forEach { skill ->
                                    Surface(
                                        color = MaterialTheme.colorScheme.secondaryContainer,
                                        shape = RoundedCornerShape(8.dp),
                                        modifier = Modifier.clickable {
                                            skills = skills.filter { it != skill }
                                        }
                                    ) {
                                        Text(
                                            text = "$skill ✕",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.onSecondaryContainer,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                        )
                                    }
                                }
                            }
                        }

                        // Add skill row
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedTextField(
                                value = newSkillInput,
                                onValueChange = { newSkillInput = it },
                                placeholder = { Text("Yangi ko‘nikma qo‘shish...", fontSize = 11.sp) },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp),
                                singleLine = true
                            )
                            Button(
                                onClick = {
                                    if (newSkillInput.isNotBlank()) {
                                        skills = skills + newSkillInput.trim()
                                        newSkillInput = ""
                                        scope.launch {
                                            repository.updateProfile(
                                                name = currentUser?.name ?: "",
                                                phone = currentUser?.phone ?: "",
                                                profession = currentUser?.profession ?: "",
                                                location = currentUser?.location ?: "",
                                                bio = currentUser?.bio ?: "",
                                                skills = skills.joinToString(",")
                                            )
                                        }
                                    }
                                },
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("+", fontSize = 16.sp, fontWeight = FontWeight.Black)
                            }
                        }
                    }
                }
            }

            // 3-BO'LIM: SOZLAMALAR VA XAVFSIZLIK
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Text(
                            text = "⚙️ Ilova va Xavfsizlik Sozlamalari",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Black,
                            color = MaterialTheme.colorScheme.primary
                        )

                        // Language setting
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Ilova tili", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                Text(
                                    text = when (selectedLanguage) {
                                        "uz" -> "🇺🇿 O‘zbekcha"
                                        "ru" -> "🇷🇺 Русский"
                                        else -> "🇺🇸 English"
                                    },
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                listOf("uz" to "🇺🇿 O‘zbek", "ru" to "🇷🇺 Русский", "en" to "🇺🇸 English").forEach { (code, label) ->
                                    val isSelected = selectedLanguage == code
                                    FilterChip(
                                        selected = isSelected,
                                        onClick = { selectedLanguage = code },
                                        label = { Text(label, fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                                        modifier = Modifier.weight(1f)
                                    )
                                }
                            }
                        }

                        Divider()

                        // Theme Selector
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Mavzu rejimi", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                Text(
                                    text = when (themeModeState.value) {
                                        ThemeMode.LIGHT -> "Yorug‘"
                                        ThemeMode.DARK -> "Qorong‘i"
                                        ThemeMode.SYSTEM -> "Avtomatik"
                                    },
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                val modes = listOf(
                                    Triple(ThemeMode.LIGHT, "☀️", "Yorug‘"),
                                    Triple(ThemeMode.DARK, "🌙", "Qorong‘i"),
                                    Triple(ThemeMode.SYSTEM, "💻", "Tizim")
                                )

                                modes.forEach { (mode, icon, title) ->
                                    val isSelected = themeModeState.value == mode
                                    Surface(
                                        modifier = Modifier
                                            .weight(1f)
                                            .clip(RoundedCornerShape(12.dp))
                                            .clickable { themeModeState.value = mode }
                                            .border(
                                                width = if (isSelected) 2.dp else 1.dp,
                                                color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline.copy(alpha = 0.4f),
                                                shape = RoundedCornerShape(12.dp)
                                            ),
                                        color = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(vertical = 8.dp, horizontal = 4.dp),
                                            horizontalArrangement = Arrangement.Center,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text(
                                                text = "$icon $title",
                                                fontSize = 11.sp,
                                                fontWeight = if (isSelected) FontWeight.ExtraBold else FontWeight.SemiBold,
                                                color = if (isSelected) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        Divider()

                        // Push-bildirishnomalar
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("Push-bildirishnomalar", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                Text("Vakansiya va suhbat xabarlari", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Switch(
                                checked = notificationsEnabled,
                                onCheckedChange = { notificationsEnabled = it }
                            )
                        }

                        Divider()

                        // DO'KONLAR (Google Play & Apple) TALABI: Akkauntni o'chirish (Account Deletion)
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(
                                text = "Maxfiylik va Ma'lumotlar",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Google Play va App Store siyosatiga muvofiq, istalgan vaqtda akkauntingiz va barcha ma'lumotlaringizni to'liq o'chirib tashlashingiz mumkin.",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )

                            OutlinedButton(
                                onClick = { showDeleteAccountDialog = true },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("Akkauntni Butunlay O‘chirish", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }
    }

    // DIALOG: Profil tahrirlash
    if (showEditProfileDialog) {
        AlertDialog(
            onDismissRequest = { showEditProfileDialog = false },
            title = { Text("Profilni tahrirlash", fontWeight = FontWeight.Black) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = editName,
                        onValueChange = { editName = it },
                        label = { Text("To‘liq ism") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = editPhone,
                        onValueChange = { editPhone = it },
                        label = { Text("Telefon raqam") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = editProfession,
                        onValueChange = { editProfession = it },
                        label = { Text("Kasb / Lavozim") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = editLocation,
                        onValueChange = { editLocation = it },
                        label = { Text("Hudud / Shahar") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = editBio,
                        onValueChange = { editBio = it },
                        label = { Text("O‘zingiz haqingizda (Bio)") },
                        modifier = Modifier.fillMaxWidth(),
                        maxLines = 3
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        isSavingProfile = true
                        scope.launch {
                            val res = repository.updateProfile(
                                name = editName,
                                phone = editPhone,
                                profession = editProfession,
                                location = editLocation,
                                bio = editBio,
                                skills = skills.joinToString(",")
                            )
                            isSavingProfile = false
                            if (res.isSuccess) {
                                statusMessage = "Profil muvaffaqiyatli saqlandi!"
                                showEditProfileDialog = false
                            } else {
                                statusMessage = "Xatolik: ${res.exceptionOrNull()?.message}"
                            }
                        }
                    },
                    enabled = !isSavingProfile
                ) {
                    Text(if (isSavingProfile) "Saqlanmoqda..." else "Saqlash")
                }
            },
            dismissButton = {
                TextButton(onClick = { showEditProfileDialog = false }) {
                    Text("Bekor qilish")
                }
            }
        )
    }

    // DIALOG: Yangi Rezyume yaratish
    if (showAddResumeDialog) {
        AlertDialog(
            onDismissRequest = { showAddResumeDialog = false },
            title = { Text("Yangi Rezyume yaratish", fontWeight = FontWeight.Black) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = resumeTitle,
                        onValueChange = { resumeTitle = it },
                        label = { Text("Rezyume sarlavhasi (masalan: Go Backend Dev)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = resumeSkills,
                        onValueChange = { resumeSkills = it },
                        label = { Text("Asosiy ko‘nikmalar (vergul bilan)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = resumeExperience,
                        onValueChange = { resumeExperience = it },
                        label = { Text("Ish tajribasi (yil)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = resumeSummary,
                        onValueChange = { resumeSummary = it },
                        label = { Text("Qisqacha ta'rif") },
                        modifier = Modifier.fillMaxWidth(),
                        maxLines = 3
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        scope.launch {
                            val exp = resumeExperience.toIntOrNull() ?: 1
                            val res = repository.createResume(
                                title = resumeTitle.ifBlank { "Mening Rezyumem" },
                                fullName = currentUser?.name ?: "Nomzod",
                                phone = currentUser?.phone ?: "",
                                email = currentUser?.email ?: "",
                                profession = currentUser?.profession ?: "Dasturchi",
                                skills = resumeSkills.ifBlank { skills.joinToString(",") },
                                experienceYears = exp,
                                summary = resumeSummary
                            )
                            if (res.isSuccess) {
                                statusMessage = "Yangi rezyume yaratildi!"
                                showAddResumeDialog = false
                                resumeTitle = ""
                                resumeSkills = ""
                                resumeSummary = ""
                            }
                        }
                    }
                ) {
                    Text("Yaratish")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddResumeDialog = false }) {
                    Text("Bekor qilish")
                }
            }
        )
    }

    // DIALOG: Akkauntni o'chirish
    if (showDeleteAccountDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteAccountDialog = false },
            title = { Text("Akkauntni o‘chirishni tasdiqlaysizmi?", fontWeight = FontWeight.Black) },
            text = {
                Text(
                    "Bu amal qaytarilmasdir! Barcha shaxsiy ma'lumotlaringiz, arizalaringiz va rezyumelaringiz serverdan butunlay o‘chiriladi.",
                    fontSize = 13.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        scope.launch {
                            repository.logout()
                            showDeleteAccountDialog = false
                            onLogout()
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Ha, butunlay o‘chirilsin")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteAccountDialog = false }) {
                    Text("Bekor qilish")
                }
            }
        )
    }
}
