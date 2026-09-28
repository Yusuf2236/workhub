package com.workhub.app.data.api

object ApiClient {
    // 10.0.2.2 maps to host localhost in Android Emulator
    const val BASE_URL = "http://10.0.2.2:8080"
    const val WS_URL = "ws://10.0.2.2:8080/api/v1/ws"

    object Endpoints {
        const val HEALTH = "/health"
        const val REGISTER = "/api/v1/auth/register"
        const val LOGIN = "/api/v1/auth/login"
        const val ME = "/api/v1/auth/me"
        const val VACANCIES = "/api/v1/vacancies"
        const val APPLICATIONS = "/api/v1/applications"
        const val RESUMES = "/api/v1/resumes"
        const val RESUMES_UPLOAD = "/api/v1/resumes/upload"
        const val CHAT_HEALTH = "/api/v1/chat/health"
    }

    var authToken: String? = null
}
