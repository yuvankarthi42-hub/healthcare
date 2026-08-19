/**
 * The ONE generic route CareFlow's backend exposes for Zoho Projects data:
 *   GET/POST/PATCH/DELETE `/api/zoho/:moduleKey[/:id]`.
 *
 * There are no bespoke per-module endpoints (no `/api/patients`,
 * `/api/dashboard`, `/api/search`, etc.) - every screen fetches raw,
 * RBAC-filtered Zoho Projects records through this single passthrough and
 * does its own aggregation/search/AI-summary/automation computation in the
 * React app (see client/src/lib/*.js). This route's only jobs are the two
 * things that must never happen in the browser: holding the Zoho OAuth
 * token (see zohoClient.js) and enforcing the RBAC permission matrix.
 */
const express = require("express");
const { REGISTRY } = require("../moduleRegistry");
const dataStore = require("../dataStore");
const zoho = require("../zohoClient");
const { getPermission, canEditRecord, canDeleteRecord, filterByScope, redactForLimitedView, isAssignedToUser } = require("../rbac");
const { logAction } = require("../auditLogger");
const { unwrapRecord } = require("../mappers");

const router = express.Router();

const WRITE_BLOCKED = new Set(["auditLog"]);
const RESERVED_QUERY_KEYS = new Set(["search", "ownerOnly"]);

function sendError(res, err) {
  const status = err.status && Number(err.status) >= 400 && Number(err.status) < 600 ? Number(err.status) : 500;
  res.status(status).json({ error: err.message });
}

function blockAuditWrites(moduleKey, res) {
  if (!WRITE_BLOCKED.has(moduleKey)) return false;
  res.status(403).json({ error: "The audit log is append-only and cannot be created, edited, or deleted here." });
  return true;
}

async function mapWriteResult(entry, raw, fallbackId) {
  let record = unwrapRecord(raw) || raw;
  const id = record?.id || fallbackId;
  if (id) {
    try {
      const fresh = await zoho.getRecord(entry.zohoModule, id);
      record = unwrapRecord(fresh) || record;
    } catch (_) {
      // Fall back to the write payload if a refetch fails.
    }
  }
  if (!record || typeof record !== "object") return { id: id || null };
  return entry.fromZoho(record);
}

async function loadVisibleRecord(moduleKey, id, req) {
  const entry = REGISTRY[moduleKey];
  const records = await scopedList(moduleKey, req);
  return records.find((r) => String(r.id) === String(id));
}

function displayNameOf(record, body) {
  return (
    body?.name ||
    body?.fullName ||
    body?.patientName ||
    record?.name ||
    record?.fullName ||
    record?.patientName ||
    record?.teamMember
  );
}

/** Patients get bespoke scoping: visible if directly assigned OR a care-team member for that patient (no native Zoho lookup - see README > Limitations). */
async function scopedPatients(role, user) {
  const perm = getPermission(role, "patients");
  const patients = await dataStore.patients();
  if (perm.view === "all") return patients;
  if (perm.view === "none") return [];
  if (perm.view === "limited") return patients;

  const careTeam = await dataStore.careTeam();
  const myPatientIds = new Set(
    careTeam.filter((m) => m.teamMember && m.teamMember.toLowerCase() === user.displayName.toLowerCase()).map((m) => m.patientId)
  );
  return patients.filter((p) => isAssignedToUser(p, user) || myPatientIds.has(p.patientId) || myPatientIds.has(String(p.id)));
}

async function scopedList(moduleKey, req) {
  if (moduleKey === "patients") return scopedPatients(req.user.role, req.user);
  const records = await REGISTRY[moduleKey].listFn();
  return filterByScope(req.user.role, moduleKey, records, req.user);
}

function applyQuery(records, query, searchableFields) {
  let out = records;
  for (const [key, value] of Object.entries(query)) {
    if (RESERVED_QUERY_KEYS.has(key) || value === undefined || value === "") continue;
    out = out.filter((r) => String(r[key] ?? "") === String(value));
  }
  if (query.search) {
    const q = String(query.search).toLowerCase();
    out = out.filter((r) => searchableFields.some((f) => String(r[f] || "").toLowerCase().includes(q)));
  }
  return out;
}

function checkModuleAccess(req, res, next) {
  const entry = REGISTRY[req.params.moduleKey];
  if (!entry) return res.status(404).json({ error: `Unknown module "${req.params.moduleKey}".` });
  const perm = getPermission(req.user.role, req.params.moduleKey);
  if (perm.view === "none") {
    return res.status(403).json({ error: "Your role cannot access this area." });
  }
  req.permission = perm;
  next();
}

router.get("/:moduleKey", checkModuleAccess, async (req, res) => {
  try {
    const { moduleKey } = req.params;
    const entry = REGISTRY[moduleKey];
    let records = await scopedList(moduleKey, req);
    records = applyQuery(records, req.query, entry.searchableFields);
    if (req.query.ownerOnly === "true") {
      records = records.filter((r) => isAssignedToUser(r, req.user));
    }
    if (req.permission.view === "limited") {
      records = records.map((r) => redactForLimitedView(req.user.role, moduleKey, r));
    }
    res.json({ items: records, permission: req.permission });
  } catch (err) {
    sendError(res, err);
  }
});

router.get("/:moduleKey/:id", checkModuleAccess, async (req, res) => {
  try {
    const { moduleKey, id } = req.params;
    const entry = REGISTRY[moduleKey];
    const records = await scopedList(moduleKey, req);
    const record = records.find((r) => String(r.id) === String(id));
    if (!record) return res.status(404).json({ error: `${entry.entityLabel} not found or not accessible.` });
    const item = req.permission.view === "limited" ? redactForLimitedView(req.user.role, moduleKey, record) : record;
    res.json({ item, permission: req.permission });
  } catch (err) {
    sendError(res, err);
  }
});

router.post("/:moduleKey", checkModuleAccess, async (req, res) => {
  try {
    const { moduleKey } = req.params;
    if (blockAuditWrites(moduleKey, res)) return;
    const entry = REGISTRY[moduleKey];
    const perm = getPermission(req.user.role, moduleKey);
    if (!perm.create) return res.status(403).json({ error: `You do not have permission to create a ${entry.entityLabel}.` });

    const body = entry.toZoho(req.body || {});
    if (!body.name) {
      return res.status(400).json({ error: `${entry.entityLabel} requires a name.` });
    }
    const created = await zoho.createRecord(entry.zohoModule, body);
    dataStore.invalidate(entry.cacheKey);
    const item = await mapWriteResult(entry, created);

    await logAction({
      actor: req.user.displayName,
      actionType: `${entry.entityLabel} Created`,
      entityType: entry.entityLabel,
      entityId: req.body.patientId || item?.id,
      entityName: displayNameOf(item, req.body),
      newValue: `Created by ${req.user.displayName}`,
    });
    res.status(201).json({ item });
  } catch (err) {
    sendError(res, err);
  }
});

router.patch("/:moduleKey/:id", checkModuleAccess, async (req, res) => {
  try {
    const { moduleKey, id } = req.params;
    if (blockAuditWrites(moduleKey, res)) return;
    const entry = REGISTRY[moduleKey];
    const existing = await loadVisibleRecord(moduleKey, id, req);
    if (!existing) return res.status(404).json({ error: `${entry.entityLabel} not found.` });
    if (!canEditRecord(req.user.role, moduleKey, existing, req.user)) {
      return res.status(403).json({ error: `You do not have permission to edit this ${entry.entityLabel}.` });
    }

    const body = entry.toZoho(req.body || {}, { partial: true });
    if (!Object.keys(body).length) {
      return res.status(400).json({ error: "No fields to update." });
    }
    const updated = await zoho.updateRecord(entry.zohoModule, id, body);
    dataStore.invalidate(entry.cacheKey);
    const item = await mapWriteResult(entry, updated, id);

    const changedKeys = Object.keys(req.body || {}).filter((k) => k !== "id");
    const summary = changedKeys.map((k) => `${k}: ${existing[k]} -> ${req.body[k]}`).join("; ");
    await logAction({
      actor: req.user.displayName,
      actionType: `${entry.entityLabel} Updated`,
      entityType: entry.entityLabel,
      entityId: existing.patientId || existing.id,
      entityName: displayNameOf(existing, req.body),
      previousValue: summary ? "see new value" : undefined,
      newValue: summary || "Updated",
    });
    res.json({ item });
  } catch (err) {
    sendError(res, err);
  }
});

router.delete("/:moduleKey/:id", checkModuleAccess, async (req, res) => {
  try {
    const { moduleKey, id } = req.params;
    if (blockAuditWrites(moduleKey, res)) return;
    const entry = REGISTRY[moduleKey];
    const existing = await loadVisibleRecord(moduleKey, id, req);
    if (!existing) return res.status(404).json({ error: `${entry.entityLabel} not found.` });
    if (!canDeleteRecord(req.user.role, moduleKey, existing, req.user)) {
      return res.status(403).json({ error: `You do not have permission to delete this ${entry.entityLabel}.` });
    }

    await zoho.trashRecord(entry.zohoModule, id);
    dataStore.invalidate(entry.cacheKey);

    await logAction({
      actor: req.user.displayName,
      actionType: `${entry.entityLabel} Deleted`,
      entityType: entry.entityLabel,
      entityId: existing.patientId || existing.id,
      entityName: displayNameOf(existing, {}),
      previousValue: existing.status || existing.patientStatus || undefined,
      newValue: `Moved to recycle bin by ${req.user.displayName}`,
    });
    res.json({ ok: true, id });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
