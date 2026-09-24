# WorkHub iOS

The iOS app is implemented with SwiftUI and follows a modular MVVM architecture. Each screen has a dedicated view and a state manager.

## Structure

```text
ios/
├── App/
├── Core/
├── Features/
├── Resources/
└── README.md
```

## Main modules

- App
- Core/API
- Core/Models
- Features/Auth
- Features/Home
- Features/Vacancies
- Features/Applications
- Features/Resume
- Features/Chat

## API base config

```swift
struct APIConfig {
    static let baseURL = URL(string: "http://localhost:8080")!
}
```

## Notes

The app is designed to use the same backend contracts as Android and the admin dashboard while keeping a native user experience.
