import { ENUMS } from "./constants";

/** Prepends a patient-picker field for standalone module screens (outside the patient workspace, where the patient is already known). */
export function withPatientSelect(fields) {
  return [{ key: "patientId", label: "Patient", type: "patientSelect", required: true, colSpan: 2 }, ...fields];
}

export const carePlanFields = [
  { key: "name", label: "Plan Name", required: true, colSpan: 2 },
  { key: "primaryCondition", label: "Primary Condition", required: true },
  { key: "careType", label: "Care Type", type: "select", options: ENUMS.careType, required: true },
  { key: "startDate", label: "Start Date", type: "date", required: true },
  { key: "targetEndDate", label: "Target End Date", type: "date" },
  { key: "assignedCoordinator", label: "Assigned Coordinator" },
  { key: "priority", label: "Priority", type: "select", options: ENUMS.priority },
  { key: "status", label: "Status", type: "select", options: ENUMS.carePlanStatus },
  { key: "goal", label: "Goal", colSpan: 2 },
  { key: "notes", label: "Notes", type: "textarea", colSpan: 2 },
];

export const careTeamFields = [
  { key: "teamMember", label: "Team Member Name", required: true },
  { key: "role", label: "Role", type: "select", options: ENUMS.careTeamRole, required: true },
  { key: "department", label: "Department" },
  { key: "responsibility", label: "Responsibility", colSpan: 2 },
  { key: "assignmentDate", label: "Assignment Date", type: "date" },
  { key: "status", label: "Status", type: "select", options: ENUMS.careTeamStatus },
];

export const taskFields = [
  { key: "name", label: "Task Name", required: true, colSpan: 2 },
  { key: "taskType", label: "Task Type", type: "select", options: ENUMS.taskType, required: true },
  { key: "assignedTo", label: "Assigned To", required: true },
  { key: "priority", label: "Priority", type: "select", options: ENUMS.priority, required: true },
  { key: "dueDate", label: "Due Date", type: "date", required: true },
  { key: "status", label: "Status", type: "select", options: ENUMS.taskStatus },
  { key: "notes", label: "Notes", type: "textarea", colSpan: 2 },
];

export const diagnosticFields = [
  { key: "name", label: "Test Name", required: true, colSpan: 2 },
  { key: "testCategory", label: "Test Category", type: "select", options: ENUMS.testCategory, required: true },
  { key: "orderedBy", label: "Ordered By", required: true },
  { key: "orderedDate", label: "Ordered Date", type: "date", required: true },
  { key: "scheduledDate", label: "Scheduled Date", type: "date" },
  { key: "priority", label: "Priority", type: "select", options: ENUMS.priority },
  { key: "status", label: "Status", type: "select", options: ENUMS.diagnosticStatus },
  { key: "resultSummary", label: "Result Summary (demo/fictional)", type: "textarea", colSpan: 2 },
  { key: "notes", label: "Notes", type: "textarea", colSpan: 2 },
];

export const treatmentFields = [
  { key: "name", label: "Treatment Name", required: true, colSpan: 2 },
  { key: "treatmentType", label: "Treatment Type", type: "select", options: ENUMS.treatmentType, required: true },
  { key: "prescribedBy", label: "Prescribed By", required: true },
  { key: "startDate", label: "Start Date", type: "date", required: true },
  { key: "endDate", label: "End Date", type: "date" },
  { key: "frequency", label: "Frequency" },
  { key: "status", label: "Status", type: "select", options: ENUMS.treatmentStatus },
  { key: "adherence", label: "Adherence", type: "select", options: ENUMS.adherence },
  { key: "notes", label: "Notes", type: "textarea", colSpan: 2 },
];

export const appointmentFields = [
  { key: "provider", label: "Provider", required: true },
  { key: "appointmentType", label: "Appointment Type", type: "select", options: ENUMS.appointmentType, required: true },
  { key: "date", label: "Date", type: "date", required: true },
  { key: "startTime", label: "Start Time", type: "time" },
  { key: "endTime", label: "End Time", type: "time" },
  { key: "location", label: "Location" },
  { key: "mode", label: "Mode", type: "select", options: ENUMS.appointmentMode },
  { key: "status", label: "Status", type: "select", options: ENUMS.appointmentStatus },
  { key: "reason", label: "Reason", colSpan: 2 },
  { key: "notes", label: "Notes", type: "textarea", colSpan: 2 },
];

export const escalationFields = [
  { key: "name", label: "Title", required: true, colSpan: 2 },
  { key: "source", label: "Source", type: "select", options: ENUMS.escalationSource, required: true },
  { key: "severity", label: "Severity", type: "select", options: ENUMS.escalationSeverity, required: true },
  { key: "assignedTo", label: "Assigned To", required: true },
  { key: "dueDate", label: "Due Date", type: "date" },
  { key: "description", label: "Description", type: "textarea", colSpan: 2, required: true },
];

export const progressFields = [
  { key: "name", label: "Entry Name", required: true, colSpan: 2 },
  { key: "metricDate", label: "Metric Date", type: "date", required: true },
  { key: "carePlanCompletionPct", label: "Care Plan Completion %", type: "number" },
  { key: "taskCompletionPct", label: "Task Completion %", type: "number" },
  { key: "treatmentAdherencePct", label: "Treatment Adherence %", type: "number" },
  { key: "diagnosticCompletionPct", label: "Diagnostic Completion %", type: "number" },
  { key: "appointmentAdherencePct", label: "Appointment Adherence %", type: "number" },
  { key: "overdueTasksCount", label: "Overdue Tasks", type: "number" },
  { key: "openEscalationsCount", label: "Open Escalations", type: "number" },
  { key: "daysSinceLastActivity", label: "Days Since Last Activity", type: "number" },
  { key: "nextMilestone", label: "Next Milestone", colSpan: 2 },
  { key: "goalProgressNotes", label: "Goal Progress Notes", type: "textarea", colSpan: 2 },
];
