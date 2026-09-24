# WorkHub iOS

Bu papka SwiftUI yordamida yaratilgan iOS ilovasini o‘z ichiga oladi.

## iOS features

- login screen
- dashboard/home screen
- vacancy list and application tracking
- API configuration
- future push notifications hook
- SwiftUI skeleton for real backend integration

## Recommended structure

```text
ios/
├── APIConfig.swift
├── ContentView.swift
├── HomeView.swift
├── JobPlatformApp.swift
├── LoginView.swift
├── README.md
├── WorkhubApp.swift
├── Assets.xcassets/
└── ...
```

## Tech stack

- Swift
- SwiftUI
- URLSession
- Foundation
- MVVM pattern

## Local setup

```bash
cd ios
# open in Xcode
# choose simulator or device
# run app
```

## API setup

```swift
struct APIConfig {
    static let baseURL = URL(string: "http://localhost:8080")!
    static let authPath = "/api/v1/auth"
    static let vacancyPath = "/api/v1/vacancies"
}
```

## Future screens

- LoginView
- HomeView
- VacancyListView
- VacancyDetailView
- ResumeUploadView
- ChatView
- ProfileView

## Notes

iOS qismi native UI uchun tayyor, lekin production-ready backend va realtime stream bilan integratsiya keyingi bosqichda to‘liq yakunlanadi.
