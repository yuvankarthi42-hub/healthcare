import { isAssignedToUser } from "../data/rbac";

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}
function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

const SEVERITY_RANK = { Critical: 0, High: 1, Medium: 2, Low: 3 };

/** Computes every widget on the Dashboard from raw, already-fetched module lists (client-side aggregation). */
export function buildDashboardData({ patients, carePlans, tasks, diagnostics, appointments, escalations, careTeam, user }) {
  const activePatients = patients.filter((p) => p.patientStatus === "Active");
  const activeCarePlans = carePlans.filter((p) => p.status === "Active");
  const openTasks = tasks.filter((t) => !["Completed", "Cancelled"].includes(t.status));
  const tasksDueToday = openTasks.filter((t) => isToday(t.dueDate));
  const overdueTasks = openTasks.filter((t) => isOverdue(t.dueDate));
  const todaysAppointments = appointments.filter((a) => isToday(a.date) && !["Cancelled"].includes(a.status));
  const openEscalations = escalations.filter((e) => !["Resolved", "Dismissed"].includes(e.status));
  const highRiskPatients = patients.filter((p) => ["High", "Critical"].includes(p.riskLevel));
  const nearCompletionPlans = activeCarePlans.filter((p) => (p.completionPct || 0) >= 80);
  const diagnosticsAwaitingReview = diagnostics.filter((d) => d.status === "Result Available");

  const kpis = {
    activePatients: activePatients.length,
    activeCarePlans: activeCarePlans.length,
    tasksDueToday: tasksDueToday.length,
    overdueTasks: overdueTasks.length,
    todaysAppointments: todaysAppointments.length,
    openEscalations: openEscalations.length,
    highRiskPatients: highRiskPatients.length,
    carePlansNearCompletion: nearCompletionPlans.length,
  };

  const escalationCenter = {
    critical: openEscalations.filter((e) => e.severity === "Critical").length,
    high: openEscalations.filter((e) => e.severity === "High").length,
    medium: openEscalations.filter((e) => e.severity === "Medium").length,
    top: [...openEscalations].sort((a, b) => (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9)).slice(0, 6),
  };

  const patientRisk = {
    low: patients.filter((p) => p.riskLevel === "Low").length,
    medium: patients.filter((p) => p.riskLevel === "Medium").length,
    high: patients.filter((p) => p.riskLevel === "High").length,
    critical: patients.filter((p) => p.riskLevel === "Critical").length,
  };

  const topCarePlans = [...activeCarePlans].sort((a, b) => (b.completionPct || 0) - (a.completionPct || 0)).slice(0, 6);

  const workloadByMember = {};
  careTeam
    .filter((m) => m.status !== "Removed")
    .forEach((m) => {
      const key = m.teamMember || "Unassigned";
      if (!workloadByMember[key]) workloadByMember[key] = { member: key, role: m.role, assignedTasks: 0, overdueTasks: 0, activePatients: new Set() };
      workloadByMember[key].activePatients.add(m.patientId);
    });
  tasks.forEach((t) => {
    const key = t.assignedTo;
    if (!key) return;
    if (!workloadByMember[key]) workloadByMember[key] = { member: key, role: "", assignedTasks: 0, overdueTasks: 0, activePatients: new Set() };
    if (!["Completed", "Cancelled"].includes(t.status)) workloadByMember[key].assignedTasks += 1;
    if (isOverdue(t.dueDate) && !["Completed", "Cancelled"].includes(t.status)) workloadByMember[key].overdueTasks += 1;
  });
  const teamWorkload = Object.values(workloadByMember)
    .map((w) => ({ ...w, activePatients: w.activePatients.size }))
    .sort((a, b) => b.assignedTasks - a.assignedTasks)
    .slice(0, 10);

  const recentActivity = []
    .concat(
      tasks.filter((t) => t.status === "Completed" && t.completedDate).map((t) => ({ at: t.completedDate, text: `Task completed: ${t.name}`, type: "task" })),
      diagnostics.filter((d) => d.completedDate).map((d) => ({ at: d.completedDate, text: `Diagnostic updated: ${d.name}`, type: "diagnostic" })),
      appointments.filter((a) => a.status === "Completed").map((a) => ({ at: a.date, text: `Appointment completed: ${a.appointmentType} - ${a.patientName}`, type: "appointment" })),
      escalations.map((e) => ({ at: e.createdTime, text: `Escalation created: ${e.name}`, type: "escalation" })),
      carePlans.filter((p) => p.updatedTime).map((p) => ({ at: p.updatedTime, text: `Care plan updated: ${p.name}`, type: "carePlan" }))
    )
    .filter((e) => e.at && !Number.isNaN(new Date(e.at).getTime()))
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 12);

  const todaysCare = {
    appointments: todaysAppointments.slice(0, 8),
    tasks: tasksDueToday.slice(0, 8),
    diagnosticsForReview: diagnosticsAwaitingReview.slice(0, 8),
  };

  const myTasks = tasks.filter((t) => isAssignedToUser(t, user) && !["Completed", "Cancelled"].includes(t.status));
  const myAppointments = appointments.filter((a) => isAssignedToUser(a, user) && isToday(a.date));
  const myDiagnostics = diagnostics.filter((d) => isAssignedToUser(d, user) && d.status !== "Reviewed");
  const myEscalations = openEscalations.filter((e) => isAssignedToUser(e, user));
  const myPatients = patients.filter((p) => isAssignedToUser(p, user));

  return {
    kpis,
    escalationCenter,
    patientRisk,
    topCarePlans,
    teamWorkload,
    recentActivity,
    todaysCare,
    mine: {
      tasks: myTasks.slice(0, 8),
      appointments: myAppointments,
      diagnostics: myDiagnostics.slice(0, 8),
      escalations: myEscalations.slice(0, 8),
      patients: myPatients.slice(0, 8),
    },
    role: user.role,
  };
}
