# WorkHub

WorkHub — bu ish qidiruvchilar, ish beruvchilar va platforma uchun mo‘ljallangan monorepo loyihasi. Loyiha bir nechta modullardan iborat bo‘lib, backend, Android, iOS, admin panel, desktop client, hujjatlar va dizayn dokumentatsiyasi ajratilgan.

## Asosiy maqsad

- ish vakansiyalarini ko‘rsatish va boshqarish
- foydalanuvchilarni autentifikatsiya qilish
- ariza topshirish va rezyume yuklash
- real-time chat va push bildirishnomalar
- admin panel orqali boshqaruv
- mobil va desktop klientlar bilan integratsiya
- monetizatsiya va business modelini qo‘llab-quvvatlash

## Monorepo tuzilmasi

```text
workhub/
├── README.md
├── .gitignore
├── backend/
│   ├── cmd/
│   ├── internal/
│   ├── pkg/
│   ├── migrations/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── go.mod
│   ├── .env.example
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
├── admin/
│   └── README.md
├── docs/
│   ├── README.md
│   ├── integrations.md
│   ├── monetization.md
│   └── design-system.md
├── mobile-android/
│   └── README.md
├── windows-desktop/
│   └── README.md
└── .github/
```

## Modullar

### 1. Backend
- Go + Gin
- PostgreSQL
- Redis
- JWT auth
- WebSocket chat
- MinIO / Cloudflare R2 storage
- Docker Compose

### 2. Android mobile
- Kotlin + Jetpack Compose
- Login, home, vacancies, applications, chat
- REST API client, viewmodel, repository pattern

### 3. iOS mobile
- Swift + SwiftUI
- Native UX experience
- Auth, dashboard, jobs, applications

### 4. Admin panel
- admin dashboard
- employer management
- vacancy moderation
- user management
- analytics and reports

### 5. Windows desktop
- Windows desktop client (WPF / WinUI)
- sync with backend API
- notifications and job monitoring

### 6. Docs
- integrations docs
- monetization docs
- design system docs
- onboarding and deployment notes

## Tech stack

- Backend: Go
- Android: Kotlin + Compose
- iOS: Swift + SwiftUI
- Desktop: .NET / WPF / WinUI (option)
- DB: PostgreSQL
- Cache: Redis
- Storage: MinIO / Cloudflare R2
- Auth: JWT
- Messaging: Firebase / WebSocket / push alerts
- Infra: Docker, Docker Compose

## Business model and monetization

Loyiha uchun monetizatsiya modellari:

- premium employer plans
- candidat premium subscription
- paid vacancy promotion
-headhunting / talent search service
- enterprise API access
- CV boost / priority listing
- custom branding for employers

Batafsil ma’lumotlar: `docs/monetization.md`

## Integratsiyalar

- Firebase Cloud Messaging
- Google / Apple sign-in (ixtiyoriy)
- MinIO / Cloudflare R2
- PostgreSQL and Redis
- payment gateway (Stripe / Payme / Click)
- analytics and crash tools

Batafsil ma’lumotlar: `docs/integrations.md`

## Design system

- primary color palette
- typography
- card styles
- buttons and forms
- dashboard layout
- mobile app components
- desktop UI rules

Batafsil ma’lumotlar: `docs/design-system.md`

## Lokal ishlash

```bash
cp backend/.env.example backend/.env
cd backend
docker compose up -d
go run ./cmd/api
```

## Key milestones

- phase 1: auth + vacancies + applications
- phase 2: resumes + uploads + chat
- phase 3: admin panel + analytics
- phase 4: desktop app + integrations
- phase 5: monetization + premium features

## Ishga tushirish navbatma-navbat

1. Database va Redis ochiladi
2. Backend ishlaydi
3. Mobil app test qilinadi
4. Admin panel boshqariladi
5. Desktop client integratsiya qilinadi
6. Monetization va analytics ichki bo‘limlar qo‘shiladi

## Xulosa

WorkHub monorepo loyihasi katta va kengaytiriladigan product bo‘lib, unda backend, mobil clientlar, desktop client, admin panel, hujjatlar va monetization modelini bir vaqtning o‘zida rivojlantirish mumkin. Bu loyiha startup uchun ham, mahsulot uchun ham muhim bazani tashkil qiladi.
