# Dear Day — Production Operations (2026-10-10)

## Live system

- Customer website: `https://dear-day.com` and `https://www.dear-day.com` → permanent 308 redirect to apex
- Vercel project: `dearday` (`prj_fnNDEBrRdFAYYhuI2wvZOLJDiZFb`)
- Application root directory within GitHub repository: `next-app`
- GitHub repository: `wigglewiggle716/dearday`
- Main code and Vercel production branch: `main` (deployed and verified 2026-10-10)
- **Release verified:** A `main` production deployment on commit `065797835c8aa7ddbdb7cd8a4f4c99c0bd2e2b26` was `READY` and directly served `dear-day.com` before the project was renamed.
- Historical HTML Vercel project (`prj_THPPUNzmy7g1wFTYcVPv1wCkf17F`) was deleted. The new React project (`prj_fnNDEBrRdFAYYhuI2wvZOLJDiZFb`) now uses the name `dearday`.
- Backend: existing Supabase project (`hpffdmldtdtwcaoemyso`). **Do not delete, recreate, or reset it.**

## Source archives

- `archive/legacy-html-2026-10-10` — final original HTML `main` before migration
- `archive/react-pre-cleanup-2026-10-10` — all React and legacy files before cleanup

Never redeploy an archive branch directly over the live custom domain. To restore a release, select an inspected, verified READY deployment or commit in the active Next.js project; test protected auth, payments state, and database compatibility. The former HTML Vercel project no longer exists.

## Operational safeguards

1. Keep Supabase roles, RLS, MFA policies, signing/redirect settings, and production data unchanged without a separate approved change.
2. Keep any `SUPABASE_SERVICE_ROLE_KEY` or email API key server-side only. Verify secrets in Vercel without exporting their values.
3. Current Paymob payment integration is **not active**. The payment page is presentation-only and must not assert a completed reservation/charge.
4. Verify partner, accountant and super admin auth/permissions after new production deployments.
5. Preserve Dynadot DNS and `info@dear-day.com` mailbox records. Switching the Vercel Git branch does not require DNS changes.
6. The React `next-app/public/approved-pages/assets` directory carries live static assets even though its path retains the old name; don't remove it until references and browser rendering have been audited.
7. The Next.js app `next-app/public/` may contain other legacy-named resources still referenced by the running app; handle them through a separate tested cleanup.
8. Keep historical checklists in the archive branches; use current operations documents for production work.
