# React Migration — scope and status reconciliation (2026-10-08)

## Strictly out of scope
- The parking functionality is a separate, unrelated project, even if it shares the Supabase project.
- Do not inspect, modify, migrate, reset, export, or run security remediations/tests against parking-specific tables, functions, jobs, files, or data.
- Known exclusions include `public.parking_layouts`, `public.parking_layout_history`, and `public.backup_parking_layout()`.
- Do not execute project-wide Supabase resets or blanket migrations. Database changes require a Dear Day-only impact analysis and a separate rollback plan.

## Source-of-truth hierarchy
1. The actual, tested behaviour of `dear-day.com` at the time of work.
2. Current `main` repository code and current deployed production commit.
3. The latest explicit user approvals/updates, including guest checkout without mandatory account creation (2026-10-08).
4. Historical audit reports as a checklist — NOT an authoritative description of what remains undone.

## Historical audit caveat
The user supplied the report `DearDay_Master_Repair_and_Operations_Audit_2026-10-06(1).md`.
It contains historical UX-01–UX-12 findings as of 2026-10-05 and later dated OPS and guest-checkout updates through 2026-10-08. Some UX issues described as pending have already been addressed in the UI since that snapshot. Never re-implement or roll back a UX feature solely because the report labels it open. Verify current implementation first, then document status as verified implemented, partially implemented, broken, or not verified.

## Guest checkout invariant
Customers may purchase without signing in; no sign-in or account-creation invitation during checkout/details/review/payment and no hidden account creation.

## Safety baseline
- Protected production workspace (do not touch): GitHub `main`, production Vercel `dearday`, custom domain `dear-day.com`.
- Reference code branch: `backup/pre-react-2026-10-08`.
- Working branch: `react-migration`.
- Baseline commit: `5d97cc458910279646ec10a18ffecaca81a6854d`.
- New application code only in `next-app/` until approved cutover.
- This code snapshot does NOT constitute a full production database backup or restore test.

## Migration verification
Before moving any area, compare current Arabic/English UI on desktop and mobile, links, cart persistence, checkout, auth, and role-based operations. Record evidence of current completion independently of historical labels. Do not connect preview deployments to production privileged credentials.
