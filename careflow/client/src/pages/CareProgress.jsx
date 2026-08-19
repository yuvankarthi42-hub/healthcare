import { useNavigate } from "react-router-dom";
import ModuleListPage from "./ModuleListPage";
import ProgressBar from "../components/ProgressBar";
import { progressFields } from "../data/formSchemas";
import { usePatientLookup } from "../lib/usePatientLookup";
import { formatDate } from "../lib/format";

export default function CareProgress() {
  const navigate = useNavigate();
  const { resolvePatientRecordId } = usePatientLookup();

  return (
    <ModuleListPage
      title="Care Progress"
      endpoint="/api/zoho/careProgress"
      moduleKey="careProgress"
      searchPlaceholder="Search by patient or milestone..."
      createLabel="Record Progress"
      createFields={progressFields}
      successMessage="Progress entry recorded."
      columns={[
        { key: "metricDate", label: "Date", sortable: true, sortValue: (r) => new Date(r.metricDate || 0).getTime(), render: (r) => formatDate(r.metricDate) },
        {
          key: "patientName",
          label: "Patient",
          render: (r) => {
            const pid = resolvePatientRecordId(r.patientId);
            return pid ? (
              <button onClick={(e) => { e.stopPropagation(); navigate(`/patients/${pid}`); }} className="text-brand-700 hover:underline">
                {r.patientName}
              </button>
            ) : (
              r.patientName || "—"
            );
          },
        },
        { key: "carePlanCompletionPct", label: "Plan Completion", render: (r) => <ProgressBar value={r.carePlanCompletionPct || 0} showLabel /> },
        { key: "taskCompletionPct", label: "Task Completion", render: (r) => <ProgressBar value={r.taskCompletionPct || 0} showLabel /> },
        { key: "overdueTasksCount", label: "Overdue Tasks" },
        { key: "openEscalationsCount", label: "Open Escalations" },
        { key: "nextMilestone", label: "Next Milestone" },
      ]}
    />
  );
}
