# Cloudflare Workers deployment (two Next.js apps)

> **Status: configuration proposal.** This branch intentionally does not deploy or change production secrets. Install and commit the adapter dependencies and lockfiles, then validate both builds before merging.

This repository contains **two independent Next.js 16 apps**. Cloudflare Pages static deployment with `npx wrangler deploy` from the repository root will not work. Deploy each app as a **Cloudflare Worker with OpenNext**, with separate Worker projects pointing to the same GitHub repository.

## Before merging this PR

For **each** of `frontend/` and `backend/`, in a checkout of this branch, run:

```sh
cd frontend # repeat in backend/
npm install --save-dev @opennextjs/cloudflare wrangler
npm run cf:build
```

Commit both `package.json` and `package-lock.json` from each app. Then verify `npm ci && npm run cf:build` succeeds in each app. **Do not merge until this is done.** The scripts and `open-next.config.ts` require the adapter; the dependency is not yet added because the GitHub-only editing environment cannot resolve an npm lockfile.

## Cloudflare dashboard: create two Workers (not Pages)

Use **Workers & Pages → Create → Worker → Import Git repository** (wording may vary). Use the same repository, `paran87/myFirstWebsite`, for both Workers.

| Setting | Public frontend | Admin/backend |
|---|---|---|
| Worker name | `myfirstwebsite-frontend` | `myfirstwebsite-backend` |
| Production branch | `main` (after merge) | `main` (after merge) |
| Root directory | `frontend` | `backend` |
| Build command | `npm run cf:build` | `npm run cf:build` |
| Deploy command | `npx wrangler deploy` | `npx wrangler deploy` |
| Wrangler config | `frontend/wrangler.jsonc` | `backend/wrangler.jsonc` |

The build must run **before** `wrangler deploy`. These commands assume Cloudflare executes them inside the configured root directory and installs dependencies first. If root directory cannot be set, use a supported working-directory build configuration instead.

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
