package com.workhub.app.data.api

import android.util.Log
import com.workhub.app.data.models.Application
import com.workhub.app.data.models.ChatMessage
import com.workhub.app.data.models.User
import com.workhub.app.data.models.Vacancy
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

    // 10.0.2.2 maps to host localhost from Android emulator
    const val BASE_URL = "http://10.0.2.2:8080"
    const val WS_URL = "ws://10.0.2.2:8080/api/v1/ws"

    var authToken: String? = null
    var currentUser: User? = null

    object Endpoints {
        const val HEALTH = "/health"
        const val LOGIN = "/api/v1/auth/login"
        const val REGISTER = "/api/v1/auth/register"
        const val GOOGLE_AUTH = "/api/v1/auth/google"
        const val ME = "/api/v1/auth/me"
        const val VACANCIES = "/api/v1/vacancies"
        const val APPLICATIONS = "/api/v1/applications"
        const val RESUMES = "/api/v1/resumes"
        const val CHAT_HEALTH = "/api/v1/chat/health"
        const val CHAT_MESSAGES = "/api/v1/chat/messages"
        const val CHAT_SEND = "/api/v1/chat/send"
    }

    private suspend fun makeHttpRequest(
        method: String,
        endpoint: String,
        bodyJson: String? = null,
        queryParams: Map<String, String>? = null
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            var fullUrl = "$BASE_URL$endpoint"
            if (!queryParams.isNullOrEmpty()) {
                val query = queryParams.entries.joinToString("&") { (k, v) ->
                    "${java.net.URLEncoder.encode(k, "UTF-8")}=${java.net.URLEncoder.encode(v, "UTF-8")}"
                }
                fullUrl += "?$query"
            }

            val url = URL(fullUrl)
            val connection = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = method
                connectTimeout = 8000
                readTimeout = 8000
                setRequestProperty("Content-Type", "application/json; charset=UTF-8")
                setRequestProperty("Accept", "application/json")
                authToken?.let {
                    setRequestProperty("Authorization", "Bearer $it")
                }
                doInput = true
                if (bodyJson != null && (method == "POST" || method == "PUT" || method == "PATCH")) {
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
            Log.e(TAG, "Request to $endpoint failed", e)
            Result.failure(e)
        }
    }

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

    suspend fun applyToVacancy(vacancyId: String, coverLetter: String): Result<Boolean> {
        val payload = JSONObject().apply {
            put("cover_letter", coverLetter)
        }.toString()
        val res = makeHttpRequest("POST", "${Endpoints.VACANCIES}/$vacancyId/apply", payload)
        return res.mapCatching { true }
    }

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
                        status = it.optString("status", "submitted"),
                        createdAt = it.optString("created_at")
                    )
                )
            }
            list
        }
    }

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

        val res = makeHttpRequest("POST", Endpoints.CHAT_SEND, payload)
        return res.mapCatching { jsonStr ->
            val obj = JSONObject(jsonStr)
            val data = obj.getJSONObject("data")
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
