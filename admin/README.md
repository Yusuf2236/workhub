# Admin panel

The WorkHub admin panel is the management layer for recruiters, HR specialists, and platform administrators. It provides moderation, analytics, and operational oversight for the platform.

## Stack

- Next.js 14+
- React 18+
- TypeScript
- Tailwind CSS
- Recharts / Chart.js
- Axios / fetch client

## Folder structure

```text
admin/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── dashboard/
│   ├── users/
│   ├── vacancies/
│   ├── applications/
│   └── analytics/
├── components/
│   ├── layout/
│   ├── tables/
│   ├── charts/
│   └── forms/
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   └── utils.ts
├── hooks/
├── styles/
├── package.json
├── tsconfig.json
├── next.config.js
├── .env.example
└── README.md
```

## Main pages

- Dashboard overview
- User management
- Vacancy moderation
- Application review
- Analytics and reports
- Settings and billing

## Authentication

- JWT-based access to admin API
- role checks: admin, recruiter, moderator
- protected routes using middleware

## API integration

```ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1';
```

## Notes

This dashboard is designed to work with the same backend endpoint contracts as the Android and iOS apps, while exposing internal operational controls for HR staff.
