# PhotoSpot Georgia

Discover, upload, and share beautiful photography locations across Georgia. A
full-stack Next.js application where photographers, models, and content
creators can scout and browse locations on an interactive map — every
submission is reviewed by an admin before it goes public.

## Tech stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion
- **Maps:** Leaflet + React-Leaflet + Leaflet.markercluster (OpenStreetMap tiles, free, no API key)
- **Backend:** Next.js Route Handlers (API routes), Node.js
- **Database/ORM:** Prisma with SQLite by default (zero setup) — swappable for PostgreSQL
- **Auth:** Custom email/password auth, bcrypt password hashing, JWT session cookies (httpOnly)
- **Image storage:** Local filesystem (`/public/uploads`), images auto-compressed to WebP via `sharp`
- **Geocoding/search:** OpenStreetMap Nominatim (free, client-side calls, no key required)

## Getting started

### 1. Install dependencies

```bash
npm install
```

This project's package downloads were not available in the environment it was
authored in (sandboxed, no registry access), so this is the **first time**
`npm install` actually runs against the real npm registry — do this on a
machine with normal internet access.

### 2. Configure environment variables

```bash
cp .env.example .env
```

The defaults work out of the box for local development (SQLite database,
dev-only JWT secrets). For anything beyond local testing, generate real
secrets:

```bash
openssl rand -base64 48
```

and put them in `JWT_SECRET` / `JWT_RESET_SECRET`.

### 3. Set up the database

```bash
npx prisma migrate dev --name init
npm run db:seed
```

This creates `prisma/dev.db` (SQLite) and seeds it with an admin account, a
few demo users, and a dozen sample locations (mostly approved, a couple
pending/rejected so you can see the moderation workflow immediately).

Seeded accounts (see console output after seeding, or `.env.example` for the
admin credentials):

- **Admin:** `admin@photospot.ge` / `Admin123!` (or whatever you set in `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`)
- **Demo user:** `nino@example.com` / `Demo1234!` (all seeded demo users share this password)

### 4. Run the dev server

```bash
npm run dev
```

Visit http://localhost:3000. Log in as the seeded admin to see `/admin`, or
register a new account (the *very first* account ever created on a fresh
database automatically becomes an admin, so you always have a way in).

## Project structure

```
prisma/schema.prisma       Database schema (Users, Locations, Images, Comments,
                            Likes, Favorites, Notifications, Reports, AdminLogs)
prisma/seed.ts              Demo data seeding script
src/app/                    Next.js App Router pages + API routes
  api/                       All backend REST endpoints (auth, locations,
                              comments, likes, favorites, notifications, admin/*)
  (auth)/                    Login, register, forgot/reset password
  locations/[slug]/          Public location detail + edit pages
  locations/new/              Upload flow
  profile/[username]/        Public profile pages
  dashboard/                  Logged-in user area (My Locations, Favorites,
                              Notifications, Settings)
  admin/                      Admin dashboard (pending review, all locations,
                              users, audit logs)
  map/, search/               Interactive map + global search
src/components/              Reusable UI, map, location, dashboard, admin components
src/lib/                     auth.ts, db.ts, validation.ts, moderation.ts,
                              geo.ts (Haversine distance), notifications.ts,
                              upload.ts (image processing), constants.ts
src/middleware.ts            Route protection (redirects unauthenticated users
                              away from /dashboard, /admin, /locations/new)
```

## Key features implemented

- **Auth:** register, login, logout, "stay logged in" sessions, forgot/reset
  password (dev mode logs the reset link to the console and shows it in the
  UI since no email provider is wired up — see "Connecting a real email
  provider" below), edit profile, avatar upload.
- **Approval workflow:** every new location starts `PENDING`; only `APPROVED`
  locations are publicly visible. Admins can approve, reject (with a note),
  or request changes (with a note) from `/admin/pending`.
- **Interactive map:** clustering, custom markers, popups, fullscreen,
  locate-me, city/category/difficulty filters, and **distance search** (pick
  a point on the map, choose a radius from 1–100km).
- **Location pages:** multi-image gallery with a lightbox (zoom, swipe,
  keyboard nav, counter), comments with replies and likes, likes/favorites,
  nearby locations (within 20km), share (Web Share API + clipboard fallback),
  report flow.
- **Admin dashboard:** stats overview, pending queue, all-locations table
  with edit/delete, user management (ban/unban, promote/demote admin,
  delete), audit log of every admin action.
- **Moderation:** zod validation on every input, a profanity filter, simple
  in-memory rate limiting (submissions/comments/login/register/uploads), and
  duplicate-location detection (title similarity + proximity).
- **Dark mode / light mode**, fully responsive, loading skeletons, empty
  states, custom 404/error pages, SEO metadata + sitemap + robots.txt.

## Switching to PostgreSQL for production

The Prisma schema ships with SQLite for zero-config local development. To
deploy against Postgres (e.g. Railway or Supabase, as suggested in the
original spec):

1. In `prisma/schema.prisma`, change:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Set `DATABASE_URL` to your Postgres connection string.
3. Optionally promote the string "enum-like" fields back to real Postgres
   enums (`Role`, `LocationStatus`, `Difficulty`, `NotificationType`,
   `ReportStatus`) — see the comment block at the top of `schema.prisma` for
   the exact values. This is optional; the app works fine with them as
   validated strings.
4. Run `npx prisma migrate dev` again against the new database.

## Switching image storage to Cloudinary/S3

Images are currently saved to `/public/uploads` via `src/lib/upload.ts`. To
use Cloudinary or S3 instead, replace the body of `saveUploadedImage()` with
an upload call to your provider's SDK and return the resulting hosted URL —
every other part of the app just stores and displays a URL string, so no
other code needs to change.

## Connecting a real email provider

Password reset currently logs the reset link to the server console (and, in
development only, echoes it back in the API response so you can test the
flow without an inbox). To send real emails, wire a provider (Resend,
Postmark, SES, etc.) into `src/app/api/auth/forgot-password/route.ts` where
the `console.log(...)` currently is, and drop the `devResetLink` from the
response.

## Deployment

- **Frontend + API:** Vercel (this is a standard Next.js app, no config
  changes needed beyond environment variables).
- **Database:** Railway or Supabase Postgres (see switching instructions
  above) — SQLite's on-disk file won't survive a serverless deployment.
- **Image storage:** switch to Cloudinary or S3-compatible storage for
  production (see above) — a serverless filesystem is ephemeral.

## A note on how this project was built

This codebase was generated in a sandboxed environment with no access to
npm's package registry, so `npm install`, `prisma generate`, and `next build`
could never be run during development — every file was written by hand and
reviewed manually instead of compiler-verified. Run `npm run type-check` and
`npm run build` as your first step after installing dependencies, and please
report any issues.
