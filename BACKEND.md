# Dear Day Backend Foundation

Phase 1 Step 1 uses Supabase for PostgreSQL, Auth and Storage, while Vercel serverless functions keep sensitive business logic and Paymob integration on the server.

## Files

- `supabase/migrations/001_initial_schema.sql` — initial marketplace schema and RLS foundation.
- `lib/supabase-admin.js` — server-only Supabase client using the service-role key.
- `api/health.js` — verifies that Vercel can reach the database.
- `.env.example` — required environment variable names only; never commit real keys.

## First setup

1. Create a Supabase project for Dear Day.
2. Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor (or via Supabase CLI later).
3. In Vercel Project Settings > Environment Variables add:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`
4. Redeploy.
5. Open `/api/health`. A successful setup returns `ok: true` and `database: connected`.

## Initial data model

The first migration includes:

- user profiles and staff/customer roles
- partners and partner-user membership
- categories
- listings and versioned listing changes
- approval workflow (`draft`, `pending_review`, `published`, `rejected`, `archived`)
- customer orders
- order items
- partner sub-orders so one Dear Day order can contain multiple partners
- basic commission fields
- audit log
- Row Level Security foundation

## Important security rule

`SUPABASE_SERVICE_ROLE_KEY` is server-only. It must never be placed in HTML, browser JavaScript, localStorage, or any public repository file.

## Next Phase 1 step

Step 2 will connect the existing Dear Day Login/Create Account pages to Supabase Auth and replace prototype-only login behavior with real customer accounts and sessions.
