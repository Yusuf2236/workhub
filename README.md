# WorkHub

WorkHub is a job platform project with a Go backend, Android app, and iOS app. The repository is structured as a monorepo with separate native client apps and a shared backend API layer.

## Stack

- Backend: Go + Gin + PostgreSQL + Redis
- Android: Kotlin + Jetpack Compose
- iOS: Swift + SwiftUI
- Auth: JWT-based authentication with password hashing
- Real-time: WebSocket chat endpoint skeleton
- Files: MinIO/Cloudflare R2-ready abstraction
- Notifications: Firebase Cloud Messaging-ready integration

## Project structure

- `backend/` — API server, config, handlers, migrations, Docker setup
- `android/` — Android native app
- `ios/` — iOS native app

## Local development

1. Copy the backend environment file:
   `cp backend/.env.example backend/.env`
2. Run infrastructure:
   `cd backend && docker compose up -d`
3. Start the API:
   `go run ./cmd/api`
4. Open client apps in Android Studio / Xcode and configure the API URL if needed.

## Notes

This repository is intentionally scaffolded for rapid extension. The backend exposes health, auth, vacancy, application, resume, and chat abstractions with clear TODOs for real database persistence and external service integration.
