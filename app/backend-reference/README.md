# Backend reference & REST contract

This folder is **not** part of the deployed frontend. It is the specification
for the backend that the BEKA app expects to talk to. When BEKA ran on Base44,
these entities and functions lived on Base44's platform. To run BEKA on your own
infrastructure, implement the endpoints below (in any language/framework) and
point the app at them via `VITE_API_BASE_URL`.

- `entities/` — the 17 data models (JSON schema-ish `.jsonc` files).
- `functions/` — the 15 serverless functions as they ran on Base44's Deno
  runtime. They still contain Base44 SDK calls (`@base44/sdk`) and Deno APIs;
  treat them as **reference logic to port**, not runnable code. They document
  real behaviour: the SMS provider (Africala/SMSala), OTP format and expiry,
  escalation timing, WhatsApp webhook handling, etc.

The frontend calls this backend exclusively through `src/api/client.js`. Every
route below maps to a method there, so the contract is fully defined by that
file plus this document.

## Base URL

All paths are relative to `VITE_API_BASE_URL` (default `/api`). All requests and
responses are JSON unless noted. Authenticated requests carry
`Authorization: Bearer <token>`.

## Entities — generic CRUD

For each entity `<Name>` in `entities/`, implement:

| Method & path | Purpose | Notes |
|---|---|---|
| `GET /entities/<Name>` | list | query params: `sort` (e.g. `-created_date`), `limit`, `skip` |
| `GET /entities/<Name>/filter` | filtered list | query params: `where` (JSON-encoded object), `sort`, `limit`, `skip` |
| `GET /entities/<Name>/:id` | fetch one | |
| `POST /entities/<Name>` | create | body = entity fields; return the created record |
| `PUT /entities/<Name>/:id` | update | body = changed fields; return updated record |
| `DELETE /entities/<Name>/:id` | delete | |

Records should include at least `id` and `created_date` (the UI sorts by
`-created_date`). The `where` filter uses simple field equality; a few call
sites also use `{ field: { $in: [...] } }` (see `AdminIncidentMap`), so support
`$in` at minimum.

Entities: `AccessCode`, `AuditLog`, `Case`, `CaseUpdate`, `EmergencyContact`,
`EvidenceVault`, `IncidentLog`, `Message`, `Notification`, `OtpVerification`,
`PanicAlert`, `Resource`, `ResponseUnit`, `StaffMessage`, `TwoFactorCode`,
`User`, `WhatsAppSession`.

### Realtime
The client's `subscribe()` currently **polls** `GET /entities/<Name>` every 15s.
No realtime endpoint is required. If you add WebSockets/SSE later, update
`subscribe()` in `src/api/client.js`.

## Auth

| Method & path | Purpose |
|---|---|
| `GET /auth/me` | current user (401/403 if not logged in) |
| `PATCH /auth/me` | update current user profile |
| `POST /auth/login` | body `{ email, password }` → `{ access_token, ...user }` |
| `POST /auth/register` | body `{ email, password, full_name }` |
| `POST /auth/verify-otp` | body `{ email, otp }` → may return `{ access_token }` |
| `POST /auth/resend-otp` | body `{ email }` |
| `POST /auth/reset-password/request` | body `{ email }` |
| `POST /auth/reset-password` | body `{ reset_token, new_password }` |
| `POST /auth/logout` | invalidate session (best-effort) |
| `GET /auth/oauth/:provider?redirect=<url>` | start OAuth; redirect back with `?access_token=...` |

The frontend stores `access_token` in `localStorage` and sends it as a Bearer
token. After OAuth, redirect the browser back to `redirect` with
`?access_token=...` appended — the app captures and strips it on load.

## Functions

`POST /functions/<name>` with a JSON body; respond with a JSON body. The client
wraps the response as `{ data: <body> }`.

Implement these (see `functions/<name>/` for the original logic):
`acknowledgeAlert`, `checkEscalations`, `getLivePosition`,
`notifyEmergencyContacts`, `redeemAccessCode`, `sendAlertSMS`, `sendOTP`,
`submitReport`, `testSMS`, `triggerEmergency`, `updateCaseStatus`,
`updateLiveLocation`, `verifyOTP`, `whatsappWebhook`.

Notable payloads used by the app:
- `submitReport` → returns `{ ...case }` (the created case).
- `triggerEmergency` → `{ location_lat, location_lng, location_captured_at, is_silent, client_idempotency_key }`; must be idempotent on `client_idempotency_key` (the app retries from an offline queue).
- `sendOTP` / `verifyOTP` → `{ phoneNumber }` / `{ phoneNumber, otp }`.
- `redeemAccessCode` → `{ code }`.

## Integrations

| Method & path | Purpose |
|---|---|
| `POST /integrations/upload` | `multipart/form-data` with field `file` → `{ file_url }` |
| `POST /integrations/llm` | `{ prompt, response_json_schema }` → object matching the schema (used for GBV risk assessment) |

If you don't wire up an LLM, return a static default such as
`{ risk_level: "medium", ai_summary: "" }` — the report flow already treats the
LLM step as best-effort.
