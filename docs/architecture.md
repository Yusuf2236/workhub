# Architecture

This document describes the overall architecture of the WorkHub monorepo.

## Design principles

- modular monorepo
- clear separation of concerns
- backend as source of truth for business logic
- native client apps for Android and iOS
- admin + desktop for operations
- deployment via Docker and infrastructure scripts

## Layers

### 1. Backend layer
Responsible for authentication, jobs, applications, resumes, and realtime chat.

### 2. Mobile layer
Native client apps for candidate and employer workflows.

### 3. Admin layer
Operational management for HR and platform moderation.

### 4. Desktop layer
Extended management experience for Windows users.

### 5. Infra layer
PostgreSQL, Redis, MinIO, and deployment services.

## Technology map

- Backend: Go + Gin
- Database: PostgreSQL
- Cache: Redis
- Storage: MinIO / Cloudflare R2
- Realtime: WebSocket
- Auth: JWT
- Notifications: Firebase
