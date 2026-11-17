import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

// Standard TanStack Start config (replaces the former Lovable wrapper).
// Deploys as a Node server on a VPS via nitro's node-server preset.
export default defineConfig({
  server: {
    port: 3000,
    host: true,
  },
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({
      customViteReactPlugin: true,
      // Redirect the bundled server entry to src/server.ts (SSR error wrapper).
      server: { entry: "./src/server.ts" },
      // Build a standalone Node server for VPS deployment.
      target: "node-server",
    }),
    viteReact(),
  ],
});
