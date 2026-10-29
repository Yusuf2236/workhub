package com.workhub.app.data.session

import android.content.Context
import android.content.SharedPreferences
import com.workhub.app.data.api.ApiClient
import com.workhub.app.data.models.User
import org.json.JSONObject

class SessionManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

    companion object {
        private const val PREF_NAME = "workhub_session_prefs"
        private const val KEY_TOKEN = "auth_token"
        private const val KEY_USER = "current_user_json"
        private const val KEY_SAVED_VACANCIES = "saved_vacancy_ids"

        @Volatile
        private var INSTANCE: SessionManager? = null

        fun getInstance(context: Context): SessionManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: SessionManager(context.applicationContext).also { INSTANCE = it }
            }
        }
    }

    init {
        // Ilova ishga tushganda sessiyani ApiClient ga tiklash
        restoreSession()
    }

    fun saveAuth(token: String, user: User) {
        prefs.edit().apply {
            putString(KEY_TOKEN, token)
            putString(KEY_USER, userToJson(user).toString())
            apply()
        }
        ApiClient.authToken = token
        ApiClient.currentUser = user
    }

    fun updateCurrentUser(user: User) {
        prefs.edit().putString(KEY_USER, userToJson(user).toString()).apply()
        ApiClient.currentUser = user
    }

    fun getToken(): String? = prefs.getString(KEY_TOKEN, null)

    fun getUser(): User? {
        val userJson = prefs.getString(KEY_USER, null) ?: return null
        return try {
            jsonToUser(JSONObject(userJson))
        } catch (_: Exception) {
            null
        }
    }

    fun clearSession() {
        prefs.edit().apply {
            remove(KEY_TOKEN)
            remove(KEY_USER)
            apply()
        }
        ApiClient.authToken = null
        ApiClient.currentUser = null
    }

    fun isLoggedIn(): Boolean = !getToken().isNullOrBlank()

    fun getSavedVacancyIds(): Set<String> {
        return prefs.getStringSet(KEY_SAVED_VACANCIES, emptySet()) ?: emptySet()
    }

    fun toggleSaveVacancy(vacancyId: String): Set<String> {
        val current = getSavedVacancyIds().toMutableSet()
        if (current.contains(vacancyId)) {
            current.remove(vacancyId)
        } else {
            current.add(vacancyId)
        }
        prefs.edit().putStringSet(KEY_SAVED_VACANCIES, current).apply()
        return current
    }

    private fun restoreSession() {
        val token = getToken()
        val user = getUser()
        if (!token.isNullOrBlank() && user != null) {
            ApiClient.authToken = token
            ApiClient.currentUser = user
        }
    }

    private fun userToJson(user: User): JSONObject {
        return JSONObject().apply {
            put("id", user.id)
            put("name", user.name)
            put("email", user.email)
            put("role", user.role)
            put("auth_provider", user.authProvider)
            put("avatar_url", user.avatarUrl)
            put("phone", user.phone)
            put("profession", user.profession)
            put("location", user.location)
            put("bio", user.bio)
            put("skills", user.skills)
        }
    }

    private fun jsonToUser(obj: JSONObject): User {
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
}
