/**
 * CareFlow authentication.
 *
 * DEVIATION FROM SPEC (documented in README > What Broke / Limitations):
 * Zoho Projects has no API to programmatically provision new portal users,
 * so the 7 named demo personas cannot be created as real Zoho Projects
 * logins tied to distinct portal accounts - only one live portal user
 * (the org owner) actually exists. CareFlow therefore ships its own
 * lightweight, server-side credential + JWT session layer for the 8 demo
 * roles below. This is a real, working login (not a mock): passwords are
 * checked server-side, sessions are signed JWTs, and every privileged Zoho
 * Projects call happens only after that JWT is verified and RBAC-checked.
 * In a production deployment this layer would be swapped for Catalyst's
 * built-in Authentication (IAM) / OAuth against the org's identity
 * provider - the seam is isolated entirely to this file.
 */
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "careflow-dev-secret-change-me";
const JWT_EXPIRES_IN = "8h";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "CareFlow@2026";

// Demo personas mapped to real clinician names already present in the
// seeded Zoho Projects demo data, so role-scoped ("assigned to me") views
// return meaningful results out of the box.
const DEMO_USERS = [
  {
    email: "care.coordinator@zohotest.com",
    role: "care_coordinator",
    displayName: "Marcus Bellweather, CCM",
    title: "Care Coordinator",
  },
  {
    email: "physician@zohotest.com",
    role: "physician",
    displayName: "Dr. Priya Nair",
    title: "Physician",
  },
  {
    email: "nurse@zohotest.com",
    role: "nurse",
    displayName: "Renee Alvarez, RN",
    title: "Registered Nurse",
  },
  {
    email: "lab@zohotest.com",
    role: "lab_technician",
    displayName: "Lab Services",
    title: "Lab Technician",
  },
  {
    email: "admin@zohotest.com",
    role: "administrator",
    displayName: "System Administrator",
    title: "Administrator",
  },
  {
    email: "superadmin@zohotest.com",
    role: "super_admin",
    displayName: "Vijay A",
    title: "Super Admin",
  },
  {
    email: "specialist@zohotest.com",
    role: "specialist",
    displayName: "Dr. Kevin Osei",
    title: "Orthopedic Specialist",
  },
  {
    email: "therapist@zohotest.com",
    role: "therapist",
    displayName: "Tom Reyes",
    title: "Physical Therapist",
  },
];

function findUser(email) {
  return DEMO_USERS.find((u) => u.email.toLowerCase() === String(email || "").toLowerCase());
}

function login(email, password) {
  const user = findUser(email);
  if (!user) return { error: "No account found for that email." };
  if (password !== DEMO_PASSWORD) return { error: "Incorrect password." };
  const payload = { email: user.email, role: user.role, displayName: user.displayName, title: user.title };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return { token, user: payload };
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/** Express middleware: attaches req.user from a Bearer token, 401s otherwise. */
function requireAuth(req, res, next) {
  // Catalyst Advanced I/O intercepts `Authorization: Bearer …` as its own OAuth token.
  // HealthCare JWT sessions use a dedicated header so they reach this middleware.
  const dedicated = req.headers["x-careflow-token"];
  const header = req.headers.authorization || "";
  const token =
    (typeof dedicated === "string" && dedicated) ||
    (header.startsWith("Bearer ") ? header.slice(7) : null);
  if (!token) return res.status(401).json({ error: "Missing authentication token." });
  try {
    req.user = verifyToken(token);
    next();
  } catch (e) {
    return res.status(401).json({ error: "Session expired or invalid. Please sign in again." });
  }
}

module.exports = { DEMO_USERS, findUser, login, verifyToken, requireAuth, JWT_SECRET };
