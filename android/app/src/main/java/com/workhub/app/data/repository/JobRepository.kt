package com.workhub.app.data.repository

import com.workhub.app.data.api.ApiClient
import com.workhub.app.data.models.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class JobRepository {

    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    private val _vacancies = MutableStateFlow<List<Vacancy>>(emptyList())
    val vacancies: StateFlow<List<Vacancy>> = _vacancies.asStateFlow()

    private val _isLoadingVacancies = MutableStateFlow(false)
    val isLoadingVacancies: StateFlow<Boolean> = _isLoadingVacancies.asStateFlow()

    private val _applications = MutableStateFlow<List<Application>>(emptyList())
    val applications: StateFlow<List<Application>> = _applications.asStateFlow()

    private val _chatMessages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val chatMessages: StateFlow<List<ChatMessage>> = _chatMessages.asStateFlow()

    private val _savedIds = MutableStateFlow<Set<String>>(emptySet())
    val savedIds: StateFlow<Set<String>> = _savedIds.asStateFlow()

    private val _newsList = MutableStateFlow<List<NewsItem>>(getInitialNews())
    val newsList: StateFlow<List<NewsItem>> = _newsList.asStateFlow()

    private val _commentsList = MutableStateFlow<List<CommunityComment>>(getInitialComments())
    val commentsList: StateFlow<List<CommunityComment>> = _commentsList.asStateFlow()

    suspend fun login(email: String, pass: String): Result<User> {
        val result = ApiClient.login(email, pass)
        return result.map { (user, _) ->
            _currentUser.value = user
            user
        }
    }

    suspend fun register(name: String, email: String, pass: String): Result<User> {
        val result = ApiClient.register(name, email, pass)
        return result.map { (user, _) ->
            _currentUser.value = user
            user
        }
    }

    fun logout() {
        _currentUser.value = null
        ApiClient.authToken = null
        ApiClient.currentUser = null
    }

    suspend fun fetchVacancies(search: String = "", category: String = "", location: String = "") {
        _isLoadingVacancies.value = true
        try {
            val res = ApiClient.getVacancies(search = search, category = category, location = location)
            res.onSuccess {
                _vacancies.value = it
            }
        } finally {
            _isLoadingVacancies.value = false
        }
    }

    suspend fun fetchApplications() {
        val res = ApiClient.getApplications()
        res.onSuccess {
            _applications.value = it
        }
    }

    suspend fun apply(vacancy: Vacancy, coverLetter: String = "Assalomu alaykum! Men ushbu vakansiyaga o‘z nomzodimni taqdim etmoqchiman."): Result<Boolean> {
        val res = ApiClient.applyToVacancy(vacancy.id, coverLetter)
        if (res.isSuccess) {
            val newApp = Application(
                id = "app-${System.currentTimeMillis()}",
                userId = _currentUser.value?.id ?: "",
                vacancyId = vacancy.id,
                vacancyTitle = vacancy.title,
                company = vacancy.company,
                coverLetter = coverLetter,
                status = "submitted",
                createdAt = "Hozirgina"
            )
            _applications.value = listOf(newApp) + _applications.value
        }
        return res
    }

    suspend fun fetchChatMessages(room: String = "general") {
        val res = ApiClient.getChatMessages(room)
        res.onSuccess {
            _chatMessages.value = it
        }
    }

    suspend fun sendChatMessage(room: String = "general", content: String): Result<ChatMessage> {
        val res = ApiClient.sendChatMessage(room, content)
        res.onSuccess { msg ->
            _chatMessages.value = _chatMessages.value + msg
        }
        return res
    }

    fun toggleSaveVacancy(vacancyId: String) {
        val current = _savedIds.value.toMutableSet()
        if (current.contains(vacancyId)) {
            current.remove(vacancyId)
        } else {
            current.add(vacancyId)
        }
        _savedIds.value = current
    }

    fun addComment(content: String, topic: String) {
        val user = _currentUser.value
        val newComment = CommunityComment(
            id = "c-${System.currentTimeMillis()}",
            authorName = user?.name ?: "Foydalanuvchi",
            authorRole = if (user?.role == "employer") "Ish beruvchi" else "Nomzod / Mutaxassis",
            authorAvatar = user?.avatarUrl ?: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80",
            content = content,
            timestamp = "Hozirgina",
            likes = 1,
            likedByMe = true,
            topicTag = if (topic.startsWith("#")) topic else "#$topic"
        )
        _commentsList.value = listOf(newComment) + _commentsList.value
    }

    fun toggleLikeComment(commentId: String) {
        _commentsList.value = _commentsList.value.map { c ->
            if (c.id == commentId) {
                val liked = !c.likedByMe
                c.copy(
                    likedByMe = liked,
                    likes = if (liked) c.likes + 1 else c.likes - 1
                )
            } else c
        }
    }

    companion object {
        fun getInitialNews(): List<NewsItem> = listOf(
            NewsItem(
                id = "news-1",
                title = "O'zbekistonda 2026-yilda eng yuqori maosh to'lanadigan IT va Fintech yo'nalishlari",
                excerpt = "Go backend, AI integratsiyalari va kiberxavfsizlik mutaxassislariga bo'lgan talab 45% ga oshdi. O'rtacha oylik maoshlar $1,500 dan $4,000 gacha.",
                content = "O'zbekiston raqamli iqtisodiyoti tez sur'atlar bilan rivojlanmoqda. Fintech, bank tizimlari va xalqaro autsorsing bozorida yuqori malakali mutaxassislarga bo'lgan ehtiyoj rekord darajaga yetdi.",
                category = "Bozor tahlili",
                imageUrl = "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
                author = "Sanjar Rahimov",
                authorRole = "Bozor tahlilchisi",
                date = "28-sentyabr, 2026",
                readTime = "4 daqiqa",
                views = 1420,
                likes = 89,
                tags = listOf("Fintech", "IT Bozor", "Maoshlar")
            ),
            NewsItem(
                id = "news-2",
                title = "Toshkentda 'Tech Careers Summit 2026' yirik ish yarmarkasi o'tkazilmoqda",
                excerpt = "50 dan ortiq yirik texnologik kompaniyalar 1,000 dan ziyod ochiq bo'sh ish o'rinlarini taqdim etmoqda.",
                content = "Poytaxtimizda yilning eng yirik karyera forumi o'z ishini boshladi. Forumda Uzum, EPAM, Payme, Click va boshqa yetakchi kompaniyalar qatnashmoqda.",
                category = "Tadbirlar",
                imageUrl = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
                author = "Aziza Yo‘ldosheva",
                authorRole = "Tadbir koordinatori",
                date = "27-sentyabr, 2026",
                readTime = "3 daqiqa",
                views = 2150,
                likes = 142,
                tags = listOf("Tadbir", "Vakansiyalar", "Expo")
            ),
            NewsItem(
                id = "news-3",
                title = "Sun'iy intellekt davrida rezyume tayyorlash: HR mutaxassislaridan 6 ta qoida",
                excerpt = "Rezyumengiz ATS filtrlaridan o'tishi va ish beruvchi e'tiborini jalb qilishi uchun qanday tuzilishi lozim?",
                content = "Zamonaviy rekrutingda dastlabki saralash ko'pincha avtomatlashtirilgan tizimlar orqali amalga oshiriladi. Aniq natijalar va texnologiyalar ko'rsatilgan portfolio talab qilinadi.",
                category = "Karyera",
                imageUrl = "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80",
                author = "Dilnoza Karimova",
                authorRole = "HR Konsul",
                date = "26-sentyabr, 2026",
                readTime = "5 daqiqa",
                views = 3100,
                likes = 210,
                tags = listOf("Rezyume", "Karyera", "AI")
            )
        )

        fun getInitialComments(): List<CommunityComment> = listOf(
            CommunityComment(
                id = "c-1",
                authorName = "Farrux Zokirov",
                authorRole = "Senior Go Developer",
                authorAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
                content = "O'zbekistonda backend yo'nalishida Microservices va Kafka biladigan dasturchilarga talab 40% oshibdi. Kompaniyalar juniorlarni ham o'qitishga tayyormi?",
                timestamp = "15 daqiqa oldin",
                likes = 24,
                likedByMe = false,
                topicTag = "#backend"
            ),
            CommunityComment(
                id = "c-2",
                authorName = "Nilufar Qosimova",
                authorRole = "HR Director, Fintech",
                authorAvatar = "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80",
                content = "Bizning kompaniyada hozirda 12 ta ochiq vakansiya bor. Eng muhimi — soft skills va o'rganishga bo'lgan ishtiyoq.",
                timestamp = "42 daqiqa oldin",
                likes = 38,
                likedByMe = false,
                topicTag = "#hr_maslahat"
            ),
            CommunityComment(
                id = "c-3",
                authorName = "Jasur Alimov",
                authorRole = "UI/UX Designer",
                authorAvatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
                content = "WZone mobil ilovasi juda qulay va tez ishlayapti. Ayniqsa chat orqali rekruter bilan to'g'ridan-to'g'ri bog'lanish zo'r funksiya bo'libdi!",
                timestamp = "2 soat oldin",
                likes = 19,
                likedByMe = true,
                topicTag = "#wzone_app"
            )
        )

        fun getSalaryTrends(): List<SalaryTrend> = listOf(
            SalaryTrend("Backend (Go, Java, Python)", "$900 - $3,800", "+28%"),
            SalaryTrend("Frontend (React, Next.js)", "$700 - $2,900", "+22%"),
            SalaryTrend("Mobile (Flutter, iOS, Kotlin)", "$800 - $3,200", "+25%"),
            SalaryTrend("DevOps & Cloud Security", "$1,200 - $4,200", "+35%"),
            SalaryTrend("UI/UX & Product Design", "$600 - $2,400", "+18%")
        )

        fun getSpotlightCompanies(): List<CompanySpotlight> = listOf(
            CompanySpotlight(
                id = "comp-1",
                name = "Uzum Technologies",
                industry = "E-commerce & Fintech Ekotizim",
                location = "Toshkent shahri",
                openPositions = 28,
                logo = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80",
                coverImage = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
                verified = true,
                tagline = "O'zbekistondagi birinchi texnologik unicorn ekotizimida faoliyat olib boring."
            ),
            CompanySpotlight(
                id = "comp-2",
                name = "EPAM Systems",
                industry = "Global Dasturiy Injiniring",
                location = "Toshkent / Remote",
                openPositions = 35,
                logo = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=120&q=80",
                coverImage = "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80",
                verified = true,
                tagline = "Dunyo miqyosidagi global loyihalar va ilg'or xalqaro injiniring."
            ),
            CompanySpotlight(
                id = "comp-3",
                name = "Payme",
                industry = "To'lov tizimlari",
                location = "Toshkent shahri",
                openPositions = 14,
                logo = "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=120&q=80",
                coverImage = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
                verified = true,
                tagline = "Har kuni millionlab foydalanuvchilar ishonadigan fintech mahsulotlar."
            )
        )
    }
}
