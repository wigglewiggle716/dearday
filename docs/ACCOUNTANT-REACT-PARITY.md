# Accountant dashboard parity — Dear Day React

## Objective
Keep the approved original accountant identity from `Dear-Day-Staff.html`, without removing newer React features or touching the static production site.

## Implementation
- Restored original accountant header: title, description and staff email.
- Restored **role-gated** Orders, Partners and Finance shortcut buttons, including burgundy primary Finance CTA. They remain accessible on mobile (the legacy site hid them).
- Kept 4 accountant financial metric cards in legacy order: unsettled partner net, draft, approved and paid.
- Restored **Recent Settlements (6)** before **Recent Orders (6)** with period, partner, status translated and colour-coded, and the reference, linking to full React finance and order pages.
- Kept React's fixed 260px burgundy sidebar, Arabic/English, responsive drawer, permission guards, details dialogs, filters, external payment confirmations, and settlement lifecycle RPCs.
- Accountant-specific CSS does not change Super Admin and other staff layouts.
- Exact totals now come from `public.staff_finance_exact_totals()` with active `finance.view` and AAL2 check. The database computes the complete totals, not first 600 list rows.
- The finance table still caps at 600 rows for listing/interaction and explicitly labels limited lists. **If exact totals aren't available, show an em-dash and a warning rather than misleading partial amounts.** Live sandbox has no orders or settlements yet.
- Function is read-only; no privileges, settlements, account roles or original static site files were changed.
- Both branches of accountant dashboard retain the same Supabase data source.

## Verification
- [x] Legacy and React code compared.
- [x] Accountant role permissions inspected: `dashboard.view`, `finance.view`, `finance.manage`, `orders.view`, `partners.view` (and `audit.write`).
- [x] Shared DB finance aggregation RPC deployed, anonymous access denied and no-auth calls rejected with `FINANCE_OVERVIEW_ACCESS_DENIED`.
- [x] Static regression assertions added: `node tests/react-accountant-parity.cjs`.
- [ ] Next.js production build successful and deployed to isolated React project.
- [ ] Manual screenshot approval: account-holder Arabic and English desktop/mobile.
- [ ] Accountant signed-in browser test with real settlement data and 600+ rows before large-scale operations.
- [ ] True funds transfer integrations and maker/checker approval separation are separate future business controls.

**Do not deploy changes from the React branch to the primary static `dear-day.com` Vercel project.**
