/**
 * CareFlow Catalyst function.
 *
 * No CareFlow-specific REST APIs (no /api/patients, /api/dashboard, etc.).
 * Persistent data is Zoho Projects custom modules only.
 *
 *   POST /api/auth/login     — demo login (challenge requirement)
 *   GET/POST/PATCH/DELETE /api/zoho/:moduleKey  — Zoho Projects records
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { requireAuth } = require("./src/auth");
const authRoutes = require("./src/routes/auth");
const zohoRoutes = require("./src/routes/zoho");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "careflow-api" }));

app.use("/api/auth", authRoutes);
app.use("/api", requireAuth);
app.use("/api/zoho", zohoRoutes);

app.use((req, res) => res.status(404).json({ error: `No route for ${req.method} ${req.path}` }));

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

const PORT = process.env.X_ZOHO_CATALYST_LISTEN_PORT || process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log(`CareFlow API listening on port ${PORT}`);
});

module.exports = app;
