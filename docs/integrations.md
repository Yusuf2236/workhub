# Integrations

## 1. Database integration

- PostgreSQL as primary database
- Redis for caching and real-time support
- SQL migration system for schema updates

## 2. File storage integration

- MinIO for local dev environment
- Cloudflare R2 for production CDN-like storage
- upload service for resumes, avatars, company logos

## 3. Authentication integration

- JWT access + refresh tokens
- optional Firebase Auth for mobile auth
- password hashing via bcrypt

## 4. Notification integration

- Firebase Cloud Messaging for push notifications
- WebSocket chat for live communication
- email / SMS service integration optional

## 5. Payment integration

- Stripe / Payme / Click integration
- premium memberships
- employer plan upgrades

## 6. Analytics integration

- PostHog / Mixpanel / Google Analytics
- crash reporting: Sentry

## 7. Deployment integration

- Docker Compose for development
- Docker build for production
- optional VPS / Railway / Render / AWS deployment

## 8. Mobile app integration

- Android app calls backend endpoints
- iOS app uses same API contracts
- shared JSON schema for requests and responses
