# Dear Day Next.js App

This is the only active Dear Day web application. It is deployed from this `next-app/` directory to Vercel and served at https://dear-day.com.

- Framework: Next.js 16 and React 19
- Backend: Supabase (existing production instance; do not reset)
- Public store: Arabic `/` and English `/en`
- Protected areas: customers, partner portals and staff/admin/finance

## Commands

```sh
npm install
npm run dev
npm run build
npm start
```

The repository root `README.md` and `docs/PRODUCTION-OPERATIONS.md` explain release settings and archive references.

The historical HTML implementation and full pre-cleanup repository are archived in Git branches. Never add back legacy HTML/API files just to resolve a new application issue; repair the Next.js implementation instead.

## Security & rollout

Preserve live Supabase data, access policies, staff MFA and OAuth provider configuration. Do not deploy DDL, reconfigure auth callbacks, trigger paid transactions, or email real customers just to test builds.

Online Paymob charging is not currently enabled; its display UI must not imply an order has been paid.
