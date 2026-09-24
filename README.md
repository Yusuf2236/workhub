# WorkHub

WorkHub is a full-stack job platform monorepo built for job seekers, employers, recruiters, and admins. The project is structured as a modular platform with a Go backend, native Android and iOS clients, an admin dashboard, Windows desktop client, and shared documentation.

## Architecture overview

- Backend: Go + Gin + PostgreSQL + Redis
- Mobile Android: Kotlin + Jetpack Compose
- Mobile iOS: Swift + SwiftUI
- Admin: Next.js / React dashboard
- Desktop: .NET / WPF or WinUI
- Storage: MinIO / Cloudflare R2
- Auth: JWT + password hashing
- Realtime: Gorilla WebSocket
- Notifications: Firebase Cloud Messaging

## Repository structure

```text
workhub/
├── README.md
├── backend/
├── android/
├── ios/
├── admin/
├── docs/
├── windows-desktop/
├── infra/
├── scripts/
├── docker-compose.yml
└── .env.example
```

## Product modules

### Candidate experience
- job discovery and search
- application tracking
- resume upload and profile management
- realtime chat with employers

### Employer experience
- vacancy creation and management
- candidate review and filtering
- application status updates
- premium placement / featured jobs

### Admin experience
- user moderation
- vacancy review
- analytics dashboard
- billing and subscription management

## Platform services

- Auth API
- Vacancy API
- Application API
- Resume API
- Chat WebSocket API
- File upload service
- Notification service
- Analytics service

## Local development

```bash
cp .env.example backend/.env
cd backend
docker compose up -d
go run ./cmd/api
```

## Main routes

- GET /health
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- GET /api/v1/auth/me
- GET /api/v1/vacancies
- POST /api/v1/vacancies
- GET /api/v1/applications
- POST /api/v1/resumes
- GET /api/v1/ws

## Documentation

- `docs/architecture.md` — architecture overview
- `docs/integrations.md` — services and integrations
- `docs/monetization.md` — revenue model
- `docs/design-system.md` — UI foundation
- `docs/roadmap.md` — future milestones

## Notes

This repository is organized to support a real SaaS-style job platform from prototype to production. The app is intentionally modular so each client and admin tool can evolve independently while sharing the same backend contracts.
