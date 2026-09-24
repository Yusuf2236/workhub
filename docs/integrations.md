# Integrations

WorkHub uses a layered integration model to keep services isolated and scalable.

## Core integrations

### PostgreSQL
Primary relational store for users, vacancies, applications, resumes, and notifications.

### Redis
Caching, rate limiting, and session state.

### MinIO / Cloudflare R2
Resume uploads, avatars, and other object storage needs.

### Firebase Cloud Messaging
Push notifications for iOS and Android devices.

### Stripe / Payme / Click
Payments and premium subscriptions.

### Sentry / PostHog
Monitoring and analytics.

## Integration flow

1. Client calls backend API.
2. Backend validates JWT and input.
3. Repository queries PostgreSQL.
4. Redis handles cache and rate limiting.
5. File uploads go to MinIO or Cloudflare R2.
6. Notifications are pushed through Firebase.
