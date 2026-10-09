# Dear Day — React cutover readiness (prepared 2026-10-09)

## Non-negotiable guardrails
- Work only in GitHub `wigglewiggle716/dearday` branch `react-migration`, `next-app/`.
- Current public website: `https://dear-day.com` on Vercel project **dearday** (`prj_THPPUNzmy7g1wFTYcVPv1wCkf17F`). Keep this untouched until final owner approval.
- New Next.js preview: `dearday-react-migration` (`prj_fnNDEBrRdFAYYhuI2wvZOLJDiZFb`), `https://dearday-react-migration.vercel.app`. This is a separate deployment project.
- Current Vercel domain mapping (read-only audit): `dear-day.com` on old project; `www.dear-day.com` on old project redirected with HTTP 308 to apex.
- The domain's DNS is managed through Dynadot, with web A and WWW routing configured. Email incoming mailbox `info@dear-day.com` must remain working.
- Resend outbound domain verification is independent of switching Next.js website hosting and is **not** a cutover blocker. Never change MX for the apex or delete Dynadot web/DNS records while preparing React.
- Do not change live `main` deployment, domain attachment, Auth settings, employee roles, or SQL while simply preparing.

## React route inventory
- 27 Arabic page entries in `next-app/app/(ar)/` and 27 English page entries in `next-app/app/(en)/en/` (count includes the single-segment preview fallbacks). Route file presence is **not** equivalent to feature or design acceptance.
- Customer routes to smoke-test (both locales): home, gifts, cake, flowers, venues, occasions, birthday, details, cart, review, payment, about, how-it-works, partners, faq, contact, privacy, terms, refunds, auth, register, account, bookings, delete-account.
- Staff-only routes: access, security (TOTP enrollment and verification), staff-permissions; each has Arabic/English counterparts.
- Current staff and partner operational portals on the old website have **not yet been completely migrated into React**; the React access page links to the old portal in a separate domain/session. Cutover cannot assume these legacy HTML pages will continue to be reachable after moving the custom domain. Decide whether to port admin/finance/partner portals or retain them under a protected separate hostname **before** switching `dear-day.com`.

## Confirmed release blockers / checks
1. **Latest build mismatch:** at the time of this check the newest GitHub commit was not the last READY Vercel deployment. Confirm a READY deployment at the exact approved Git SHA, with successful build logs.
2. **SEO gated:** Arabic and English React root layouts explicitly set `robots: {index:false,follow:false}`; some page-specific metadata repeats noindex. Keep this on preview. Before public launch, replace preview-only descriptions, deliberately enable indexing for public pages, keep all private/account/admin pages noindex, generate sitemap/robots, canonical URLs and Arabic/English alternate links.
3. **Browser QA:** Confirm desktop/mobile RTL/LTR consistency, auth state, cart persistence across pages, product add/remove/quantity, login, registration, OAuth/recovery, order creation, payment behavior, guest checkout, partner inquiry and staff access.
4. **Backend:** verify live catalog/order operations with RLS and user scoping; do not send fake payment or emails to real customers. Verify production environment variables/server secrets are configured on the intended Next.js project only.
5. **MFA:** all employees, including future accountants, must use MFA. The universal AAL2 SQL migration file is **STAGED, NOT APPLIED** because live Supabase is shared. Enroll staff and test before applying.
6. **Email:** Resend domain verification (DKIM, SPF, Return-Path) can finish separately. Configure API key as a server-only environment secret and implement an idempotent transactional-email queue only after domain verification and approval. Never store that key in browser code.
7. **Vercel preview protection:** The React project currently reports Vercel SSO protection. Owner browser review may require an authenticated Vercel session. Do not remove preview protection automatically.

## Cutover sequence — requires explicit owner approval
1. Agree on precise release SHA and freeze the React release candidate (no parallel changes).
2. Test all customer, staff/partner, finance routes and backups; compare to old site. Record failures and fix before switching.
3. Prepare working canonical, hreflang, sitemap and production metadata at cutover without prematurely indexing a preview.
4. Capture old project deployment ID and verify a rollback path. Confirm that the old project stays intact and accessible if the domain is removed from it.
5. Configure approved hostname plan for legacy staff/finance/partner portals, or finish their migration into Next.js. Test both before switching apex.
6. In Vercel, detach `dear-day.com` from **old** project and attach to **React** project, keeping the original Dynadot A/WWW web DNS and the root mailbox MX unchanged if routing requirements remain the same. Confirm DNS/SSL verification; avoid applying this during live customer orders.
7. Recreate `www.dear-day.com` on the React project as a 308 redirect to the apex (or equivalent); double-check 301/308 semantics.
8. Update approved Auth redirect URL allowlist/OAuth callbacks in Supabase for the public hostname, test password reset and OAuth sign-in; ensure no staging URL leak.
9. Verify HTTP status codes, canonical tags, robots, sitemap, navigation, cart, checkout, customer/partner/admin sessions, transaction alerts and mailbox delivery at both apex and www.
10. Keep existing Vercel legacy deployment intact for a fast rollback by moving the domain back if a critical regression occurs. Record cutover timestamp and incident owner.

## What can be done while Resend is pending?
- Prepare migration QA matrices and a full redirect/SEO plan.
- Bring Vercel Next.js preview up to the latest React commit and validate build.
- Finish and test admin/finance/partner route separation.
- Stage and review public SEO metadata and server-side Resend integration, without enabling emails or changing production configuration.
- Reserve the actual domain handover, final MFA enforcement and transactional send activation for controlled owner-approved checkpoints.
