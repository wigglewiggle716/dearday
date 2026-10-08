# Dear Day Next.js migration

This directory is an isolated migration workspace.

Safety rules:
- Do not modify or delete the existing static production files while migration is in progress.
- Do not point the production domain to this app until the migration is approved.
- Do not use Supabase service-role credentials in client code.
- Keep production Supabase write access out of preview testing until a dedicated development environment is ready.
- Migrate page-by-page and compare Arabic, English, desktop, and mobile behavior before cutover.

Baseline source commit:
`5d97cc458910279646ec10a18ffecaca81a6854d`
