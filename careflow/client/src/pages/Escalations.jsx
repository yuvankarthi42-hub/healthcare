import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, CheckCircle2, PlayCircle, XCircle, Clock, Pencil, Trash2 } from "lucide-react";
import AppShell from "../components/AppShell";
import FilterBar from "../components/FilterBar";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { TableSkeleton } from "../components/LoadingSkeleton";
import PermissionGate from "../components/PermissionGate";
import EntityFormModal from "../components/EntityFormModal";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import { SeverityBadge } from "../components/RiskBadge";
import { useFetch } from "../lib/useApi";
import { usePatientLookup } from "../lib/usePatientLookup";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { ENUMS } from "../data/constants";
import { escalationFields, withPatientSelect } from "../data/formSchemas";
import { formatRelative } from "../lib/format";
import api from "../lib/apiClient";
import ConfirmationDialog from "../components/ConfirmationDialog";

const SEVERITY_RANK = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export default function Escalations() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [trashing, setTrashing] = useState(null);
  const [trashingBusy, setTrashingBusy] = useState(false);
  const [resolving, setResolving] = useState(null);
  const [sortBy, setSortBy] = useState("age");
  const toast = useToast();
  const { user } = useAuth();
  const { resolvePatientRecordId, patients } = usePatientLookup();

  const status = params.get("status") || "";
  const severity = params.get("severity") || "";
  const source = params.get("source") || "";
  const ownerOnly = params.get("ownerOnly") === "true";
  const openOnly = params.get("openOnly") || "";

  const { data, loading, error, refetch } = useFetch("/api/zoho/escalations", {
    status,
    severity,
    source,
    ownerOnly: ownerOnly || undefined,
    openOnly: openOnly || undefined,
    search: search || undefined,
  });

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  // Escalation Inbox actions are plain field updates on the escalation record
  // itself - there is no bespoke "/acknowledge" endpoint, just a generic PATCH.
  const act = async (id, newStatus, verb) => {
    try {
      await api.patch(`/api/zoho/escalations/${id}`, { status: newStatus });
      toast.success(`Escalation ${verb}.`);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || "Action failed.");
    }
  };

  let items = data?.items || [];
  items = [...items].sort((a, b) => {
    if (sortBy === "severity") return (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9);
    if (sortBy === "patient") return (a.patientName || "").localeCompare(b.patientName || "");
    if (sortBy === "owner") return (a.assignedTo || "").localeCompare(b.assignedTo || "");
    return new Date(a.createdTime || 0) - new Date(b.createdTime || 0); // age: oldest first
  });

  return (
    <AppShell
      title="Escalation Inbox"
      actions={
        <PermissionGate moduleKey="escalations" require="create">
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={15} /> Create Escalation
          </button>
        </PermissionGate>
      }
    >
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by title, source, or patient..."
        filters={[
          { key: "openOnly", label: "State", options: [{ value: "true", label: "Open only" }] },
          { key: "status", label: "Status", options: ENUMS.escalationStatus.map((s) => ({ value: s, label: s })) },
          { key: "severity", label: "Severity", options: ENUMS.escalationSeverity.map((s) => ({ value: s, label: s })) },
          { key: "source", label: "Source", options: ENUMS.escalationSource.map((s) => ({ value: s, label: s })) },
        ]}
        values={{ status, severity, source, openOnly }}
        onChange={setFilter}
        onClear={() => {
          setSearch("");
          setParams({});
        }}
      />

      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-slate-400">{items.length} escalation(s)</p>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input w-auto bg-white py-1.5 text-xs">
          <option value="age">Sort by: Age (oldest first)</option>
          <option value="severity">Sort by: Criticality</option>
          <option value="patient">Sort by: Patient</option>
          <option value="owner">Sort by: Owner</option>
        </select>
      </div>

      {error && <ErrorState message={error} onRetry={refetch} />}
      {loading && !data && <TableSkeleton cols={6} />}
      {!loading && !error && items.length === 0 && <EmptyState title="Inbox zero" description="No escalations match your filters." />}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-2.5">
          {items.map((e) => {
            const pid = resolvePatientRecordId(e.patientId);
            const isOpen = !["Resolved", "Dismissed"].includes(e.status);
            return (
              <div key={e.id} className={`card flex flex-wrap items-center gap-4 px-4 py-3.5 ${e.severity === "Critical" && isOpen ? "border-red-200 bg-red-50/30" : ""}`}>
                <SeverityBadge severity={e.severity} />
                <div className="min-w-[200px] flex-1">
                  <p className="text-sm font-medium text-slate-800">{e.name}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {e.source} ·{" "}
                    {pid ? (
                      <button onClick={() => navigate(`/patients/${pid}`)} className="text-brand-600 hover:underline">
                        {e.patientName}
                      </button>
                    ) : (
                      e.patientName
                    )}
                  </p>
                </div>
                <div className="hidden text-xs text-slate-400 sm:block">
                  <Clock size={11} className="mr-1 inline" /> {formatRelative(e.createdTime)}
                </div>
                <div className="text-xs text-slate-500">{e.assignedTo || "Unassigned"}</div>
                <StatusBadge status={e.status} />
                <div className="flex items-center gap-1">
                  <PermissionGate moduleKey="escalations" require="edit">
                    <IconAction title="Edit" onClick={() => setEditing(e)} icon={Pencil} />
                  </PermissionGate>
                  {isOpen && (
                    <PermissionGate moduleKey="escalations" require="edit">
                      <span className="flex items-center gap-1">
                        {e.status === "Open" && (
                          <IconAction title="Acknowledge" onClick={() => act(e.id, "Acknowledged", "acknowledged")} icon={CheckCircle2} />
                        )}
                        {e.status !== "In Progress" && (
                          <IconAction title="Start work" onClick={() => act(e.id, "In Progress", "moved to in progress")} icon={PlayCircle} />
                        )}
                        <IconAction title="Resolve" onClick={() => setResolving(e)} icon={CheckCircle2} tone="text-emerald-600" />
                        <IconAction title="Dismiss" onClick={() => act(e.id, "Dismissed", "dismissed")} icon={XCircle} tone="text-slate-400" />
                      </span>
                    </PermissionGate>
                  )}
                  <PermissionGate moduleKey="escalations" require="delete">
                    <IconAction title="Delete" onClick={() => setTrashing(e)} icon={Trash2} tone="text-slate-400" />
                  </PermissionGate>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EntityFormModal
        open={showCreate || Boolean(editing)}
        onClose={() => {
          setShowCreate(false);
          setEditing(null);
        }}
        title={editing ? "Edit Escalation" : "Create Escalation"}
        endpoint="/api/zoho/escalations"
        recordId={editing?.id}
        fields={withPatientSelect(escalationFields)}
        initialValues={editing || {}}
        patients={patients}
        onSaved={refetch}
        successMessage={editing ? "Escalation updated." : "Escalation created."}
      />

      <ConfirmationDialog
        open={Boolean(trashing)}
        onClose={() => setTrashing(null)}
        onConfirm={async () => {
          if (!trashing) return;
          setTrashingBusy(true);
          try {
            await api.delete(`/api/zoho/escalations/${trashing.id}`);
            toast.success("Escalation moved to recycle bin.");
            setTrashing(null);
            refetch();
          } catch (err) {
            toast.error(err.response?.data?.error || "Could not delete.");
          } finally {
            setTrashingBusy(false);
          }
        }}
        loading={trashingBusy}
        title="Move escalation to recycle bin?"
        message={`${trashing?.name || "This escalation"} will be moved to the recycle bin.`}
        confirmLabel="Delete"
      />

      <ResolveModal escalation={resolving} onClose={() => setResolving(null)} onResolved={refetch} actorName={user.displayName} />
    </AppShell>
  );
}

function IconAction({ icon: Icon, title, onClick, tone = "text-slate-400" }) {
  return (
    <button title={title} onClick={onClick} className={`rounded-lg p-1.5 hover:bg-slate-100 ${tone}`}>
      <Icon size={16} />
    </button>
  );
}

function ResolveModal({ escalation, onClose, onResolved, actorName }) {
  const [resolution, setResolution] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/api/zoho/escalations/${escalation.id}`, {
        status: "Resolved",
        resolution: resolution || "Resolved via HealthCare.",
        resolvedBy: actorName,
        resolvedDate: new Date().toISOString().slice(0, 10),
      });
      toast.success("Escalation resolved.");
      setResolution("");
      onClose();
      onResolved();
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not resolve escalation.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!escalation}
      onClose={onClose}
      title={`Resolve: ${escalation?.name || ""}`}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" form="resolve-form" type="submit" disabled={saving}>{saving ? "Saving..." : "Mark Resolved"}</button>
        </>
      }
    >
      <form id="resolve-form" onSubmit={submit}>
        <label className="label">Resolution notes</label>
        <textarea className="input" rows={4} required value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Describe how this was resolved..." />
      </form>
    </Modal>
  );
}
