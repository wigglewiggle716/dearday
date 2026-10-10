# Dear Day — Final Cutover Preparation Audit (2026-10-10)

## Business request and boundaries
The owner completed a manual side-by-side review of the React site on 2026-10-10 and requested a **complete transition away from the legacy HTML website**. This acknowledges the appearance/visual review; it **does not prove transactional payment, data privacy, SEO, backend endpoints, or full staff/partner functionality**. Release is subject to the blockers below.

No `dear-day.com` domain changes, deletion of the old Vercel project, GitHub `main` updates, Supabase SQL writes, changes to real users/orders or Dynadot DNS were performed as part of this audit.

## Snapshot
- Old live project: `dearday` (Vercel `prj_THPPUNzmy7g1wFTYcVPv1wCkf17F`).
  - `dear-day.com` mapped and verified here
  - `www.dear-day.com` redirects HTTP 308 to the apex, on this same old project
- New React project: `dearday-react-migration` (Vercel `prj_fnNDEBrRdFAYYhuI2wvZOLJDiZFb`).
  - `dearday-react-migration.vercel.app` attached here
  - Latest observed `react-migration` HEAD before redirect preparation was `47ea499bcf5835956d7c49afdb44aa731eb8c6ef` at status `READY`.
  - Redirect staging introduces an additional commit. Verify a fresh `READY` status at the **exact final release SHA** before cutover.
- The React project's Vercel variable *names*, inspected with decrypted values **disabled**, include `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `ORDER_EMAIL_DISPATCH_SECRET`, `RESEND_ORDER_PAID_TEMPLATE_ID`, `RESEND_ORDER_EMAILS_ENABLED`. **No Paymob intention credentials, HMAC secret, or checkout expiry secret were present** in the inspected production/preview environment metadata.
- Supabase currently exposes checkout server RPCs such as `quote_guest_checkout`, `prepare_guest_checkout`, `allow_guest_checkout_attempt`, `expire_checkout_orders`, `reserve_guest_payment`, `bind_payment_intention`, and `process_paymob_event`; SQL functions existing is not proof the Next UI invokes them.

## Critical transactional gap — do not cut over without explicit scope choice
- `next-app/components/payment-page.jsx` is a deliberately **non-operational preview**. Both `card` and `wallet` options are display-only, and the `Pay` button is explicitly disabled. It does not call `quote_guest_checkout`, `prepare_guest_checkout`, or a payment intention API.
- The React project includes `/api/paymob/webhook`, but the webhook requires `PAYMOB_HMAC_SECRET` and fails closed (503) without it. A webhook alone does not initiate a payment. React has no `/api/checkout/guest`, `/api/paymob/create-intention`, `/api/paymob/methods`, or `/api/maintenance/expire-checkouts` route at audit time.
- The legacy site had a guest checkout API and a test-only checkout quote/temporary reservation flow, **but Paymob collection in legacy is also disabled** (legacy `api/paymob/create-intention.js` returns 503, payment methods false). The owner needs to choose whether the initial public launch should remain **non-paying, same as legacy** or require **full, sandbox-accepted live card checkout and real order processing before domain change**.
- In either case, call it what it is: a display-only payment UI does **not** constitute full functional backend parity. A production storefront accepting paid orders needs completed amount/stock server recalculation, guest idempotency, secure Paymob intention, signed webhook, expiry jobs, status page, and test-paid transaction reconciliation.

## SEO blocker
- Both Next layouts use `robots: {index:false,follow:false}`; many *public* page files also override metadata with `robots: {index:false,follow:false}`. Removing only root noindex would not fix these page-level flags.
- Stage production-only public canonical, hreflang, robots/sitemap and clear indexability, while **keeping private paths noindex**. Preview must stay noindex.
- Set the public site metadata/URL to `https://dear-day.com` only in the authorized release, not as a premature preview claim.

## Legacy bookmarks — staged on React branch
- `next-app/next.config.mjs` now includes **71 exact legacy HTML → corresponding React path redirects** (Arabic/English store pages, account, staff, partner and notifications). They do not touch the live HTML project until the hostname moves.
- Ensure old stored/emails/social deep links work, and verify the intended 308 redirects do not create loops or break OAuth callback routes. Existing HTML files remain present and no legacy deployment is deleted.

## Auth, money and rollback
- The same existing Supabase project serves new and old sites. Validate Google/Facebook/Apple OAuth redirect URI allowlists, password recovery, customer session, active partner scoping, staff AAL2/MFA and RLS after hostname switch.
- Account deletion, email sending and business notifications have pending operational acceptance. Do not send test emails to actual customers.
- The owner chose **to preserve existing `finance.manage` settlement permissions**; do not change them during cutover.
- Before cutover, record the old deployment URL/ID and prepare a reversible domain switch; do **not** delete the old project or change MX records for `info@dear-day.com`.
- Freeze the final release SHA. Confirm latest `READY`; run customer/staff/partner AR/EN/mobile tests; then detach apex/www from legacy and attach both to Next, preserving WWW→apex. Keep rollback available and monitor immediately after.

## Release decision still required
**Will the launched React storefront continue with online payment unavailable (as on the original HTML site), or must real payments and real order creation work on launch day?** Do not change the domain until this decision and the appropriate acceptance criteria are confirmed.
