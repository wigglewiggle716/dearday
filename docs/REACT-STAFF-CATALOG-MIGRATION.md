# Dear Day React — Products and Approvals (Staff Phase 3)

Prepared 2026-10-09 on **react-migration**, not on production `main`.

## Added
- Arabic: `/staff/catalog`, `/staff/approvals`
- English: `/en/staff/catalog`, `/en/staff/approvals`
- Shared components `next-app/components/staff-catalog.jsx` and `staff-approvals.jsx`, `next-app/lib/staff-catalog.js`, styling `next-app/app/staff-catalog.css`.
- Shared sidebar/workspace shows React catalog if `catalog.view` or `catalog.manage`, and React approvals only if `approvals.review`. Old HTML links to these two modules are removed from the React workspace.
- Supports reading available listings, their latest versions, published-version indicator, partner, category, kind, stock/capacity, price, filters and responsive AR/EN screens.
- `catalog.manage` may create an unpublished listing with a draft or submitted version, or append a new proposal version to an existing listing; publishing **always** requires separate approval.
- `catalog.view` without `catalog.manage` sees the catalog and version history read-only.
- Proposal payload validates numeric values, text name, partner/kind, HTTPS media list (up to 12 URLs) and stores `metadata.proposed` for deferred application.
- Catalog reviewer with `approvals.review` can compare a pending version against the published version, require a rejection note, and call the existing `review_listing_version` RPC for approval/rejection.
- Confirm dialog before any actual write or RPC that would change catalog entries; recheck active employee and permissions immediately before writes.
- All data access uses the public Supabase anon/publishable browser key with server RLS; no service-role secret. No new database grants or migrations were deployed.
- New staff routes remain explicitly `noindex`.

## Safety decisions
- The React catalog editor never directly updates `published_version_id`, published price or published descriptions.
- The reviewer RPC is an existing server-side implementation that checks `approvals.review`, locks the pending version and listing, applies approved `metadata.proposed`, records audit events, and rejects repeat review after status changed.
- New listing placeholders are inserted with `is_available=false` and no published version; the approval flow applies the proposed availability.
- Do not use *real* product changes for QA. Approved version publication is live database mutation; use designated test entries with owner approval.
- Current UI intentionally excludes destructive archive/delete actions and direct availability switches; their policy and operation flows need separate future migration.
- Reviewer UI compares status and current published version at load time; a just-in-time version re-fetch or stricter supersession policy should be considered before final production acceptance if multiple pending versions may exist.
- RLS is authoritative: UI controls alone do not provide a security boundary.

## Scale and UX limitations to review
- Catalog fetches the newest 500 listings and bounded batched histories (60 listing IDs per query, max 1,000 version rows per batch). For larger catalogs, server pagination/search and full history loading are still needed.
- Pending approvals fetch up to 200 pending versions, with 60-ID batches for related records. The UI discloses the cap.
- Full accessible dialog keyboard focus trap and live multi-user concurrency tests must be verified in browser.
- If new listing row insertion succeeds but version insertion fails, an unpublished placeholder can remain. Implement an atomic create-listing-with-first-version RPC before high-volume use if necessary.
- The current live Supabase database was inspected **read-only** for exact table columns, RLS policies, and `review_listing_version` function; no live rows were written.
- Browser/production build on exact latest Git SHA **has not been verified** because Vercel preview previously hit its free deployment-per-day quota.

## Owner sign-off
Every QA item, including this phase, is recorded centrally in **[REACT-OWNER-REVIEW-CHECKLIST.md](./REACT-OWNER-REVIEW-CHECKLIST.md)** sections 7–8. Do not mark items checked without the owner's actual review.

## Next internal modules
Partner management, customer management/support inbox, availability, cancellations/refunds, finance and settlements, partner internal portal; exact cutover scope is tracked centrally in the owner checklist.
