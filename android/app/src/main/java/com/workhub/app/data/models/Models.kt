package com.workhub.app.data.models

data class User(
    val id: String,
    val name: String,
    val email: String,
    val role: String = "user"
)

data class Vacancy(
    val id: String,
    val title: String,
    val company: String,
    val location: String = "",
    val description: String = "",
    val salary: String = "",
    val createdBy: String = "",
    val createdAt: String = ""
)

data class Application(
    val id: String,
    val userId: String,
    val vacancyId: String,
    val status: String = "submitted",
    val createdAt: String = ""
)

data class Resume(
    val id: String,
    val userId: String,
    val title: String,
    val summary: String = "",
    val fileUrl: String = "",
    val createdAt: String = ""
)

data class ChatMessage(
    val id: String,
    val roomId: String,
    val userId: String,
    val content: String,
    val createdAt: String = ""
)
