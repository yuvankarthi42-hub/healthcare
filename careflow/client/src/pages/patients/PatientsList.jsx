import { useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import AppShell from "../../components/AppShell";
import FilterBar from "../../components/FilterBar";
import DataTable from "../../components/DataTable";
import PatientAvatar from "../../components/PatientAvatar";
import { RiskBadge } from "../../components/RiskBadge";
import StatusBadge from "../../components/StatusBadge";
import ErrorState from "../../components/ErrorState";
import PermissionGate from "../../components/PermissionGate";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import { withRowActions } from "../../components/RecordActions";
import { useFetch } from "../../lib/useApi";
import { ENUMS } from "../../data/constants";
import { age } from "../../lib/format";
import PatientFormModal from "./PatientFormModal";
import { useToast } from "../../context/ToastContext";
import api from "../../lib/apiClient";

export default function PatientsList() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [trashing, setTrashing] = useState(null);
  const [trashingBusy, setTrashingBusy] = useState(false);
  const toast = useToast();
  const status = params.get("status") || "";
  const riskLevel = params.get("riskLevel") || "";

  // The generic /api/zoho endpoint matches query keys against the domain field name verbatim,
  // and a patient's status lives on the `patientStatus` field (not `status`, unlike other modules).
  const { data, loading, error, refetch } = useFetch("/api/zoho/patients", { patientStatus: status, riskLevel, search: search || undefined });

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const confirmTrash = async () => {
    if (!trashing) return;
    setTrashingBusy(true);
    try {
      await api.delete(`/api/zoho/patients/${trashing.id}`);
      toast.success("Patient moved to recycle bin.");
      setTrashing(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not delete.");
    } finally {
      setTrashingBusy(false);
    }
  };

  const columns = [
    {
      key: "fullName",
      label: "Patient",
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          <PatientAvatar name={p.fullName} size={32} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">{p.fullName}</p>
            <p className="text-xs text-slate-400">{p.patientId}</p>
          </div>
        </div>
      ),
    },
    { key: "age", label: "Age", sortValue: (p) => age(p.dateOfBirth) || 0, render: (p) => age(p.dateOfBirth) ?? "—" },
    { key: "primaryDiagnosis", label: "Primary Diagnosis", sortable: true },
    { key: "riskLevel", label: "Risk", sortable: true, render: (p) => <RiskBadge level={p.riskLevel} /> },
    { key: "patientStatus", label: "Status", sortable: true, render: (p) => <StatusBadge status={p.patientStatus} /> },
    { key: "careCoordinator", label: "Care Coordinator" },
  ];

  return (
    <AppShell
      title="Patients"
      actions={
        <PermissionGate moduleKey="patients" require="create">
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <UserPlus size={15} /> Register Patient
          </button>
        </PermissionGate>
      }
    >
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, patient ID, or diagnosis..."
        filters={[
          { key: "status", label: "Status", options: ENUMS.patientStatus.map((s) => ({ value: s, label: s })) },
          { key: "riskLevel", label: "Risk", options: ENUMS.riskLevel.map((s) => ({ value: s, label: s })) },
        ]}
        values={{ status, riskLevel }}
        onChange={setFilter}
        onClear={() => {
          setSearch("");
          setParams({});
        }}
      />
      {error && <ErrorState message={error} onRetry={refetch} />}
      {!error && (
        <DataTable
          columns={withRowActions(columns, { moduleKey: "patients", onEdit: setEditing, onDelete: setTrashing })}
          rows={data?.items || []}
          loading={loading}
          onRowClick={(p) => navigate(`/patients/${p.id}`)}
          emptyTitle="No patients match your filters"
        />
      )}
      <PatientFormModal
        open={showCreate || Boolean(editing)}
        onClose={() => {
          setShowCreate(false);
          setEditing(null);
        }}
        patient={editing}
        onCreated={refetch}
      />
      <ConfirmationDialog
        open={Boolean(trashing)}
        onClose={() => setTrashing(null)}
        onConfirm={confirmTrash}
        loading={trashingBusy}
        title="Move patient to recycle bin?"
        message={`${trashing?.fullName || "This patient"} will be moved to the recycle bin.`}
        confirmLabel="Delete"
      />
    </AppShell>
  );
}
