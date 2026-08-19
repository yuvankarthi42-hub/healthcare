/**
 * Single registry mapping every CareFlow "module key" (used in the generic
 * `/api/zoho/:moduleKey` route and in the RBAC matrix) to its Zoho Projects
 * module + mapper + cache key. This is what lets the API layer expose ONE
 * generic Zoho passthrough route instead of a bespoke endpoint per module.
 */
const { MODULES } = require("./zohoSchema");
const dataStore = require("./dataStore");
const mappers = require("./mappers");

const REGISTRY = {
  patients: {
    zohoModule: MODULES.patient,
    listFn: dataStore.patients,
    toZoho: mappers.patientToZoho,
    fromZoho: mappers.patientFromZoho,
    entityLabel: "Patient",
    searchableFields: ["fullName", "patientId", "primaryDiagnosis"],
    cacheKey: "patients",
  },
  carePlans: {
    zohoModule: MODULES.carePlan,
    listFn: dataStore.carePlans,
    toZoho: mappers.carePlanToZoho,
    fromZoho: mappers.carePlanFromZoho,
    entityLabel: "Care Plan",
    searchableFields: ["name", "patientName"],
    cacheKey: "carePlans",
  },
  careTeam: {
    zohoModule: MODULES.careTeam,
    listFn: dataStore.careTeam,
    toZoho: mappers.careTeamToZoho,
    fromZoho: mappers.careTeamFromZoho,
    entityLabel: "Care Team Member",
    searchableFields: ["teamMember", "role", "patientName"],
    cacheKey: "careTeam",
  },
  clinicalTasks: {
    zohoModule: MODULES.clinicalTask,
    listFn: dataStore.clinicalTasks,
    toZoho: mappers.clinicalTaskToZoho,
    fromZoho: mappers.clinicalTaskFromZoho,
    entityLabel: "Clinical Task",
    searchableFields: ["name", "patientName", "assignedTo"],
    cacheKey: "clinicalTasks",
  },
  diagnostics: {
    zohoModule: MODULES.diagnostic,
    listFn: dataStore.diagnostics,
    toZoho: mappers.diagnosticToZoho,
    fromZoho: mappers.diagnosticFromZoho,
    entityLabel: "Diagnostic",
    searchableFields: ["name", "patientName", "orderedBy"],
    cacheKey: "diagnostics",
  },
  treatment: {
    zohoModule: MODULES.treatment,
    listFn: dataStore.treatments,
    toZoho: mappers.treatmentToZoho,
    fromZoho: mappers.treatmentFromZoho,
    entityLabel: "Treatment Plan",
    searchableFields: ["name", "patientName", "prescribedBy"],
    cacheKey: "treatments",
  },
  appointments: {
    zohoModule: MODULES.appointment,
    listFn: dataStore.appointments,
    toZoho: mappers.appointmentToZoho,
    fromZoho: mappers.appointmentFromZoho,
    entityLabel: "Appointment",
    searchableFields: ["provider", "patientName", "location"],
    cacheKey: "appointments",
  },
  escalations: {
    zohoModule: MODULES.escalation,
    listFn: dataStore.escalations,
    toZoho: mappers.escalationToZoho,
    fromZoho: mappers.escalationFromZoho,
    entityLabel: "Escalation",
    searchableFields: ["name", "patientName", "source", "description"],
    cacheKey: "escalations",
  },
  careProgress: {
    zohoModule: MODULES.progress,
    listFn: dataStore.progress,
    toZoho: mappers.progressToZoho,
    fromZoho: mappers.progressFromZoho,
    entityLabel: "Care Progress Entry",
    searchableFields: ["patientName", "nextMilestone"],
    cacheKey: "progress",
  },
  auditLog: {
    zohoModule: MODULES.auditLog,
    listFn: dataStore.auditLog,
    toZoho: mappers.auditLogToZoho,
    fromZoho: mappers.auditLogFromZoho,
    entityLabel: "Audit Log Entry",
    searchableFields: ["actionType", "entityType", "entityName", "actorUser"],
    cacheKey: "auditLog",
  },
};

module.exports = { REGISTRY };
