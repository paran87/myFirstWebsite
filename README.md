# Walk Metro Manila

A full-stack video streaming & documentation platform for publishing and organizing
body-camera footage captured while walking streets and areas of **Metro Manila** —
for documentation, mapping, presentation, and reference.

The platform is split into **two independent Next.js applications** that share a
single Supabase project (PostgreSQL + Auth + Storage):

```text
project-root/
├── frontend/    # Public video streaming/documentation website (Next.js, port 3000)
├── backend/     # Private admin dashboard + REST API (Next.js, port 4000)
├── supabase/    # SQL migrations (schema, RLS policies, storage buckets)
└── README.md    # You are here
```

```text
                 ┌──────────────────────────┐
                 │     FRONTEND WEBSITE     │  http://localhost:3000
                 │   Public Video Platform  │
                 └────────────┬─────────────┘
                              │ REST API (NEXT_PUBLIC_API_URL)
                              ▼
                 ┌──────────────────────────┐
                 │      BACKEND / API       │  http://localhost:4000
                 │ Admin Auth + CRUD        │
                 │ Video/Category Management │
                 └────────────┬─────────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
       ┌────────────────┐            ┌────────────────┐
       │    Supabase    │            │ Supabase Storage│
       │   PostgreSQL   │            │  (videos, thumbs)│
       │   Auth         │            │  served via CDN  │
       └────────────────┘            └────────────────┘
```

Videos never pass through the backend server: the admin browser uploads directly to
Supabase Storage via a short-lived signed URL, and the public frontend streams
directly from Supabase's CDN using the stored `video_url`. The backend only ever
handles metadata, auth, and issuing signed upload URLs.

---

## 1. Why two separate apps (not one Next.js app)?

- The spec requires the public site and the admin panel to be **separate
  applications** that can be deployed and scaled independently (e.g. the admin app
  can stay on a private URL/VPN while the frontend is fully public).
- It keeps the public bundle free of any admin code, admin-only dependencies, and
  reduces the public attack surface.
- Each app has its own `package.json`, `.env.local`, and can be deployed to its own
  Vercel project / domain.

**Trade-off:** since they're independent projects, `frontend/src/lib/types.ts` and
`backend/src/lib/types.ts` are hand-synced duplicates instead of a shared npm
package. If this grows, extract them into a published `@walk-metro-manila/shared`
package or a pnpm/turborepo workspace.

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide icons |
| Backend/Admin | Next.js 16 (App Router + Route Handlers), TypeScript, Tailwind CSS v4 |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (email + password) |
| Storage/CDN | Supabase Storage (public buckets, signed upload URLs) |
| Map | Leaflet + OpenStreetMap (`react-leaflet`) |
| Validation | Zod |
| UI niceties | `sonner` (toasts), `next-themes` (light/dark mode) |

---

## 3. Prerequisites

- Node.js 20+ and npm
- A free [Supabase](https://supabase.com) project
- Git

---

## 4. Supabase setup

1. Create a new project at [supabase.com](https://supabase.com/dashboard).
2. Open **SQL Editor** and run the migration files **in order**:
   - `supabase/migrations/0001_init.sql` — tables, indexes, RLS policies, seed categories.
   - `supabase/migrations/0002_storage.sql` — `videos` and `thumbnails` storage
     buckets + public read policies.
3. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ **backend only**, never
     put this in the frontend app or commit it)
4. Go to **Authentication → Providers** and make sure **Email** sign-in is enabled.
5. Create your first admin account — the SQL migration auto-creates a `profiles`
   row (role `admin`) for every new `auth.users` row via a trigger, so simply:
   - **Authentication → Users → Add User** (set email + password, confirm the
     email automatically), or
   - Sign up once via `POST {SUPABASE_URL}/auth/v1/signup` with your anon key.
   Then log in at `http://localhost:4000/admin/login`.

> In production, remove/replace the "every new user becomes an admin" trigger in
> `0001_init.sql` (`handle_new_user`) with an invite-only flow — it's convenient for
> local development but too permissive for a public deployment.

---

## 5. Environment variables

Each app has its own `.env.example` — copy it to `.env.local` and fill in real
values. **Never commit `.env.local`.**

### `backend/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server-only, never exposed to the browser

VIDEO_STORAGE_PROVIDER=supabase
VIDEO_CDN_URL=

SUPABASE_VIDEO_BUCKET=videos
SUPABASE_THUMBNAIL_BUCKET=thumbnails

VIDEO_MAX_FILE_SIZE_MB=2048
THUMBNAIL_MAX_FILE_SIZE_MB=10
NEXT_PUBLIC_VIDEO_MAX_FILE_SIZE_MB=2048
NEXT_PUBLIC_THUMBNAIL_MAX_FILE_SIZE_MB=10

ALLOWED_FRONTEND_ORIGINS=http://localhost:3000

NEXT_PUBLIC_SITE_NAME=Walk Metro Manila
```

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_URL=http://localhost:4000
NEXT_PUBLIC_SITE_NAME=Walk Metro Manila

NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Renaming the site: change `NEXT_PUBLIC_SITE_NAME` in **both** `.env.local` files —
it flows through `siteConfig.name` everywhere (header, page titles, metadata).

---

## 6. Local development

Install dependencies and run each app in its own terminal:

```bash
# Terminal 1 — backend / admin (http://localhost:4000)
cd backend
npm install
npm run dev

# Terminal 2 — frontend (http://localhost:3000)
cd frontend
npm install
npm run dev
```

- Public site: <http://localhost:3000>
- Admin dashboard: <http://localhost:4000/admin/login>

The frontend calls the backend via `NEXT_PUBLIC_API_URL` — never hard-code
`localhost` for production builds; set that env var to your deployed backend URL
instead.

---

## 7. Project structure

```text
backend/src
├── app/
│   ├── admin/
│   │   ├── login/page.tsx            # /admin/login
│   │   └── (app)/                    # authenticated shell (sidebar + topbar)
│   │       ├── dashboard/page.tsx     # /admin/dashboard
│   │       ├── videos/page.tsx        # /admin/videos
│   │       ├── videos/new/page.tsx    # /admin/videos/new
│   │       ├── videos/[id]/edit/page.tsx
│   │       ├── categories/page.tsx    # /admin/categories
│   │       └── recycle-bin/page.tsx   # /admin/recycle-bin
│   └── api/
│       ├── videos/route.ts            # GET (list, public/admin), POST (create)
│       ├── videos/[id]/route.ts       # GET/PATCH/DELETE (soft or ?permanent=true)
│       ├── videos/[id]/restore/route.ts
│       ├── videos/[id]/view/route.ts  # POST — dedup'd view counter
│       ├── categories/route.ts        # GET, POST
│       ├── categories/[id]/route.ts   # PATCH, DELETE
│       ├── upload/signed-url/route.ts # POST — issues Supabase signed upload URL
│       └── admin/stats/route.ts       # GET — dashboard stats
├── lib/
│   ├── supabase/{server,admin,client}.ts   # 3 Supabase clients, see §8
│   ├── auth.ts            # requireAdmin() / tryGetAdmin()
│   ├── validation.ts      # Zod schemas
│   ├── rate-limit.ts      # in-memory limiter for login/upload/view endpoints
│   └── cors.ts            # CORS for the public read endpoints
├── components/admin/…     # sidebar, topbar, video form, admin shell
├── components/ui/…        # stat cards, states, confirm dialog
└── proxy.ts                # Next.js 16 "proxy" (formerly middleware) — guards /admin/*

frontend/src
├── app/
│   ├── page.tsx            # homepage: search + filters + video grid
│   ├── video/[id]/page.tsx # video player + metadata + map
│   ├── sitemap.ts, robots.ts
│   └── loading.tsx, error.tsx, not-found.tsx
├── lib/{api,types,config,format}.ts
└── components/
    ├── layout/{header,footer}.tsx
    ├── video/{video-card,video-grid,filters-bar,video-player,map-view*}.tsx
    └── ui/states.tsx

supabase/migrations/
├── 0001_init.sql     # tables, indexes, RLS, seed categories
└── 0002_storage.sql  # storage buckets + public read policies
```

---

## 8. Why three Supabase clients on the backend?

| Client | File | Key used | Purpose |
|---|---|---|---|
| Server (session-aware) | `lib/supabase/server.ts` | anon | Reads that should respect RLS (public vs. admin visibility) |
| Admin (service role) | `lib/supabase/admin.ts` | service role | Writes, after `requireAdmin()` has already authorized the request |
| Browser | `lib/supabase/client.ts` | anon | Login form (`signInWithPassword`), logout |

The service-role client is imported **only** in Route Handlers / Server Components,
never in a file marked `"use client"`, and the module is guarded with the
`server-only` package so an accidental client import fails at build time.

---

## 9. Authentication & authorization model

1. **`proxy.ts`** (Next.js 16's renamed `middleware.ts`) redirects any
   unauthenticated visit to `/admin/*` (except `/admin/login`) to
   `/admin/login?redirectedFrom=...`.
2. Every admin API route additionally calls **`requireAdmin()`**
   (`lib/auth.ts`), which:
   - Verifies a valid Supabase session exists (401 if not).
   - Looks up the `profiles` row and checks `role in ('admin','editor')`
     (403 if not).
   This is required because middleware redirects don't protect API routes (a
   fetch to a protected API route would otherwise just receive a redirect
   response instead of a clean 401/403 JSON error).
3. **Row Level Security** in Postgres is the last line of defense: even if
   application code had a bug, `videos`/`categories` RLS policies only let
   `published`/`active` rows through to anonymous `select`s.

---

## 10. Video upload flow (large-file friendly)

```text
Admin picks a file in /admin/videos/new
        │
        ▼
POST /api/upload/signed-url   (admin-only, validates type & size)
        │
        ▼
Supabase Storage returns { signedUrl, token, path, publicUrl }
        │
        ▼
Browser PUTs the file bytes directly to `signedUrl` (XHR, progress tracked)
        │
        ▼
POST /api/videos with { video_url: publicUrl, storage_path, ... metadata }
        │
        ▼
Row inserted in `videos` (status defaults to "draft")
        │
        ▼
Admin sets status = "published" → video appears on the public frontend
```

The video's bytes **never pass through either Next.js server** — they go straight
from the admin's browser to Supabase's object storage, and straight from
Supabase's CDN to the viewer's `<video>` tag. This keeps both Next.js deployments
fast and cheap regardless of file size.

**Scaling beyond the MVP:** For very large files (multi-GB) in production, swap the
single-PUT signed upload in `lib/upload.ts` for Supabase's resumable (TUS) upload
endpoint using `tus-js-client` — the rest of the app (metadata shape, `storage_path`,
`publicUrl`) does not need to change.

---

## 11. Storage provider abstraction

`VIDEO_STORAGE_PROVIDER` and `VIDEO_CDN_URL` in `backend/.env.local` exist so the
storage backend can be swapped later (e.g. S3 + CloudFront, Cloudflare R2 + Bunny
CDN) without touching the rest of the app:

- Only `lib/config.ts` (bucket names, limits) and
  `app/api/upload/signed-url/route.ts` know about Supabase Storage specifically.
- Every other part of the app just deals with a plain `video_url` string.

---

## 12. Soft delete / Recycle Bin

Videos are never hard-deleted from a single click:

- **Delete** (`DELETE /api/videos/:id`) sets `deleted_at = now()` and
  `status = 'deleted'`. The video disappears from the public site (RLS + the
  public list query both filter on `deleted_at is null` and
  `status = 'published'`) but remains in the database.
- **`/admin/recycle-bin`** lists everything with `deleted_at is not null` and
  offers:
  - **Restore** → `POST /api/videos/:id/restore` sets `deleted_at = NULL` and
    `status = 'draft'` (the admin must explicitly re-publish it).
  - **Permanently Delete** → `DELETE /api/videos/:id?permanent=true` removes the
    row and its storage objects (video + thumbnail) for good.

---

## 13. View counting

`POST /api/videos/:id/view` calls the `increment_video_views` Postgres function,
which de-duplicates by `(video_id, viewer_key)` where `viewer_key` is a hash of the
client IP + a random id the frontend stores once in `localStorage`. This means one
browser session watching the same video repeatedly only counts once, without
requiring user accounts. See `supabase/migrations/0001_init.sql` and
`backend/src/app/api/videos/[id]/view/route.ts`.

---

## 14. Testing checklist

Manual checklist mirroring the spec's testing requirements — run through this after
any significant change:

- **Auth:** login, logout, wrong password shows an inline error, visiting
  `/admin/dashboard` while logged out redirects to `/admin/login`.
- **Videos:** create (with upload progress), edit, publish/unpublish, soft delete,
  restore, permanently delete.
- **Search:** search by title, city, barangay, street from the homepage search bar.
- **Upload:** small file, a large file (watch the progress bar), an unsupported
  file type (should show a clear error), a network failure mid-upload (should
  surface an error rather than hang).
- **Responsive:** homepage, video page, and every admin page at mobile / tablet /
  desktop widths.
- **End-to-end:** publish a video in the admin → confirm it appears in the
  frontend's video grid within the cache window (≈30s) → open it → confirm the
  video streams, the map renders (if lat/lng set), and the view count increments
  once per session.

---

## 15. Deployment

Both apps deploy independently (e.g. two Vercel projects):

1. **Backend/Admin** → deploy `backend/`, set all `backend/.env.example` variables
   in the hosting provider's environment settings (including
   `SUPABASE_SERVICE_ROLE_KEY` as a **server-only secret**, and
   `ALLOWED_FRONTEND_ORIGINS` to your production frontend URL).
2. **Frontend** → deploy `frontend/`, set `NEXT_PUBLIC_API_URL` to the deployed
   backend's `/api` URL, `NEXT_PUBLIC_SITE_URL` to its own production URL, and
   `NEXT_PUBLIC_ADMIN_URL` to the backend's base URL.
3. **Supabase** → use a dedicated production project; re-run both migration files
   against it; create real admin accounts (and remove/replace the
   auto-admin-on-signup trigger, see §4).
4. Point your DNS / custom domains at each deployment (e.g. `walkmetromanila.com`
   for the frontend, `admin.walkmetromanila.com` for the backend).

Never hard-code `localhost` URLs in production env vars.

---

## 16. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Homepage shows "Unable to load videos." | Backend isn't running, or `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_API_URL` are wrong/placeholder values. Check the backend terminal for the real error. |
| `/api/videos` returns 500 | Usually Supabase env vars in `backend/.env.local` are still placeholders, or the migrations haven't been run yet. |
| Login page loads but sign-in fails with "Incorrect email or password" | Confirm the user exists in **Authentication → Users** and that Email auth is enabled. |
| Logged in but redirected back to `/admin/login` | The `profiles` row is missing or its `role` isn't `admin`/`editor` — check the `handle_new_user` trigger ran, or insert a `profiles` row manually. |
| Upload fails immediately | Check the file's MIME type/size against `VIDEO_MAX_FILE_SIZE_MB` / allowed types in `backend/.env.local`, and that the `videos` bucket exists (run `0002_storage.sql`). |
| Video thumbnail doesn't load (broken image icon) | Confirm `next.config.ts`'s `images.remotePatterns` matches your Supabase project hostname (it's derived from `NEXT_PUBLIC_SUPABASE_URL` automatically — restart the dev server after changing env vars). |
| Map doesn't render on a video page | Latitude/longitude weren't set on that video, or an ad-blocker is blocking OpenStreetMap tiles / the Leaflet marker icons from `unpkg.com`. |
| CORS error in the browser console | Add the calling origin to `ALLOWED_FRONTEND_ORIGINS` in `backend/.env.local` and restart the backend. |

---

## 17. Known MVP limitations / next steps

Per the spec's instruction to "build a working MVP first," the following are
intentionally simple and documented as future work rather than implemented:

- **No transcoding / adaptive bitrate.** Videos stream as uploaded via HTTP range
  requests (which Supabase Storage supports natively). Multi-resolution/HLS
  transcoding would sit between "Upload" and "Save metadata" in
  `components/admin/video-form.tsx` without changing the rest of the pipeline.
- **Non-resumable uploads.** Uploads use a single signed PUT rather than
  chunked/resumable TUS uploads — fine for the MVP, see §10 for the upgrade path.
- **Rate limiting is in-memory**, per server instance (`lib/rate-limit.ts`) — swap
  for a shared store (e.g. Upstash Redis) behind the same function signature for a
  multi-instance deployment.
- **Auto-admin-on-signup trigger** in `0001_init.sql` is a local-dev convenience
  that should be replaced with an invite-only flow in production.
