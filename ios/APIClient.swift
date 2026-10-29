import Foundation

enum APIError: LocalizedError {
    case invalidURL
    case networkError(String)
    case serverError(Int, String)
    case decodingError(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Noto'g'ri URL manzili"
        case .networkError(let msg): return "Tarmoq xatosi: \(msg)"
        case .serverError(let code, let msg): return "Server xatosi (\(code)): \(msg)"
        case .decodingError(let msg): return "Ma'lumotni o'qishda xatolik: \(msg)"
        }
    }
}

class APIClient {
    static let shared = APIClient()

    private var baseURL: URL {
        return APIConfig.baseURL
    }

    private func request(
        endpoint: String,
        method: String = "GET",
        body: [String: Any]? = nil,
        queryParams: [String: String]? = nil
    ) async throws -> Data {
        var urlComponents = URLComponents(url: baseURL.appendingPathComponent(endpoint), resolvingAgainstBaseURL: true)
        
        if let queryParams = queryParams, !queryParams.isEmpty {
            urlComponents?.queryItems = queryParams.map { URLQueryItem(name: $0.key, value: $0.value) }
        }

        guard let url = urlComponents?.url else {
            throw APIError.invalidURL
        }

        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("application/json", forHTTPHeaderField: "Accept")

        if let token = SessionManager.shared.authToken, !token.isEmpty {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = body {
            req.httpBody = try JSONSerialization.data(withJSONObject: body)
        }

        let (data, response) = try await URLSession.shared.data(for: req)

        if let httpResponse = response as? HTTPURLResponse {
            if !(200...299).contains(httpResponse.statusCode) {
                let errMessage = String(data: data, encoding: .utf8) ?? "Noma'lum xatolik"
                throw APIError.serverError(httpResponse.statusCode, errMessage)
            }
        }

        return data
    }

    // ---------------- AUTH ----------------

    func login(email: String, pass: String) async throws -> (User, String) {
        let body: [String: Any] = ["email": email, "password": pass]
        let data = try await request(endpoint: "api/v1/auth/login", method: "POST", body: body)
        let resp = try JSONDecoder().decode(ApiResponse<AuthData>.self, from: data)
        guard let auth = resp.data else {
            throw APIError.decodingError("Avtorizatsiya ma'lumotlari topilmadi")
        }
        SessionManager.shared.saveSession(token: auth.token, user: auth.user)
        return (auth.user, auth.token)
    }

    func register(name: String, email: String, pass: String) async throws -> (User, String) {
        let body: [String: Any] = ["name": name, "email": email, "password": pass, "role": "user"]
        let data = try await request(endpoint: "api/v1/auth/register", method: "POST", body: body)
        let resp = try JSONDecoder().decode(ApiResponse<AuthData>.self, from: data)
        guard let auth = resp.data else {
            throw APIError.decodingError("Ro'yxatdan o'tish ma'lumotlari topilmadi")
        }
        SessionManager.shared.saveSession(token: auth.token, user: auth.user)
        return (auth.user, auth.token)
    }

    func forgotPassword(email: String) async throws -> String {
        let body: [String: Any] = ["email": email]
        let data = try await request(endpoint: "api/v1/auth/password/forgot", method: "POST", body: body)
        let obj = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        return obj?["message"] as? String ?? "Tiklash havolasi yuborildi"
    }

    // ---------------- VACANCIES ----------------

    func fetchVacancies(search: String = "", category: String = "", location: String = "") async throws -> [Vacancy] {
        var params: [String: String] = ["page": "1", "limit": "30"]
        if !search.isEmpty { params["q"] = search }
        if !category.isEmpty && category != "Barchasi" { params["category"] = category }
        if !location.isEmpty && location != "Barcha hududlar" { params["location"] = location }

        let data = try await request(endpoint: "api/v1/vacancies", method: "GET", queryParams: params)
        let resp = try JSONDecoder().decode(ApiResponse<VacancyListData>.self, from: data)
        return resp.data?.items ?? []
    }

    func fetchVacancyDetail(id: String) async throws -> Vacancy {
        let data = try await request(endpoint: "api/v1/vacancies/\(id)", method: "GET")
        let resp = try JSONDecoder().decode(ApiResponse<Vacancy>.self, from: data)
        guard let vac = resp.data else {
            throw APIError.decodingError("Vakansiya topilmadi")
        }
        return vac
    }

    func applyToVacancy(vacancyId: String, coverLetter: String, resumeId: String? = nil) async throws -> Bool {
        var body: [String: Any] = ["cover_letter": coverLetter]
        if let rId = resumeId, !rId.isEmpty {
            body["resume_id"] = rId
        }
        _ = try await request(endpoint: "api/v1/vacancies/\(vacancyId)/apply", method: "POST", body: body)
        return true
    }

    // ---------------- APPLICATIONS ----------------

    func fetchApplications() async throws -> [Application] {
        let data = try await request(endpoint: "api/v1/applications", method: "GET")
        let resp = try JSONDecoder().decode(ApiResponse<[Application]>.self, from: data)
        return resp.data ?? []
    }

    // ---------------- PROFILE ----------------

    func fetchProfile() async throws -> User {
        let data = try await request(endpoint: "api/v1/profile", method: "GET")
        let resp = try JSONDecoder().decode(ApiResponse<User>.self, from: data)
        guard let user = resp.data else {
            throw APIError.decodingError("Profil ma'lumotlari topilmadi")
        }
        SessionManager.shared.currentUser = user
        return user
    }

    func updateProfile(
        name: String,
        phone: String,
        profession: String,
        location: String,
        bio: String,
        skills: String
    ) async throws -> User {
        let body: [String: Any] = [
            "name": name,
            "phone": phone,
            "profession": profession,
            "location": location,
            "bio": bio,
            "skills": skills
        ]
        let data = try await request(endpoint: "api/v1/profile", method: "PUT", body: body)
        let resp = try JSONDecoder().decode(ApiResponse<User>.self, from: data)
        guard let user = resp.data else {
            throw APIError.decodingError("Profil yangilanmadi")
        }
        SessionManager.shared.currentUser = user
        return user
    }

    // ---------------- RESUMES ----------------

    func fetchResumes() async throws -> [Resume] {
        let data = try await request(endpoint: "api/v1/resumes", method: "GET")
        let resp = try JSONDecoder().decode(ApiResponse<[Resume]>.self, from: data)
        return resp.data ?? []
    }

    func createResume(
        title: String,
        fullName: String,
        phone: String,
        email: String,
        profession: String,
        skills: String,
        experienceYears: Int,
        summary: String
    ) async throws -> Resume {
        let body: [String: Any] = [
            "title": title,
            "full_name": fullName,
            "phone": phone,
            "email": email,
            "profession": profession,
            "skills": skills,
            "experience_years": experienceYears,
            "summary": summary
        ]
        let data = try await request(endpoint: "api/v1/resumes", method: "POST", body: body)
        let resp = try JSONDecoder().decode(ApiResponse<Resume>.self, from: data)
        guard let resume = resp.data else {
            throw APIError.decodingError("Rezyume yaratilmadi")
        }
        return resume
    }

    func deleteResume(id: String) async throws -> Bool {
        _ = try await request(endpoint: "api/v1/resumes/\(id)", method: "DELETE")
        return true
    }

    // ---------------- CHAT ----------------

    func fetchChatMessages(room: String = "general") async throws -> [ChatMessage] {
        let data = try await request(endpoint: "api/v1/chat/messages", method: "GET", queryParams: ["room": room])
        let resp = try JSONDecoder().decode(ApiResponse<ChatMessagesData>.self, from: data)
        let currentUserId = SessionManager.shared.currentUser?.id ?? ""
        return (resp.data?.messages ?? []).map { msg in
            var m = msg
            m.isMe = (!currentUserId.isEmpty && msg.userId == currentUserId)
            return m
        }
    }

    func sendChatMessage(room: String = "general", content: String) async throws -> ChatMessage {
        let senderName = SessionManager.shared.currentUser?.name ?? "Mehmon"
        let senderAvatar = SessionManager.shared.currentUser?.avatarUrl ?? ""
        let body: [String: Any] = [
            "room_id": room,
            "content": content,
            "sender_name": senderName,
            "sender_avatar": senderAvatar
        ]
        let data = try await request(endpoint: "api/v1/chat/messages", method: "POST", body: body)
        let obj = (try? JSONSerialization.jsonObject(with: data) as? [String: Any])?["data"] as? [String: Any]
        return ChatMessage(
            id: obj?["id"] as? String ?? UUID().uuidString,
            roomId: room,
            userId: SessionManager.shared.currentUser?.id,
            senderName: senderName,
            senderAvatar: senderAvatar,
            content: content,
            isMe: true,
            createdAt: "Hozirgina"
        )
    }
}
