/** Client-side global search: matches against records already fetched from the generic /api/zoho/* endpoints. */
import { formatTaskTitle } from "./format";

function match(text, q) {
  return text && String(text).toLowerCase().includes(q);
}

export function runSearch(query, { patients, carePlans, careTeam, tasks, diagnostics, appointments, escalations }) {
  const q = (query || "").trim().toLowerCase();
  if (q.length < 2) return { query: q, results: null };

  const patientMatches = patients.filter((p) => match(p.fullName, q) || match(p.patientId, q) || match(p.primaryDiagnosis, q));
  const matchedPatientIds = new Set(patientMatches.map((p) => p.patientId));

  const results = {
    patients: patientMatches.slice(0, 8).map((p) => ({ type: "patient", id: p.id, title: p.fullName, subtitle: p.primaryDiagnosis, patientId: p.patientId })),
    carePlans: carePlans
      .filter((r) => match(r.name, q) || matchedPatientIds.has(r.patientId))
      .slice(0, 6)
      .map((r) => ({ type: "carePlan", id: r.id, title: r.name, subtitle: r.patientName, patientId: r.patientId })),
    careTeam: careTeam
      .filter((r) => match(r.teamMember, q) || matchedPatientIds.has(r.patientId))
      .slice(0, 6)
      .map((r) => ({ type: "careTeam", id: r.id, title: r.teamMember, subtitle: `${r.role} - ${r.patientName}`, patientId: r.patientId })),
    tasks: tasks
      .filter((r) => match(r.name, q) || match(r.taskType, q) || matchedPatientIds.has(r.patientId))
      .slice(0, 6)
      .map((r) => ({ type: "task", id: r.id, title: formatTaskTitle(r), subtitle: r.patientName, patientId: r.patientId })),
    diagnostics: diagnostics
      .filter((r) => match(r.name, q) || matchedPatientIds.has(r.patientId))
      .slice(0, 6)
      .map((r) => ({ type: "diagnostic", id: r.id, title: r.name, subtitle: r.patientName, patientId: r.patientId })),
    appointments: appointments
      .filter((r) => match(r.provider, q) || matchedPatientIds.has(r.patientId))
      .slice(0, 6)
      .map((r) => ({ type: "appointment", id: r.id, title: `${r.appointmentType} - ${r.provider}`, subtitle: r.patientName, patientId: r.patientId })),
    escalations: escalations
      .filter((r) => match(r.name, q) || match(r.source, q) || matchedPatientIds.has(r.patientId))
      .slice(0, 6)
      .map((r) => ({ type: "escalation", id: r.id, title: r.name, subtitle: `${r.severity} - ${r.patientName}`, patientId: r.patientId })),
  };

  return { query: q, results };
}
