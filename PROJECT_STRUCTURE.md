# Dear Day — Project Structure

This file documents the current canonical structure of the Dear Day codebase so new work updates existing files instead of creating duplicate versions.

## Canonical customer entry points

- `index.html` — Arabic home page
- `index-en.html` — English home page
- `Dear-Day-Auth.html` / `Dear-Day-Auth-en.html` — customer authentication
- `Dear-Day-Account.html` / `Dear-Day-Account-en.html` — customer account
- `Dear-Day-Bookings.html` / `Dear-Day-Bookings-en.html` — customer bookings

## Canonical customer flow pages

All customer flow pages live under `approved-pages/`.

- `Dear-Day-Occasions-Approved.html` / `-en.html`
- `Dear-Day-Birthday-Approved.html` / `-en.html`
- `Dear-Day-Gifts-Approved.html` / `-en.html`
- `Dear-Day-Cake-Approved.html` / `-en.html`
- `Dear-Day-Flowers-Approved.html` / `-en.html`
- `Dear-Day-Venues-Approved.html` / `-en.html`
- `Dear-Day-Details-Approved.html` / `-en.html`
- `Dear-Day-Cart.html` / `-en.html`
- `Dear-Day-Review.html` / `-en.html`
- `Dear-Day-Payment.html` / `-en.html`

Do not create `v2`, `v3`, `final`, `new`, `review`, or backup copies of these pages. Update the canonical file directly after QA.

## Compatibility redirect files — keep

These are intentionally small compatibility shims and should not be deleted unless every historic/internal link has been migrated:

- `approved-pages/Dear-Day-Auth.html` → redirects to `/Dear-Day-Auth.html`
- `approved-pages/Dear-Day-Details-en.html` → redirects to `Dear-Day-Details-Approved-en.html`

## Shared customer runtime

- `approved-pages/dear-day-cart.js` — shared customer bootstrap
- `approved-pages/dear-day-cart-core.js` — cart/header/shared customer behavior
- `approved-pages/dear-day-mobile-nav.js` — mobile navigation
- `approved-pages/dear-day-auth-state.js` — signed-in customer state/header account menu
- `approved-pages/dear-day-customer-availability.js` — customer availability/booking holds
- `approved-pages/dear-day-customer-refund.js` — refund-policy preview
- `approved-pages/dear-day-live-catalog.js` — live Supabase catalog for Gifts/Cake/Flowers
- `approved-pages/dear-day-home-categories.js` — home direct-category section
- `approved-pages/dear-day-supabase-config.js` — public Supabase client config

Before adding a new global customer script, check whether it belongs in the shared runtime above.

## Admin / Partner / Finance

Root HTML pages such as `Dear-Day-Admin*.html`, `Dear-Day-Partner*.html`, `Dear-Day-Finance.html`, and `Dear-Day-Notifications.html` are the canonical operational pages. Their logic lives in matching `approved-pages/dear-day-*.js` files.

## Assets

Reusable site assets live under:

- `approved-pages/assets/fonts/`
- `approved-pages/assets/home/`
- `approved-pages/assets/media/`

Do not add duplicate copies of the same asset under new versioned filenames unless the visual asset itself is intentionally different.

## Cache-busting policy

Query strings such as `?v=20261003-2` are cache-busting tokens, not duplicate files.

Rules going forward:

1. Never create copied JS/CSS files just to force cache refresh.
2. Update the existing canonical file.
3. Change the query-string version only when that asset changes.
4. Prefer one release/date token across related shared runtime files when practical.
5. Do not treat older query-string numbers as files that need deletion.

## Supabase migrations — append-only history

Everything in `supabase/migrations/` is database history and must remain append-only.

- Do not rename old migrations.
- Do not delete old migrations.
- Do not renumber old migrations, including existing duplicate numeric prefixes such as `002`, `003`, and `006`.
- Add a new migration for future schema changes.

## Separate parking project — do not touch

The Dear Day project shares a Supabase project with unrelated parking objects. Do not modify, delete, migrate, secure, or clean:

- `parking_layouts`
- `parking_layout_history`
- `backup_parking_layout()`
- any other parking-related object

## Cleanup rule

A file can be removed only when all of the following are true:

1. It is not referenced by any canonical HTML/JS file.
2. It is not a compatibility redirect.
3. It is not a Supabase migration/history file.
4. Its behavior has already been replaced by an active canonical file.
5. Production behavior is verified after removal.
