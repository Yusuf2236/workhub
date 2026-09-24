import Foundation

struct APIConfig {
    static let baseURL = URL(string: "http://localhost:8080")!
    static let authPath = "/api/v1/auth"
    static let vacancyPath = "/api/v1/vacancies"
}
