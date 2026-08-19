import { useNavigate } from "react-router-dom";
import ModuleListPage from "./ModuleListPage";
import StatusBadge from "../components/StatusBadge";
import { ENUMS } from "../data/constants";
import { careTeamFields } from "../data/formSchemas";
import { usePatientLookup } from "../lib/usePatientLookup";

export default function CareTeam() {
  const navigate = useNavigate();
  const { resolvePatientRecordId } = usePatientLookup();

  return (
    <ModuleListPage
      title="Care Team"
      endpoint="/api/zoho/careTeam"
      moduleKey="careTeam"
      searchPlaceholder="Search by member name, role, or patient..."
      createLabel="Assign Team Member"
      createFields={careTeamFields}
      successMessage="Care team member assigned."
      filterDefs={[{ key: "status", label: "Status", options: ENUMS.careTeamStatus.map((s) => ({ value: s, label: s })) }]}
      columns={[
        { key: "teamMember", label: "Member", sortable: true },
        { key: "role", label: "Role", sortable: true },
        { key: "department", label: "Department" },
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
              <span>{r.patientName || "—"}</span>
            );
          },
        },
        { key: "responsibility", label: "Responsibility" },
        { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
      ]}
    />
  );
}
