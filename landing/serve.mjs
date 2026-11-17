// Production HTTP server for VPS deployment.
//
// The Vite build emits a web-standard `fetch` handler (dist/server/server.js)
// plus static client assets (dist/client). This wrapper serves the assets and
// delegates everything else to the SSR fetch handler.
//
// Run:  node serve.mjs      (respects PORT and HOST env vars)

import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

if (!existsSync(join(__dirname, "dist", "server", "server.js"))) {
  console.error("Build output missing. Run `npm run build` first.");
  process.exit(1);
}

// The SSR fetch handler produced by the build.
const { default: ssrHandler } = await import("./dist/server/server.js");

const app = new Hono();

// Serve built client assets (JS/CSS + anything from public/) straight from disk.
app.use("/*", serveStatic({ root: "./dist/client" }));

// Anything not served as a static file -> server-side render.
app.all("/*", (c) => ssrHandler.fetch(c.req.raw));

serve({ fetch: app.fetch, port: PORT, hostname: HOST }, (info) => {
  console.log(`safepath running at http://${info.address}:${info.port}`);
});
