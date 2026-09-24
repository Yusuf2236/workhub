# WorkHub backend

Bu papka Go tili bilan yozilgan backend API xizmatini o‘z ichiga oladi. Loyiha job platformasi uchun yaratilgan bo‘lib, auth, vacancy, application, resume va chat bo‘limlarini o‘z ichiga oladi.

## Xususiyatlar

- health check endpoint
- JWT bazasidagi autentifikatsiya
- foydalanuvchi ro‘yxatdan o‘tish va kirish endpointlari
- vakansiya ro‘yxatini ko‘rish va yaratish
- ariza topshirish endpointlari
- resume endpointlari
- WebSocket chat endpointi
- PostgreSQL va Redis konfiguratsiyasi
- Docker Compose bilan lokallashtrish

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

Barcha konfiguratsiya o‘zgaruvchilari `.env.example` faylida ko‘rsatilgan.

## Backend arxitekturasi

- `cmd/api` — serverni ishga tushirish nuqtasi
- `internal/config` — konfiguratsiya va env loading
- `internal/handlers` — HTTP handlerlar
- `internal/middleware` — auth, CORS va logger
- `internal/models` — data modellar
- `pkg` — JWT, hash va response utilitlari
- `migrations` — SQL migrationlar

## Bo‘limlar

- auth
- user
- vacancy
- application
- resume
- chat

## Maqsad

Backend qismi frontend va mobil ilovalardan keladigan so‘rovlarga javob berish, ma’lumotlarni saqlash va xavfsiz autentifikatsiyani ta’minlash uchun xizmat qiladi.
