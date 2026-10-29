import Foundation

struct ApiResponse<T: Codable>: Codable {
    let success: Bool?
    let message: String?
    let data: T?
}

struct AuthData: Codable {
    let token: String
    let user: User
}

struct VacancyListData: Codable {
    let items: [Vacancy]
    let total: Int?
    let page: Int?
}

struct User: Identifiable, Codable {
    let id: String
    var name: String
    let email: String
    var role: String
    var avatarUrl: String?
    var phone: String?
    var profession: String?
    var location: String?
    var bio: String?
    var skills: String?

    enum CodingKeys: String, CodingKey {
        case id, name, email, role, bio, skills, location, phone
        case avatarUrl = "avatar_url"
        case profession
    }
}

struct Vacancy: Identifiable, Codable {
    let id: String
    let title: String
    let company: String
    let location: String
    let description: String
    var salary: String? = nil
    var salaryMin: Int?
    var salaryMax: Int?
    var salaryCurrency: String?
    var category: String?
    var employmentType: String?
    var requirements: String?
    var createdAt: String?

    var salaryFormatted: String {
        if let s = salary, !s.isEmpty {
            return s
        }
        if let min = salaryMin, min > 0, let max = salaryMax, max > 0 {
            return "\(min) - \(max) \(salaryCurrency ?? "UZS")"
        }
        return "Kelishilgan"
    }

    enum CodingKeys: String, CodingKey {
        case id, title, company, location, description, category, requirements, salary
        case salaryMin = "salary_min"
        case salaryMax = "salary_max"
        case salaryCurrency = "salary_currency"
        case employmentType = "employment_type"
        case createdAt = "created_at"
    }
}

struct Resume: Identifiable, Codable {
    let id: String
    let userId: String?
    var title: String
    var fullName: String?
    var phone: String?
    var email: String?
    var profession: String?
    var skills: String?
    var experienceYears: Int?
    var summary: String?
    var fileUrl: String?
    var atsScore: Int?
    var createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id, title, phone, email, profession, skills, summary
        case userId = "user_id"
        case fullName = "full_name"
        case experienceYears = "experience_years"
        case fileUrl = "file_url"
        case atsScore = "ats_score"
        case createdAt = "created_at"
    }
}

struct Application: Identifiable, Codable {
    let id: String
    let userId: String?
    let vacancyId: String?
    let vacancyTitle: String?
    let company: String?
    let status: String?
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id, status
        case userId = "user_id"
        case vacancyId = "vacancy_id"
        case vacancyTitle = "vacancy_title"
        case company
        case createdAt = "created_at"
    }
}

struct ChatMessage: Identifiable, Codable {
    let id: String
    let roomId: String?
    let userId: String?
    let senderName: String?
    let senderAvatar: String?
    let content: String
    var isMe: Bool = false
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id, content
        case roomId = "room_id"
        case userId = "user_id"
        case senderName = "sender_name"
        case senderAvatar = "sender_avatar"
        case createdAt = "created_at"
    }
}

struct ChatMessagesData: Codable {
    let messages: [ChatMessage]
}

struct NewsArticle: Identifiable {
    let id: String
    let title: String
    let excerpt: String
    let content: String
    let category: String
    let imageUrl: String
    let author: String
    let date: String
    let readTime: String
    let views: Int
    var likes: Int
}

struct CommunityCommentItem: Identifiable {
    let id: String
    let authorName: String
    let authorRole: String
    let content: String
    let timestamp: String
    var likes: Int
    var likedByMe: Bool
    let topicTag: String
}

struct SalaryTrendItem: Identifiable {
    let id = UUID()
    let role: String
    let range: String
    let growth: String
}
