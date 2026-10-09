# Dear Day — React Staff Availability & Booking Operations (Phase 6)

Prepared 2026-10-09, on `react-migration` in `next-app/` **only**.

## Added pages
- Arabic: `/staff/availability`
- English: `/en/staff/availability`
- Component: `next-app/components/staff-availability.jsx`
- Scoped styling: `next-app/app/staff-availability.css`
- Shared bilingual route map and staff dashboard navigation updated. Legacy HTML page remains intact and available in old project.
- Both pages are marked `noindex`.

## Features
- Only authenticated, active employees with completed MFA and `availability.view` or `availability.manage` can access the staff interface; existing Supabase RLS is authoritative for all reads and writes.
- Reads listing names from actual `published_version_id` instead of assuming the most recently proposed version is published; loads up to 400 listings, names batched to avoid URL limits.
- Reads live `listing_availability_settings`, `listing_availability_windows`, `listing_availability_exceptions`, and upcoming `booking_reservations` (up to 150 in the initial viewer).
- Supports `date` and `time_slot` booking modes, opening toggle, slot/daily capacities, lead cutoff and temporary hold duration, Cairo timezone.
- Weekly schedule may contain **multiple windows per day**; editor preserves separate live windows, rejects overlapping or invalid hours, validates numeric limits. Disabled windows are not included in the next full replacement save.
- Staff with `availability.manage` can save schedule and settings via existing `save_listing_availability_config` RPC, which atomically replaces weekly windows and records an audit event.
- Read/write conflict risk: the UI re-reads live settings and window `updated_at` metadata before saving and blocks stale snapshots. **This is best-effort, not a database-level compare-and-swap**: there is a race between the re-read and the RPC. A transactional compare-and-swap server revision mechanism should be considered before rigorous concurrent production editing.
- Special dates can be created/edited with closed/custom hours/override capacity/notes through the existing `upsert_listing_availability_exception` RPC, and deleted through `delete_listing_availability_exception`, both checked by backend permissions and audited. The UI checks the target date/version before mutation to reduce stale overwrites.
- Read-only booking list distinguishes active and expired holds; expired holds excluded from active-hold counters. Does not create, modify, cancel or refund bookings.
- Read-only `check_listing_availability` RPC supports a date, optional time and quantity, and returns server-computed capacity/reason. The probe uses the saved mode (not an unsaved form change), in the `Africa/Cairo` timezone.

## Security & production safety
- All pages require an active Supabase employee account and appropriate read/manage permission (as checked by staff Auth and `get_my_permissions`).
- Writes re-verify current employee MFA/session and live `availability.manage`, show confirmation and call the existing secured RPC. There are no browser service-role keys or direct writes to reservation records.
- Only schema/policy and function definition introspection queries were executed in shared Supabase — no actual customer booking/hold, availability setting or exception was modified.
- No domain, GitHub `main`, production Vercel, Dynadot DNS or Resend change made.
- The preview build and authenticated browser QA remain outstanding until the correct branch SHA has a READY preview. Do not claim pages are production-ready.

## Identified limits and follow-up
- Up to 400 listings, 150 upcoming reservations per selected listing, with no server paging yet. Counters are **within those loaded 150** and not guaranteed full totals when overflow occurs. Complete pagination/aggregated counts if the scale warrants it.
- Schedule validation is client-side plus database constraints; some unsafe business transitions such as lowering capacity below a confirmed booking are not categorically prohibited by the existing RPC. Require a separate confirmed-reservations safety rule and approval before allowing such reductions in a live workflow.
- Existing customer bookings and payments remain untouched. A reservation is only considered active if status is confirmed or a nonexpired hold.
- External partner's self-service availability page is **not yet migrated**; this is employee management only.

## Owner review
Central cumulative checklist: [REACT-OWNER-REVIEW-CHECKLIST.md](./REACT-OWNER-REVIEW-CHECKLIST.md), section **9د** (20 QA cases). All checkboxes remain unchecked until owner tests. Use only designated test listings/dates for write tests, with explicit approval.
