# Dear Day React — Owner-approved planning and package fixes

Implementation date: 2026-10-10. Scope: `react-migration` branch only. Live `main`, production Vercel, `dear-day.com`, DNS, authenticated Supabase records and checkout/payment infrastructure were **not** changed.

## Owner's six review items

1. Cake & Chocolate: footer custom-design section headline changed to Arabic **تصميم مخصص** and English **Custom Design**, retaining the existing upload/dialog function and copy.
2. Flowers: sidebar filter fields replaced browser-default selects with the common branded accessible `BrandedDropdown`, using Dear Day burgundy `#6B3540`, RTL/LTR direction and focus states. **Owner follow-up:** restore an independent keyboard/touch scroll navigator constrained to viewport height with a visible burgundy scrollbar; dropdowns render in flow within that scroll panel. Bottom custom-flowers image/copy layout reversed for desktop and responsive mobile.
3. How It Works: Arabic final prompt now reads **جاهز تبدأ ؟** (Arabic question mark separated by one space); English unaffected.
4. Home planner: selecting an occasion, Cairo/Giza, date and budget starts `/birthday?flow=1&occasion=...&area=...&date=...&budget=...` (and `/en/birthday`) **directly**, without asking to choose an occasion twice. Original Occasions directory remains accessible for visitors starting there.
5. **Updated after owner review:** The package-selection toast/message was removed completely (including its seven-second timer and old CSS). Selecting a package updates the shared cart and journey with **no popup**.
6. **Real available packages:** replaced all 15 hard-coded ID/name/price mock packages with up to **15 category recipe combinations** computed from currently published/available `loadPublicCatalog` records. Includes live Gifts, Cakes, Flowers, and **published venues/experiences if they exist** (accepted live category slug variants). Selection uses permanent `listing_id`, partner_id, and current published price/name, and avoids duplicate item combinations.

### Cart and journey correctness
- `CartProvider.applyPackage(pkg)` atomically removes rows originally inserted by the previous selected package only; manually selected items are preserved. New package gift/flower/cake rows have the same real listing identity as normal category product cards; venue preference is stored separately under `dearDayPlan.venueSelections` until real availability and booking verification exists.
- Clicking Next from planning stores the complete selected service list and goes to the first selected step with `?flow=1`. If there are cart items from a chosen package, `fromPackage=1` automatically shows the shared cart drawer on the first category page, where a **Next** link now leads to the following selected step.
- All category pages (Gifts/Cakes/Flowers/Venues) now render a common selection/Next dock inside `?flow=1`, and the regular `PlanningStepper` remains visible.
- The published-venue page restores true selected venues from package choices **only after catalog loading**; old static venue previews remain visibly browsable but are never inserted into live packages, cart or confirmed booking.
- Preserves the previously selected real package across revisiting the planning page, while treating old mock package IDs and items as invalid. No active customer order, payment or hold is created.

### Important limitations
- The 15 *recipes* are not 15 guaranteed available bundles. Only recipes for which **every required category has a live published/available listing** are displayed. When the selected budget has no matching genuine package, display an honest empty result, not a fabricated entry.
- No current payment amount is authoritative before the server-side Checkout revalidates stock, published price, area, date, inventory/availability and bookings; that end-to-end checkout is a separately documented migration blocker.
- Venue listing selection is only a **preference**, not a venue booking, reservation hold, or a purchased line item. The current production venue catalog may have no published venue inventory; this cannot be substituted with `venuePreviews`.
- `is_available`, `stock_qty`, `capacity_per_day`, partner activity and `published_version_id` are used by catalog read; day/time capacity is **not confirmed** without the server-side scheduling/checkout API.
- Browser / Playwright QA required on an exact-SHA READY Vercel Preview. Review Arabic+English, desktop+mobile, manual cart items, multiple package switching, venue scenarios, date/budget state, double clicks, back/forward and cart drawer Next.

## Release gate
**This is code implementation, not an owner-approved or fully tested deployment.** Everything must be reviewed under the single [Owner Review Checklist](./REACT-OWNER-REVIEW-CHECKLIST.md), section **9ي** (29 additional unchecked test items). Never push these changes to production `main` or link the apex domain without explicit owner authorisation.

## Vercel build errors — owner review follow-up

Three intermediate deployments at commits `eeb44e01`, `72332b96`, and `6c80f020` have `ERROR` with `npm run build exited with 1`. Git history shows that in those commits, `birthday-planning.jsx` still imported `PACKAGES` from `planning-packages.js` after the old `PACKAGES` export was removed. This is a verified static import/export incompatibility and a plausible cause of the observed failures; deployment-specific logs were not accessible (Vercel API 403) to confirm the precise log line. Later revisions changed the importer to `composeLivePackages` and subsequent Vercel deployments are `READY` at newer intermediate SHAs, but **the current branch HEAD still needs its own READY build and authenticated browser QA**.

The latest user requests were implemented in code on `react-migration`. The production apex `dear-day.com` and its original Vercel project were not changed.
