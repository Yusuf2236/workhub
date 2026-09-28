import Foundation

struct User: Identifiable, Codable {
    let id: String
    let name: String
    let email: String
    let role: String
    var avatarUrl: String?
    var phone: String?
    var profession: String?
    var location: String?
    var bio: String?
    var skills: String?
}

struct Vacancy: Identifiable, Codable {
    let id: String
    let title: String
    let company: String
    let location: String
    let description: String
    let salary: String
    var category: String? = "IT & Dasturlash"
    var employmentType: String? = "Full-time"
}

struct Application: Identifiable, Codable {
    let id: String
    let userId: String
    let vacancyId: String
    let vacancyTitle: String
    let company: String
    let status: String
    let createdAt: String
}

struct ChatMessage: Identifiable, Codable {
    let id: String
    let roomId: String
    let userId: String
    let senderName: String
    let content: String
    let isMe: Bool
    let createdAt: String
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
