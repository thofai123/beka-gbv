# BEKA Platform

GBV emergency-response platform for Zambia. One repository, three parts:

```
beka-platform/
├── landing/    Marketing site (TanStack Start SSR) — the "Get BEKA" install page
├── app/        The BEKA PWA (React + Vite) — panic button, reports, evidence vault, admin
└── backend/    API server (Node + Express + Prisma + Postgres)
```

- **landing** — public marketing site with a **"Get BEKA" install button** (PWA
  install now; App Store / Play Store badges are placeholders until you submit the
  APK/IPA).
- **app** — the actual application. Survivors report incidents, upload evidence,
  trigger panic alerts; responders/admins manage cases. It's a PWA (installable,
  offline-capable), not yet a native APK.
- **backend** — stores everything: 17 entities, auth, emergency/OTP functions,
  evidence uploads. Replaces the old Base44 backend.

## Prerequisites

- Node 20+ and npm
- Docker (for local Postgres) — or your own Postgres

## Quick start (all three, local)

```bash
# 1. Postgres
docker compose up -d db

# 2. Install everything (npm workspaces)
npm install

# 3. Backend: schema + seed + run
cd backend
cp .env.example .env            # DATABASE_URL default matches docker compose
npx prisma migrate dev --name init
npm run db:seed
npm run dev                     # http://localhost:8080
cd ..

# 4. App (new terminal) — dev server proxies /api to the backend
npm run dev:app                 # http://localhost:5173

# 5. Landing (optional, new terminal)
npm run dev:landing             # http://localhost:3000
```

Seeded admin login: `admin@beka.local` / `ChangeMe123!` (change it).

## How the pieces connect

- The **app** calls the backend via `VITE_API_BASE_URL` (default `/api`). In dev,
  Vite proxies `/api` → `http://localhost:8080`. In production, put nginx in front
  and proxy `/api` to the backend (see `app/README.md`).
- The **landing** links to the app's URL and offers PWA install.
- The **backend** is the single source of truth for data.

## Deployment (VPS)

Each part has its own README with production steps:
- `backend/README.md` — Prisma migrate deploy, env, pm2/systemd, security notes.
- `app/README.md` — static build + nginx with `/api` reverse proxy.
- `landing/README.md` — SSR Node service (systemd) behind nginx.

Typical layout: `your-domain.com` → landing, `app.your-domain.com` → app (served
static, `/api` proxied to the backend on `:8080`).

## Turning the PWA into an APK (later)

The app is a PWA today. To publish on Google Play, wrap it in a Trusted Web
Activity with [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) or
PWABuilder — that produces the signed `.aab`/`.apk`. Then swap the placeholder
store badges in `landing/` for real store links. (Requires your own Play
developer account and signing key.)

## Important: this is a safety-critical app

BEKA handles gender-based-violence reports and emergency alerts. Before real
users rely on it, review the backend's access-control (`backend/src/policies.js`),
secure the evidence-file storage, set strong secrets, and test the emergency
flows end to end. See the security notes in `backend/README.md`.
