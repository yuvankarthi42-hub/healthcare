import { useNavigate } from "react-router-dom";
import ModuleListPage from "./ModuleListPage";
import StatusBadge from "../components/StatusBadge";
import { PriorityBadge } from "../components/RiskBadge";
import { ENUMS } from "../data/constants";
import { diagnosticFields } from "../data/formSchemas";
import { usePatientLookup } from "../lib/usePatientLookup";
import { formatDate } from "../lib/format";

export default function Diagnostics() {
  const navigate = useNavigate();
  const { resolvePatientRecordId } = usePatientLookup();

  return (
    <ModuleListPage
      title="Diagnostics"
      endpoint="/api/zoho/diagnostics"
      moduleKey="diagnostics"
      searchPlaceholder="Search by test, patient, or ordering clinician..."
      createLabel="Order Diagnostic"
      createFields={diagnosticFields}
      successMessage="Diagnostic ordered."
      filterDefs={[
        { key: "status", label: "Status", options: ENUMS.diagnosticStatus.map((s) => ({ value: s, label: s })) },
        { key: "priority", label: "Priority", options: ENUMS.priority.map((s) => ({ value: s, label: s })) },
      ]}
      columns={[
        { key: "name", label: "Test", sortable: true },
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
        { key: "testCategory", label: "Category" },
        { key: "orderedBy", label: "Ordered By" },
        { key: "orderedDate", label: "Ordered", sortValue: (r) => new Date(r.orderedDate || 0).getTime(), render: (r) => formatDate(r.orderedDate) },
        { key: "priority", label: "Priority", render: (r) => <PriorityBadge priority={r.priority} /> },
        { key: "status", label: "Status", sortable: true, render: (r) => <StatusBadge status={r.status} /> },
      ]}
    />
  );
}
