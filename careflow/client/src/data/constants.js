export const PRODUCT_NAME = "HealthCare";
export const PRODUCT_TAGLINE = "Healthcare Operations Platform";

/** User-facing module names across navigation, page titles, and permissions UI. */
export const MODULE_LABELS = {
  clinicalTasks: "Care Tasks",
  carePlans: "Care Plans",
  careTeam: "Care Team",
  careProgress: "Care Progress",
  diagnostics: "Diagnostics",
  treatment: "Treatment Plans",
  appointments: "Appointments",
  escalations: "Escalations",
  patients: "Patients",
};

export const ROLE_LABELS = {
  super_admin: "Super Admin",
  administrator: "Administrator",
  physician: "Physician",
  nurse: "Nurse",
  care_coordinator: "Care Coordinator",
  specialist: "Specialist",
  lab_technician: "Lab Technician",
  therapist: "Therapist",
};

/** Demo personas for the login picker and Users & Roles screen. Not a data store — these match Zoho Projects seeded care-team names. */
export const DEMO_ACCOUNTS = [
  { email: "care.coordinator@zohotest.com", role: "care_coordinator", displayName: "Marcus Bellweather, CCM", title: "Care Coordinator" },
  { email: "physician@zohotest.com", role: "physician", displayName: "Dr. Priya Nair", title: "Physician" },
  { email: "nurse@zohotest.com", role: "nurse", displayName: "Renee Alvarez, RN", title: "Registered Nurse" },
  { email: "lab@zohotest.com", role: "lab_technician", displayName: "Lab Services", title: "Lab Technician" },
  { email: "admin@zohotest.com", role: "administrator", displayName: "System Administrator", title: "Administrator" },
  { email: "superadmin@zohotest.com", role: "super_admin", displayName: "Vijay A", title: "Super Admin" },
  { email: "specialist@zohotest.com", role: "specialist", displayName: "Dr. Kevin Osei", title: "Orthopedic Specialist" },
  { email: "therapist@zohotest.com", role: "therapist", displayName: "Tom Reyes", title: "Physical Therapist" },
];

/** Shared demo password for all DEMO_ACCOUNTS. Matches DEMO_PASSWORD in the API .env. */
export const DEMO_PASSWORD = "CareFlow@2026";

export const ENUMS = {
  patientStatus: ["Active", "Inactive", "Discharged", "Transferred", "Archived"],
  riskLevel: ["Low", "Medium", "High", "Critical"],
  carePlanStatus: ["Draft", "Active", "On Hold", "Completed", "Cancelled"],
  careType: [
    "Chronic Care",
    "Post-Surgery",
    "Rehabilitation",
    "Preventive Care",
    "Oncology",
    "Cardiac Care",
    "Diabetes Management",
    "Elder Care",
    "Home Care",
    "General Care",
  ],
  priority: ["Low", "Medium", "High", "Urgent"],
  careTeamRole: ["Physician", "Nurse", "Care Coordinator", "Specialist", "Pharmacist", "Lab Technician", "Therapist", "Dietitian", "Administrator"],
  careTeamStatus: ["Active", "On Leave", "Removed"],
  taskStatus: ["Not Started", "In Progress", "Blocked", "Completed", "Cancelled"],
  taskType: [
    "Follow-up Call",
    "Review Lab Report",
    "Schedule Consultation",
    "Medication Adherence Check",
    "Wound Assessment",
    "Physiotherapy Session",
    "Patient Education",
    "Vital Check",
    "Care Plan Review",
    "Insurance Verification",
    "Review Diagnostic Result",
  ],
  diagnosticStatus: ["Ordered", "Scheduled", "Sample Collected", "Processing", "Result Available", "Reviewed", "Cancelled"],
  testCategory: ["Blood Test", "CBC", "HbA1c", "ECG", "MRI", "CT", "X-Ray", "Ultrasound", "Lipid Profile", "Liver Function Test"],
  treatmentType: ["Medication", "Therapy", "Physiotherapy", "Lifestyle", "Diet", "Procedure", "Follow-up"],
  treatmentStatus: ["Planned", "Active", "Paused", "Completed", "Discontinued"],
  adherence: ["Good", "Needs Attention", "Poor", "Unknown"],
  appointmentType: ["Consultation", "Follow-up", "Diagnostic", "Therapy", "Procedure", "Care Review"],
  appointmentMode: ["In Person", "Video", "Phone"],
  appointmentStatus: ["Scheduled", "Confirmed", "Checked In", "Completed", "No Show", "Cancelled", "Rescheduled"],
  escalationSeverity: ["Low", "Medium", "High", "Critical"],
  escalationStatus: ["Open", "Acknowledged", "In Progress", "Resolved", "Dismissed"],
  escalationSource: [
    "Critical Task Overdue",
    "Diagnostic Result Waiting for Review",
    "Patient Missed Appointment",
    "Treatment Adherence Issue",
    "High-Risk Patient Without Recent Activity",
    "Care Plan Approaching Target Date",
    "Unassigned Clinical Task",
    "Repeated Appointment Cancellation",
    "Required Follow-up Missed",
    "Critical Workflow Blocked",
  ],
};

export const MAIN_NAV = [
  { to: "/", label: "Dashboard", icon: "layout-dashboard", moduleKey: null },
  { to: "/patients", label: "Patients", icon: "users", moduleKey: "patients" },
  { to: "/care-plans", label: "Care Plans", icon: "clipboard-list", moduleKey: "carePlans" },
  { to: "/care-team", label: "Care Team", icon: "user-group", moduleKey: "careTeam" },
  { to: "/tasks", label: "Care Tasks", icon: "check-square", moduleKey: "clinicalTasks" },
  { to: "/diagnostics", label: "Diagnostics", icon: "activity", moduleKey: "diagnostics" },
  { to: "/treatments", label: "Treatment Plans", icon: "pill", moduleKey: "treatment" },
  { to: "/appointments", label: "Appointments", icon: "calendar", moduleKey: "appointments" },
  { to: "/escalations", label: "Escalations", icon: "alert-triangle", moduleKey: "escalations" },
  { to: "/progress", label: "Care Progress", icon: "trending-up", moduleKey: "careProgress" },
];

export const ADMIN_NAV = [
  { to: "/admin/users", label: "Users & Roles", icon: "shield", moduleKey: "usersRoles" },
  { to: "/admin/audit-log", label: "Audit Log", icon: "file-text", moduleKey: "auditLog" },
  { to: "/admin/settings", label: "Settings", icon: "settings", moduleKey: "settings" },
];

export const RISK_COLORS = {
  Low: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Medium: "bg-amber-50 text-amber-700 ring-amber-600/20",
  High: "bg-orange-50 text-orange-700 ring-orange-600/20",
  Critical: "bg-red-50 text-red-700 ring-red-600/20",
};

export const SEVERITY_COLORS = {
  Low: "bg-slate-100 text-slate-700 ring-slate-500/20",
  Medium: "bg-amber-50 text-amber-700 ring-amber-600/20",
  High: "bg-orange-50 text-orange-700 ring-orange-600/20",
  Critical: "bg-red-50 text-red-700 ring-red-600/20",
};

export const STATUS_COLORS = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Draft: "bg-slate-100 text-slate-600 ring-slate-500/20",
  "On Hold": "bg-amber-50 text-amber-700 ring-amber-600/20",
  Completed: "bg-brand-50 text-brand-700 ring-brand-600/20",
  Cancelled: "bg-slate-100 text-slate-500 ring-slate-500/20",
  Inactive: "bg-slate-100 text-slate-500 ring-slate-500/20",
  Discharged: "bg-brand-50 text-brand-700 ring-brand-600/20",
  Transferred: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Archived: "bg-slate-100 text-slate-500 ring-slate-500/20",
  "Not Started": "bg-slate-100 text-slate-600 ring-slate-500/20",
  "In Progress": "bg-brand-50 text-brand-700 ring-brand-600/20",
  Blocked: "bg-red-50 text-red-700 ring-red-600/20",
  Ordered: "bg-slate-100 text-slate-600 ring-slate-500/20",
  Scheduled: "bg-brand-50 text-brand-700 ring-brand-600/20",
  "Sample Collected": "bg-amber-50 text-amber-700 ring-amber-600/20",
  Processing: "bg-amber-50 text-amber-700 ring-amber-600/20",
  "Result Available": "bg-orange-50 text-orange-700 ring-orange-600/20",
  Reviewed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Planned: "bg-slate-100 text-slate-600 ring-slate-500/20",
  Paused: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Discontinued: "bg-red-50 text-red-700 ring-red-600/20",
  Confirmed: "bg-brand-50 text-brand-700 ring-brand-600/20",
  "Checked In": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "No Show": "bg-red-50 text-red-700 ring-red-600/20",
  Rescheduled: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Open: "bg-red-50 text-red-700 ring-red-600/20",
  Acknowledged: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Resolved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Dismissed: "bg-slate-100 text-slate-500 ring-slate-500/20",
};

export const PRIORITY_COLORS = {
  Low: "bg-slate-100 text-slate-600 ring-slate-500/20",
  Medium: "bg-amber-50 text-amber-700 ring-amber-600/20",
  High: "bg-orange-50 text-orange-700 ring-orange-600/20",
  Urgent: "bg-red-50 text-red-700 ring-red-600/20",
};

export const ADHERENCE_COLORS = {
  Good: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "Needs Attention": "bg-amber-50 text-amber-700 ring-amber-600/20",
  Poor: "bg-red-50 text-red-700 ring-red-600/20",
  Unknown: "bg-slate-100 text-slate-500 ring-slate-500/20",
};
