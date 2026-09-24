# WorkHub Android

Android qismi Kotlin + Jetpack Compose bilan yaratilgan native mobil ilovadir. Build qilish uchun Android Studio va SDK kerak bo‘ladi.

## Android features

- login and register flow
- home/dashboard screen
- vacancy list and detail screen
- apply flow
- profile and resume management
- chat screen skeleton
- navigation graph

## Recommended module structure

```text
android/
├── app/
│   ├── src/main/java/com/workhub/app/
│   ├── src/main/res/
│   └── AndroidManifest.xml
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
├── README.md
└── .gitignore
```

## Technologies used

- Kotlin
- Jetpack Compose
- Material3
- Navigation Compose
- Lifecycle
- Coil for image loading

## Local setup

```bash
cd android
# Android Studio orqali oching
# Gradle sync qiling
# app konfiguratsiyasini ishga tushiring
```

## Default API config

Lokal emulator uchun backend base URL:

```text
http://10.0.2.2:8080
```

## Suggested screens

- SplashScreen
- LoginScreen
- RegisterScreen
- HomeScreen
- SearchScreen
- VacancyDetailScreen
- ApplyScreen
- ResumeScreen
- ChatScreen
- ProfileScreen

## Notes

Bu qism hozircha skelet holatda bo‘lib, keyinchalik backend API bilan real data integratsiyasi qo‘shiladi.

