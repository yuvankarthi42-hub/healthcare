/** Attaches related-record counts to a care plan, computed client-side from raw module lists. */
export function attachCounts(plan, { tasks, diagnostics, treatments, appointments, escalations, careTeam }) {
  const forPlan = (arr) => arr.filter((r) => String(r.carePlanId) === String(plan.id) || String(r.carePlanId) === String(plan.patientId));
  const planTasks = forPlan(tasks);
  const planDiagnostics = forPlan(diagnostics);
  const planEscalations = forPlan(escalations);
  return {
    ...plan,
    counts: {
      careTeam: forPlan(careTeam).length,
      tasks: planTasks.length,
      tasksOpen: planTasks.filter((t) => !["Completed", "Cancelled"].includes(t.status)).length,
      diagnostics: planDiagnostics.length,
      diagnosticsPending: planDiagnostics.filter((d) => d.status === "Result Available").length,
      treatments: forPlan(treatments).length,
      appointments: forPlan(appointments).length,
      escalationsOpen: planEscalations.filter((e) => !["Resolved", "Dismissed"].includes(e.status)).length,
    },
  };
}
