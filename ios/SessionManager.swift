import Foundation
import Combine

class SessionManager: ObservableObject {
    static let shared = SessionManager()

    private let tokenKey = "workhub_auth_token"
    private let userKey = "workhub_current_user"
    private let savedKey = "workhub_saved_vacancies"

    @Published var authToken: String? {
        didSet {
            if let token = authToken {
                UserDefaults.standard.set(token, forKey: tokenKey)
            } else {
                UserDefaults.standard.removeObject(forKey: tokenKey)
            }
        }
    }

    @Published var currentUser: User? {
        didSet {
            if let user = currentUser, let data = try? JSONEncoder().encode(user) {
                UserDefaults.standard.set(data, forKey: userKey)
            } else {
                UserDefaults.standard.removeObject(forKey: userKey)
            }
        }
    }

    @Published var savedVacancyIds: Set<String> {
        didSet {
            UserDefaults.standard.set(Array(savedVacancyIds), forKey: savedKey)
        }
    }

    var isLoggedIn: Bool {
        return authToken != nil && !(authToken?.isEmpty ?? true)
    }

    init() {
        self.authToken = UserDefaults.standard.string(forKey: tokenKey)
        if let userData = UserDefaults.standard.data(forKey: userKey),
           let user = try? JSONDecoder().decode(User.self, from: userData) {
            self.currentUser = user
        } else {
            self.currentUser = nil
        }

        if let savedArray = UserDefaults.standard.stringArray(forKey: savedKey) {
            self.savedVacancyIds = Set(savedArray)
        } else {
            self.savedVacancyIds = []
        }
    }

    func saveSession(token: String, user: User) {
        self.authToken = token
        self.currentUser = user
    }

    func clearSession() {
        self.authToken = nil
        self.currentUser = nil
    }

    func toggleSaved(vacancyId: String) {
        if savedVacancyIds.contains(vacancyId) {
            savedVacancyIds.remove(vacancyId)
        } else {
            savedVacancyIds.insert(vacancyId)
        }
    }
}
