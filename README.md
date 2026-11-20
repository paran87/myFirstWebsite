# Walk Metro Manila

A full-stack video streaming & documentation platform for publishing and organizing
body-camera footage and photos captured while walking streets and areas of **Metro
Manila** — for documentation, mapping, presentation, and reference.

It runs **entirely on Cloudflare**: two Workers (public site + admin/API), a **D1**
database, an **R2** bucket for media, and **Cloudflare Access** for admin sign-in.
There is no other backend service.

```text
project-root/
├── frontend/    # Public site        — Next.js on a Cloudflare Worker (local port 3000)
├── backend/     # Admin dashboard + REST API — Next.js on a Cloudflare Worker (local port 4000)
│   └── migrations/   # D1 (SQLite) schema + seed categories
└── README.md    # You are here
```

```text
   visitors                                   admins
      │                                          │
      ▼                                          ▼
┌───────────────┐   REST (NEXT_PUBLIC_API_URL)  ┌─────────────────────────┐
│   FRONTEND    │ ────────────────────────────► │   BACKEND (admin + API)  │
│  Worker       │ ◄── POST /api/revalidate ──── │   Worker                 │
│  cache: R2+D1 │                               │   ▲ Cloudflare Access    │
└───────────────┘                               │     guards /admin*       │
                                                └─────┬──────────────┬─────┘
                                                      │              │
                                              ┌───────▼──────┐ ┌─────▼──────────┐
                                              │ D1: wmm-db   │ │ R2: wmm-media  │
                                              │ videos,      │ │ videos/ photos/│
                                              │ photos, …    │ │ thumbnails/    │
                                              └──────────────┘ └────────────────┘
```

Large videos never pass through a Worker: the admin browser uploads them straight to R2
with a presigned URL, and visitors stream them from R2 (ideally through a custom domain
on the bucket).

---

## 1. Why two separate apps?

- The public site and the admin panel are **separate applications** that deploy and
  scale independently, and the admin app can sit behind Cloudflare Access.
- The public bundle contains no admin code.
- **Trade-off:** `frontend/src/lib/types.ts` and `backend/src/lib/types.ts` are
  hand-synced duplicates rather than a shared package.

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| Backend/Admin | Next.js 16 (App Router + Route Handlers), TypeScript, Tailwind CSS v4 |
| Hosting | Cloudflare Workers via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) |
| Database | Cloudflare **D1** (SQLite) — full-text search with FTS5 |
| Media storage | Cloudflare **R2** |
| Admin auth | Cloudflare **Access** (JWT verified inside the Worker) |
| Site cache | R2 (incremental cache) + D1 (tag revalidation) for the frontend |
| Image resizing | Cloudflare Images binding (`next/image`) |
| Map | Leaflet + OpenStreetMap (`react-leaflet`) |
| Validation | Zod |

Both apps need **Next.js ≥ 16.4.5** (a peer requirement of the Cloudflare adapter),
so they are pinned to 16.4.6.

---

## 3. Prerequisites

- Node.js 20+ and npm
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up) (Zero Trust free plan
  is enough for Access, up to 50 users)
- A domain on Cloudflare DNS is strongly recommended (custom domains for the two Workers
  and for the R2 bucket; Access works best on a custom domain)

No Cloudflare account is needed for local development.

---

## 4. Local development

Local D1 and R2 are simulated on disk (`.wrangler/state`), so nothing is shared with
production.

```bash
# Terminal 1 — backend / admin (http://localhost:4000)
cd backend
npm install
cp .env.example .env.local        # optional: non-secret settings
cp .dev.vars.example .dev.vars    # DEV_ADMIN_EMAIL, REVALIDATE_SECRET
npm run db:migrate:local          # create tables + seed categories
npm run dev
```

```bash
# Terminal 2 — frontend (http://localhost:3000)
cd frontend
npm install
cp .env.example .env.local
cp .dev.vars.example .dev.vars
npm run db:migrate:local          # tag-cache table (only needed for `npm run preview`)
npm run dev
```

- Public site: <http://localhost:3000>
- Admin dashboard: <http://localhost:4000/admin/dashboard>

There is no Cloudflare Access on localhost. Instead, when `DEV_ADMIN_EMAIL` is set,
`next dev` treats **same-origin browser requests** as that admin. Server-to-server calls
(like the public site fetching the API) stay anonymous, so the public API behaves as in
production. This bypass is disabled in any production build.

To act as the admin from `curl`, add `-H "Sec-Fetch-Site: same-origin"`.

Run the real Worker runtime locally (`workerd`) with `npm run preview`. Note the admin
bypass is off there, because it is a production build.

---

## 5. Deploying to Cloudflare

Do the backend first: the frontend needs its URL at build time.

### 5.1 Create the resources (once)

```bash
npx wrangler login

# Backend: database + media bucket
npx wrangler d1 create wmm-db          # copy the printed database_id
npx wrangler r2 bucket create wmm-media

# Frontend: Next.js cache
npx wrangler d1 create wmm-cache       # copy the printed database_id
npx wrangler r2 bucket create wmm-cache
```

Paste the two `database_id` values into `backend/wrangler.jsonc` and
`frontend/wrangler.jsonc` (replacing `REPLACE_WITH_DATABASE_ID`).

Create the tables:

```bash
cd backend  && npm run db:migrate:remote
cd ../frontend && npm run db:migrate:remote
```

### 5.2 Public media URL (recommended)

In the dashboard: **R2 → wmm-media → Settings → Custom Domains → Connect domain**
(e.g. `media.example.com`). Then set `R2_PUBLIC_URL=https://media.example.com` on the
backend and `NEXT_PUBLIC_MEDIA_URL=https://media.example.com` on the frontend.

Without it, files are served through the backend Worker at `/api/files/…` (this works,
but video traffic then counts against the Worker). Do **not** use the rate-limited
`r2.dev` URL in production.

> Stored file URLs are absolute. Decide on the media domain **before** you upload
> content, or the saved URLs will point at the old host.

### 5.3 Direct uploads for large videos (R2 credentials + CORS)

A Worker request body is capped at 100 MB (Free/Pro), so videos over ~90 MB go straight
from the browser to R2:

1. **R2 → Manage API tokens → Create API token** with *Object Read & Write* on `wmm-media`.
2. Set on the backend Worker:
   ```bash
   cd backend
   npx wrangler secret put R2_ACCESS_KEY_ID
   npx wrangler secret put R2_SECRET_ACCESS_KEY
   ```
   and put your account id in `R2_ACCOUNT_ID` (`wrangler.jsonc` → `vars`).
3. Allow the admin origin to PUT: edit `backend/r2-cors.json` (set your admin origin),
   then `npx wrangler r2 bucket cors set wmm-media --file r2-cors.json`.

Without these, uploads up to ~90 MB still work through the Worker; bigger videos are
refused with an explanatory message.

### 5.4 Cloudflare Access for the admin

1. **Zero Trust → Access → Applications → Add an application → Self-hosted.**
2. Destinations: your admin hostname with path `admin` **and** `admin/*`
   (e.g. `admin.example.com/admin` and `admin.example.com/admin/*`).
   *Do not* protect `/api/*`: the public site reads from it.
3. Policy: **Allow** → Emails → the people who may manage the site.
4. Copy the application's **Audience (AUD) tag** and your **team domain**
   (`<team>.cloudflareaccess.com`) into `backend/wrangler.jsonc` → `vars`:
   `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`. Optionally set `ADMIN_EMAILS` as an extra
   allow-list.

How it works: Access signs people in and sets a `CF_Authorization` cookie. Every admin API
route re-verifies that JWT inside the Worker (signature, issuer, audience, expiry), because
the same `/api/*` paths also serve the public site and so can't be fenced off by Access.

> **Verify after deploy:** sign in at `/admin/dashboard`, then check that the admin lists
> load data and a save succeeds. If the pages load but admin API calls return 401, the
> browser is not sending the `CF_Authorization` cookie to `/api/*`. The fix is to move the
> admin-only write endpoints under `/admin/api/*`, which the Access application already
> covers (Access then also adds the `Cf-Access-Jwt-Assertion` header, which
> `requireAdmin()` reads).

### 5.5 Deploy

**From your machine:**

```bash
cd backend  && npm run deploy
cd ../frontend && npx wrangler secret put REVALIDATE_SECRET && npm run deploy
cd ../backend && npx wrangler secret put REVALIDATE_SECRET   # same value as the frontend
```

**Or from Git** (Workers & Pages → Create → Import a repository), one project per app:

| | Backend | Frontend |
|---|---|---|
| Root directory | `backend` | `frontend` |
| Build command | `npx opennextjs-cloudflare build` | `npx opennextjs-cloudflare build` |
| Deploy command | `npx opennextjs-cloudflare deploy` | `npx opennextjs-cloudflare deploy` |

The `name` in each `wrangler.jsonc` must match the Worker's name in Cloudflare
(`myfirstwebsite` = backend, `myfirstwebsite-frontend` = frontend); Workers Builds fails the
build if they differ, and also if a `database_id` is still `REPLACE_WITH_DATABASE_ID`.

`NEXT_PUBLIC_*` values are inlined at **build** time, so set them as *build variables*
as well as in `wrangler.jsonc`. After deploying, add each Worker's custom domain under
**Settings → Domains & Routes**.

---

## 6. Environment variables

Non-secret settings live in `wrangler.jsonc` → `vars` (production) or `.env.local`
(local). Secrets use `wrangler secret put` (production) or `.dev.vars` (local).

### Backend (`backend/`)

| Name | Kind | Purpose |
|---|---|---|
| `ACCESS_TEAM_DOMAIN` | var | `<team>.cloudflareaccess.com` |
| `ACCESS_AUD` | var | Audience tag of the Access application |
| `ADMIN_EMAILS` | var, optional | Extra allow-list (comma-separated) |
| `R2_PUBLIC_URL` | var, recommended | Public URL of the media bucket |
| `R2_ACCOUNT_ID`, `R2_BUCKET_NAME` | var | For direct large-video uploads |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | **secret** | For direct large-video uploads |
| `ALLOWED_FRONTEND_ORIGINS` | var | CORS origin(s) of the public site |
| `FRONTEND_URL` | var | Where to send cache-refresh pings |
| `REVALIDATE_SECRET` | **secret** | Must equal the frontend's |
| `*_MAX_FILE_SIZE_MB`, `PHOTO_MAX_BATCH_COUNT` | var | Upload limits |
| `DEV_ADMIN_EMAIL` | local only | Admin bypass for `next dev` |

Bindings: `DB` (D1), `MEDIA` (R2), `ASSETS`.

### Frontend (`frontend/`)

| Name | Kind | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | var + build | Backend API, e.g. `https://admin.example.com/api` |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ADMIN_URL` | var + build | Public URLs |
| `NEXT_PUBLIC_MEDIA_URL` | var + build | Media domain (for `next/image`) |
| `NEXT_PUBLIC_SITE_NAME` | var + build | Branding |
| `REVALIDATE_SECRET` | **secret** | Must equal the backend's |

Bindings: `NEXT_INC_CACHE_R2_BUCKET` (R2), `NEXT_TAG_CACHE_D1` (D1), `IMAGES`, `ASSETS`.

Renaming the site: change `NEXT_PUBLIC_SITE_NAME` in **both** apps.

---

## 7. Project structure

```text
backend/
├── migrations/               # D1 schema (0001_init.sql) + seed categories
├── wrangler.jsonc            # bindings + vars
├── open-next.config.ts
├── r2-cors.json              # CORS rule for direct browser → R2 uploads
└── src
    ├── app/
    │   ├── admin/
    │   │   ├── login/page.tsx            # Access status page (sign-in is done by Access)
    │   │   └── (app)/                    # dashboard, videos, photos, categories, recycle-bin
    │   └── api/
    │       ├── videos, photos            # list/create, [id] get/patch/delete, restore, view
    │       ├── categories                # list/create, [id] patch/delete
    │       ├── upload/route.ts           # POST — through the Worker (≤ ~90 MB)
    │       ├── upload/signed-url/route.ts# POST — presigned direct-to-R2 upload
    │       ├── files/[...path]/route.ts  # GET — stream from R2 with Range support
    │       └── admin/stats/route.ts
    └── lib/
        ├── cf.ts          # D1 / R2 bindings + settings
        ├── db.ts          # all SQL (videos, photos, categories, stats)
        ├── storage.ts     # R2 helpers + presigned URLs
        ├── access.ts      # Cloudflare Access JWT verification
        ├── auth.ts        # requireAdmin() / tryGetAdmin()
        └── validation.ts  # Zod schemas

frontend/
├── migrations/0001_tag_cache.sql   # table for the Next.js tag cache
├── wrangler.jsonc, open-next.config.ts
└── src/{app,components,lib}
```

---

## 8. Authentication & authorization model

- **Public** (no sign-in): `GET /api/videos`, `/api/photos`, `/api/categories`
  (published, non-deleted rows only, reduced columns), `GET …/:id`,
  `POST /api/videos/:id/view`, `GET /api/files/*`.
- **Admin**: everything else. `requireAdmin()` verifies the Cloudflare Access JWT on
  every request, rejects requests whose `Origin` is a different site (CSRF), and
  optionally enforces `ADMIN_EMAILS`.
- There is no user table. The Access email is the user id and is stored in
  `created_by`. Every Access-approved person is a full admin; manage who that is in the
  Access policy.
- D1 has no row-level security, so **authorization lives only in the route handlers**.
  Any new route that writes data must call `requireAdmin()` first.

---

## 9. Upload flow

| File | Path |
|---|---|
| Thumbnails, photos, videos ≤ ~90 MB | Browser → `POST /api/upload` → Worker → R2 (`MEDIA` binding) |
| Videos > ~90 MB | Browser → `POST /api/upload/signed-url` → presigned `PUT` straight to R2 (single PUT, up to 5 GB; the app limit is 2 GB) |

Photo batches are sent one file per request so a batch never hits the Worker's request
size or memory limits. After the upload the admin form saves the metadata with
`POST /api/videos` (or `/api/photos`).

Uploads are not resumable: a dropped connection restarts the file.

---

## 10. Soft delete / Recycle Bin

- **Delete** sets `deleted_at` and `status = 'deleted'`; the item disappears from the
  public site but stays in D1.
- **`/admin/recycle-bin`** lists deleted items: **Restore** brings it back as a draft;
  **Permanently Delete** (`?permanent=true`) removes the row and its R2 objects.

---

## 11. View counting

`POST /api/videos/:id/view` records one row per `(video, viewer)` in `video_views`, where
the viewer key is a hash of the client IP plus a random id the frontend stores in
`localStorage`, and increments `videos.views` only for a new viewer. Unknown or
unpublished videos return 404.

---

## 12. Search

Videos and photos each have an FTS5 table (`videos_fts`, `photos_fts`) kept in sync by
triggers. Every word in the query must match as a **prefix** (`"edsa"* "manila"*`), over
title, description, location, street, barangay, city and tags.

---

## 13. How this was verified

Run in this repo's dev environment (no Cloudflare account was available, so nothing was
deployed):

- Both apps type-check and build with `opennextjs-cloudflare build`; deploy dry-runs
  report ~1.4 MB (backend) and ~1.2 MB (frontend) gzipped, under the 3 MB Free-plan limit.
- Migrations apply to a local D1; the API was exercised end to end against local D1/R2 in
  both `next dev` and the real `workerd` runtime: create/list/search/update/soft-delete/
  restore/permanent-delete, categories (incl. duplicate → 409), view de-duplication,
  photo batch insert, EXIF GPS backfill, R2 upload + `Range` responses, public vs admin
  visibility, CSRF rejection.
- Cloudflare Access JWT verification was run inside `workerd` with a generated key: a
  valid token is accepted; expired, wrong audience, wrong issuer, tampered, wrong-key,
  unknown-key, missing and malformed tokens are all rejected.
- The frontend ↔ backend round trip, R2/D1 cache and `revalidateTag` flow was run with
  both Workers locally.

**Not verified** (needs a real account): Cloudflare Access login itself (including that
the `CF_Authorization` cookie reaches `/api/*`, see §5.4), presigned uploads against real
R2 + its CORS rule, the Images binding's resizing, and custom domains.

---

## 14. Troubleshooting

| Symptom | Likely cause |
|---|---|
| `/admin/login` says it could not verify Access | `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` wrong, Access app does not cover `/admin*`, or the email is not in `ADMIN_EMAILS` |
| Admin pages load but saving returns 401 | `CF_Authorization` not reaching `/api/*` (see §5.4) |
| `D1 binding "DB" is missing` | `d1_databases` in `wrangler.jsonc` (and `database_id`) |
| Large video upload says R2 is not configured | Set the R2 secrets in §5.3 |
| Large video upload fails with a network/CORS error | Apply `r2-cors.json` to the bucket (§5.3) |
| Uploaded files 404 in the public site | `R2_PUBLIC_URL` / `NEXT_PUBLIC_MEDIA_URL` does not match where the files are served |
| Admin edits show up after ~30 s instead of instantly | `REVALIDATE_SECRET` differs between the apps, or `FRONTEND_URL` is unset |
| Images are not resized | `images` binding missing, or the host is not allowed in `frontend/next.config.ts` |

---

## 15. Known limitations / next steps

- **No transcoding / adaptive bitrate.** Videos stream as uploaded via HTTP range
  requests (R2 supports them natively).
- **Uploads are not resumable.**
- **Rate limiting is in-memory per Worker isolate** (`lib/rate-limit.ts`), so it is only
  a soft guard. Use Cloudflare rate-limiting rules or a Durable Object for a hard limit.
- **Subrequest limits.** A Free-plan Worker allows 50 subrequests per request; the GPS
  backfill processes 20 photos per call for that reason.
- **Free-plan quotas** apply to D1, R2, Workers requests and Images transformations.
- **All Access users are admins** (no editor/admin split).
- No data was migrated from the previous Supabase version; the schema was translated by
  hand (`backend/migrations/`).
