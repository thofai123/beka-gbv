import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { attachUser } from "./auth.js";
import authRoutes from "./routes/auth.js";
import entityRoutes from "./routes/entities.js";
import functionRoutes from "./routes/functions.js";
import integrationRoutes from "./routes/integrations.js";
import { UPLOAD_DIR } from "./routes/integrations.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 8080;

const origins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({ origin: origins.length ? origins : true, credentials: true }));

app.use(express.json({ limit: "2mb" }));
app.use(attachUser);

// API Router (mounted at both /api and root so both Docker production and Vite dev proxy work seamlessly)
const api = express.Router();
api.get("/health", (_req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() })
);
api.get("/public-settings", (_req, res) => {
  res.json({
    id: "beka",
    public_settings: {
      app_name: "BEKA",
      requires_auth: false,
    },
  });
});
api.use("/auth", authRoutes);
api.use("/entities", entityRoutes);
api.use("/functions", functionRoutes);
api.use("/integrations", integrationRoutes);

app.use("/api", api);
app.use("/", api);

// Serve uploaded evidence files
app.use("/uploads", express.static(UPLOAD_DIR));

// Serve compiled React SPA in production when app/dist exists
const distDir = path.resolve(__dirname, "..", "..", "app", "dist");
if (fs.existsSync(distDir)) {
  app.use("/beka", express.static(distDir));
  app.use(express.static(distDir));

  app.get("/", (_req, res) => res.redirect(302, "/beka/"));
  app.get("/beka/*", (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}
app.use(attachUser);

// API Router...
// --- SERVE FRONTEND STATIC ASSETS ---
const frontendDistPath = path.resolve('/srv/beka/app/dist');
app.use(express.static(frontendDistPath));

// Catch-all route to support React Router (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// 404 Handler (must be after static routes so API 404s still work)
app.use((req, res) =>
  res.status(404).json({ message: `No route: ${req.method} ${req.path}` })
);
// --- SERVE FRONTEND STATIC ASSETS ---
const frontendDistPath = path.join(__dirname, '../app/dist');
app.use(express.static(frontendDistPath));

// Catch-all route to support React Router (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// 404 Handler (must be after static routes so API 404s still work)
app.use((req, res) =>
  res.status(404).json({ message: `No route: ${req.method} ${req.path}` })
);
// 404
app.use((req, res) =>
  res.status(404).json({ message: `No route: ${req.method} ${req.path}` })
);

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || "Internal server error" });
});

// START SERVER
app.listen(PORT, "0.0.0.0", () => {
  console.log(`BEKA server listening on http://0.0.0.0:${PORT}`);
});
