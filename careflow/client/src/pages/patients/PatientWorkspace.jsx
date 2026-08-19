import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ClipboardList, UsersRound, CheckSquare, Activity, Pill, Calendar, AlertTriangle, TrendingUp, History, LayoutGrid,
} from "lucide-react";
import AppShell from "../../components/AppShell";
import PatientHeader from "../../components/PatientHeader";
import AIInsightCard from "../../components/AIInsightCard";
import CareJourney from "../../components/CareJourney";
import Timeline from "../../components/Timeline";
import DataTable from "../../components/DataTable";
import ProgressBar from "../../components/ProgressBar";
import StatusBadge from "../../components/StatusBadge";
import { PriorityBadge, SeverityBadge, AdherenceBadge } from "../../components/RiskBadge";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import { CardSkeleton } from "../../components/LoadingSkeleton";
import PermissionGate from "../../components/PermissionGate";
import EntityFormModal from "../../components/EntityFormModal";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import { withRowActions } from "../../components/RecordActions";
import PatientFormModal from "./PatientFormModal";
import { usePatientBundle } from "../../lib/usePatientBundle";
import { formatDate, isOverdue } from "../../lib/format";
import * as schemas from "../../data/formSchemas";
import { useToast } from "../../context/ToastContext";
import api from "../../lib/apiClient";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "carePlans", label: "Care Plans", icon: ClipboardList },
  { key: "careTeam", label: "Care Team", icon: UsersRound },
  { key: "tasks", label: "Clinical Tasks", icon: CheckSquare },
  { key: "diagnostics", label: "Diagnostics", icon: Activity },
  { key: "treatments", label: "Treatment", icon: Pill },
  { key: "appointments", label: "Appointments", icon: Calendar },
  { key: "escalations", label: "Escalations", icon: AlertTriangle },
  { key: "progress", label: "Progress", icon: TrendingUp },
  { key: "activity", label: "Activity", icon: History },
];

const FORMS = {
  carePlans: { label: "Create Care Plan", editLabel: "Edit Care Plan", endpoint: "/api/zoho/carePlans", fields: schemas.carePlanFields, moduleKey: "carePlans" },
  careTeam: { label: "Assign Care Team", editLabel: "Edit Care Team Member", endpoint: "/api/zoho/careTeam", fields: schemas.careTeamFields, moduleKey: "careTeam" },
  clinicalTasks: { label: "Add Task", editLabel: "Edit Task", endpoint: "/api/zoho/clinicalTasks", fields: schemas.taskFields, moduleKey: "clinicalTasks" },
  diagnostics: { label: "Add Diagnostic", editLabel: "Edit Diagnostic", endpoint: "/api/zoho/diagnostics", fields: schemas.diagnosticFields, moduleKey: "diagnostics" },
  treatment: { label: "Add Treatment", editLabel: "Edit Treatment", endpoint: "/api/zoho/treatment", fields: schemas.treatmentFields, moduleKey: "treatment" },
  appointments: { label: "Schedule Appointment", editLabel: "Edit Appointment", endpoint: "/api/zoho/appointments", fields: schemas.appointmentFields, moduleKey: "appointments" },
  escalations: { label: "Create Escalation", editLabel: "Edit Escalation", endpoint: "/api/zoho/escalations", fields: schemas.escalationFields, moduleKey: "escalations" },
  careProgress: { label: "Record Progress", editLabel: "Edit Progress", endpoint: "/api/zoho/careProgress", fields: schemas.progressFields, moduleKey: "careProgress" },
};

const QUICK_ACTIONS = ["carePlans", "careTeam", "clinicalTasks", "diagnostics", "treatment", "appointments", "escalations"].map((k) => FORMS[k]);

export default function PatientWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [formState, setFormState] = useState(null);
  const [editingPatient, setEditingPatient] = useState(false);
  const [trashTarget, setTrashTarget] = useState(null);
  const [trashingBusy, setTrashingBusy] = useState(false);
  const toast = useToast();

  // The AI summary and activity timeline are computed client-side (client/src/lib) from
  // the same raw, RBAC-filtered records - no bespoke "/patients/:id" bundling endpoint.
  const { data, summary, loading, error, refetch } = usePatientBundle(id);
  const summaryLoading = loading;
  const refetchSummary = refetch;
  const summaryData = summary ? { summary } : null;

  const activePlan = useMemo(() => data?.carePlans.find((p) => p.status === "Active") || data?.carePlans[0], [data]);
  const nextAppointment = useMemo(() => {
    if (!data) return null;
    return [...data.appointments]
      .filter((a) => a.date && new Date(a.date) >= new Date() && !["Cancelled", "Completed", "No Show"].includes(a.status))
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  }, [data]);

  if (loading && !data) {
    return (
      <AppShell title="Patient">
        <div className="space-y-4">
          <CardSkeleton className="h-32" />
          <CardSkeleton className="h-20" />
          <CardSkeleton className="h-64" />
        </div>
      </AppShell>
    );
  }
  if (error) {
    return (
      <AppShell title="Patient">
        <ErrorState message={error} onRetry={refetch} />
      </AppShell>
    );
  }
  if (!data) return null;

  const patient = data.item;

  const journeyStages = [
    { key: "reg", label: "Registration", status: "done", onClick: () => setTab("overview") },
    { key: "plan", label: "Care Plan", status: data.carePlans.length ? "done" : "pending", count: data.carePlans.length, onClick: () => setTab("carePlans") },
    { key: "team", label: "Care Team", status: data.careTeam.length ? "done" : "pending", count: data.careTeam.length, onClick: () => setTab("careTeam") },
    { key: "tasks", label: "Tasks", status: data.tasks.some((t) => t.status !== "Not Started") ? "active" : data.tasks.length ? "pending" : "pending", count: data.tasks.length, onClick: () => setTab("tasks") },
    { key: "diag", label: "Diagnostics", status: data.diagnostics.some((d) => ["Reviewed", "Result Available"].includes(d.status)) ? "done" : data.diagnostics.length ? "active" : "pending", count: data.diagnostics.length, onClick: () => setTab("diagnostics") },
    { key: "treat", label: "Treatment", status: data.treatments.some((t) => t.status === "Active") ? "active" : data.treatments.length ? "done" : "pending", count: data.treatments.length, onClick: () => setTab("treatments") },
    { key: "appt", label: "Appointments", status: data.appointments.some((a) => a.status === "Completed") ? "done" : data.appointments.length ? "active" : "pending", count: data.appointments.length, onClick: () => setTab("appointments") },
    { key: "prog", label: "Progress", status: data.progress.length ? "active" : "pending", count: data.progress.length, onClick: () => setTab("progress") },
    { key: "done", label: "Completion", status: activePlan?.status === "Completed" ? "done" : "pending", onClick: () => setTab("carePlans") },
  ];

  const action = formState ? FORMS[formState.moduleKey] : null;

  return (
    <AppShell title={patient.fullName}>
      <div className="space-y-5">
        <PatientHeader
          patient={patient}
          activePlan={activePlan}
          nextAppointment={nextAppointment}
          actions={
            <div className="flex items-center gap-2">
              <PermissionGate moduleKey="patients" require="edit">
                <button onClick={() => setEditingPatient(true)} className="btn-secondary text-xs">
                  Edit
                </button>
              </PermissionGate>
              <PermissionGate moduleKey="patients" require="delete">
                <button onClick={() => setTrashTarget({ moduleKey: "patients", record: patient })} className="btn-danger text-xs">
                  Delete
                </button>
              </PermissionGate>
            </div>
          }
        />

        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((a) => (
            <PermissionGate key={a.moduleKey} moduleKey={a.moduleKey} require="create">
              <button onClick={() => setFormState({ moduleKey: a.moduleKey })} className="btn-secondary text-xs">
                {a.label}
              </button>
            </PermissionGate>
          ))}
        </div>

        <CareJourney stages={journeyStages} />

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                    tab === t.key ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <t.icon size={14} /> {t.label}
                </button>
              ))}
            </div>

            <TabContent
              tab={tab}
              data={data}
              onNavigatePlan={(pid) => navigate(`/care-plans/${pid}`)}
              onEdit={(moduleKey, row) => setFormState({ moduleKey, record: row })}
              onDelete={(moduleKey, row) => setTrashTarget({ moduleKey, record: row })}
            />
          </div>

          <div className="space-y-4">
            <AIInsightCard summary={summaryData?.summary} loading={summaryLoading} onRefresh={refetchSummary} />
          </div>
        </div>
      </div>

      {action && (
        <EntityFormModal
          open
          onClose={() => setFormState(null)}
          title={formState.record ? action.editLabel : action.label}
          endpoint={action.endpoint}
          recordId={formState.record?.id}
          fields={action.fields}
          initialValues={
            formState.record || {
              patientId: patient.patientId,
              patientName: patient.fullName,
              carePlanId: activePlan?.id || "",
            }
          }
          onSaved={() => {
            refetch();
            refetchSummary();
          }}
        />
      )}
      <PatientFormModal
        open={editingPatient}
        onClose={() => setEditingPatient(false)}
        patient={patient}
        onCreated={refetch}
      />
      <ConfirmationDialog
        open={Boolean(trashTarget)}
        onClose={() => setTrashTarget(null)}
        onConfirm={async () => {
          if (!trashTarget) return;
          setTrashingBusy(true);
          try {
            const endpoint = trashTarget.moduleKey === "patients" ? "/api/zoho/patients" : FORMS[trashTarget.moduleKey].endpoint;
            await api.delete(`${endpoint}/${trashTarget.record.id}`);
            toast.success("Moved to recycle bin.");
            setTrashTarget(null);
            if (trashTarget.moduleKey === "patients") {
              navigate("/patients");
            } else {
              refetch();
              refetchSummary();
            }
          } catch (err) {
            toast.error(err.response?.data?.error || "Could not delete.");
          } finally {
            setTrashingBusy(false);
          }
        }}
        loading={trashingBusy}
        title="Move to recycle bin?"
        message={`${trashTarget?.record?.name || trashTarget?.record?.fullName || trashTarget?.record?.teamMember || "This record"} will be moved to the recycle bin.`}
        confirmLabel="Delete"
      />
    </AppShell>
  );
}

function TabContent({ tab, data, onNavigatePlan, onEdit, onDelete }) {
  const actions = (moduleKey) => ({
    moduleKey,
    onEdit: (row) => onEdit?.(moduleKey, row),
    onDelete: (row) => onDelete?.(moduleKey, row),
  });
  if (tab === "overview") return <OverviewTab data={data} />;
  if (tab === "carePlans")
    return (
      <DataTable
        columns={withRowActions(
          [
            { key: "name", label: "Plan", sortable: true, render: (r) => <button onClick={() => onNavigatePlan(r.id)} className="font-medium text-brand-700 hover:underline">{r.name}</button> },
            { key: "careType", label: "Care Type" },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "completionPct", label: "Completion", render: (r) => <ProgressBar value={r.completionPct || 0} showLabel /> },
            { key: "targetEndDate", label: "Target End", render: (r) => formatDate(r.targetEndDate) },
          ],
          actions("carePlans")
        )}
        rows={data.carePlans}
        emptyTitle="No care plans yet"
      />
    );
  if (tab === "careTeam")
    return (
      <DataTable
        columns={withRowActions(
          [
            { key: "teamMember", label: "Member", sortable: true },
            { key: "role", label: "Role" },
            { key: "department", label: "Department" },
            { key: "responsibility", label: "Responsibility" },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ],
          actions("careTeam")
        )}
        rows={data.careTeam}
        emptyTitle="No care team assigned"
      />
    );
  if (tab === "tasks")
    return (
      <DataTable
        columns={withRowActions(
          [
            { key: "name", label: "Task", sortable: true },
            { key: "taskType", label: "Type" },
            { key: "assignedTo", label: "Assigned To" },
            { key: "priority", label: "Priority", render: (r) => <PriorityBadge priority={r.priority} /> },
            { key: "dueDate", label: "Due", render: (r) => <span className={isOverdue(r.dueDate) && r.status !== "Completed" ? "font-medium text-red-600" : ""}>{formatDate(r.dueDate)}</span> },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ],
          actions("clinicalTasks")
        )}
        rows={data.tasks}
        emptyTitle="No clinical tasks yet"
      />
    );
  if (tab === "diagnostics")
    return (
      <DataTable
        columns={withRowActions(
          [
            { key: "name", label: "Test", sortable: true },
            { key: "testCategory", label: "Category" },
            { key: "orderedBy", label: "Ordered By" },
            { key: "orderedDate", label: "Ordered", render: (r) => formatDate(r.orderedDate) },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ],
          actions("diagnostics")
        )}
        rows={data.diagnostics}
        emptyTitle="No diagnostics ordered"
      />
    );
  if (tab === "treatments")
    return (
      <DataTable
        columns={withRowActions(
          [
            { key: "name", label: "Treatment", sortable: true },
            { key: "treatmentType", label: "Type" },
            { key: "prescribedBy", label: "Prescribed By" },
            { key: "adherence", label: "Adherence", render: (r) => <AdherenceBadge adherence={r.adherence} /> },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ],
          actions("treatment")
        )}
        rows={data.treatments}
        emptyTitle="No treatment plans yet"
      />
    );
  if (tab === "appointments")
    return (
      <DataTable
        columns={withRowActions(
          [
            { key: "date", label: "Date", sortable: true, render: (r) => formatDate(r.date) },
            { key: "appointmentType", label: "Type" },
            { key: "provider", label: "Provider" },
            { key: "mode", label: "Mode" },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ],
          actions("appointments")
        )}
        rows={data.appointments}
        emptyTitle="No appointments scheduled"
      />
    );
  if (tab === "escalations")
    return (
      <DataTable
        columns={withRowActions(
          [
            { key: "name", label: "Escalation", sortable: true },
            { key: "source", label: "Source" },
            { key: "severity", label: "Severity", render: (r) => <SeverityBadge severity={r.severity} /> },
            { key: "assignedTo", label: "Assigned To" },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ],
          actions("escalations")
        )}
        rows={data.escalations}
        emptyTitle="No escalations for this patient"
      />
    );
  if (tab === "progress")
    return (
      <DataTable
        columns={withRowActions(
          [
            { key: "metricDate", label: "Date", sortable: true, render: (r) => formatDate(r.metricDate) },
            { key: "carePlanCompletionPct", label: "Plan Completion", render: (r) => <ProgressBar value={r.carePlanCompletionPct || 0} showLabel /> },
            { key: "taskCompletionPct", label: "Task Completion", render: (r) => <ProgressBar value={r.taskCompletionPct || 0} showLabel /> },
            { key: "nextMilestone", label: "Next Milestone" },
          ],
          actions("careProgress")
        )}
        rows={data.progress}
        emptyTitle="No progress entries recorded"
      />
    );
  if (tab === "activity")
    return (
      <div className="card p-5">
        <Timeline events={data.timeline} />
      </div>
    );
  return null;
}

function OverviewTab({ data }) {
  const openTasks = data.tasks.filter((t) => !["Completed", "Cancelled"].includes(t.status));
  const overdue = openTasks.filter((t) => isOverdue(t.dueDate));
  const openEsc = data.escalations.filter((e) => !["Resolved", "Dismissed"].includes(e.status));

  if (!data.carePlans.length && !openTasks.length && !openEsc.length) {
    return <EmptyState title="No activity recorded for this patient yet" description="Use the quick actions above to create a care plan, assign a team, or schedule an appointment." />;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="Open Tasks" value={openTasks.length} sub={overdue.length ? `${overdue.length} overdue` : "On track"} tone={overdue.length ? "danger" : "default"} />
        <SummaryCard label="Care Team" value={data.careTeam.filter((m) => m.status !== "Removed").length} sub="active members" />
        <SummaryCard label="Open Escalations" value={openEsc.length} tone={openEsc.length ? "warning" : "default"} sub={openEsc.length ? "needs attention" : "none open"} />
        <SummaryCard label="Diagnostics" value={data.diagnostics.length} sub={`${data.diagnostics.filter((d) => d.status === "Result Available").length} awaiting review`} />
      </div>
      <div className="card p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Recent Activity</h3>
        <Timeline events={data.timeline.slice(0, 6)} />
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, tone = "default" }) {
  const tones = { default: "text-slate-500", danger: "text-red-500", warning: "text-amber-600" };
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      <p className={`mt-0.5 text-xs ${tones[tone]}`}>{sub}</p>
    </div>
  );
}
