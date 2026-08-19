/**
 * Client-side mirror of the server's RBAC matrix (functions/careflow-api/src/rbac.js).
 * Used ONLY to shape the UI (hide nav items/buttons the user can't use) -
 * every mutating action is re-checked server-side regardless of what this
 * says, per the "never rely only on hiding buttons" requirement.
 */
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
const SCOPED = { view: "scoped", create: false, edit: "scoped", delete: false, assign: false };

export const MATRIX = {
  super_admin: {
    patients: FULL, carePlans: FULL, careTeam: FULL, clinicalTasks: FULL, diagnostics: FULL, treatment: FULL,
    appointments: FULL, escalations: FULL, careProgress: FULL, usersRoles: FULL, auditLog: VIEW_ALL, settings: FULL,
  },
  administrator: {
    patients: FULL, carePlans: FULL, careTeam: FULL, clinicalTasks: FULL, diagnostics: FULL, treatment: FULL,
    appointments: FULL, escalations: FULL, careProgress: FULL, usersRoles: VIEW_ALL, auditLog: VIEW_ALL, settings: { ...VIEW_ALL, edit: "org" },
  },
  physician: {
    patients: ASSIGNED_RO, carePlans: CREATE_EDIT_ALL, careTeam: VIEW_ALL, clinicalTasks: ASSIGNED_RW,
    diagnostics: { view: "all", create: false, edit: "all", delete: false, assign: false }, treatment: FULL,
    appointments: ASSIGNED_RO, escalations: CREATE_VIEW, careProgress: VIEW_ALL, usersRoles: NONE, auditLog: NONE, settings: NONE,
  },
  nurse: {
    patients: ASSIGNED_RO, carePlans: VIEW_ALL, careTeam: VIEW_ALL, clinicalTasks: ASSIGNED_RW, diagnostics: VIEW_ALL,
    treatment: VIEW_ALL, appointments: ASSIGNED_RO, escalations: CREATE_VIEW, careProgress: SCOPED, usersRoles: NONE, auditLog: NONE, settings: NONE,
  },
  care_coordinator: {
    patients: FULL, carePlans: FULL, careTeam: FULL, clinicalTasks: FULL, diagnostics: TRACK, treatment: TRACK,
    appointments: FULL, escalations: FULL, careProgress: FULL, usersRoles: NONE, auditLog: NONE, settings: NONE,
  },
  specialist: {
    patients: ASSIGNED_RO, carePlans: EDIT_ASSIGNED, careTeam: VIEW_ALL, clinicalTasks: ASSIGNED_RW, diagnostics: VIEW_ALL,
    treatment: EDIT_ASSIGNED, appointments: ASSIGNED_RO, escalations: CREATE_VIEW, careProgress: SCOPED, usersRoles: NONE, auditLog: NONE, settings: NONE,
  },
  lab_technician: {
    patients: LIMITED, carePlans: VIEW_ALL, careTeam: VIEW_ALL, clinicalTasks: SCOPED,
    diagnostics: { view: "all", create: false, edit: "all", delete: false, assign: false },
    treatment: NONE, appointments: SCOPED, escalations: CREATE_VIEW, careProgress: VIEW_ALL, usersRoles: NONE, auditLog: NONE, settings: NONE,
  },
  therapist: {
    patients: ASSIGNED_RO, carePlans: EDIT_ASSIGNED, careTeam: VIEW_ALL, clinicalTasks: SCOPED, diagnostics: VIEW_ALL,
    treatment: SCOPED, appointments: ASSIGNED_RO, escalations: CREATE_VIEW, careProgress: SCOPED, usersRoles: NONE, auditLog: NONE, settings: NONE,
  },
};

export function getPermission(role, moduleKey) {
  return MATRIX[role]?.[moduleKey] || NONE;
}

export function canView(role, moduleKey) {
  return getPermission(role, moduleKey).view !== "none";
}
export function canCreate(role, moduleKey) {
  return !!getPermission(role, moduleKey).create;
}
export function canEditAny(role, moduleKey) {
  const e = getPermission(role, moduleKey).edit;
  return e === "all" || e === true;
}
export function canDelete(role, moduleKey) {
  return !!getPermission(role, moduleKey).delete;
}

export const MODULE_KEYS = [
  "patients", "carePlans", "careTeam", "clinicalTasks", "diagnostics", "treatment",
  "appointments", "escalations", "careProgress", "usersRoles", "auditLog", "settings",
];

export const ROLES = [
  "super_admin", "administrator", "physician", "nurse", "care_coordinator", "specialist", "lab_technician", "therapist",
];

/**
 * Client-side mirror of the server's isAssignedToUser (rbac.js) - used to
 * build "my workload" views from lists the backend already RBAC-filtered.
 * Never relied on as the security boundary itself (that's server-side).
 */
export function isAssignedToUser(record, user) {
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
