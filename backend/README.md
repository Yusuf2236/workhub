# WorkHub backend

This directory contains the Go API service for the WorkHub platform.

## Features

- Health check endpoint
- JWT-based auth middleware
- User registration and login endpoints
- Vacancy listing and creation APIs
- Application and resume handler skeletons
- WebSocket chat endpoint
- PostgreSQL and Redis config wiring
- Docker Compose support for local infrastructure

## Run locally

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

See `.env.example` for the full list.
