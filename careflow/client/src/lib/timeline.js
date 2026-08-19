/** Builds a unified, reverse-chronological activity timeline for a patient, client-side. */
export function buildPatientTimeline({ carePlans, careTeam, tasks, diagnostics, treatments, appointments, escalations, progress }) {
  const events = [];

  const push = (at, icon, text, meta) => {
    if (!at) return;
    events.push({ at, icon, text, meta });
  };

  carePlans.forEach((p) => {
    push(p.createdTime || p.startDate, "care_plan", `Care plan "${p.name}" created`, { type: "carePlan", id: p.id });
    if (p.status === "Completed") push(p.updatedTime, "care_plan", `Care plan "${p.name}" completed`, { type: "carePlan", id: p.id });
  });

  careTeam.forEach((m) => {
    push(m.assignmentDate || m.createdTime, "care_team", `${m.teamMember} assigned as ${m.role}`, { type: "careTeam", id: m.id });
  });

  tasks.forEach((t) => {
    if (t.completedDate) push(t.completedDate, "task", `Task completed: ${t.name}`, { type: "task", id: t.id });
    else push(t.createdTime, "task", `Task created: ${t.name}`, { type: "task", id: t.id });
  });

  diagnostics.forEach((d) => {
    if (d.completedDate) push(d.completedDate, "diagnostic", `Diagnostic result added: ${d.name}`, { type: "diagnostic", id: d.id });
    else push(d.orderedDate || d.createdTime, "diagnostic", `Diagnostic ordered: ${d.name}`, { type: "diagnostic", id: d.id });
  });

  treatments.forEach((t) => {
    push(t.createdTime || t.startDate, "treatment", `Treatment plan updated: ${t.name}`, { type: "treatment", id: t.id });
  });

  appointments.forEach((a) => {
    if (a.status === "Completed") push(a.date, "appointment", `Appointment completed: ${a.appointmentType} with ${a.provider}`, { type: "appointment", id: a.id });
    else if (a.status === "No Show") push(a.date, "appointment", `Missed appointment: ${a.appointmentType} with ${a.provider}`, { type: "appointment", id: a.id });
    else push(a.createdTime || a.date, "appointment", `Appointment scheduled: ${a.appointmentType} with ${a.provider}`, { type: "appointment", id: a.id });
  });

  escalations.forEach((e) => {
    if (e.status === "Resolved") push(e.resolvedDate || e.updatedTime, "escalation", `Escalation resolved: ${e.name}`, { type: "escalation", id: e.id });
    else push(e.createdTime, "escalation", `Escalation raised: ${e.name}`, { type: "escalation", id: e.id });
  });

  progress.forEach((p) => {
    push(p.metricDate || p.createdTime, "progress", `Progress recorded: ${p.nextMilestone || "milestone update"}`, { type: "progress", id: p.id });
  });

  return events
    .filter((e) => e.at && !Number.isNaN(new Date(e.at).getTime()))
    .sort((a, b) => new Date(b.at) - new Date(a.at));
}
