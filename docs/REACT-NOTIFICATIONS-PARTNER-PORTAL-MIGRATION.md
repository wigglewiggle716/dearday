# Dear Day — React Notifications & Partner Portal (Phase 9)

Date: 2026-10-10. Prepared on `react-migration` only. Live site `dear-day.com`, production Vercel, GitHub `main`, Supabase data/roles, Dynadot DNS and Resend were not modified.

## Notifications — migrated React UI
- `/notifications`, `/en/notifications`; shared `next-app/components/notifications-center.jsx` and `next-app/app/notifications.css`.
- Only authenticated active account owner sees their records from `public.notifications`, filtered by `recipient_user_id=auth.uid()` and backed by `notifications_self_read` RLS.
- `mark_notification_read` and `mark_all_notifications_read` RPCs update **only the authenticated recipient** and require an active account (verified read-only against existing private SQL definitions).
- AR/EN title/body fallback, Cairo timestamps, 30-record incremental loading, unread view, role-specific React deep links for supported entity types.
- Linked from authenticated web account menu, staff administration modules, and the React partner portal sidebar.
- The legacy notification unread badge/real-time count is **not migrated** yet. Owner checklist tracks this explicitly. Click-through to a specific ticket/application currently opens the correct React section, not the individual detail anchored at the ID; test deep-link expectation before release.
- No notifications sent, marked read or modified during coding.

## Partner portal — new bilingual routes
| Arabic | English | Scope |
|---|---|---|
| `/partner` | `/en/partner` | Partner overview |
| `/partner/orders` | `/en/partner/orders` | Partner orders/details/status |
| `/partner/products` | `/en/partner/products` | Catalog versions and inventory |
| `/partner/availability` | `/en/partner/availability` | Scheduling, exceptions and holds |
| `/partner/refund-policies` | `/en/partner/refund-policies` | New partner/listing refund policy drafts |
| `/partner/cancellations` | `/en/partner/cancellations` | Cancellation read-only status |

- Shared `partner-portal-base.jsx` checks current `partner_user` account, active `partner_users` memberships, and `partners.status='active'`. Multiple partner selection is supported by active memberships.
- Signed-in `partner_user` now routes to `/partner` through `destinationFor` and Account Gateway instead of opening the old HTML portal via a separate domain session.
- All partner routes are `noindex` with Dear Day burgundy brand palette and responsive Arabic RTL/English LTR shell.
- `PartnerOrdersPanel`: `partner_list_orders`, `partner_get_order_detail`, `partner_update_order_status` RPC. Orders are filtered to the selected member partner. Backend locks/verifies order ownership and legal transitions; frontend confirms writes, checks active membership and refreshes current state. No real orders changed.
- `PartnerProductsPanel`: only listings with selected `partner_id`; version history and category listing are read under RLS. `partner_submit_listing` creates a draft or a pending proposal, never edits published version directly; `partner_set_inventory` is an **immediate** live availability/stock change requiring an explicit confirmation.
- `PartnerPoliciesPanel`: filter policies to active platform-approved or selected partner/listing records; `submit_refund_policy` for `partner` and `listing` only, with validation, never approve/activate from partner role. Backend guards require active membership.
- `Partner Availability`: shares the proven staff availability schedule editor and booking viewer with an explicit partner mode. Lists only selected partner's listings and checks active member and partner state before any setting/exception write. Uses the existing `save_listing_availability_config`, `upsert_listing_availability_exception`, `delete_listing_availability_exception` and `check_listing_availability` RPCs. RLS and `private.can_manage_listing_availability` are authoritative. No live schedule updates performed.
- `Partner Cancellations`: read-only `partner_list_cancellations` RPC and clear fulfilment instructions. **Limitation:** current RPC does not return `partner_id`. If a user is attached to multiple partners, this React screen intentionally does **not** display a misleading per-partner list. This must be solved with a separately reviewed backend change before multi-partner approval; existing one-partner member cases are supported.
- All write operations must be tested on *designated dummy data only* with separate owner approval. No data was written while preparing phase 9.

## Remaining gaps / release gates
1. A **successful READY Vercel preview at the exact latest Git SHA** and authenticated browser testing are still required. A GitHub commit is NOT a successful build or owner approval.
2. Partner-orders RPC and cancellation RPC can return all authorized memberships; the React orders page filters selected partner; the cancellations multi-member experience remains blocked pending an explicit server response field.
3. Portal view count and product loading currently have bounds; add server-side pagination/aggregation if volume exceeds 300 listing records or version queries.
4. The availability RPC does not server-side guard reduction below confirmed reservations. Define and test confirmed-booking protections before activating real partner schedule changes.
5. Inventory immediate changes and partner payout/status transitions must pass role/RLS/integration checks; no production partner/customer data mutations are authorized for QA.
6. Critical in-app notification click-through/legacy badge parity needs visual testing and targeted fix-ups.
7. Verify role-based entry, logout/login persistence, multi-partner switching, keyboard/dialog accessibility, and AR/EN/mobile parity.
8. Complete remaining old HTML admin links, staff audit history, security/finance gates, Paymob payment reconciliation, and Resend sending verification before live apex cutover.

All Phase 9 items are recorded, **unchecked**, in [the master owner review checklist](./REACT-OWNER-REVIEW-CHECKLIST.md), sections 9ح and 9ط. Never call the phase user-approved or deploy to production without signoff.
