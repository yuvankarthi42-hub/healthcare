import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import AppShell from "../../components/AppShell";
import FilterBar from "../../components/FilterBar";
import DataTable from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { PriorityBadge } from "../../components/RiskBadge";
import ProgressBar from "../../components/ProgressBar";
import ErrorState from "../../components/ErrorState";
import PermissionGate from "../../components/PermissionGate";
import EntityFormModal from "../../components/EntityFormModal";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import { withRowActions } from "../../components/RecordActions";
import { useFetch } from "../../lib/useApi";
import { ENUMS } from "../../data/constants";
import { carePlanFields, withPatientSelect } from "../../data/formSchemas";
import { formatDate } from "../../lib/format";
import { attachCounts } from "../../lib/carePlanAggregate";
import { useToast } from "../../context/ToastContext";
import api from "../../lib/apiClient";

export default function CarePlansList() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [trashing, setTrashing] = useState(null);
  const [trashingBusy, setTrashingBusy] = useState(false);
  const toast = useToast();
  const status = params.get("status") || "";
  const careType = params.get("careType") || "";
  const nearCompletion = params.get("nearCompletion") || "";

  const { data, loading, error, refetch } = useFetch("/api/zoho/carePlans", {
    status,
    careType,
    nearCompletion: nearCompletion || undefined,
    search: search || undefined,
  });
  const { data: patientsData } = useFetch("/api/zoho/patients");
  // Related-record counts (tasks, diagnostics, escalations...) are computed client-side
  // from raw module lists instead of a bespoke "care plans with counts" backend endpoint.
  const { data: tasksData } = useFetch("/api/zoho/clinicalTasks");
  const { data: diagnosticsData } = useFetch("/api/zoho/diagnostics");
  const { data: treatmentsData } = useFetch("/api/zoho/treatment");
  const { data: appointmentsData } = useFetch("/api/zoho/appointments");
  const { data: escalationsData } = useFetch("/api/zoho/escalations");
  const { data: careTeamData } = useFetch("/api/zoho/careTeam");

  const items = (data?.items || []).map((p) =>
    attachCounts(p, {
      tasks: tasksData?.items || [],
      diagnostics: diagnosticsData?.items || [],
      treatments: treatmentsData?.items || [],
      appointments: appointmentsData?.items || [],
      escalations: escalationsData?.items || [],
      careTeam: careTeamData?.items || [],
    })
  );

  const confirmTrash = async () => {
    if (!trashing) return;
    setTrashingBusy(true);
    try {
      await api.delete(`/api/zoho/carePlans/${trashing.id}`);
      toast.success("Care plan moved to recycle bin.");
      setTrashing(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not delete.");
    } finally {
      setTrashingBusy(false);
    }
  };

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const columns = [
    { key: "name", label: "Care Plan", sortable: true },
    { key: "patientName", label: "Patient", sortable: true },
    { key: "careType", label: "Care Type" },
    { key: "priority", label: "Priority", render: (r) => <PriorityBadge priority={r.priority} /> },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "completionPct", label: "Completion", sortValue: (r) => Number(r.completionPct) || 0, render: (r) => <ProgressBar value={r.completionPct || 0} showLabel /> },
    { key: "targetEndDate", label: "Target End", sortValue: (r) => new Date(r.targetEndDate || 0).getTime(), render: (r) => formatDate(r.targetEndDate) },
  ];

  return (
    <AppShell
      title="Care Plans"
      actions={
        <PermissionGate moduleKey="carePlans" require="create">
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={15} /> New Care Plan
          </button>
        </PermissionGate>
      }
    >
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by plan name or patient..."
        filters={[
          { key: "status", label: "Status", options: ENUMS.carePlanStatus.map((s) => ({ value: s, label: s })) },
          { key: "careType", label: "Care Type", options: ENUMS.careType.map((s) => ({ value: s, label: s })) },
          { key: "nearCompletion", label: "Completion", options: [{ value: "true", label: "Near completion (≥80%)" }] },
        ]}
        values={{ status, careType, nearCompletion }}
        onChange={setFilter}
        onClear={() => {
          setSearch("");
          setParams({});
        }}
      />
      {error && <ErrorState message={error} onRetry={refetch} />}
      {!error && (
        <DataTable
          columns={withRowActions(columns, { moduleKey: "carePlans", onEdit: setEditing, onDelete: setTrashing })}
          rows={items}
          loading={loading}
          onRowClick={(r) => navigate(`/care-plans/${r.id}`)}
          emptyTitle="No care plans match your filters"
        />
      )}

      <EntityFormModal
        open={showCreate || Boolean(editing)}
        onClose={() => {
          setShowCreate(false);
          setEditing(null);
        }}
        title={editing ? "Edit Care Plan" : "Create Care Plan"}
        endpoint="/api/zoho/carePlans"
        recordId={editing?.id}
        fields={withPatientSelect(carePlanFields)}
        initialValues={editing || {}}
        patients={patientsData?.items}
        onSaved={refetch}
        successMessage={editing ? "Care plan updated." : "Care plan created."}
      />
      <ConfirmationDialog
        open={Boolean(trashing)}
        onClose={() => setTrashing(null)}
        onConfirm={confirmTrash}
        loading={trashingBusy}
        title="Move care plan to recycle bin?"
        message={`${trashing?.name || "This care plan"} will be moved to the recycle bin.`}
        confirmLabel="Delete"
      />
    </AppShell>
  );
}
