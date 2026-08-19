/**
 * Deterministic, rule-based "AI Patient Summary" generator.
 *
 * Runs entirely in the browser against records already fetched from the
 * generic `/api/zoho/*` endpoints - no separate backend endpoint. Per spec
 * this MUST NOT make clinical diagnoses or autonomous clinical decisions -
 * it only summarizes existing operational data and surfaces attention
 * items, always clearly labeled as AI-generated.
 */

function daysAgo(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function buildPatientAISummary({ patient, carePlans, tasks, diagnostics, treatments, appointments, escalations, progress }) {
  const activePlan = carePlans.find((p) => p.status === "Active") || carePlans[0];
  const openTasks = tasks.filter((t) => !["Completed", "Cancelled"].includes(t.status));
  const overdueTasks = openTasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date());
  const recentDiagnostics = [...diagnostics].sort((a, b) => new Date(b.orderedDate || 0) - new Date(a.orderedDate || 0)).slice(0, 3);
  const pendingReview = diagnostics.filter((d) => d.status === "Result Available");
  const activeTreatments = treatments.filter((t) => t.status === "Active");
  const poorAdherence = treatments.filter((t) => ["Poor", "Needs Attention"].includes(t.adherence));
  const upcomingAppts = appointments
    .filter((a) => a.date && new Date(a.date) >= new Date() && !["Cancelled", "Completed", "No Show"].includes(a.status))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const openEscalations = escalations.filter((e) => !["Resolved", "Dismissed"].includes(e.status));
  const criticalEscalations = openEscalations.filter((e) => e.severity === "Critical" || e.severity === "High");
  const latestProgress = [...progress].sort((a, b) => new Date(b.metricDate || 0) - new Date(a.metricDate || 0))[0];
  const inactivityDays = daysAgo(latestProgress?.metricDate) ?? daysAgo(patient.registrationDate);

  const sections = [];

  sections.push(
    `${patient.fullName} (${patient.riskLevel || "Unrisked"} risk, ${patient.patientStatus || "Active"}) is primarily managed for ${
      patient.primaryDiagnosis || "an unspecified primary condition"
    }${patient.secondaryConditions ? `, with secondary conditions noted as ${patient.secondaryConditions}` : ""}.`
  );

  if (activePlan) {
    sections.push(
      `Current care plan "${activePlan.name}" (${activePlan.careType || "General Care"}) is ${activePlan.status?.toLowerCase() || "active"} at ${
        activePlan.completionPct || 0
      }% completion, coordinated by ${activePlan.assignedCoordinator || "an unassigned coordinator"}.`
    );
  } else {
    sections.push("No active care plan is currently on file for this patient.");
  }

  sections.push(
    `${openTasks.length} clinical task(s) are outstanding${
      overdueTasks.length ? `, including ${overdueTasks.length} overdue` : ""
    }.`
  );

  if (recentDiagnostics.length) {
    sections.push(
      `Most recent diagnostics: ${recentDiagnostics.map((d) => `${d.name} (${d.status})`).join(", ")}.` +
        (pendingReview.length ? ` ${pendingReview.length} result(s) are available and awaiting clinical review.` : "")
    );
  }

  if (activeTreatments.length) {
    sections.push(
      `${activeTreatments.length} active treatment(s) in progress${
        poorAdherence.length ? `; adherence concerns flagged on ${poorAdherence.length} treatment(s)` : ""
      }.`
    );
  }

  if (upcomingAppts.length) {
    const next = upcomingAppts[0];
    sections.push(`Next appointment: ${next.appointmentType} with ${next.provider} on ${next.date} (${next.mode}).`);
  } else {
    sections.push("No upcoming appointments are currently scheduled.");
  }

  sections.push(
    openEscalations.length
      ? `${openEscalations.length} open escalation(s), ${criticalEscalations.length} of which are high/critical severity.`
      : "No open escalations at this time."
  );

  if (latestProgress) {
    sections.push(
      `Latest recorded progress snapshot (${latestProgress.metricDate}): ${latestProgress.carePlanCompletionPct || 0}% care plan completion, ${
        latestProgress.taskCompletionPct || 0
      }% task completion.`
    );
  }

  const attentionItems = [];
  if (overdueTasks.length) attentionItems.push(`${overdueTasks.length} overdue clinical task(s) need action.`);
  if (pendingReview.length) attentionItems.push(`${pendingReview.length} diagnostic result(s) awaiting review.`);
  if (criticalEscalations.length) attentionItems.push(`${criticalEscalations.length} high/critical escalation(s) open.`);
  if (poorAdherence.length) attentionItems.push(`${poorAdherence.length} treatment(s) flagged for adherence concerns.`);
  if (patient.riskLevel === "Critical" || patient.riskLevel === "High") {
    if (inactivityDays !== null && inactivityDays >= 7) {
      attentionItems.push(`High-risk patient with no recorded activity in ${inactivityDays} day(s).`);
    }
  }
  if (activePlan?.targetEndDate) {
    const daysToEnd = daysAgo(activePlan.targetEndDate) !== null ? -daysAgo(activePlan.targetEndDate) : null;
    if (daysToEnd !== null && daysToEnd >= 0 && daysToEnd <= 21 && (activePlan.completionPct || 0) < 70) {
      attentionItems.push(`Care plan approaching target end date (${activePlan.targetEndDate}) with only ${activePlan.completionPct || 0}% completion.`);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    isAIGenerated: true,
    disclaimer:
      "AI-generated operational summary based on existing CareFlow records. This is not a clinical diagnosis or treatment recommendation.",
    headline: `${patient.fullName} - ${activePlan ? activePlan.name : "No active care plan"}`,
    sections,
    attentionItems,
  };
}
