/**
 * Converts raw Zoho Projects records (keyed by Zoho field_name) into clean
 * healthcare-domain JSON objects for the frontend, and back again for writes.
 * This is the ONLY layer that should ever see a Zoho field_name - everything
 * above it (routes, frontend) speaks pure healthcare vocabulary.
 */
const { FIELDS } = require("./zohoSchema");

function pick(record, fieldMap) {
  if (!record || typeof record !== "object") {
    return { id: null };
  }
  const out = {
    id: record.id,
    zohoStatus: record.status?.name,
    createdTime: record.created_time || null,
    updatedTime: record.updated_time || null,
  };
  for (const [key, zohoField] of Object.entries(fieldMap)) {
    out[key] = record[zohoField] ?? null;
  }
  return out;
}

function isBlank(value) {
  return value === undefined || value === null || value === "";
}

function toZohoBody(domainObject, fieldMap, { partial = false } = {}) {
  const body = {};
  for (const [key, zohoField] of Object.entries(fieldMap)) {
    if (partial && !(key in domainObject)) continue;
    if (!isBlank(domainObject[key])) {
      body[zohoField] = domainObject[key];
    }
  }
  return body;
}

/** Zoho custom-module create requires `name` (max 200). Forms that don't collect it get a generated title. */
function withGeneratedName(domainObject, { partial = false } = {}) {
  const next = { ...domainObject };
  if (!next.fullName) {
    const assembled = `${next.firstName || ""} ${next.lastName || ""}`.trim();
    if (assembled) next.fullName = assembled;
  }
  if (next.name || next.fullName || partial) return next;
  next.name =
    [next.teamMember, next.role].filter(Boolean).join(" · ") ||
    [next.appointmentType, next.provider, next.date].filter(Boolean).join(" · ") ||
    next.patientName ||
    "Untitled";
  return next;
}

function unwrapRecord(data) {
  if (!data) return null;
  if (Array.isArray(data)) return data[0] || null;
  if (data.id) return data;
  if (Array.isArray(data.entities)) return data.entities[0] || null;
  const nested = data.entity || data.record || data.data;
  if (nested) return Array.isArray(nested) ? nested[0] : nested;
  return data;
}

const patientFromZoho = (r) => {
  const base = pick(r, FIELDS.patient);
  return {
    ...base,
    id: r.id,
    patientId: base.patientCode,
    fullName: base.fullName || `${base.firstName || ""} ${base.lastName || ""}`.trim(),
  };
};
const patientToZoho = (p, opts) => toZohoBody(withGeneratedName(p, opts), FIELDS.patient, opts);

const carePlanFromZoho = (r) => pick(r, FIELDS.carePlan);
const carePlanToZoho = (p, opts) => toZohoBody(withGeneratedName(p, opts), FIELDS.carePlan, opts);

const careTeamFromZoho = (r) => pick(r, FIELDS.careTeam);
const careTeamToZoho = (p, opts) => toZohoBody(withGeneratedName(p, opts), FIELDS.careTeam, opts);

const clinicalTaskFromZoho = (r) => pick(r, FIELDS.clinicalTask);
const clinicalTaskToZoho = (p, opts) => toZohoBody(withGeneratedName(p, opts), FIELDS.clinicalTask, opts);

const diagnosticFromZoho = (r) => pick(r, FIELDS.diagnostic);
const diagnosticToZoho = (p, opts) => toZohoBody(withGeneratedName(p, opts), FIELDS.diagnostic, opts);

const treatmentFromZoho = (r) => pick(r, FIELDS.treatment);
const treatmentToZoho = (p, opts) => toZohoBody(withGeneratedName(p, opts), FIELDS.treatment, opts);

const appointmentFromZoho = (r) => pick(r, FIELDS.appointment);
const appointmentToZoho = (p, opts) => toZohoBody(withGeneratedName(p, opts), FIELDS.appointment, opts);

const escalationFromZoho = (r) => pick(r, FIELDS.escalation);
const escalationToZoho = (p, opts) => toZohoBody(withGeneratedName(p, opts), FIELDS.escalation, opts);

const progressFromZoho = (r) => pick(r, FIELDS.progress);
const progressToZoho = (p, opts) => toZohoBody(withGeneratedName(p, opts), FIELDS.progress, opts);

const auditLogFromZoho = (r) => ({
  ...pick(r, FIELDS.auditLog),
  timestamp: r.created_time,
});
const auditLogToZoho = (p, opts) => toZohoBody(p, FIELDS.auditLog, opts);

module.exports = {
  unwrapRecord,
  patientFromZoho,
  patientToZoho,
  carePlanFromZoho,
  carePlanToZoho,
  careTeamFromZoho,
  careTeamToZoho,
  clinicalTaskFromZoho,
  clinicalTaskToZoho,
  diagnosticFromZoho,
  diagnosticToZoho,
  treatmentFromZoho,
  treatmentToZoho,
  appointmentFromZoho,
  appointmentToZoho,
  escalationFromZoho,
  escalationToZoho,
  progressFromZoho,
  progressToZoho,
  auditLogFromZoho,
  auditLogToZoho,
};
