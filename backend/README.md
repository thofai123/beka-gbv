# BEKA Backend

Node + Express + Prisma + Postgres. Implements everything the BEKA app stores:
the 17 entities (generic CRUD with role-based access), authentication, the
emergency/OTP/report functions, and evidence-vault file uploads.

## Setup

```bash
# 1. Start Postgres (from the repo root):  docker compose up -d db
# 2. Configure env
cp .env.example .env          # edit DATABASE_URL, JWT_SECRET, etc.
# 3. Install + generate client
npm install
# 4. Create the schema
npx prisma migrate dev --name init
# 5. Seed an admin user + access codes + sample resources
npm run db:seed
# 6. Run
npm run dev                    # http://localhost:8080
```

Default seeded admin: `admin@beka.local` / `ChangeMe123!` (override with
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`). **Change this before production.**

## API surface

- `POST /auth/register|login`, `GET/PATCH /auth/me`, `POST /auth/logout`,
  `POST /auth/reset-password/request|/reset-password`
- `GET|POST|PUT|DELETE /entities/:name` (+ `/entities/:name/filter`) — generic
  CRUD for all 17 entities, scoped by role (survivors see only their own cases,
  evidence, contacts; staff/admin see more).
- `POST /functions/:name` — triggerEmergency, submitReport, sendOTP, verifyOTP,
  redeemAccessCode, acknowledgeAlert, updateCaseStatus, updateLiveLocation,
  getLivePosition, notifyEmergencyContacts, checkEscalations, sendAlertSMS,
  testSMS, whatsappWebhook.
- `POST /integrations/upload` — evidence/attachment upload → `{ file_url }`.
- `POST /integrations/llm` — GBV risk assessment (returns a safe default until
  you configure `LLM_PROVIDER`).

## Integrations to configure

- **SMS** (OTP + emergency alerts): set `AFRICALA_API_TOKEN` (SMSala/Africala).
  Without it, SMS is logged and skipped so the app still runs.
- **LLM** (optional risk scoring): set `LLM_PROVIDER` and wire the call in
  `src/routes/integrations.js`.
- **OAuth** (optional Google login): implement `GET /auth/oauth/:provider` in
  `src/routes/auth.js`.

## Security notes (this is a GBV safety app — please review before launch)

- Access control lives in `src/policies.js` + `src/routes/entities.js`. Review it
  against your real-world rules before going live.
- Uploaded evidence is currently served as static files from `/uploads`. Evidence
  is sensitive — put it behind authentication or signed URLs, and consider
  encrypting at rest, before real users upload anything.
- Set a strong `JWT_SECRET` and real `CORS_ORIGINS` in production.

## Production

```bash
npm install
npx prisma migrate deploy
npm run start        # or run under pm2 / systemd
```
