# WorkHub iOS

iOS qismi SwiftUI bilan yaratilgan native mobil application bo‘lib, JobHub platformasi uchun barcha asosiy ekranlar va API integratsiyasi uchun skelet beradi.

## iOS features

- login screen
- home/dashboard screen
- job list and application status
- API config
- lightweight MVVM structure
- future push notification hook

## Suggested project structure

```text
ios/
├── APIConfig.swift
├── ContentView.swift
├── HomeView.swift
├── JobPlatformApp.swift
├── LoginView.swift
├── README.md
├── WorkhubApp.swift
└── Assets.xcassets/
```

## Technologies used

- Swift
- SwiftUI
- Foundation
- URLSession

## Local setup

```bash
cd ios
# Xcode orqali oching
# simulator yoki real device tanlang
# ilovani ishga tushiring
```

## API configuration

```swift
struct APIConfig {
    static let baseURL = URL(string: "http://localhost:8080")!
    static let authPath = "/api/v1/auth"
    static let vacancyPath = "/api/v1/vacancies"
}
```

## Suggested screens

- LoginView
- HomeView
- VacancyListView
- VacancyDetailView
- ResumeUploadView
- ChatView
- ProfileView

## Notes

Ilova initial skeleton darajasida bo‘lib, keyinchalik real backend bilan to‘liq integratsiya qilinadi.

