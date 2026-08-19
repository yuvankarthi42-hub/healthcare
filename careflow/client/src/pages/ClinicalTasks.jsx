import { useNavigate } from "react-router-dom";
import ModuleListPage from "./ModuleListPage";
import StatusBadge from "../components/StatusBadge";
import { PriorityBadge } from "../components/RiskBadge";
import { ENUMS } from "../data/constants";
import { taskFields } from "../data/formSchemas";
import { usePatientLookup } from "../lib/usePatientLookup";
import { formatDate, isOverdue } from "../lib/format";

export default function ClinicalTasks() {
  const navigate = useNavigate();
  const { resolvePatientRecordId } = usePatientLookup();

  return (
    <ModuleListPage
      title="Clinical Tasks"
      endpoint="/api/zoho/clinicalTasks"
      moduleKey="clinicalTasks"
      searchPlaceholder="Search by task, patient, or assignee..."
      createLabel="Add Task"
      createFields={taskFields}
      successMessage="Task created."
      filterDefs={[
        { key: "status", label: "Status", options: ENUMS.taskStatus.map((s) => ({ value: s, label: s })) },
        { key: "priority", label: "Priority", options: ENUMS.priority.map((s) => ({ value: s, label: s })) },
      ]}
      columns={[
        { key: "name", label: "Task", sortable: true },
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
        { key: "assignedTo", label: "Assigned To" },
        { key: "priority", label: "Priority", sortable: true, render: (r) => <PriorityBadge priority={r.priority} /> },
        {
          key: "dueDate",
          label: "Due Date",
          sortValue: (r) => new Date(r.dueDate || 0).getTime(),
          render: (r) => (
            <span className={isOverdue(r.dueDate) && !["Completed", "Cancelled"].includes(r.status) ? "font-medium text-red-600" : ""}>
              {formatDate(r.dueDate)}
            </span>
          ),
        },
        { key: "status", label: "Status", sortable: true, render: (r) => <StatusBadge status={r.status} /> },
      ]}
    />
  );
}
