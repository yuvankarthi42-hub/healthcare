import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Catalyst hosts the web client under /app/. Local `vite` keeps "/".
  base: mode === "production" ? "/app/" : "/",
  server: {
    port: 5173,
    proxy: {
      // In local dev, the CareFlow API runs standalone on :9000 (see
      // functions/careflow-api). In production this is replaced by the
      // deployed Catalyst function URL via VITE_API_BASE_URL.
      "/api": {
        target: process.env.VITE_DEV_API_TARGET || "http://localhost:9000",
        changeOrigin: true,
      },
    },
  },
}));
