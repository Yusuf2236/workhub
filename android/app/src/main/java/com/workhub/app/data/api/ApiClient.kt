package com.workhub.app.data.api

import android.util.Log
import com.workhub.app.BuildConfig
import com.workhub.app.data.models.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

object ApiClient {
    private const val TAG = "ApiClient"

    // Set at build time (see app/build.gradle.kts); defaults to the host machine from the emulator
    val BASE_URL: String = BuildConfig.API_BASE_URL.trimEnd('/')
    val WS_URL: String = BASE_URL.replaceFirst("http", "ws") + "/api/v1/ws"

    var authToken: String? = null
    var currentUser: User? = null

    object Endpoints {
        const val HEALTH = "/health"
        const val LOGIN = "/api/v1/auth/login"
        const val REGISTER = "/api/v1/auth/register"
        const val LOGOUT = "/api/v1/auth/logout"
        const val GOOGLE_AUTH = "/api/v1/auth/google"
        const val FORGOT_PASSWORD = "/api/v1/auth/password/forgot"
        const val RESET_PASSWORD = "/api/v1/auth/password/reset"
        const val ME = "/api/v1/auth/me"
        const val PROFILE = "/api/v1/profile"
        const val PROFILE_AVATAR = "/api/v1/profile/avatar"
        const val VACANCIES = "/api/v1/vacancies"
        const val VACANCY_RECOMMENDATIONS = "/api/v1/vacancies/recommendations"
        const val APPLICATIONS = "/api/v1/applications"
        const val RESUMES = "/api/v1/resumes"
        const val RESUME_UPLOAD = "/api/v1/resumes/upload"
        const val NOTIFICATIONS = "/api/v1/notifications"
        const val CHAT_HEALTH = "/api/v1/chat/health"
        const val CHAT_ROOMS = "/api/v1/chat/rooms"
        const val CHAT_MESSAGES = "/api/v1/chat/messages"
        const val COMMENTS_RECENT = "/api/v1/comments/recent"
    }

    private suspend fun makeHttpRequest(
        method: String,
        endpoint: String,
        bodyJson: String? = null,
        queryParams: Map<String, String>? = null
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            var fullUrl = if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
                endpoint
            } else {
                "$BASE_URL$endpoint"
            }

            if (!queryParams.isNullOrEmpty()) {
                val query = queryParams.entries.joinToString("&") { (k, v) ->
                    "${java.net.URLEncoder.encode(k, "UTF-8")}=${java.net.URLEncoder.encode(v, "UTF-8")}"
                }
                fullUrl += if (fullUrl.contains("?")) "&$query" else "?$query"
            }

            val url = URL(fullUrl)
            val connection = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = method
                connectTimeout = 10000
                readTimeout = 10000
                setRequestProperty("Content-Type", "application/json; charset=UTF-8")
                setRequestProperty("Accept", "application/json")
                authToken?.let {
                    if (it.isNotBlank()) {
                        setRequestProperty("Authorization", "Bearer $it")
                    }
                }
                doInput = true
                if (bodyJson != null && (method == "POST" || method == "PUT" || method == "PATCH" || method == "DELETE")) {
                    doOutput = true
                    OutputStreamWriter(outputStream, "UTF-8").use { writer ->
                        writer.write(bodyJson)
                        writer.flush()
                    }
                }
            }

            val statusCode = connection.responseCode
            val inputStream = if (statusCode in 200..299) connection.inputStream else connection.errorStream
            val responseText = BufferedReader(InputStreamReader(inputStream ?: "".byteInputStream())).use {
                it.readText()
            }

            if (statusCode in 200..299) {
                Result.success(responseText)
            } else {
                Log.e(TAG, "HTTP $statusCode error on $endpoint: $responseText")
                Result.failure(Exception("HTTP $statusCode: $responseText"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Request to $endpoint failed: ${e.message}", e)
            Result.failure(e)
        }
    }

    // ---------------- AUTH ----------------

    suspend fun login(email: String, pass: String): Result<Pair<User, String>> {
        val payload = JSONObject().apply {
            put("email", email)
            put("password", pass)
        }.toString()

        val res = makeHttpRequest("POST", Endpoints.LOGIN, payload)
        return res.mapCatching { jsonStr ->
            val obj = JSONObject(jsonStr)
            val data = obj.getJSONObject("data")
            val token = data.getString("token")
            val userObj = data.getJSONObject("user")
            val user = parseUser(userObj)
            authToken = token
            currentUser = user
            Pair(user, token)
        }
    }

    suspend fun register(name: String, email: String, pass: String, role: String = "user"): Result<Pair<User, String>> {
        val payload = JSONObject().apply {
            put("name", name)
            put("email", email)
            put("password", pass)
            put("role", role)
        }.toString()

        val res = makeHttpRequest("POST", Endpoints.REGISTER, payload)
        return res.mapCatching { jsonStr ->
            val obj = JSONObject(jsonStr)
            val data = obj.getJSONObject("data")
            val token = data.getString("token")
            val userObj = data.getJSONObject("user")
            val user = parseUser(userObj)
            authToken = token
            currentUser = user
            Pair(user, token)
        }
    }

    suspend fun logout(): Result<Boolean> {
        val res = makeHttpRequest("POST", Endpoints.LOGOUT)
        authToken = null
        currentUser = null
        return res.map { true }
    }

    suspend fun forgotPassword(email: String): Result<String> {
        val payload = JSONObject().apply {
            put("email", email)
        }.toString()
        val res = makeHttpRequest("POST", Endpoints.FORGOT_PASSWORD, payload)
        return res.mapCatching { jsonStr ->
            val obj = JSONObject(jsonStr)
            obj.optString("message", "Parolni tiklash havolasi emailingizga yuborildi")
        }
    }

    // ---------------- PROFILE ----------------

    suspend fun getProfile(): Result<User> {
        val res = makeHttpRequest("GET", Endpoints.PROFILE)
        return res.mapCatching { jsonStr ->
            val obj = JSONObject(jsonStr)
            val data = obj.getJSONObject("data")
            val user = parseUser(data)
            currentUser = user
            user
        }
    }

    suspend fun updateProfile(
        name: String,
        phone: String,
        profession: String,
        location: String,
        bio: String,
        skills: String
    ): Result<User> {
        val payload = JSONObject().apply {
            put("name", name)
            put("phone", phone)
            put("profession", profession)
            put("location", location)
            put("bio", bio)
            put("skills", skills)
        }.toString()

        val res = makeHttpRequest("PUT", Endpoints.PROFILE, payload)
        return res.mapCatching { jsonStr ->
            val obj = JSONObject(jsonStr)
            val data = obj.getJSONObject("data")
            val user = parseUser(data)
            currentUser = user
            user
        }
    }

    // ---------------- VACANCIES ----------------

    suspend fun getVacancies(
        page: Int = 1,
        limit: Int = 30,
        search: String = "",
        category: String = "",
        location: String = ""
    ): Result<List<Vacancy>> {
        val params = mutableMapOf(
            "page" to page.toString(),
            "limit" to limit.toString()
        )
        if (search.isNotBlank()) params["q"] = search
        if (category.isNotBlank() && category != "Barchasi") params["category"] = category
        if (location.isNotBlank() && location != "Barcha hududlar") params["location"] = location

        val res = makeHttpRequest("GET", Endpoints.VACANCIES, queryParams = params)
        return res.mapCatching { jsonStr ->
            val obj = JSONObject(jsonStr)
            val data = obj.getJSONObject("data")
            val items = data.getJSONArray("items")
            val list = mutableListOf<Vacancy>()
            for (i in 0 until items.length()) {
                val it = items.getJSONObject(i)
                list.add(parseVacancy(it))
            }
            list
        }
    }

    suspend fun getVacancyById(id: String): Result<Vacancy> {
        val res = makeHttpRequest("GET", "${Endpoints.VACANCIES}/$id")
        return res.mapCatching { jsonStr ->
            val obj = JSONObject(jsonStr)
            val data = obj.getJSONObject("data")
            parseVacancy(data)
        }
    }

    suspend fun applyToVacancy(vacancyId: String, coverLetter: String, resumeId: String = ""): Result<Boolean> {
        val payload = JSONObject().apply {
            put("cover_letter", coverLetter)
            if (resumeId.isNotBlank()) {
                put("resume_id", resumeId)
            }
        }.toString()
        val res = makeHttpRequest("POST", "${Endpoints.VACANCIES}/$vacancyId/apply", payload)
        return res.mapCatching { true }
    }

    // ---------------- APPLICATIONS ----------------

    suspend fun getApplications(): Result<List<Application>> {
        val res = makeHttpRequest("GET", Endpoints.APPLICATIONS)
        return res.mapCatching { jsonStr ->
            val obj = JSONObject(jsonStr)
            val data = obj.optJSONObject("data")
            val items = data?.optJSONArray("items") ?: obj.optJSONArray("data") ?: JSONArray()
            val list = mutableListOf<Application>()
            for (i in 0 until items.length()) {
                val it = items.getJSONObject(i)
                list.add(
                    Application(
                        id = it.optString("id"),
                        userId = it.optString("user_id"),
                        vacancyId = it.optString("vacancy_id"),
                        vacancyTitle = it.optString("vacancy_title", "Vakansiya"),
                        company = it.optString("company", "Kompaniya"),
                        coverLetter = it.optString("cover_letter"),
                        resumeUrl = it.optString("resume_url"),
                        status = it.optString("status", "submitted"),
                        createdAt = it.optString("created_at")
                    )
                )
            }
            list
        }
    }

    // ---------------- RESUMES ----------------

    suspend fun getResumes(): Result<List<Resume>> {
        val res = makeHttpRequest("GET", Endpoints.RESUMES)
        return res.mapCatching { jsonStr ->
            val obj = JSONObject(jsonStr)
            val items = obj.optJSONArray("data") ?: JSONArray()
            val list = mutableListOf<Resume>()
            for (i in 0 until items.length()) {
                val it = items.getJSONObject(i)
                list.add(
                    Resume(
                        id = it.optString("id"),
                        userId = it.optString("user_id"),
                        title = it.optString("title"),
                        fullName = it.optString("full_name"),
                        phone = it.optString("phone"),
                        email = it.optString("email"),
                        location = it.optString("location"),
                        profession = it.optString("profession"),
                        skills = it.optString("skills"),
                        experienceYears = it.optInt("experience_years", 0),
                        summary = it.optString("summary"),
                        fileUrl = it.optString("file_url"),
                        atsScore = it.optInt("ats_score", 85),
                        createdAt = it.optString("created_at")
                    )
                )
            }
            list
        }
    }

    suspend fun createResume(
        title: String,
        fullName: String,
        phone: String,
        email: String,
        profession: String,
        skills: String,
        experienceYears: Int,
        summary: String
    ): Result<Resume> {
        val payload = JSONObject().apply {
            put("title", title)
            put("full_name", fullName)
            put("phone", phone)
            put("email", email)
            put("profession", profession)
            put("skills", skills)
            put("experience_years", experienceYears)
            put("summary", summary)
        }.toString()

        val res = makeHttpRequest("POST", Endpoints.RESUMES, payload)
        return res.mapCatching { jsonStr ->
            val obj = JSONObject(jsonStr)
            val it = obj.getJSONObject("data")
            Resume(
                id = it.optString("id"),
                userId = it.optString("user_id"),
                title = it.optString("title"),
                fullName = it.optString("full_name"),
                phone = it.optString("phone"),
                email = it.optString("email"),
                location = it.optString("location"),
                profession = it.optString("profession"),
                skills = it.optString("skills"),
                experienceYears = it.optInt("experience_years", 0),
                summary = it.optString("summary"),
                fileUrl = it.optString("file_url"),
                atsScore = it.optInt("ats_score", 85),
                createdAt = it.optString("created_at")
            )
        }
    }

    suspend fun deleteResume(resumeId: String): Result<Boolean> {
        val res = makeHttpRequest("DELETE", "${Endpoints.RESUMES}/$resumeId")
        return res.map { true }
    }

    // ---------------- CHAT ----------------

    suspend fun getChatMessages(room: String = "general"): Result<List<ChatMessage>> {
        val res = makeHttpRequest("GET", Endpoints.CHAT_MESSAGES, queryParams = mapOf("room" to room))
        return res.mapCatching { jsonStr ->
            val obj = JSONObject(jsonStr)
            val data = obj.getJSONObject("data")
            val msgs = data.getJSONArray("messages")
            val list = mutableListOf<ChatMessage>()
            val currentUserId = currentUser?.id ?: ""
            for (i in 0 until msgs.length()) {
                val it = msgs.getJSONObject(i)
                val uId = it.optString("user_id")
                list.add(
                    ChatMessage(
                        id = it.optString("id"),
                        roomId = it.optString("room_id", room),
                        userId = uId,
                        senderName = it.optString("sender_name", "Foydalanuvchi"),
                        senderAvatar = it.optString("sender_avatar"),
                        content = it.optString("content"),
                        isMe = currentUserId.isNotEmpty() && uId == currentUserId,
                        createdAt = it.optString("created_at")
                    )
                )
            }
            list
        }
    }

    suspend fun sendChatMessage(room: String = "general", content: String): Result<ChatMessage> {
        val senderName = currentUser?.name ?: "Mehmon"
        val senderAvatar = currentUser?.avatarUrl ?: ""
        val payload = JSONObject().apply {
            put("room_id", room)
            put("content", content)
            put("sender_name", senderName)
            put("sender_avatar", senderAvatar)
        }.toString()

        // TO'G'RILANDI: Backendda POST /api/v1/chat/messages
        val res = makeHttpRequest("POST", Endpoints.CHAT_MESSAGES, payload)
        return res.mapCatching { jsonStr ->
            val obj = JSONObject(jsonStr)
            val data = obj.optJSONObject("data") ?: JSONObject()
            ChatMessage(
                id = data.optString("id", System.currentTimeMillis().toString()),
                roomId = room,
                userId = currentUser?.id ?: "",
                senderName = senderName,
                senderAvatar = senderAvatar,
                content = content,
                isMe = true,
                createdAt = "Hozirgina"
            )
        }
    }

    // ---------------- NOTIFICATIONS ----------------

    suspend fun getNotifications(): Result<List<AppNotification>> {
        val res = makeHttpRequest("GET", Endpoints.NOTIFICATIONS)
        return res.mapCatching { jsonStr ->
            val obj = JSONObject(jsonStr)
            val items = obj.optJSONArray("data") ?: JSONArray()
            val list = mutableListOf<AppNotification>()
            for (i in 0 until items.length()) {
                val it = items.getJSONObject(i)
                list.add(
                    AppNotification(
                        id = it.optString("id"),
                        userId = it.optString("user_id"),
                        title = it.optString("title"),
                        body = it.optString("body"),
                        isRead = it.optBoolean("is_read", false),
                        createdAt = it.optString("created_at")
                    )
                )
            }
            list
        }
    }

    suspend fun markNotificationRead(id: String): Result<Boolean> {
        val res = makeHttpRequest("PATCH", "${Endpoints.NOTIFICATIONS}/$id/read")
        return res.map { true }
    }

    // ---------------- PARSERS ----------------

    private fun parseUser(obj: JSONObject): User {
        return User(
            id = obj.optString("id"),
            name = obj.optString("name"),
            email = obj.optString("email"),
            role = obj.optString("role", "user"),
            authProvider = obj.optString("auth_provider", "local"),
            avatarUrl = obj.optString("avatar_url"),
            phone = obj.optString("phone"),
            profession = obj.optString("profession"),
            location = obj.optString("location"),
            bio = obj.optString("bio"),
            skills = obj.optString("skills")
        )
    }

    private fun parseVacancy(obj: JSONObject): Vacancy {
        return Vacancy(
            id = obj.optString("id"),
            title = obj.optString("title"),
            company = obj.optString("company", "Kompaniya"),
            location = obj.optString("location", "Toshkent shahri"),
            category = obj.optString("category", "IT & Dasturlash"),
            employmentType = obj.optString("employment_type", "Full-time"),
            salaryMin = obj.optLong("salary_min", 0),
            salaryMax = obj.optLong("salary_max", 0),
            salaryCurrency = obj.optString("salary_currency", "UZS"),
            description = obj.optString("description"),
            requirements = obj.optString("requirements"),
            tags = obj.optString("tags"),
            views = obj.optLong("views", 0),
            isFeatured = obj.optBoolean("is_featured", false),
            createdBy = obj.optString("created_by"),
            createdAt = obj.optString("created_at")
        )
    }
}
