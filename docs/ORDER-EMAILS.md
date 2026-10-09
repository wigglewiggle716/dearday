# Dear Day — Order email integration (React deployment and E2E verification pending)

## Guarantee
- Source of truth: `public.orders.status` in Supabase, not browser checkout arguments.
- Exactly one `payment_received` outbox record per order (unique order/kind).
- Outbox trigger fires only when server-verified Paymob transaction changes order to `paid`.
- A receipt says payment was received; **it does not say the booking is confirmed**.
- Reads customer email from stored checkout contact, falling back to Supabase Auth email for signed-in orders. Guests do not need accounts.
- Resend receives authoritative order number, amount, currency and occasion date from DB.
- Private outbox, service-role RPC only. Admin UI must use server-side authorized API.
- Resend Idempotency-Key stable per order; server leases prevent concurrent send workers.
- Retried pending/failed sends and expired leases are claimable. Uncertain results beyond 23 hours or five attempts require manual review rather than potentially duplicating email. Successful sends are never requeued by duplicate callbacks.

## Added on `react-migration`
- `supabase/migrations/20261009_order_payment_email_outbox.sql` — private ledger, paid-status trigger and service-only claim/settle RPCs.
- `next-app/lib/order-email-dispatch.cjs` — server-only shared Resend worker; `lib/order-email-dispatch.js` is a compatibility wrapper for the legacy Vercel API.
- `next-app/app/api/maintenance/order-emails/route.js` — protected Next.js dispatcher endpoint (no production cron).
- `next-app/app/api/paymob/webhook/route.js` — signed Paymob callback route for Next; shared DB confirmation and outbox delivery logic, with a local verified HMAC implementation.
- `api/paymob/webhook.js` — after verified `paid`, best-effort immediate dispatch; never compromises callback acknowledgement on email failure.
- `api/maintenance/send-order-emails.js` — POST worker protected by `Authorization: Bearer <ORDER_EMAIL_DISPATCH_SECRET>`.
- `tests/order-email-dispatch.cjs` — deterministic mock-based test: `node tests/order-email-dispatch.cjs`.
- Resend template **PUBLISHED**: `Dear Day – Payment Received (English)`, alias `dear-day-payment-received-en`, ID `29809617-7af9-4831-89d9-bd84c52c2b76`.
- `supabase/migrations/20261010_staff_order_email_monitor.sql` — AAL2 + orders.manage RPC for email status and strictly safe/manual retry.
- `next-app/app/(ar)/staff/order-emails/page.js` and English equivalent; `next-app/components/staff-order-emails.jsx`, dedicated CSS; linked from staff workspace and orders.

## Activation prerequisites — DO NOT skip
1. **COMPLETED 2026-10-10:** `order_payment_email_outbox` applied to the existing Supabase database; migration recorded as `20261009211220`. Verified: outbox table present, RLS enabled, paid-status trigger present, anonymous/authenticated roles cannot read or claim the outbox, service role can claim/settle, and a no-op claim returns `[]`. At the time of verification, there were zero paid orders and zero queued emails. Database changes do not enable sending.
2. **COMPLETED:** The branded Payment Received template is published in Resend.
3. **CONFIGURED on the isolated React Vercel project:** the following server-only environment variables were added (sensitive values never exposed in docs):
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (configured).
   - `RESEND_API_KEY` (sending-only, domain restricted; no client access).
   - `RESEND_ORDER_PAID_TEMPLATE_ID=dear-day-payment-received-en`.
   - `RESEND_ORDER_EMAILS_ENABLED=true` (saved on React Vercel project; **not effective on existing deployment until a successful new React build**).
   - `ORDER_EMAIL_DISPATCH_SECRET` strong independent random token.
4. **PENDING — Vercel returned a 402 daily deployment-quota block (100/day)** during the attempt to deploy the latest React commit with the new settings. No redeploy succeeded and the primary `dear-day.com` site was not altered. Once quota resets, deploy only project `dearday-react-migration`, and verify correct commit and env values. Verify Paymob sandbox is configured and the trusted payment webhook is in the actual deployed runtime. Currently the public create-intention endpoint responds `PAYMENTS_NOT_READY`. No live card charges or order/payment emails can occur until the checkout gateway is enabled.
5. Arrange protected worker scheduler to POST the maintenance endpoint (for retries). Do not schedule before approval; no cron is included in this branch.
6. End-to-end sandbox acceptance: a real signed successful callback -> DB status paid -> exactly one outbox record -> one Resend delivery with exact trusted totals; duplicate callback -> no extra email; bad callback -> none; refunded/cancelled/review payment -> none; provider failure -> retry record; successful reply reaches Dynadot.
7. **STAGED:** bilingual Order Emails admin list (accessible only via `orders.manage`) and manual requeue. RPC gates require verified AAL2, active permission, and mask recipient addresses. Manual retry allows only definitely-unsent failed messages (`RATE_LIMIT`/`PROVIDER_REJECTED`), at most twice; ambiguous transport failures cannot be manually replayed. Retry is **queued**, not sent immediately. Full failure alerting remains for a later step.
8. React `next-app` still contains a payment UI preview only. The signed Paymob callback endpoint exists, but no payment initiation or checkout adapter is enabled yet. Complete sandbox intention/checkout acceptance before switching deployment.

## Important operational notes
- **The Resend template is published and the React Vercel env flag is `true`, but the new deployment was blocked by Vercel quota. No live end-to-end automatic email was verified, no DNS edits, and no customer email was sent as part of this integration work. The original production site remains untouched.**
- Do not accept recipient, amount, order id, or email template variables directly from the browser.
- Never expose the Resend API key, the Supabase service-role key, or worker token in client code.
- The idempotency header reduces duplicates; no email provider can promise perfect exactly-once delivery across arbitrary prolonged outages. Investigate aged uncertain deliveries rather than automatically replaying indefinitely.
