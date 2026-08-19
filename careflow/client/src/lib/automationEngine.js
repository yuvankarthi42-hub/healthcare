import api from "./apiClient";

/**
 * Workflow automation ("escalation engine") - runs entirely in the browser,
 * on demand (Settings / Dashboard "Run Automation Now", for roles allowed
 * to manage escalations). It fetches the current raw records through the
 * generic `/api/zoho/*` endpoints, evaluates the same five operational
 * rules the original design called for, and writes any new escalations /
 * review tasks back through the same generic `POST /api/zoho/:moduleKey`
 * endpoint - the backend's own RBAC + audit logging cover every write.
 *
 * Every rule is intentionally OPERATIONAL, not clinical: it never invents a
 * diagnosis or treatment decision, it only raises visibility on things a
 * human already defined as important (a high priority task, a no-show, a
 * result being ready to look at, an inactive high-risk patient, a plan
 * running out of runway).
 */
const HIGH_RISK_INACTIVITY_DAYS = 7;
const CARE_PLAN_END_WARNING_DAYS = 21;
const CARE_PLAN_LOW_COMPLETION_THRESHOLD = 70;

function daysBetween(a, b) {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function existingEscalationFor(escalations, source, patientId, marker) {
  return escalations.find(
    (e) =>
      e.source === source &&
      e.patientId === patientId &&
      ["Open", "Acknowledged", "In Progress"].includes(e.status) &&
      (!marker || (e.description || "").includes(marker))
  );
}

async function createEscalation(fields) {
  const res = await api.post("/api/zoho/escalations", {
    name: fields.name,
    patientId: fields.patientId,
    patientName: fields.patientName,
    carePlanId: fields.carePlanId,
    source: fields.source,
    severity: fields.severity,
    description: fields.description,
    assignedTo: fields.assignedTo,
    status: "Open",
  });
  return res.data.item;
}

export async function runAutomation() {
  const [{ data: patientsRes }, { data: carePlansRes }, { data: tasksRes }, { data: diagnosticsRes }, { data: appointmentsRes }, { data: escalationsRes }, { data: progressRes }] =
    await Promise.all([
      api.get("/api/zoho/patients"),
      api.get("/api/zoho/carePlans"),
      api.get("/api/zoho/clinicalTasks"),
      api.get("/api/zoho/diagnostics"),
      api.get("/api/zoho/appointments"),
      api.get("/api/zoho/escalations"),
      api.get("/api/zoho/careProgress"),
    ]);

  const patients = patientsRes.items;
  const carePlans = carePlansRes.items;
  const tasks = tasksRes.items;
  const diagnostics = diagnosticsRes.items;
  const appointments = appointmentsRes.items;
  const escalations = escalationsRes.items;
  const progress = progressRes.items;

  const today = new Date();
  const results = { overdueTasks: [], missedAppointments: [], diagnosticReviews: [], highRiskInactivity: [], planNearEnd: [] };
  const patientByCode = new Map(patients.map((p) => [p.patientId, p]));

  // 1. Overdue high-priority task -> escalation
  for (const task of tasks) {
    if (["Completed", "Cancelled"].includes(task.status)) continue;
    if (!task.dueDate) continue;
    const due = new Date(task.dueDate);
    const isOverdue = due < today;
    const isHighPriority = ["High", "Urgent"].includes(task.priority);
    if (isOverdue && isHighPriority) {
      const marker = `task:${task.id}`;
      if (!existingEscalationFor(escalations, "Critical Task Overdue", task.patientId, marker)) {
        const created = await createEscalation({
          name: `Overdue: ${task.name}`,
          patientId: task.patientId,
          patientName: task.patientName,
          carePlanId: task.carePlanId,
          source: "Critical Task Overdue",
          severity: task.priority === "Urgent" ? "Critical" : "High",
          description: `[${marker}] Task "${task.name}" (priority ${task.priority}) is overdue (due ${task.dueDate}).`,
          assignedTo: task.assignedTo,
        });
        results.overdueTasks.push(created?.id);
      }
    }
  }

  // 2. No Show appointment -> escalation
  for (const appt of appointments) {
    if (appt.status !== "No Show") continue;
    const marker = `appt:${appt.id}`;
    if (!existingEscalationFor(escalations, "Patient Missed Appointment", appt.patientId, marker)) {
      const created = await createEscalation({
        name: `Missed Appointment: ${appt.name}`,
        patientId: appt.patientId,
        patientName: appt.patientName,
        carePlanId: appt.carePlanId,
        source: "Patient Missed Appointment",
        severity: "Medium",
        description: `[${marker}] Patient marked No Show for "${appt.name}" on ${appt.date}.`,
        assignedTo: appt.provider,
      });
      results.missedAppointments.push(created?.id);
    }
  }

  // 3. Diagnostic result available -> create "Review Diagnostic Result" task
  for (const diag of diagnostics) {
    if (diag.status !== "Result Available") continue;
    const already = tasks.find((t) => t.taskType === "Review Diagnostic Result" && (t.notes || "").includes(`diag:${diag.id}`));
    if (already) continue;
    const res = await api.post("/api/zoho/clinicalTasks", {
      name: `Review Diagnostic Result - ${diag.name}`,
      patientId: diag.patientId,
      patientName: diag.patientName,
      carePlanId: diag.carePlanId,
      assignedTo: diag.orderedBy || patientByCode.get(diag.patientId)?.primaryPhysician || "",
      taskType: "Review Diagnostic Result",
      priority: diag.priority === "Urgent" ? "Urgent" : "High",
      dueDate: new Date(today.getTime() + 2 * 86400000).toISOString().slice(0, 10),
      status: "Not Started",
      notes: `[diag:${diag.id}] Auto-created because diagnostic result became available.`,
      escalationRequired: false,
    });
    results.diagnosticReviews.push(res.data.item?.id);
  }

  // 4. High-risk patient with no recent activity -> escalation
  const progressByPatient = new Map(progress.map((p) => [p.patientId, p]));
  for (const patient of patients) {
    if (!["High", "Critical"].includes(patient.riskLevel)) continue;
    const prog = progressByPatient.get(patient.patientId);
    const days = prog ? Number(prog.daysSinceLastActivity) : null;
    if (days === null || Number.isNaN(days) || days < HIGH_RISK_INACTIVITY_DAYS) continue;
    const marker = `inactivity:${patient.patientId}`;
    if (!existingEscalationFor(escalations, "High-Risk Patient Without Recent Activity", patient.patientId, marker)) {
      const created = await createEscalation({
        name: `Inactivity Check: ${patient.fullName}`,
        patientId: patient.patientId,
        patientName: patient.fullName,
        carePlanId: "",
        source: "High-Risk Patient Without Recent Activity",
        severity: patient.riskLevel === "Critical" ? "Critical" : "High",
        description: `[${marker}] ${patient.riskLevel}-risk patient with no logged activity for ${days} days.`,
        assignedTo: patient.careCoordinator,
      });
      results.highRiskInactivity.push(created?.id);
    }
  }

  // 5. Care plan approaching target end date with low completion -> escalation
  for (const plan of carePlans) {
    if (plan.status !== "Active" || !plan.targetEndDate) continue;
    const end = new Date(plan.targetEndDate);
    const remaining = daysBetween(end, today);
    const completion = Number(plan.completionPct || 0);
    if (remaining >= 0 && remaining <= CARE_PLAN_END_WARNING_DAYS && completion < CARE_PLAN_LOW_COMPLETION_THRESHOLD) {
      const marker = `plan:${plan.id}`;
      if (!existingEscalationFor(escalations, "Care Plan Approaching Target Date", plan.patientId, marker)) {
        const created = await createEscalation({
          name: `Plan Nearing End Date: ${plan.name}`,
          patientId: plan.patientId,
          patientName: plan.patientName,
          carePlanId: plan.id,
          source: "Care Plan Approaching Target Date",
          severity: "Medium",
          description: `[${marker}] Care plan ends in ${remaining} day(s) at only ${completion}% completion.`,
          assignedTo: plan.assignedCoordinator,
        });
        results.planNearEnd.push(created?.id);
      }
    }
  }

  return results;
}
