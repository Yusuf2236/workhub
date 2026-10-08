import Foundation

// Server addresses come from Info.plist keys WZoneAPIBaseURL and WZoneWebURL so release builds
// can point at production without code changes. The defaults are for the simulator.
struct APIConfig {
    static let baseURL = configuredURL("WZoneAPIBaseURL", fallback: "http://localhost:8080")
    static let webURL = configuredURL("WZoneWebURL", fallback: "http://localhost:3000")
    static let authPath = "/api/v1/auth"
    static let vacancyPath = "/api/v1/vacancies"

    private static func configuredURL(_ key: String, fallback: String) -> URL {
        if let value = Bundle.main.object(forInfoDictionaryKey: key) as? String,
           let url = URL(string: value), !value.isEmpty {
            return url
        }
        return URL(string: fallback)!
    }
}
