# Dear Day — Production Website

**Live domain:** https://dear-day.com  
**Active app:** `next-app/` (Next.js / React)  
**Backend:** existing shared Supabase project  
**Hosting:** Vercel project `dearday` (project ID `prj_fnNDEBrRdFAYYhuI2wvZOLJDiZFb`)  
**Primary development branch:** `main` (production; verified 2026-10-10)

The legacy HTML website was decommissioned from Vercel on 2026-10-10. Its source and the complete pre-cleanup repository state remain archived in these read-only Git branches:

- `archive/legacy-html-2026-10-10` — original HTML website, before React migration.
- `archive/react-pre-cleanup-2026-10-10` — full repository before removing legacy files.

## Local development

```sh
cd next-app
npm install
npm run dev
npm run build
```

Environment values should be provisioned as protected Vercel variables. Never commit production secrets or embed the Supabase service-role key in browser code.

## Operating notes

Read [production operations](docs/PRODUCTION-OPERATIONS.md), [security/authorization](docs/OPS-02-authorization.md), [order integrity](docs/OPS-03-order-integrity.md), and [payments](docs/OPS-04-payments.md).

Do not reintroduce the old root HTML pages, `approved-pages/`, legacy `api/`, or `vercel.json` into the production build. Their last state is available in the archive branches.

**Important:** Paymob payment capture is not enabled by this migration. A successful display of the payment UI is not a completed payment or a confirmed order.
