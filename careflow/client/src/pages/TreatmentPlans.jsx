import { useNavigate } from "react-router-dom";
import ModuleListPage from "./ModuleListPage";
import StatusBadge from "../components/StatusBadge";
import { AdherenceBadge } from "../components/RiskBadge";
import { ENUMS } from "../data/constants";
import { treatmentFields } from "../data/formSchemas";
import { usePatientLookup } from "../lib/usePatientLookup";

export default function TreatmentPlans() {
  const navigate = useNavigate();
  const { resolvePatientRecordId } = usePatientLookup();

  return (
    <ModuleListPage
      title="Treatment Plans"
      endpoint="/api/zoho/treatment"
      moduleKey="treatment"
      searchPlaceholder="Search by treatment, patient, or prescriber..."
      createLabel="Add Treatment"
      createFields={treatmentFields}
      successMessage="Treatment plan created."
      filterDefs={[
        { key: "status", label: "Status", options: ENUMS.treatmentStatus.map((s) => ({ value: s, label: s })) },
      ]}
      columns={[
        { key: "name", label: "Treatment", sortable: true },
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
        { key: "treatmentType", label: "Type" },
        { key: "prescribedBy", label: "Prescribed By" },
        { key: "adherence", label: "Adherence", render: (r) => <AdherenceBadge adherence={r.adherence} /> },
        { key: "status", label: "Status", sortable: true, render: (r) => <StatusBadge status={r.status} /> },
      ]}
    />
  );
}
