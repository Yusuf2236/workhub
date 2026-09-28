import Foundation

struct User: Identifiable, Codable {
    let id: String
    let name: String
    let email: String
    let role: String
}

struct Vacancy: Identifiable, Codable {
    let id: String
    let title: String
    let company: String
    let location: String
    let description: String
    let salary: String
}

struct Application: Identifiable, Codable {
    let id: String
    let userId: String
    let vacancyId: String
    let status: String
    let createdAt: String
}

struct ChatMessage: Identifiable, Codable {
    let id: String
    let roomId: String
    let userId: String
    let content: String
    let createdAt: String
}
