# Dear Day React migration baseline — 2026-10-08

## Production baseline
- GitHub repository: `wigglewiggle716/dearday`
- Production source commit: `5d97cc458910279646ec10a18ffecaca81a6854d`
- Backup branch: `backup/pre-react-2026-10-08`
- Migration branch: `react-migration`
- Vercel production deployment: `dpl_3t6pjY2XAbnhaXYvhdBMifXqoZyX`
- Production domain remains: `dear-day.com`

## Supabase baseline
- Project ref: `hpffdmldtdtwcaoemyso`
- Production database remains unchanged during the frontend foundation stage.
- All inspected public tables have RLS enabled.
- Existing security advisor warnings are tracked separately and are not modified as part of this baseline step.

## Repository inventory
- Total files: 335
- HTML files: 119
- JavaScript files: 49
- Supabase migration files: 31
- Existing approved/static assets remain in place during migration.

## Migration isolation rules
1. Existing production files remain untouched.
2. New React/Next.js code lives under `next-app/`.
3. Production deployment remains on `main`.
4. Migration work happens only on `react-migration`.
5. No production-domain cutover until the new app passes parity and functional QA.
6. No production Supabase write testing from preview environments.
