import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import AppShell from "../../components/AppShell";
import StatusBadge from "../../components/StatusBadge";
import { PriorityBadge, AdherenceBadge, SeverityBadge } from "../../components/RiskBadge";
import ProgressBar from "../../components/ProgressBar";
import DataTable from "../../components/DataTable";
import ErrorState from "../../components/ErrorState";
import { CardSkeleton } from "../../components/LoadingSkeleton";
import PermissionGate from "../../components/PermissionGate";
import EntityFormModal from "../../components/EntityFormModal";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import { useFetch } from "../../lib/useApi";
import { formatDate } from "../../lib/format";
import { attachCounts } from "../../lib/carePlanAggregate";
import { carePlanFields, withPatientSelect } from "../../data/formSchemas";
import { useToast } from "../../context/ToastContext";
import api from "../../lib/apiClient";

export default function CarePlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [trashing, setTrashing] = useState(false);
  const [trashingBusy, setTrashingBusy] = useState(false);
  const { data, loading, error, refetch } = useFetch(`/api/zoho/carePlans/${id}`);
  // Related records + counts are computed client-side from raw module lists
  // instead of a bespoke "care plan detail bundle" backend endpoint.
  const { data: careTeamData } = useFetch("/api/zoho/careTeam");
  const { data: tasksData } = useFetch("/api/zoho/clinicalTasks");
  const { data: diagnosticsData } = useFetch("/api/zoho/diagnostics");
  const { data: treatmentsData } = useFetch("/api/zoho/treatment");
  const { data: appointmentsData } = useFetch("/api/zoho/appointments");
  const { data: escalationsData } = useFetch("/api/zoho/escalations");
  const { data: patientsData } = useFetch("/api/zoho/patients");

  if (loading && !data) {
    return (
      <AppShell title="Care Plan">
        <CardSkeleton className="h-40" />
      </AppShell>
    );
  }
  if (error) {
    return (
      <AppShell title="Care Plan">
        <ErrorState message={error} onRetry={refetch} />
      </AppShell>
    );
  }
  const rawPlan = data.item;
  const forPlan = (arr) => (arr || []).filter((r) => String(r.carePlanId) === String(rawPlan.id));
  const careTeam = forPlan(careTeamData?.items);
  const tasks = forPlan(tasksData?.items);
  const diagnostics = forPlan(diagnosticsData?.items);
  const treatments = forPlan(treatmentsData?.items);
  const appointments = forPlan(appointmentsData?.items);
  const escalations = forPlan(escalationsData?.items);
  const plan = attachCounts(rawPlan, {
    tasks: tasksData?.items || [],
    diagnostics: diagnosticsData?.items || [],
    treatments: treatmentsData?.items || [],
    appointments: appointmentsData?.items || [],
    escalations: escalationsData?.items || [],
    careTeam: careTeamData?.items || [],
  });

  return (
    <AppShell title={plan.name}>
      <div className="space-y-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft size={14} /> Back
        </button>

        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <button onClick={() => navigate(`/patients/${plan.patientId}`)} className="text-sm font-medium text-brand-700 hover:underline">
                {plan.patientName}
              </button>
              <h2 className="mt-1 text-xl font-bold text-slate-900">{plan.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{plan.careType} · {plan.primaryCondition}</p>
            </div>
            <div className="flex items-center gap-2">
              <PriorityBadge priority={plan.priority} />
              <StatusBadge status={plan.status} />
              <PermissionGate moduleKey="carePlans" require="edit">
                <button onClick={() => setEditing(true)} className="btn-secondary text-xs">Edit</button>
              </PermissionGate>
              <PermissionGate moduleKey="carePlans" require="delete">
                <button onClick={() => setTrashing(true)} className="btn-danger text-xs">Delete</button>
              </PermissionGate>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-4">
            <Field label="Coordinator" value={plan.assignedCoordinator} />
            <Field label="Start Date" value={formatDate(plan.startDate)} />
            <Field label="Target End Date" value={formatDate(plan.targetEndDate)} />
            <Field label="Goal" value={plan.goal} />
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="mb-1.5 text-xs font-medium text-slate-500">Completion</p>
            <ProgressBar value={plan.completionPct || 0} showLabel size="lg" />
          </div>
          {plan.notes && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{plan.notes}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Care Team" value={plan.counts.careTeam} />
          <Stat label="Open Tasks" value={plan.counts.tasksOpen} />
          <Stat label="Diagnostics Pending" value={plan.counts.diagnosticsPending} />
          <Stat label="Open Escalations" value={plan.counts.escalationsOpen} />
        </div>

        <Section title="Care Team">
          <DataTable
            columns={[
              { key: "teamMember", label: "Member" },
              { key: "role", label: "Role" },
              { key: "responsibility", label: "Responsibility" },
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={careTeam}
            emptyTitle="No care team assigned to this plan"
          />
        </Section>

        <Section title="Clinical Tasks">
          <DataTable
            columns={[
              { key: "name", label: "Task" },
              { key: "assignedTo", label: "Assigned To" },
              { key: "priority", label: "Priority", render: (r) => <PriorityBadge priority={r.priority} /> },
              { key: "dueDate", label: "Due", render: (r) => formatDate(r.dueDate) },
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={tasks}
            emptyTitle="No tasks linked to this plan"
          />
        </Section>

        <Section title="Diagnostics">
          <DataTable
            columns={[
              { key: "name", label: "Test" },
              { key: "testCategory", label: "Category" },
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={diagnostics}
            emptyTitle="No diagnostics linked to this plan"
          />
        </Section>

        <Section title="Treatment Plans">
          <DataTable
            columns={[
              { key: "name", label: "Treatment" },
              { key: "treatmentType", label: "Type" },
              { key: "adherence", label: "Adherence", render: (r) => <AdherenceBadge adherence={r.adherence} /> },
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={treatments}
            emptyTitle="No treatment plans linked"
          />
        </Section>

        <Section title="Appointments">
          <DataTable
            columns={[
              { key: "date", label: "Date", render: (r) => formatDate(r.date) },
              { key: "appointmentType", label: "Type" },
              { key: "provider", label: "Provider" },
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={appointments}
            emptyTitle="No appointments linked"
          />
        </Section>

        <Section title="Escalations">
          <DataTable
            columns={[
              { key: "name", label: "Escalation" },
              { key: "severity", label: "Severity", render: (r) => <SeverityBadge severity={r.severity} /> },
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={escalations}
            emptyTitle="No escalations linked"
          />
        </Section>
      </div>

      <EntityFormModal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit Care Plan"
        endpoint="/api/zoho/carePlans"
        recordId={plan.id}
        fields={withPatientSelect(carePlanFields)}
        initialValues={rawPlan}
        patients={patientsData?.items}
        onSaved={refetch}
        successMessage="Care plan updated."
      />
      <ConfirmationDialog
        open={trashing}
        onClose={() => setTrashing(false)}
        onConfirm={async () => {
          setTrashingBusy(true);
          try {
            await api.delete(`/api/zoho/carePlans/${plan.id}`);
            toast.success("Care plan moved to recycle bin.");
            navigate("/care-plans");
          } catch (err) {
            toast.error(err.response?.data?.error || "Could not delete.");
            setTrashingBusy(false);
          }
        }}
        loading={trashingBusy}
        title="Move care plan to recycle bin?"
        message={`${plan.name} will be moved to the recycle bin.`}
        confirmLabel="Delete"
      />
    </AppShell>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-slate-800">{value || "—"}</p>
    </div>
  );
}
function Stat({ label, value }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
function Section({ title, children }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-800">{title}</h3>
      {children}
    </div>
  );
}
