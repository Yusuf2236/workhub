# WorkHub backend

The backend is the core service for the WorkHub platform. It exposes the main APIs for authentication, jobs, applications, resumes, and realtime chat.

## Stack

- Go 1.22+
- Gin Web Framework
- PostgreSQL
- Redis
- MinIO / Cloudflare R2
- JWT authentication
- Gorilla WebSocket
- Firebase push notification service ready

## Project structure

```text
backend/
├── cmd/api/main.go
├── internal/
│   ├── config/
│   ├── database/
│   ├── handlers/
│   ├── middleware/
│   ├── models/
│   ├── repositories/
│   ├── services/
│   ├── storage/
│   ├── validators/
│   └── websocket/
├── pkg/
│   ├── hash/
│   ├── jwt/
│   ├── response/
│   └── validator/
├── migrations/
├── docs/
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── go.mod
└── README.md
```

## API domains

- Auth
- Vacancy
- Application
- Resume
- Chat
- Admin
- Notification

## Local setup

```bash
cp .env.example .env
cd backend
docker compose up -d
go mod download
go run ./cmd/api
```

## Example environment

```env
PORT=8080
APP_ENV=development
JWT_SECRET=super-secret-key
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=168h
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=workhub
REDIS_HOST=localhost
REDIS_PORT=6379
STORAGE_PROVIDER=minio
STORAGE_ENDPOINT=localhost:9000
STORAGE_BUCKET=workhub
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
FIREBASE_PROJECT_ID=workhub-project
```

## Main routes

- GET /health
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- GET /api/v1/auth/me
- GET /api/v1/vacancies
- POST /api/v1/vacancies
- POST /api/v1/vacancies/:id/apply
- POST /api/v1/resumes
- GET /api/v1/ws

## Notes

This backend is designed to be production-ready in structure and can be extended with real repository, cache, storage, notification, and admin logic without changing the public API contracts.
