# OPS-04 payment verification — first implementation stage, 2026-10-08

Public collection remains OFF: create-intention returns 503 and all methods are false.
No real or provider sandbox payment has been initiated in this stage.

## Implemented

- Service-only private attempt/event ledger, RLS and no browser grants. One attempt
  per order, trusted totals/contact from stored guest order, guest-cookie ownership
  passed only by a trusted backend. Reserve-before-network prevents duplicate
  intention creation; ambiguous provider timeouts remain `unknown` for reconciliation.
- Test-only intention helper (sk_test only), bounded timeout and expiry, provider
  response bound to the attempt before client_secret may be returned. An existing
  ready/failed intention is reused. The helper is deliberately not connected to
  the public endpoint yet; live keys are rejected.
- POST /api/paymob/webhook verifies the documented SHA-512 HMAC with timing-safe
  comparison BEFORE database work. Query-string GET redirects never mark paid.
  Only signed fields are normalized. Raw payload, billing/card data, secrets and
  unsigned refund amounts/merchant extras/is_live are not stored or trusted.
- Match signed provider order id to the registered attempt; verify amount, currency,
  integration id and signed owner id against the stored server configuration.
  Unknown mappings and database failure return 503, enabling retry, not false ACK.
- Duplicate events are idempotent. Pending is not paid; later failure cannot undo
  payment. Success atomically confirms existing unexpired reservations and marks
  the order paid. Confirmed reservations already consume stock: NO extra decrement.
- Late success, missing reservation, mismatches, second successful transaction,
  refund/void/auth/capture/child callbacks enter review, without pretending to refund
  or fulfill unavailable stock. Review outcomes currently live in the private
  ledger + audit trail; a finance operations UI/alert is still needed before launch.
- Expiry worker cancels only expired pending checkout orders and pending partner
  orders, expires holds and clears reusable payment tokens. Paid orders are untouched.
  POST /api/maintenance/expire-checkouts is bearer-secret protected and bounded.
  It has NOT been scheduled or invoked against production business orders.

## Required configuration and remaining acceptance

Server secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PAYMOB_HMAC_SECRET,
CHECKOUT_MAINTENANCE_SECRET. Intention helper also needs the approved TEST secret,
card integration ID and signed owner ID. Never paste or commit secret values.
Vercel access was 403 in the preceding stage; availability of these env vars is
unverified. This stage does not modify credentials or enable live payments.

Before connecting create-intention: test the real guest-cookie ownership adapter,
sandbox account/integration/owner matching, provider HMAC fixture, callback routing,
intention expiry behavior and retries. Card-only acceptance first; source_data null
variants are currently rejected, so wallet compatibility requires a provider fixture.
Configure transaction processed callback URL in Paymob too (notification_url support
varies by payment method). Card token callbacks are unsupported and never processed.

Still required: verified sandbox end-to-end charge, guest payment-result/status page,
secure guest tracking/email, ambiguous-intention reconciliation, scheduled expiry,
refund/void initiation + reconciliation, review alerts/UI, provider logs, concurrency
load test, and explicit live activation only after acceptance. OPS-04 is NOT closed.
Current shipping/discount policy remains an unresolved launch decision (OPS-03).

## Evidence

`tests/ops04-paymob.cjs`: independent official concatenated HMAC fixture, tampered
amount/currency/success/owner/integration, malformed types/signature, unsigned fields
ignored, GET rejected, invalid callbacks cannot call DB, retry response on DB failure,
trusted intention payload, reuse, live-key gate and timeout ambiguity. No external
network requests in this suite.

`supabase/tests/ops04_payments.sql`: rollback fixtures, wrong guest denied, authoritative
amount, reserve idempotency, pending/failure/success, replay, confirmed reservation,
no double stock decrement, late failure, additional payment review, wrong amount,
currency/integration/owner, expiry leaves paid intact, late success, browser RPC denial.
Existing checkout and guest API tests also pass. No concurrent load test yet.

Official references retrieved 2026-10-08:
- https://developers.paymob.com/paymob-docs/intention-apis/create-intention
- https://developers.paymob.com/paymob-docs/developers/webhook-callbacks-and-hmac/hmac/hmac-transaction-callback
- https://developers.paymob.com/paymob-docs/developers/transaction-callbacks
