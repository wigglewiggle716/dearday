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

## Privacy policy migration — 2026-10-09

- Added `/privacy` and `/en/privacy` as server-rendered React pages, using the
  existing shared header, footer and language navigation.
- Both sets of 12 sections and the original September 30, 2026 update date are
  preserved from the live `/privacy` and `/privacy-en` content. Live page bodies
  matched the current `main` source at `5d97cc4`; the cookies update is included.
- Scoped responsive legal styling mirrors the original layout. Section anchors
  clear the sticky header; the desktop contents panel can scroll on short screens.
- Verified: production build, rendered content parity for both languages, 1440px,
  390px and 320px widths without horizontal overflow, section navigation,
  language switching with the section fragment, contact links and footer return.
- Browser checks ran locally with catalog requests mocked and external font loading
  replaced by the existing local Arabic font; no production data was written.
- Changes are limited to `next-app/` on `react-migration`; no production deploy or
  changes to `main`. Terms, refunds and account/data-deletion remain separate steps.

## Terms and conditions migration — 2026-10-09

- Added `/terms` and `/en/terms` using the shared legal styling and site layout.
- Preserved all 16 sections and the October 2, 2026 update date from the live
  policies, whose page bodies match the approved source files in the repository.
  No legal wording changes were made; Arabic/English content was reviewed together.
- Localised contact and refunds links use the React route map. Refunds still uses
  the migration placeholder until its separate page migration is completed.
- Passed the production build and local browser checks for both languages at
  1440px, 390px and 320px: source text parity, section anchors, no horizontal
  overflow, language switching with section fragments, contact navigation and
  footer return. Visually inspected desktop and mobile screenshots in both languages.
- Test catalog responses were mocked and the existing local Arabic font substituted
  for external font loading. No production writes or deployment operations.

## Cancellation and refund policy migration — 2026-10-09

- Added `/refunds` and `/en/refunds` with the shared legal layout and site navigation.
- Preserved the approved wording of all 10 sections and the October 2, 2026 date.
  Live page bodies matched the approved source files when the migration began.
- Existing footer and Terms links now open the completed React policy; Contact Us
  links resolve to the corresponding language. No cancellation/payment logic changed.
- Integrated the latest React work through `f1f7e7b` before final verification.
- Production build passed. Local browser checks passed in both languages at 1440,
  390 and 320 pixels: rendered text parity, no horizontal overflow, anchors,
  language switch with fragments, contact/footer round trips, and Terms navigation.
  Catalog responses were mocked and local Arabic fonts used for visual inspection.
- Only migration page files and this log were changed; no production writes or
  deployment operations. Account/data-deletion page migration remains separate.

## Account and data deletion instructions — 2026-10-09

- Added `/delete-account` and `/en/delete-account`, preserving the repository's
  original five informational sections and October 3, 2026 date.
- Shared header/footer and scoped legal styling; links point to localised React
  account and privacy routes. Existing authenticated account deletion requests and
  administrative review remain unchanged. No immediate-delete action was added.
- Build and local browser checks passed for Arabic/English at 1440, 390 and 320px:
  source content parity, no horizontal overflow, language switching, privacy/footer
  navigation and account CTA. Desktop/mobile screenshots inspected.
- External catalog requests mocked and local Arabic fonts used during checks.
  No request submitted, real account deleted, or backend behaviour certified by
  these page checks. Live HTML fetch was unavailable; repository source was used.
