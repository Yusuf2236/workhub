package com.workhub.app.data.models

data class User(
    val id: String = "",
    val name: String = "",
    val email: String = "",
    val role: String = "user",
    val authProvider: String = "local",
    val avatarUrl: String = "",
    val phone: String = "",
    val profession: String = "",
    val location: String = "",
    val bio: String = "",
    val skills: String = ""
)

data class Vacancy(
    val id: String = "",
    val title: String = "",
    val company: String = "",
    val location: String = "",
    val category: String = "IT & Dasturlash",
    val employmentType: String = "Full-time",
    val salaryMin: Long = 0,
    val salaryMax: Long = 0,
    val salaryCurrency: String = "UZS",
    val description: String = "",
    val requirements: String = "",
    val tags: String = "",
    val views: Long = 0,
    val isFeatured: Boolean = false,
    val createdBy: String = "",
    val createdAt: String = ""
)

data class Application(
    val id: String = "",
    val userId: String = "",
    val vacancyId: String = "",
    val vacancyTitle: String = "",
    val company: String = "",
    val coverLetter: String = "",
    val resumeUrl: String = "",
    val status: String = "submitted",
    val createdAt: String = ""
)

data class Resume(
    val id: String = "",
    val userId: String = "",
    val title: String = "",
    val fullName: String = "",
    val phone: String = "",
    val email: String = "",
    val location: String = "",
    val profession: String = "",
    val skills: String = "",
    val experienceYears: Int = 0,
    val summary: String = "",
    val fileUrl: String = "",
    val atsScore: Int = 85,
    val createdAt: String = ""
)

data class ChatMessage(
    val id: String = "",
    val roomId: String = "general",
    val userId: String = "",
    val senderName: String = "",
    val senderAvatar: String = "",
    val content: String = "",
    val isMe: Boolean = false,
    val createdAt: String = ""
)

data class NewsItem(
    val id: String,
    val title: String,
    val excerpt: String,
    val content: String,
    val category: String,
    val imageUrl: String,
    val author: String,
    val authorRole: String,
    val date: String,
    val readTime: String,
    val views: Int,
    val likes: Int,
    val tags: List<String>
)

data class CommunityComment(
    val id: String,
    val authorName: String,
    val authorRole: String,
    val authorAvatar: String,
    val content: String,
    val timestamp: String,
    val likes: Int,
    val likedByMe: Boolean = false,
    val topicTag: String
)

data class SalaryTrend(
    val role: String,
    val range: String,
    val growth: String
)

data class CompanySpotlight(
    val id: String,
    val name: String,
    val industry: String,
    val location: String,
    val openPositions: Int,
    val logo: String,
    val coverImage: String,
    val verified: Boolean,
    val tagline: String
)
