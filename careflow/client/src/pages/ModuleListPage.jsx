import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import AppShell from "../components/AppShell";
import FilterBar from "../components/FilterBar";
import DataTable from "../components/DataTable";
import ErrorState from "../components/ErrorState";
import PermissionGate from "../components/PermissionGate";
import EntityFormModal from "../components/EntityFormModal";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { withRowActions } from "../components/RecordActions";
import { useFetch } from "../lib/useApi";
import { withPatientSelect } from "../data/formSchemas";
import { useToast } from "../context/ToastContext";
import api from "../lib/apiClient";

/**
 * Generic list-screen for the simpler operational modules (Care Team, Tasks,
 * Diagnostics, Treatment, Appointments, Progress). Escalations gets its own
 * page (EscalationsInbox) for the bespoke resolve/acknowledge workflow.
 */
export default function ModuleListPage({
  title,
  endpoint,
  moduleKey,
  columns,
  filterDefs = [],
  searchPlaceholder = "Search...",
  createLabel,
  createFields,
  successMessage,
  onRowClick,
  extraActions,
}) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [trashing, setTrashing] = useState(null);
  const [trashingBusy, setTrashingBusy] = useState(false);
  const toast = useToast();

  const filterValues = Object.fromEntries(filterDefs.map((f) => [f.key, params.get(f.key) || ""]));
  const ownerOnly = params.get("ownerOnly") === "true";

  const { data, loading, error, refetch } = useFetch(endpoint, { ...filterValues, ownerOnly: ownerOnly || undefined, search: search || undefined });
  const { data: patientsData } = useFetch(createFields ? "/api/zoho/patients" : null);

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
      await api.delete(`${endpoint}/${trashing.id}`);
      toast.success("Moved to recycle bin.");
      setTrashing(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not delete.");
    } finally {
      setTrashingBusy(false);
    }
  };

  const tableColumns = createFields
    ? withRowActions(columns, { moduleKey, onEdit: setEditing, onDelete: setTrashing })
    : columns;

  const formFields = createFields ? withPatientSelect(createFields) : [];

  return (
    <AppShell
      title={title}
      actions={
        <div className="flex items-center gap-2">
          {extraActions}
          {createFields && (
            <PermissionGate moduleKey={moduleKey} require="create">
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                <Plus size={15} /> {createLabel || "New"}
              </button>
            </PermissionGate>
          )}
        </div>
      }
    >
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={searchPlaceholder}
        filters={filterDefs}
        values={filterValues}
        onChange={setFilter}
        onClear={() => {
          setSearch("");
          setParams({});
        }}
      />
      {error && <ErrorState message={error} onRetry={refetch} />}
      {!error && (
        <DataTable
          columns={tableColumns}
          rows={data?.items || []}
          loading={loading}
          onRowClick={onRowClick ? (r) => onRowClick(r, navigate) : undefined}
          emptyTitle={`No records match your filters`}
        />
      )}

      {createFields && (
        <EntityFormModal
          open={showCreate || Boolean(editing)}
          onClose={() => {
            setShowCreate(false);
            setEditing(null);
          }}
          title={editing ? `Edit ${title.replace(/s$/, "")}` : createLabel}
          endpoint={endpoint}
          recordId={editing?.id}
          fields={formFields}
          initialValues={editing || {}}
          patients={patientsData?.items}
          onSaved={refetch}
          successMessage={editing ? "Updated." : successMessage || "Saved."}
        />
      )}

      <ConfirmationDialog
        open={Boolean(trashing)}
        onClose={() => setTrashing(null)}
        onConfirm={confirmTrash}
        loading={trashingBusy}
        title="Move to recycle bin?"
        message={`${trashing?.name || trashing?.teamMember || trashing?.fullName || "This record"} will be moved to the recycle bin. It can be restored from Zoho Projects if needed.`}
        confirmLabel="Delete"
      />
    </AppShell>
  );
}
