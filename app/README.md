# BEKA App (PWA)

The BEKA application itself — panic button, incident reporting, **evidence vault**,
case management and the **admin** side. It's an installable PWA (offline-capable).

Part of the `beka-platform` monorepo. It talks to the backend in `../backend` via
`VITE_API_BASE_URL` (default `/api`; the dev server proxies `/api` to
`http://localhost:8080`). See the root `README.md` to run all three parts together.

---


A React + Vite single-page app. This build has been fully decoupled from
Base44 and Lovable. It talks to a backend of your choosing over a plain
REST/JSON API.

> **Important — you need a backend.** Base44 previously supplied this app's
> database, authentication, serverless functions, file storage and LLM calls.
> Removing Base44 makes the frontend build and run cleanly, but the running app
> needs a backend that implements the REST contract described in
> `backend-reference/README.md`. Point the app at it with `VITE_API_BASE_URL`.

---

## Quick start (local)

```bash
npm install
cp .env.example .env.local     # then edit VITE_API_BASE_URL
npm run dev                    # http://localhost:5173
```

## Production build

```bash
npm install
# set the API URL for the build (Vite inlines VITE_* at build time)
VITE_API_BASE_URL=/api npm run build
```

The static site is emitted to `dist/`. Serve that folder with any static web
server (nginx, Caddy, etc.).

---

## Deploying on a VPS (nginx)

Copy `dist/` to your server (e.g. `/var/www/beka`) and use an nginx server block
like this. It serves the SPA and reverse-proxies `/api` to your backend, so
`VITE_API_BASE_URL=/api` works with no CORS setup.

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/beka;
    index index.html;

    # SPA routing — always fall back to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Reverse-proxy the API to your backend service
    location /api/ {
        proxy_pass http://127.0.0.1:8080/;   # <-- your backend
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Long-cache hashed assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Add TLS with certbot (`certbot --nginx`) once DNS points at the box.

---

## What changed when Base44 was removed

- `@base44/sdk` and `@base44/vite-plugin` were removed from `package.json`.
- The Base44 SDK client was replaced by a generic REST client at
  `src/api/client.js` (exported as `apiClient`). It exposes the **same surface**
  the app already used — `entities.<Name>.list/filter/create/update/delete/subscribe`,
  `auth.*`, `functions.invoke(name, payload)`, and
  `integrations.Core.UploadFile / InvokeLLM` — so no UI/page code changed shape.
- `src/lib/app-params.js` now just reads `VITE_API_BASE_URL` and stores the auth
  token in `localStorage` (Base44's appId/token URL handling is gone).
- `AuthContext` was rewritten to use the generic client (no Base44 axios helper).
- Base44/Lovable scaffold files were deleted (the stray TanStack Start server
  stubs and `lovable-error-reporting.ts`, none of which were in the SPA build).
- The three conflicting Vite configs were consolidated into one clean
  `vite.config.js` with the `@` alias.
- Base44 CDN images (logo/coat-of-arms) were replaced with a local
  `public/logo.svg`; dead `.asset.json` placeholders were removed.

### Realtime note

Base44 pushed live updates over a socket; the generic client's `subscribe()`
falls back to polling every 15s. If your backend offers WebSockets or SSE, swap
the implementation in `src/api/client.js` — nothing else needs to change.

---

## backend-reference/

Not part of the deployed frontend. It contains your original data model (17
entity schemas) and the 15 serverless functions as they ran on Base44's Deno
runtime. Use them as the specification for the backend you build or point to.
See `backend-reference/README.md`.
