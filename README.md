# WorkHub

WorkHub — bu ish qidiruvchilar, ish beruvchilar, recruiterlar va HR jamoalari uchun mo‘ljallangan zamonaviy job platformasi. Loyiha monorepo formatida yaratilgan bo‘lib, backend, Android, iOS, admin panel, desktop client va hujjatlar bo‘limlarini birlashtiradi.

## Asosiy maqsad

WorkHub platformasi quyidagi muhim funksiyalarni ta’minlaydi:

- foydalanuvchilarni ro‘yxatdan o‘tkazish va autentifikatsiya qilish
- vakansiyalarni ko‘rish, qidirish va filtratsiya qilish
- ish beruvchilar uchun vakansiya yaratish va boshqarish
- ariza topshirish va ko‘rib chiqish
- rezyume yaratish, yuklash va boshqarish
- real-time chat va muloqot
- push bildirishnomalar
- admin panel orqali monitoring va moderation
- premium xizmatlar va monetizatsiya imkoniyatlari

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
├── admin/
│   └── README.md
├── docs/
│   ├── README.md
│   ├── integrations.md
│   ├── monetization.md
│   ├── design-system.md
│   └── roadmap.md
├── mobile-android/
│   └── README.md
├── windows-desktop/
│   └── README.md
├── .github/
└── .vscode/
```

## Texnologiyalar

### Backend
- Go
- Gin web framework
- PostgreSQL
- Redis
- JWT authentication
- WebSocket chat
- MinIO / Cloudflare R2
- Docker Compose

### Android
- Kotlin
- Jetpack Compose
- Material3
- Navigation Compose
- ViewModel + Repository pattern

### iOS
- Swift
- SwiftUI
- URLSession
- MVVM pattern

### Admin panel
- React / Next.js yoki admin template
- backend API bilan integratsiya
- chart analytics va dashboards

### Desktop
- .NET / WPF / WinUI 3
- MVVM + REST API integration

## Arxitektura

Loyiha modularga bo‘lingan va har bir qism alohida maydonda ishlaydi:

- backend — server, business logic, database, auth, storage, chat
- mobile apps — native clientlar
- admin — HR va menejerlar uchun boshqaruv paneli
- desktop — desktop foydalanuvchilar uchun monitoring va management
- docs — strategy, system design, integrations, monetization

## Business model va monetizatsiya

WorkHub uchun monetizatsiya modeli quyidagicha ishlaydi:

- employer premium planlari
- featured vacancy listing
- resume boost va premium profile
- recruiter subscription
- enterprise B2B API access
- analytics va custom dashboard

Batafsil ma’lumot: `docs/monetization.md`

## Integratsiyalar

Loyiha bir nechta tashqi xizmatlar bilan integratsiyalanadi:

- PostgreSQL va Redis
- MinIO yoki Cloudflare R2
- Firebase Cloud Messaging
- Stripe / Payme / Click (to‘lovlar)
- Sentry / PostHog / Mixpanel (analytics)
- Google / Apple auth (ixtiyoriy)

Batafsil ma’lumot: `docs/integrations.md`

## Design system

Loyiha uchun umumiy dizayn tizimi quyidagilarni o‘z ichiga oladi:

- modern UI/UX
- mobile-first layout
- rasmli, professional va ishonchli ko‘rinish
- consistent color palette and typography
- cards, button, form, modal, table, badge componentlar

Batafsil ma’lumot: `docs/design-system.md`

## Loyiha boshqaruv va sprint reja

### Phase 1 — Core product
- auth
- profile
- jobs list
- apply flow
- resume upload

### Phase 2 — Communication
- chat
- notifications
- message history
- employer replies

### Phase 3 — Admin and reporting
- admin dashboard
- moderation
- statistics
- user analytics

### Phase 4 — Monetization
- premium plans
- featured jobs
- recruiter tools

### Phase 5 — Expansion
- desktop client
- enterprise features
- AI search and matching

## Lokal ishlash

### 1. Backend

```bash
cp backend/.env.example backend/.env
cd backend
docker compose up -d
go run ./cmd/api
```

### 2. Android

1. `android/` papkasini Android Studio’da oching.
2. Gradle sync qiling.
3. `app` konfiguratsiyasini ishga tushiring.

### 3. iOS

1. `ios/` papkasini Xcode’da oching.
2. simulator yoki haqiqiy qurilma tanlang.
3. ilovani boshlang.

## Xavfsizlik

- JWT access + refresh token
- password hashing (bcrypt)
- CORS konfiguratsiyasi
- secrets environment variables orqali saqlanadi
- `.env.example` orqali demo config taqdim etiladi

## Xulosa

WorkHub — bu katta va kengaytiriladigan product bo‘lib, unga backend, mobil ilovalar, desktop client, admin panel va docs tizimlari birga birlashtirilgan. Loyiha startup sifatida boshlash uchun qulay, keyinchalik enterprise va premium hisobga o‘tish uchun ham mos.

## Hujjatlar katalogi

- `backend/README.md` — backend dokumentatsiyasi
- `android/README.md` — Android app dokumentatsiyasi
- `ios/README.md` — iOS app dokumentatsiyasi
- `admin/README.md` — admin panel bo‘limi
- `docs/README.md` — hujjatlar katalogi
- `docs/integrations.md` — xizmatlar bilan integratsiya
- `docs/monetization.md` — biznes model va monetizatsiya
- `docs/design-system.md` — dizayn systemasi
- `mobile-android/README.md` — mobil app skeleti
- `windows-desktop/README.md` — desktop client skeleti

