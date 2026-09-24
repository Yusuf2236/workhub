# WorkHub Android

Android application is built with Kotlin and Jetpack Compose. It follows a feature-based architecture and communicates with the Go backend through REST API and WebSocket endpoints.

## Module structure

```text
android/
├── app/
│   ├── src/main/java/com/workhub/app/
│   ├── src/main/res/
│   └── AndroidManifest.xml
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
└── README.md
```

## Feature modules

- auth
- home
- vacancies
- applications
- resume
- chat
- profile

## Mobile architecture

- UI layer: Compose screens and reusable components
- ViewModel layer: state, loading, errors
- Repository layer: backend communication
- Data layer: API clients and session storage

## API client

```kotlin
object ApiClient {
    const val BASE_URL = "http://10.0.2.2:8080"
}
```

## Screens

- LoginScreen
- RegisterScreen
- HomeScreen
- VacancyListScreen
- VacancyDetailScreen
- ApplicationScreen
- ResumeScreen
- ChatScreen
- ProfileScreen
