# WorkHub backend

WorkHub backend — bu job platformasi uchun yaratilgan Go API xizmati. Bu backend quyidagi tamoyillar asosida quriladi:

- modular architecture
- authentication and authorization via JWT
- PostgreSQL for persistence
- Redis for cache and real-time support
- MinIO / Cloudflare R2 for file storage
- WebSocket chat support
- Dockerized local development

## Backend features

- health check endpoint
- auth: login / register / profile
- vacancy creation and listing
- application submission
- resume management
- file upload abstraction
- WebSocket chat endpoint
- structured logging and middleware
- graceful shutdown

## Backend structure

```text
backend/
├── cmd/
│   └── api/
│       └── main.go
├── internal/
│   ├── config/
│   ├── handlers/
│   ├── middleware/
│   └── models/
├── pkg/
│   ├── hash/
│   ├── jwt/
│   └── response/
├── migrations/
│   └── 001_init.sql
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── go.mod
├── README.md
└── .gitignore
```

## Runtime stack

- Go 1.22+
- Gin web framework
- PostgreSQL 16
- Redis 7
- MinIO

## Environment configuration

Barcha environment o‘zgaruvchilari `.env.example` faylida ko‘rsatilgan.

### Example variables

```env
PORT=8080
APP_ENV=development
JWT_SECRET=change-me
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
```

## Local development

```bash
cp .env.example .env
cd backend
docker compose up -d
go mod download
go run ./cmd/api
```

## Docker

```bash
docker compose up --build
```

## Recommended API routes

- GET `/health`
- POST `/api/v1/auth/register`
- POST `/api/v1/auth/login`
- GET `/api/v1/auth/me`
- GET `/api/v1/vacancies`
- POST `/api/v1/vacancies`
- GET `/api/v1/vacancies/:id`
- POST `/api/v1/vacancies/:id/apply`
- GET `/api/v1/resumes`
- POST `/api/v1/resumes`
- GET `/api/v1/ws`

## Database design

### Core tables
- users
- profiles
- vacancies
- applications
- resumes
- chat_messages
- refresh_tokens
- file_uploads
- notifications

## Security checklist

- JWT on protected routes
- bcrypt password hashing
- CORS enabled for app clients
- secret values stored in env
- role-based access planned for admin area

## Roadmap

- real PostgreSQL repository layer
- Redis cache implementation
- file upload service with signed URLs
- Firebase push notification integration
- admin authorization
- WebSocket room-based chat persistence

