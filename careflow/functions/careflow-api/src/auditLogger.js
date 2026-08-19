const { MODULES } = require("./zohoSchema");
const { auditLogToZoho } = require("./mappers");
const zoho = require("./zohoClient");
const dataStore = require("./dataStore");

/**
 * Writes a traceability entry to the Audit Log module in Zoho Projects.
 * Every mutating action in CareFlow (login, create, update, resolve, etc.)
 * routes through here so the Audit Log screen reflects real, live activity.
 */
async function logAction({ actor, actionType, entityType, entityId, entityName, previousValue, newValue }) {
  try {
    const body = auditLogToZoho({
      name: `${actionType} - ${entityName || entityId || ""}`.slice(0, 120),
      actionType,
      entityType,
      entityId: entityId ? String(entityId) : undefined,
      entityName,
      actorUser: actor,
      previousValue: previousValue !== undefined && previousValue !== null ? String(previousValue) : undefined,
      newValue: newValue !== undefined && newValue !== null ? String(newValue) : undefined,
    });
    await zoho.createRecord(MODULES.auditLog, body);
    dataStore.invalidate("auditLog");
  } catch (err) {
    // Audit logging must never break the primary user action.
    // eslint-disable-next-line no-console
    console.error("Audit log write failed:", err.message);
  }
}

module.exports = { logAction };
