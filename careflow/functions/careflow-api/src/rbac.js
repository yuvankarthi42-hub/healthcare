/**
 * Role-based access control.
 *
 * This encodes the permission matrix from the CareFlow spec (section 16)
 * plus Super Admin (full, system-wide) and Administrator (operational,
 * non-clinical) roles. It is enforced HERE, server-side, on every mutating
 * and every scoped-read request - the frontend's PermissionGate component
 * mirrors these same rules only to shape the UI, never as the sole guard.
 */

const ROLES = [
  "super_admin",
  "administrator",
  "physician",
  "nurse",
  "care_coordinator",
  "specialist",
  "lab_technician",
  "therapist",
];

const MODULE_KEYS = [
  "patients",
  "carePlans",
  "careTeam",
  "clinicalTasks",
  "diagnostics",
  "treatment",
  "appointments",
  "escalations",
  "careProgress",
  "usersRoles",
  "auditLog",
  "settings",
];

// Presets: view -> 'all' | 'assigned' | 'limited' | 'none'
//          edit -> 'all' | 'assigned' | 'none'
const FULL = { view: "all", create: true, edit: "all", delete: true, assign: true };
const VIEW_ALL = { view: "all", create: false, edit: "none", delete: false, assign: false };
const ASSIGNED_RW = { view: "assigned", create: false, edit: "assigned", delete: false, assign: false };
const ASSIGNED_RO = { view: "assigned", create: false, edit: "none", delete: false, assign: false };
const CREATE_EDIT_ALL = { view: "all", create: true, edit: "all", delete: false, assign: false };
const EDIT_ASSIGNED = { view: "assigned", create: false, edit: "assigned", delete: false, assign: false };
const TRACK = { view: "all", create: false, edit: "assigned", delete: false, assign: false };
const CREATE_VIEW = { view: "all", create: true, edit: "none", delete: false, assign: false };
const LIMITED = { view: "limited", create: false, edit: "none", delete: false, assign: false };
const NONE = { view: "none", create: false, edit: "none", delete: false, assign: false };
const SCOPED_UPDATE = { view: "scoped", create: false, edit: "scoped", delete: false, assign: false };

const MATRIX = {
  super_admin: {
    patients: FULL,
    carePlans: FULL,
    careTeam: FULL,
    clinicalTasks: FULL,
    diagnostics: FULL,
    treatment: FULL,
    appointments: FULL,
    escalations: FULL,
    careProgress: FULL,
    usersRoles: FULL,
    auditLog: VIEW_ALL,
    settings: FULL,
  },
  administrator: {
    patients: FULL,
    carePlans: FULL,
    careTeam: FULL,
    clinicalTasks: FULL,
    diagnostics: FULL,
    treatment: FULL,
    appointments: FULL,
    escalations: FULL,
    careProgress: FULL,
    usersRoles: VIEW_ALL,
    auditLog: VIEW_ALL,
    settings: { ...VIEW_ALL, edit: "org" },
  },
  physician: {
    patients: ASSIGNED_RO,
    carePlans: CREATE_EDIT_ALL,
    careTeam: VIEW_ALL,
    clinicalTasks: ASSIGNED_RW,
    diagnostics: { view: "all", create: false, edit: "all", delete: false, assign: false }, // Review
    treatment: FULL,
    appointments: ASSIGNED_RO,
    escalations: CREATE_VIEW,
    careProgress: VIEW_ALL,
    usersRoles: NONE,
    auditLog: NONE,
    settings: NONE,
  },
  nurse: {
    patients: ASSIGNED_RO,
    carePlans: VIEW_ALL,
    careTeam: VIEW_ALL,
    clinicalTasks: ASSIGNED_RW,
    diagnostics: VIEW_ALL,
    treatment: VIEW_ALL,
    appointments: ASSIGNED_RO,
    escalations: CREATE_VIEW,
    careProgress: SCOPED_UPDATE,
    usersRoles: NONE,
    auditLog: NONE,
    settings: NONE,
  },
  care_coordinator: {
    patients: FULL,
    carePlans: FULL,
    careTeam: FULL,
    clinicalTasks: FULL,
    diagnostics: TRACK,
    treatment: TRACK,
    appointments: FULL,
    escalations: FULL,
    careProgress: FULL,
    usersRoles: NONE,
    auditLog: NONE,
    settings: NONE,
  },
  specialist: {
    patients: ASSIGNED_RO,
    carePlans: EDIT_ASSIGNED,
    careTeam: VIEW_ALL,
    clinicalTasks: ASSIGNED_RW,
    diagnostics: VIEW_ALL,
    treatment: EDIT_ASSIGNED,
    appointments: ASSIGNED_RO,
    escalations: CREATE_VIEW,
    careProgress: SCOPED_UPDATE,
    usersRoles: NONE,
    auditLog: NONE,
    settings: NONE,
  },
  lab_technician: {
    patients: LIMITED,
    carePlans: VIEW_ALL,
    careTeam: VIEW_ALL,
    clinicalTasks: { view: "scoped", create: false, edit: "scoped", delete: false, assign: false }, // Diagnostic tasks only
    diagnostics: { view: "all", create: false, edit: "all", delete: false, assign: false }, // Update status/result
    treatment: NONE,
    appointments: { view: "scoped", create: false, edit: "none", delete: false, assign: false }, // Lab-related only
    escalations: CREATE_VIEW,
    careProgress: VIEW_ALL,
    usersRoles: NONE,
    auditLog: NONE,
    settings: NONE,
  },
  therapist: {
    patients: ASSIGNED_RO,
    carePlans: EDIT_ASSIGNED,
    careTeam: VIEW_ALL,
    clinicalTasks: { view: "scoped", create: false, edit: "scoped", delete: false, assign: false }, // Therapy tasks
    diagnostics: VIEW_ALL,
    treatment: { view: "scoped", create: false, edit: "scoped", delete: false, assign: false }, // Therapy treatments
    appointments: ASSIGNED_RO,
    escalations: CREATE_VIEW,
    careProgress: SCOPED_UPDATE,
    usersRoles: NONE,
    auditLog: NONE,
    settings: NONE,
  },
};

const ROLE_LABELS = {
  super_admin: "Super Admin",
  administrator: "Administrator",
  physician: "Physician",
  nurse: "Nurse",
  care_coordinator: "Care Coordinator",
  specialist: "Specialist",
  lab_technician: "Lab Technician",
  therapist: "Therapist",
};

function getPermission(role, moduleKey) {
  return MATRIX[role]?.[moduleKey] || NONE;
}

/** Does `user` have at least read access to a specific record? */
function canViewRecord(role, moduleKey, record, user) {
  const perm = getPermission(role, moduleKey);
  if (perm.view === "none") return false;
  if (perm.view === "all") return true;
  if (perm.view === "limited") return true; // limited = visible but redacted at serializer level
  // assigned / scoped: match against clinician-name-bearing fields
  return isAssignedToUser(record, user);
}

/** Does `user` have edit rights on a specific record? */
function canEditRecord(role, moduleKey, record, user) {
  const perm = getPermission(role, moduleKey);
  if (perm.edit === "none" || perm.edit === false) return false;
  if (perm.edit === "all" || perm.edit === true) return true;
  return isAssignedToUser(record, user);
}

/** Delete follows the matrix `delete` flag, and the record must still be in the user's view scope. */
function canDeleteRecord(role, moduleKey, record, user) {
  const perm = getPermission(role, moduleKey);
  if (!perm.delete) return false;
  return canViewRecord(role, moduleKey, record, user);
}

function isAssignedToUser(record, user) {
  if (!record || !user) return false;
  const name = user.displayName;
  const candidates = [
    record.assignedTo,
    record.primaryPhysician,
    record.careCoordinator,
    record.assignedCoordinator,
    record.teamMember,
    record.prescribedBy,
    record.orderedBy,
    record.provider,
    record.resolvedBy,
  ];
  return candidates.some((c) => c && name && c.toLowerCase() === name.toLowerCase());
}

const LAB_TASK_TYPES = ["Review Lab Report", "Insurance Verification", "Review Diagnostic Result"];
const THERAPY_TASK_TYPES = ["Physiotherapy Session"];
const THERAPY_TREATMENT_TYPES = ["Physiotherapy", "Therapy"];

/**
 * Applies view-scope filtering to a list of already-mapped domain records.
 * Handles the plain 'assigned' (name match) cases as well as the special
 * 'scoped' and 'limited' cases called out in the permission matrix
 * (Lab Technician's diagnostic-only task/appointment view, Therapist's
 * therapy-only task/treatment view, Lab Technician's limited patient view).
 */
function filterByScope(role, moduleKey, records, user) {
  const perm = getPermission(role, moduleKey);
  if (perm.view === "none") return [];
  if (perm.view === "all") return records;
  if (perm.view === "limited") return records; // redaction happens in serializer
  if (perm.view === "assigned") return records.filter((r) => isAssignedToUser(r, user));

  if (perm.view === "scoped") {
    if (role === "lab_technician") {
      if (moduleKey === "clinicalTasks") {
        return records.filter((r) => LAB_TASK_TYPES.includes(r.taskType) || /lab|diagnostic/i.test(r.taskType || ""));
      }
      if (moduleKey === "appointments") {
        return records.filter((r) => r.appointmentType === "Diagnostic" || /lab|imaging/i.test(r.location || ""));
      }
    }
    if (role === "therapist") {
      if (moduleKey === "clinicalTasks") {
        return records.filter(
          (r) => THERAPY_TASK_TYPES.includes(r.taskType) || /physio|therap/i.test(r.taskType || "") || isAssignedToUser(r, user)
        );
      }
      if (moduleKey === "treatment") {
        return records.filter((r) => THERAPY_TREATMENT_TYPES.includes(r.treatmentType) || isAssignedToUser(r, user));
      }
    }
    return records.filter((r) => isAssignedToUser(r, user));
  }
  return records;
}

/** Redacts sensitive fields for 'limited' view scope (e.g. Lab Technician on Patients). */
function redactForLimitedView(role, moduleKey, record) {
  const perm = getPermission(role, moduleKey);
  if (perm.view !== "limited") return record;
  const { id, patientId, fullName, dateOfBirth, gender, riskLevel, primaryDiagnosis } = record;
  return { id, patientId, fullName, dateOfBirth, gender, riskLevel, primaryDiagnosis, limitedView: true };
}

/** Express middleware factory: require at least `minView` on a module. */
function requireModuleAccess(moduleKey) {
  return (req, res, next) => {
    const perm = getPermission(req.user.role, moduleKey);
    if (perm.view === "none") {
      return res.status(403).json({ error: `Your role (${ROLE_LABELS[req.user.role]}) cannot access this area.` });
    }
    req.permission = perm;
    next();
  };
}

module.exports = {
  ROLES,
  ROLE_LABELS,
  MODULE_KEYS,
  MATRIX,
  getPermission,
  canViewRecord,
  canEditRecord,
  canDeleteRecord,
  isAssignedToUser,
  filterByScope,
  redactForLimitedView,
  requireModuleAccess,
};
