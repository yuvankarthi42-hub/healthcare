import { useNavigate } from "react-router-dom";
import ModuleListPage from "./ModuleListPage";
import StatusBadge from "../components/StatusBadge";
import { PriorityBadge } from "../components/RiskBadge";
import { ENUMS, MODULE_LABELS } from "../data/constants";
import { taskFields } from "../data/formSchemas";
import { usePatientLookup } from "../lib/usePatientLookup";
import { formatDate, formatTaskTitle, isOverdue } from "../lib/format";

export default function ClinicalTasks() {
  const navigate = useNavigate();
  const { resolvePatientRecordId } = usePatientLookup();

  return (
    <ModuleListPage
      title={MODULE_LABELS.clinicalTasks}
      endpoint="/api/zoho/clinicalTasks"
      moduleKey="clinicalTasks"
      searchPlaceholder="Search by task type, patient, or assignee..."
      createLabel="Add Care Task"
      createFields={taskFields}
      successMessage="Care task created."
      filterDefs={[
        { key: "status", label: "Status", options: ENUMS.taskStatus.map((s) => ({ value: s, label: s })) },
        { key: "priority", label: "Priority", options: ENUMS.priority.map((s) => ({ value: s, label: s })) },
        { key: "dueToday", label: "Due", options: [{ value: "true", label: "Today" }] },
        { key: "overdue", label: "Overdue", options: [{ value: "true", label: "Overdue" }] },
      ]}
      columns={[
        {
          key: "taskType",
          label: "Task Type",
          sortable: true,
          sortValue: (r) => formatTaskTitle(r),
          render: (r) => (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{formatTaskTitle(r)}</p>
              {r.name && r.name !== formatTaskTitle(r) && (
                <p className="truncate text-[11px] text-slate-400">{r.name}</p>
              )}
            </div>
          ),
        },
        {
          key: "patientName",
          label: "Patient",
          render: (r) => {
            const pid = resolvePatientRecordId(r.patientId);
            return pid ? (
              <button onClick={(e) => { e.stopPropagation(); navigate(`/patients/${pid}`); }} className="text-brand-700 hover:underline dark:text-brand-400">
                {r.patientName}
              </button>
            ) : (
              r.patientName || "—"
            );
          },
        },
        { key: "assignedTo", label: "Assigned To", render: (r) => r.assignedTo || "—" },
        { key: "priority", label: "Priority", sortable: true, render: (r) => <PriorityBadge priority={r.priority} /> },
        {
          key: "dueDate",
          label: "Due Date",
          sortValue: (r) => new Date(r.dueDate || 0).getTime(),
          render: (r) => (
            <span className={isOverdue(r.dueDate) && !["Completed", "Cancelled"].includes(r.status) ? "font-medium text-red-600 dark:text-red-400" : ""}>
              {formatDate(r.dueDate)}
            </span>
          ),
        },
        { key: "status", label: "Status", sortable: true, render: (r) => <StatusBadge status={r.status} /> },
      ]}
    />
  );
}
