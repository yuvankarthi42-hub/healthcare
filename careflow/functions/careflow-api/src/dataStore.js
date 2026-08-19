/**
 * Data access layer: fetches from Zoho Projects (source of truth) and maps
 * to domain objects. A short-lived in-memory cache smooths out the many
 * cross-module aggregations the dashboard / patient workspace need without
 * ever caching writes or serving stale data past a few seconds.
 */
const { MODULES } = require("./zohoSchema");
const zoho = require("./zohoClient");
const mappers = require("./mappers");

const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 15000);
const cache = new Map();

async function cached(key, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;
  const value = await fn();
  cache.set(key, { value, at: Date.now() });
  return value;
}

function invalidate(prefix) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

async function fetchAll(moduleApiName) {
  // Zoho paginates at up to 200/page; walk pages until short of a full page.
  const perPage = 200;
  let page = 1;
  let all = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const batch = await zoho.listRecords(moduleApiName, { page, perPage });
    all = all.concat(batch);
    if (batch.length < perPage) break;
    page += 1;
    if (page > 25) break; // safety valve
  }
  return all;
}

const listers = {
  patients: () => cached("patients", async () => (await fetchAll(MODULES.patient)).map(mappers.patientFromZoho)),
  carePlans: () => cached("carePlans", async () => (await fetchAll(MODULES.carePlan)).map(mappers.carePlanFromZoho)),
  careTeam: () => cached("careTeam", async () => (await fetchAll(MODULES.careTeam)).map(mappers.careTeamFromZoho)),
  clinicalTasks: () =>
    cached("clinicalTasks", async () => (await fetchAll(MODULES.clinicalTask)).map(mappers.clinicalTaskFromZoho)),
  diagnostics: () =>
    cached("diagnostics", async () => (await fetchAll(MODULES.diagnostic)).map(mappers.diagnosticFromZoho)),
  treatments: () =>
    cached("treatments", async () => (await fetchAll(MODULES.treatment)).map(mappers.treatmentFromZoho)),
  appointments: () =>
    cached("appointments", async () => (await fetchAll(MODULES.appointment)).map(mappers.appointmentFromZoho)),
  escalations: () =>
    cached("escalations", async () => (await fetchAll(MODULES.escalation)).map(mappers.escalationFromZoho)),
  progress: () => cached("progress", async () => (await fetchAll(MODULES.progress)).map(mappers.progressFromZoho)),
  auditLog: () => cached("auditLog", async () => (await fetchAll(MODULES.auditLog)).map(mappers.auditLogFromZoho)),
};

module.exports = { ...listers, invalidate, fetchAll };
