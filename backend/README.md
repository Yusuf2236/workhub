# WorkHub backend

Bu papka Go tili bilan yozilgan backend API xizmatini o‘z ichiga oladi. Loyiha job platformasi uchun yaratilgan bo‘lib, auth, vacancy, application, resume va chat bo‘limlarini o‘z ichiga oladi.

## Xususiyatlar

- health check endpoint
- JWT-based authentication middleware
- user register / login / me endpoints
- vacancy listing and creation APIs
- application and resume handlers
- websocket chat endpoint
- PostgreSQL, Redis va storage konfiguratsiyasi
- Docker Compose bilan lokallashtrish
- real database schema va migrationlar

## Loyiha tuzilmasi

```text
backend/
├── cmd/api/main.go
├── internal/
│   ├── config/
│   ├── database/
│   ├── handlers/
│   ├── middleware/
│   ├── models/
│   ├── services/
│   └── storage/
├── pkg/
│   ├── hash/
│   ├── jwt/
│   └── response/
├── migrations/
│   └── 001_init_schema.sql
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── go.mod
├── README.md
└── .gitignore
```

## Ishga tushirish

```bash
cp .env.example .env

go mod download
go run ./cmd/api
```

## Docker

```bash
docker compose up --build
```

## Environment variables

`.env.example` faylida quyidagilar bo‘ladi:

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
DATABASE_URL=postgres://postgres:postgres@localhost:5432/workhub?sslmode=disable
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379
STORAGE_PROVIDER=minio
STORAGE_ENDPOINT=localhost:9000
STORAGE_BUCKET=workhub
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_PUBLIC_URL=http://localhost:9000/workhub
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=your-service-account@example.com
FIREBASE_WEB_API_KEY=your-firebase-web-key
```

## Database strategy

- PostgreSQL: transactional data
- Redis: cache, rate limiting, real-time temp state
- MinIO: file uploads and media objects

## API routes

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

## Real backend direction

Bu backend hali skelet holatda bo‘lsa-da, quyidagilarni qo‘shish mumkin:

- PostgreSQL connection and repository layer
- Redis client cache layer
- MinIO upload service
- FCM push notifications service
- real admin authorization
- production deployment pipeline
