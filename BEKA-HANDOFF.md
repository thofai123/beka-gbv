BEKA / Safe4All handoff
=======================

Last updated: 2026-10-20. Read this first in a new chat.

What it is
----------
BEKA / Safe4All is the ZCSIF GBV emergency response platform for Zambia.
Live at safe4all.online (landing, SSR) and app.safe4all.online (PWA, routes under /beka/).
Monorepo with landing/ (TanStack Start), app/ (Vite + React Router PWA) and backend/ (Express + Prisma + Postgres).

Where things live
-----------------
WSL (hangoma@Dripcard): source at ~/beka-platform-src/beka-platform. Node 22 via nvm. Do not build landing here with old Node 18.
VPS (lwipasilungwe@srv884148): app lives in /var/www/beka (moved from ~/beka-platform on 2026-10-20, owned by lwipasilungwe).
Bare git repo on VPS: /home/lwipasilungwe/git/beka-platform.git (origin for both sides).
APK: /var/www/beka-downloads/beka.apk, served at https://safe4all.online/downloads/beka.apk

Runtime on the VPS
------------------
pm2 beka-backend: /var/www/beka/backend, node src/index.js, port 8090 (reads backend/.env).
pm2 beka-landing: /var/www/beka/landing, node serve.mjs, PORT=3600.
App: static files served by Nginx from /var/www/beka/app/dist.
Nginx configs: /etc/nginx/sites-available/safe4all.online.conf and app.safe4all.online.conf (both enabled).
Nginx backup of the app config: app.safe4all.online.conf.bak-pre-move.
The VPS hosts 15+ other live sites. Always check ports with sudo ss -tlnp before using one. 3601 is used for test runs.

Deploy workflow
---------------
1. Edit on WSL, commit, git push origin main.
2. On the VPS: cd /var/www/beka && git pull origin main
3. Rebuild on the VPS (Node 20.20.2): app and/or landing, then pm2 restart beka-landing if landing changed.
4. No scp. Walk the user through changes one step at a time.

Rollback copies
---------------
Old folder ~/beka-platform on the VPS is kept as a rollback and still holds dist.pre-*, dist.bak*, src.pre-otp and .env.bak-cors.
Delete them after a few stable days. Not copied to /var/www/beka.

State as of 2026-10-20
----------------------
Latest commit on main: bd53767 (Fix nav pill wrapping).
Both sites verified live from /var/www/beka after the move.
Earlier that day the user reported "can't see it" but the server was fine (200 OK on both domains); cause was on the viewing side, not yet identified.
Legal pages (terms, privacy, cookies) are live but are a draft, not lawyer reviewed.
Password reset fix deployed (commit 83d9954). Browser test of the reset flow still pending.
sendOTP now returns an error and logs an [otp] line on SMS failure. Real SMSala failure cause still to confirm with a test send.
Mobile app: Capacitor wrap, app ID online.safe4all.beka, branch mobile-app (commit 36c0b80, not merged). Confirm build status.
CORS_ORIGINS on the VPS needs https://localhost and capacitor://localhost added before the mobile app can sign in.

Open items
----------
Record consent in backend.
Lawyer review of legal pages.
Confirm support@safe4all.zm is monitored.
Registration OTP bug.
PWA install prompt shows on every visit.
OTP uses Math.random, has no rate limit on sendOTP and no attempt limit on verifyOTP.
backend/src/routes/integrations.js has an LLM TODO stub.
app/src/components/ui/calendar.tsx and resizable.tsx are unused and have type errors.
Stray file /etc/nginx/sites-available/safe4all.online.con (typo, harmless) can be removed.
