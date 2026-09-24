# WorkHub Android

Bu papka Kotlin + Jetpack Compose bilan yaratilgan Android ilovasini o‘z ichiga oladi. Loyiha native, modern va mobile-first UX ga asoslangan.

## Android features

- splash, login va register ekranlari
- home/dashboard ekran
- vacancy list va detail ekranlari
- apply flow
- resume upload va profile screen
- chat screen skeleti
- navigation graph va API integration

## Recommended structure

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

## Tech stack

- Kotlin
- Jetpack Compose
- Material3
- Navigation Compose
- ViewModel
- Repository pattern
- Coil image loading

## Local setup

```bash
cd android
# Open in Android Studio
# sync Gradle
# run app
```

## Backend API URL

```text
http://10.0.2.2:8080
```

## Screen roadmap

- Splash
- Login
- Register
- Home
- Vacancy list
- Vacancy detail
- Apply screen
- Resume upload
- Chat
- Profile

## Notes

Bu qism real API bilan integratsiya qilish uchun tayyorlangan, lekin hali asosiy backend konfiguratsiyasi bilan birga ishlash bosqichidagi skelet sifatida qolmoqda.
