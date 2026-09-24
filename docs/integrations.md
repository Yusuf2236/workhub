# Integrations

WorkHub loyihasida bir nechta tashqi xizmatlar va internal services bir-biriga ulanadi. Ularning barchasi platformaning ishlashi va scalability uchun muhim.

## 1. Database integration

### PostgreSQL
- primary database
- users, vacancies, applications, resumes, chat messages
- migration-based schema management

### Redis
- cache layer
- rate limiting
- session and token caching
- real-time queue / notification support

## 2. File storage integration

### MinIO
- local development environment
- resume PDFs, avatar images, company logo storage
- S3-like API behavior

### Cloudflare R2
- production storage
- faster, secure and scalable object storage
- signed URLs for private files

## 3. Authentication and identity

- JWT access token + refresh token
- password hashing via bcrypt
- optional Firebase Auth integration
- Google / Apple sign-in (future)

## 4. Push notifications

### Firebase Cloud Messaging
- iOS and Android push notifications
- application status updates
- employer replies and messages

## 5. Payment integration

### Recommended gateways
- Stripe
- Payme
- Click

### Use cases
- employer subscription plans
- featured vacancy fee
- premium resume or account upgrade

## 6. Analytics and monitoring

- Sentry for error tracking
- PostHog / Mixpanel / Google Analytics for product analytics
- logs and dashboard monitoring

## 7. Deployment integration

### Development
- Docker Compose
- local PostgreSQL, Redis, MinIO

### Production
- Docker build for backend
- VPS / Railway / Render / AWS / Azure
- environment variables and secret management

## 8. API integration pattern

- backend exposes REST API
- mobile apps consume same endpoints
- secure request/response schema
- constant API versioning (`/api/v1/...`)

## 9. Recommended architecture flow

1. Mobile app sends request to backend
2. Backend validates JWT credentials
3. Data layer queries PostgreSQL
4. Redis caches hot data
5. Storage service saves uploaded files
6. Push notifications sent to mobile clients

