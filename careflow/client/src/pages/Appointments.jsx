import { useNavigate } from "react-router-dom";
import ModuleListPage from "./ModuleListPage";
import StatusBadge from "../components/StatusBadge";
import { ENUMS } from "../data/constants";
import { appointmentFields } from "../data/formSchemas";
import { usePatientLookup } from "../lib/usePatientLookup";
import { formatDate } from "../lib/format";

export default function Appointments() {
  const navigate = useNavigate();
  const { resolvePatientRecordId } = usePatientLookup();

  return (
    <ModuleListPage
      title="Appointments"
      endpoint="/api/zoho/appointments"
      moduleKey="appointments"
      searchPlaceholder="Search by provider, patient, or location..."
      createLabel="Schedule Appointment"
      createFields={appointmentFields}
      successMessage="Appointment scheduled."
      filterDefs={[
        { key: "status", label: "Status", options: ENUMS.appointmentStatus.map((s) => ({ value: s, label: s })) },
        { key: "today", label: "When", options: [{ value: "true", label: "Today" }] },
      ]}
      columns={[
        { key: "date", label: "Date", sortable: true, sortValue: (r) => new Date(r.date || 0).getTime(), render: (r) => formatDate(r.date) },
        { key: "appointmentType", label: "Type" },
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
        { key: "provider", label: "Provider" },
        { key: "mode", label: "Mode" },
        { key: "status", label: "Status", sortable: true, render: (r) => <StatusBadge status={r.status} /> },
      ]}
    />
  );
}
