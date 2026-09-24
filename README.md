# WorkHub

WorkHub — bu ish qidiruvchilar, ish beruvchilar va job platformasi tizimi uchun mo‘ljallangan monorepo loyihasi. Loyiha uchta asosiy qismdan iborat:

- Backend: Go API xizmati
- Android: Kotlin + Jetpack Compose mobil ilova
- iOS: Swift + SwiftUI mobil ilova

## Loyiha maqsadi

WorkHub platformasi quyidagi imkoniyatlarni ta’minlaydi:

- foydalanuvchilarning ro‘yxatdan o‘tishi va tizimga kirishi
- vakansiyalarni ko‘rish, qidirish va saralash
- ish beruvchilarga vakansiya yaratish imkoniyati
- ariza topshirish va ko‘rib chiqish
- rezyume yaratish va yuklash
- real-time chat va xabarlar
- push bildirishnomalar
- fayllarni saqlash (resume, avatar, logo va boshqalar)

## Texnologiyalar

- Backend: Go + Gin
- Android: Kotlin + Jetpack Compose
- iOS: Swift + SwiftUI
- Ma’lumotlar bazasi: PostgreSQL
- Cache / real-time: Redis
- Chat: Gorilla WebSocket yoki Centrifugo
- Fayllar: MinIO yoki Cloudflare R2
- Autentifikatsiya: JWT + Firebase Auth yoki maxsus JWT tizimi
- Bildirishnomalar: Firebase Cloud Messaging
- Container: Docker + Docker Compose

## Loyiha tuzilmasi

```text
workhub/
├── README.md
├── .gitignore
├── backend/
│   ├── cmd/
│   ├── internal/
│   ├── pkg/
│   ├── migrations/
│   ├── .env.example
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── go.mod
│   └── README.md
├── android/
│   ├── app/
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   ├── gradle.properties
│   └── README.md
├── ios/
│   ├── APIConfig.swift
│   ├── ContentView.swift
│   ├── HomeView.swift
│   ├── JobPlatformApp.swift
│   ├── LoginView.swift
│   ├── README.md
│   └── WorkhubApp.swift
└── .github/
```

## Backend

Backend qismi Go dasturida yozilgan bo‘lib, quyidagi funksiyalarni o‘z ichiga oladi:

- health check endpoint
- auth va JWT middleware
- ro‘yxatdan o‘tish / kirish endpointlari
- vakansiya yaratish va ro‘yxat olish
- ariza berish endpointsi
- resume endpointlari
- chat websocket endpointi
- PostgreSQL va Redis konfigurasiyasi
- Docker Compose orqali lokallashtrish

## Android

Android qismi Kotlin + Jetpack Compose orqali yaratilgan native ilova bo‘lib, quyidagilarni o‘z ichiga oladi:

- login sahifasi
- home/dashboard sahifasi
- navigation graph
- API bilan aloqa uchun skelet
- Compose UI komponentlari

## iOS

iOS qismi SwiftUI bilan yaratilgan native ilova bo‘lib, quyidagilarni o‘z ichiga oladi:

- login ekran
- dashboard/home ekran
- API konfiguratsiyasi
- MVVM ya’ni modul yangilanish uchun tayyor skelet

## Loyiha ishga tushirish

1. Backend uchun environment faylini yaratish:

```bash
cp backend/.env.example backend/.env
```

2. Docker yordamida PostgreSQL, Redis va MinIO ni ishga tushirish:

```bash
cd backend
docker compose up -d
```

3. Backend API ni ishga tushirish:

```bash
go run ./cmd/api
```

4. Android ilovasi uchun Android Studio orqali `android/` papkasi ochiladi.
5. iOS ilovasi uchun Xcode orqali `ios/` papkasi ochiladi.

## Ma’lumotlar bazasi

Loyiha uchun ma’lumotlar bazasi quyidagilarni o‘z ichiga oladi:

- users
- profiles
- vacancies
- applications
- resumes
- chat_messages
- refresh_tokens
- notifications
- file_uploads

## Redis va real-time

Redis quyidagi maqsadlarda ishlatiladi:

- auth token cache
- user sessionlar
- rate limiting
- websocket room management
- notification queue
- tezkor ma’lumotlar cache

## Fayllar va storage

MinIO yoki Cloudflare R2 quyidagi fayllarni saqlash uchun ishlatiladi:

- resume PDF
- avatar va logo
- company rasm
- fayl uploadlar
- public URL yaratish

## Xavfsizlik

Loyiha xavfsizlik jarayonini quyidagicha qurishi kerak:

- JWT access token va refresh token
- password hashing (bcrypt)
- CORS konfiguratsiyasi
- environment variable orqali secrets saqlash
- `.env.example` orqali namuna konfiguratsiya

## So‘nggi fikr

Bu loyiha modern, tezkor va kengaytiriladigan job platformasi sifatida yaratilmoqda. U native Android va iOS ilovalar bilan birgalikda ishlaydi, backend esa PostgreSQL, Redis, MinIO va JWT asosida quriladi.

Kelajakda loyiha quyidagilar bilan yanada rivojlantiriladi:

- real DB repository layer
- admin panel
- employer dashboard
- advanced search va filter
- push notification tizimi
- chat history va file sending
- deployment uchun dockerized production setup
