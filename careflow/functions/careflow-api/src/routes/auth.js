const express = require("express");
const { login, requireAuth, DEMO_USERS } = require("../auth");
const { logAction } = require("../auditLogger");
const { ROLE_LABELS } = require("../rbac");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required." });
  const result = login(email, password);
  if (result.error) return res.status(401).json({ error: result.error });
  await logAction({
    actor: result.user.displayName,
    actionType: "Login",
    entityType: "Session",
    entityName: `${ROLE_LABELS[result.user.role]} Login`,
  });
  res.json(result);
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user, roleLabel: ROLE_LABELS[req.user.role] });
});

// Exposed only for the Login screen's "demo accounts" helper panel - no secrets included.
router.get("/demo-accounts", (_req, res) => {
  res.json({
    accounts: DEMO_USERS.map((u) => ({ email: u.email, role: u.role, title: u.title, displayName: u.displayName })),
    passwordHint: "Shared demo password - see README (Demo Credentials).",
  });
});

module.exports = router;
