# safepath

A TanStack Start (React SSR) app. This build has been fully decoupled from
Lovable — the Lovable Vite config wrapper and error-reporting hook are gone,
replaced with a standard, self-contained setup. There is no Base44 in this
project.

## Quick start (local)

```bash
npm install
npm run dev          # http://localhost:3000
```

## Production build & run (VPS)

This is a **server-side rendered** app, so it needs a running Node process (not
just static files).

```bash
npm install
npm run build        # builds client + SSR bundles into dist/
npm start            # = node serve.mjs  (respects PORT / HOST)
```

`serve.mjs` is a small Hono + @hono/node-server wrapper: it serves the built
client assets from `dist/client` and delegates all other requests to the SSR
`fetch` handler in `dist/server/server.js`.

### Run it as a service (systemd)

```ini
# /etc/systemd/system/safepath.service
[Unit]
Description=safepath SSR
After=network.target

[Service]
WorkingDirectory=/var/www/safepath
Environment=PORT=3000
Environment=HOST=127.0.0.1
ExecStart=/usr/bin/node serve.mjs
Restart=on-failure
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now safepath
```

### Put nginx in front (TLS + reverse proxy)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then `certbot --nginx` for HTTPS.

## What changed when Lovable was removed

- Removed `@lovable.dev/vite-tanstack-config` and replaced `vite.config.ts` with
  a standard TanStack Start config (`tanstackStart` + `viteReact` +
  `@tailwindcss/vite` + `vite-tsconfig-paths`), targeting a Node server for VPS
  deployment.
- Deleted `src/lib/lovable-error-reporting.ts` and its call in
  `src/routes/__root.tsx` (the error boundary still logs to the console).
- Repointed Lovable-hosted asset URLs (`/__l5e/...`, used for the landing-page
  screenshots and social `og:image`) to a local `public/app-preview.svg`.
  **Swap in a real screenshot** at `public/app-preview.svg` when you have one.
- Removed dead `.asset.json` placeholders and the Lovable entry from
  `bunfig.toml`.
- Added `serve.mjs` and an `npm start` script for running the SSR build on a VPS
  (the old Lovable config targeted a serverless/edge runtime, not a long-running
  Node process).

> Note: links to `https://safe4all.online` in the landing page are your own
> production domain, not a vendor dependency — left as-is. Update them if your
> domain changes.
