# Cloudflare Workers deployment (two Next.js apps)

> **Status: build-validated deployment configuration.** Both frontend and backend OpenNext builds passed GitHub Actions on the current branch. Production still requires setting the Cloudflare environment variables listed below and smoke-testing the deployed URLs.

This repository contains **two independent Next.js 16 apps**. Cloudflare Pages static deployment with `npx wrangler deploy` from the repository root will not work. Deploy each app as a **Cloudflare Worker with OpenNext**, with separate Worker projects pointing to the same GitHub repository.

## Build validation

GitHub Actions has successfully installed dependencies and built both `frontend/` and `backend/` for Cloudflare Workers. The Cloudflare adapter and Wrangler are declared in each app's `package.json`.

## Cloudflare dashboard: create two Workers (not Pages)

Use **Workers & Pages → Create → Worker → Import Git repository** (wording may vary). Use the same repository, `paran87/myFirstWebsite`, for both Workers.

| Setting | Public frontend | Admin/backend |
|---|---|---|
| Worker name | `myfirstwebsite-frontend` | `myfirstwebsite-backend` |
| Production branch | `main` (after merge) | `main` (after merge) |
| Root directory | `frontend` | `backend` |
| Build command | `npm run cf:build` | `npm run cf:build` |
| Deploy command | `npx opennextjs-cloudflare deploy` | `npx opennextjs-cloudflare deploy` |
| Wrangler config | `frontend/wrangler.jsonc` | `backend/wrangler.jsonc` |

Set the build command to `npm run cf:build` and the deploy command to `npm run cf:deploy` (equivalent to `npx opennextjs-cloudflare deploy`). These commands assume Cloudflare executes them inside the configured root directory and installs dependencies first. If root directory cannot be set, use a supported working-directory build configuration instead.

Set **frontend** production environment variables (see `frontend/.env.example`):
- `NEXT_PUBLIC_API_URL=https://<backend-worker-host>/api`
- `NEXT_PUBLIC_SITE_URL=https://<frontend-worker-host>`
- `NEXT_PUBLIC_ADMIN_URL=https://<backend-worker-host>`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and any other required public settings.

Set **backend** environment variables (see `backend/.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Secret** `SUPABASE_SERVICE_ROLE_KEY` (never commit it)
- `ALLOWED_FRONTEND_ORIGINS=https://<frontend-worker-host>`
- `FRONTEND_URL=https://<frontend-worker-host>`
- `DEV_ADMIN_LOGIN_ENABLED=false`
- Shared `REVALIDATE_SECRET` if cache invalidation is needed.

Replace the placeholder hosts with the real Worker/custom-domain URLs. Public Next.js variables may be embedded during build; set build-time variables appropriately.

## Production compatibility review required

- Backend upload handler accepts potentially very large video uploads (up to 2 GB). Cloudflare Workers enforce request body limits based on plan, which may be far smaller. **Do not rely on the existing server-proxied upload route for multi-GB videos**; move those uploads to direct signed/resumable storage uploads before production use.
- Check Next.js image optimization, rewrites/proxying (`/backend-api`), authentication cookies, server actions, and any Node.js-only libraries under the Workers runtime.
- Test frontend pages and backend admin/API independently. Never expose service-role credentials or enable development admin login in production.
- The old Cloudflare Pages project may be left unused or deleted **after** Workers are confirmed working. Do not delete it prematurely.

Cloudflare guide: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
