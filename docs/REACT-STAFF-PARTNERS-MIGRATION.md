# Dear Day — Partner Management React Migration (Phase 4)

Prepared: 2026-10-09. Implementation on **`react-migration`**, under `next-app/` only. The public website `https://dear-day.com`, `main`, production Vercel project, domain routing, live SQL, and existing partner records were **not modified during implementation**.

## React routes
- Arabic `/staff/partners`
- English `/en/staff/partners`
- Shared component `next-app/components/staff-partners.jsx`, styles `next-app/app/staff-partners.css`
- Both routes have `noindex`, reuse global site header/footer and client Auth session provider.
- React `/staff` workspace links here for `partners.view` or `partners.manage`. Legacy admin partners link was removed from React workspace navigation only; the actual legacy page remains untouched.

## Existing partner directory tab
- Read current partner name/slug/status/commission/contact/coverage/notes with existing Supabase RLS and `get_my_permissions` after employee MFA validation.
- Staff with `partners.view` may view. Staff with `partners.manage` may create and edit, including partner status, commission, coverage, contact details, after explicit confirmation.
- Read-only 30-per-page filtered and searched grid (up to most recent 500 partners). Single partner product count loads lazily when opening details.
- Before every write, call `readCurrentAccount` and `get_my_permissions`. The database has `partners_manage_scoped` RLS.
- Existing partner names, records, contracts, and IDs are **not** overwritten, recreated or migrated in bulk. No deletion button exists.
- Frontend checks slug format, duplicates among loaded rows and commission range; database constraints and unique slug index remain definitive.
- For updates, an optimistic `updated_at` comparison avoids silently overwriting a concurrently edited partner. Update and audit events are *separate API calls*, matching the legacy implementation; a DB RPC transaction is recommended as a release-hardening follow-up if audit atomicity is mandatory.
- Partner activation/suspension can affect customer-facing listings and should only be tested with explicit owner-approved dummy accounts and data.

## Partner application inbox tab
- Read `public.partner_applications` with the established `partners.view`/`partners.manage` RLS. Data and attached documents are **not public**.
- Displays company, contact, phone, email, city/country, years, category, description, website/social, partnership terms, timestamp and internal notes.
- Staff with `partners.manage` may change status among `new`, `under_review`, `contacted`, `accepted`, `rejected`, and write internal notes.
- Updates use the existing security-definer `review_partner_application` RPC, which checks `partners.manage` and input validity. No direct client updates to the application table.
- Private documents are read from `partner-applications` storage bucket using a 60-second signed URL only after rechecking active authentication and effective partner permission. Links are not embedded in public React SSR output.
- **Acceptance is not activation.** Marking an application `accepted` does *not* create an active `partners` row, grant partner portal credentials, or trigger an automatic outbound email.
- New public visitor application form stays as-is: it uses the existing `partner-apply` Edge Function, requiring separate guest-flow acceptance testing.
- 30-per-page frontend pagination, latest 250 application limit; add server pagination if volume exceeds this range.

## Backend checks (read-only)
- Confirmed live `partners` and `partner_applications` columns exist and match UI fields.
- Confirmed scoped RLS policies `partners_manage_scoped`, `partners_staff_read`, `partner_applications_staff_read` on shared Supabase database.
- Confirmed existing `review_partner_application` stored procedure requires `partners.manage` and checks status/notes.
- No SQL migration, role change, partner insert, update, email send or file download was made during development.

## Release QA requirements (all items UNCHECKED)
See **[Single owner acceptance list](./REACT-OWNER-REVIEW-CHECKLIST.md)**, new **section 9أ**, plus release gates in section 0. In particular:
1. READY preview at **exact latest Git SHA**, no build/runtime errors.
2. Only authenticated AAL2 employees and per-action RLS-authorised users see partner/application data.
3. `partners.view` only displays details without any edit/update actions; `partners.manage` can perform approved test actions.
4. Verify AR/EN/mobile layouts, search, filters, pagination, dialog focus and session expiry.
5. Test a newly submitted **dummy** application from the public page into the inbox, then status review by a permitted employee; accepted application MUST NOT activate a partner or send email.
6. Confirm private PDF/product-list download on desktop and iPhone, blocked for unauthorized accounts.
7. Compare existing directory entries against the legacy page to rule out accidental data loss.
8. Test a narrowly authorised **test partner** edit, suspend/reactivate, duplicate slug and concurrent editing. Verify audit logs (and assess atomic audit RPC as a required prelaunch hardening fix).
9. Confirm no production Vercel project, domain or DNS changes.

## Limitations / deferred tasks
- Native Next app provides core partner admin, not partner *self-service* portal migration. Partner portal orders/products/availability/cancellations and financial settlements are separate follow-ups before domain cutover.
- No automated mail sends or Resend integration in this phase.
- Frontend 500/250-row caps and non-atomic partner audit need review if production scale/audit requirements grow.
- Preview has not been proven READY at the latest branch HEAD due to earlier Vercel daily free deployment quota; do not imply the pages are currently visible at `dear-day.com` or already owner-approved.
