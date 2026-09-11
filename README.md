# 3DS Academy — full-stack 3DEXPERIENCE® learning platform

A production-shaped course platform for **Dassault Systèmes 3DEXPERIENCE** skills (CATIA, SIMULIA,
ENOVIA, DELMIA, SOLIDWORKS on the platform), laid out like a modern ed-tech site (the structure of
CodeWithHarry: hero + stats + tracks + catalogue + testimonials + certificates + CTA) and wired to a
real backend:

- 🔐 **Google (Gmail) sign-in** — Google Identity Services button, ID token verified server-side, httpOnly session cookie
- 🎓 **Student dashboard** — enrol, resume where you left off, per-lesson progress, certificates + public verification
- 🛠️ **Admin dashboard** — create/edit courses, build modules, **"upload" a lesson by pasting a YouTube *or* Google Drive link**, attach resources, manage learners and roles
- ▶️ **One player, many sources** — YouTube video, YouTube playlist, Drive file (`/view`, `/preview`, `open?id=`, `uc?id=`, raw file id), Vimeo, direct `.mp4`
- 📤 **Real file upload too** — faculty can upload an `.mp4`/`.webm` recording or a handbook and the admin panel attaches the returned link (`/api/admin/upload`, stored in `public/uploads/`)
- 📜 **Automatic certificates** — issued at 100%, printable, and verifiable at `/verify/<credential-id>`
- ⚙️ **Zero external services** — Next.js 14 (App Router) + SQLite via Node's built-in `node:sqlite`, so nothing to install or compile

> Independent education project. 3DEXPERIENCE, CATIA, SOLIDWORKS, SIMULIA, ENOVIA and DELMIA are
> trademarks of Dassault Systèmes; this repo is not affiliated with or endorsed by them.

---

## 1. Quick start

```bash
npm install          # no native modules, no prisma engines
cp .env.example .env # optional — every value has a safe development default
npm run setup        # create data/app.db + seed the catalogue (9 courses, 107 lessons)
npm run dev          # http://localhost:3000
```

Requires **Node.js ≥ 22.5** (uses the built-in `node:sqlite` module).

Sign in with a demo role while `ALLOW_DEMO_LOGIN=true` (default in development):

| Role | Account | What you see |
| --- | --- | --- |
| Admin | `admin@3dsacademy.dev` | `/admin` — catalogue, curriculum builder, video links, learners, roles |
| Instructor | `instructor@3dsacademy.dev` | student view + mentor profile (an instructor can be promoted from the admin panel) |
| Student | `student@3dsacademy.dev` | `/dashboard` — 3 enrolments, progress, one issued certificate |

Every seeded lesson points at a real public YouTube video about that topic, so playback, progress
ticks, "complete & continue", certificate issuing and admin edits all work immediately.

## 2. Google Gmail login (real OAuth)

The app already implements the full flow; you only need a client ID.

1. [console.cloud.google.com](https://console.cloud.google.com/apis/credentials) → **Create credentials → OAuth client ID → Web application**.
2. Add every origin you will use to **Authorized JavaScript origins**, e.g.
   `http://localhost:3000` **and** your preview/deploy origin `https://3000-<sandbox-id>.e2b.app` (or your domain).
   No redirect URI is needed — we use the ID token from the sign-in button, not the auth-code flow.
3. Copy the **OAuth Client ID** into `.env`:
   ```env
   GOOGLE_CLIENT_ID="1234567890-abc...apps.googleusercontent.com"
   ADMIN_EMAILS="you@gmail.com,registrar@yourcollege.edu"
   SESSION_SECRET="<≥32 random chars>"
   ALLOW_DEMO_LOGIN="false"        # turn this off outside development
   ```
4. Restart `npm run dev`. `/login` now renders Google's official *Continue with Google* button.

What the server does with the credential (`src/app/api/auth/google/route.ts`):
verifies the token with Google's `tokeninfo` endpoint, checks `aud` + `email_verified`, upserts the
user by email, promotes it to `ADMIN` if the address is in `ADMIN_EMAILS`, then sets the signed
session cookie. No password, no token stored — only `google_id`, name, email and picture.

## 3. Environment variables

`.env` is git-ignored; copy `.env.example` to it. Every variable also has a safe default in
`src/lib/env.ts`, so the app boots with no env file at all (demo login enabled, SQLite in `data/`).
`.env.local` / `.env.production` are ignored too and take precedence per Next's env loading.

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `./data/app.db` | SQLite file (created + migrated automatically) |
| `GOOGLE_CLIENT_ID` | *empty* | Enables the real Google button when set |
| `SESSION_SECRET` | dev placeholder | HMAC key for the session JWT — **change in production** |
| `ADMIN_EMAILS` | `admin@3dsacademy.dev` | Comma-separated addresses auto-promoted to admin |
| `ALLOW_DEMO_LOGIN` | `true` in dev | Enables the demo role logins (disable in production) |
| `NEXT_PUBLIC_SITE_NAME` / `NEXT_PUBLIC_SITE_URL` | `3DS Academy` / `http://localhost:3000` | Branding + canonical metadata |

## 4. How an admin publishes a course with videos

1. **Admin → Courses & videos → New course** — title, track, level, price (`0` = free), description
   (markdown-ish), outcomes, thumbnail. The card preview updates as you type.
2. **Curriculum → Add module**, name it, then **Add lesson** per video:
   paste a **YouTube link** (`watch?v=`, `youtu.be/`, `/embed/`, `/shorts/`, `?list=` playlists, or a bare
   11-char ID) or a **Google Drive share link** (`/file/d/<id>/view`, `open?id=`, `uc?id=`, or a raw file id).
   *Test* renders the exact embed before you save; invalid links are rejected with a message instead of
   silently breaking the player.
3. Prefer your own hosting? Click **Upload a recording instead** — the file is written to
   `public/uploads/<yyyy-mm>/` and its URL is dropped straight into the video field (mp4/webm play in the
   native HTML5 player). Swap `src/app/api/admin/upload/route.ts` for S3/GCS/Cloudinary in production.
4. Mark a lesson **Free preview** so non-enrolled students can watch it from the sales page.
5. **Resources** tab: attach Drive folders, PDFs, sheets — by link or by upload.
6. **Status** panel: *Draft → Published*, optionally *Featured* on the home page. Done.

Reordering, module/lesson deletion, bulk-enrolling a class by pasting emails, resetting a learner's
progress and revoking enrolments are all one click in the same builder.

## 5. Project layout

```
src/
  app/
    (site)/                 # public: home, /courses, /courses/[slug], /login, /pricing
    (learn)/learn/…          # player workspace + curriculum sidebar (light-weight chrome)
    dashboard/               # student: overview, my courses, certificates (+ print view), profile
    admin/                   # admin: overview, courses, course builder, learners, accounts & roles
    api/                     # auth, enrol, progress, review, profile + admin/* mutations
    verify/[credentialId]    # public certificate verification
  components/                # UI kit, course cards, player, curriculum, admin builders
  lib/                       # env, session JWT, video-link parser, markdown, constants, utils
  server/                    # db.ts (node:sqlite wrapper), schema.ts, queries.ts, auth.ts, api.ts
  middleware.ts              # cookie gate for /dashboard /learn /admin
scripts/
  seed.ts                    # demo catalogue (9 courses, 30 modules, 107 lessons)
  check-video-links.ts       # parser regression check (16 link shapes)
public/media/                # generated hero/track imagery
```

**Data model** (`src/server/schema.ts`): `users · courses · modules · lessons · resources · faqs ·
enrollments · lesson_progress · certificates · reviews · activity_log`, with `ON DELETE CASCADE`
so removing a course or learner cleans up progress and certificates in one statement.

## 6. API surface

| Method & path | Auth | Body / effect |
| --- | --- | --- |
| `POST /api/auth/google` | public | `{ credential }` → verify ID token, set session cookie |
| `POST /api/auth/demo` | dev only | `{ email }` → session for an existing/created account |
| `POST /api/auth/logout` | any | clears the cookie |
| `POST /api/enroll` | student | `{ courseSlug, action: enroll \| unenroll }` |
| `POST /api/progress` | student | `{ lessonId, completed?, watchedSecs? }` → recomputes %, issues certificate |
| `POST /api/review` | enrolled | `{ courseSlug, rating, comment }` |
| `POST /api/profile` | student | `{ name, headline?, bio? }` (name used on certificates) |
| `POST /api/admin/courses` | admin | `create \| update \| delete \| publish \| unpublish \| feature \| unfeature`, `GET` lists all |
| `POST /api/admin/curriculum` | admin | `module.*`, `lesson.*`, `resource.*`, `faq.*` (create/update/delete/move) |
| `POST /api/admin/students` | admin | `enroll \| unenroll \| reset` per course |
| `POST /api/admin/users` | admin | `create \| role \| delete` |
| `POST /api/admin/upload` | admin | multipart `file` (+ optional `courseId`, `autoAttach=1`) → `{ url, kind, playable }` |

All mutations are zod-validated (`src/server/api.ts` maps constraint errors to readable messages),
role-checked on every call, and the pages re-read from SQLite on render — no client-side cache drift.

## 7. Notes for production

- **Database**: swap the tiny wrapper in `src/server/db.ts` for Postgres/MySQL (or re-add Prisma/Drizzle);
  the SQL is isolated in `src/server/queries.ts`.
- **Payments**: `/api/enroll` is the seam — create a Razorpay/Stripe order, then mark the enrolment in
  the webhook. The UI already routes paid courses through a checkout dialog.
- **Video hosting**: links (YouTube unlisted or Drive) are the default — no storage bill, no transcoding.
  Drive embeds require sharing set to *Anyone with the link*. Uploads are written to `public/uploads/`, so
  move them to object storage if the instance is ephemeral (serverless) or the disk is small
  (limit is enforced in `src/app/api/admin/upload/route.ts`, 200 MB).
- **Sessions**: set a strong `SESSION_SECRET`, `ALLOW_DEMO_LOGIN=false`, and serve over HTTPS (the cookie
  is `secure` in production).
- `npm run build` compiles all 33 routes; `npm run check:links` re-verifies the link parser.

## 8. Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | dev server on `0.0.0.0:3000` |
| `npm run setup` | create + migrate + seed the SQLite database |
| `npm run db:seed` | re-seed (idempotent, wipes and rebuilds demo data) |
| `npm run check:links` | regression test for YouTube/Drive/Vimeo/mp4 parsing |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | eslint (`next/core-web-vitals`) |
| `npm run build` / `npm start` | production build & serve |
