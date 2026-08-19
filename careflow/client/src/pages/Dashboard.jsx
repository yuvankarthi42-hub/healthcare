import { useNavigate } from "react-router-dom";
import {
  Users, ClipboardList, CheckSquare, AlertOctagon, Calendar, AlertTriangle, HeartPulse, TrendingUp, Play,
} from "lucide-react";
import AppShell from "../components/AppShell";
import MetricCard from "../components/MetricCard";
import ProgressBar from "../components/ProgressBar";
import { RiskBadge, SeverityBadge, PriorityBadge } from "../components/RiskBadge";
import StatusBadge from "../components/StatusBadge";
import { ActivityItem } from "../components/Timeline";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { CardSkeleton } from "../components/LoadingSkeleton";
import { useFetch } from "../lib/useApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useMemo, useState } from "react";
import { buildDashboardData } from "../lib/dashboardMetrics";
import { runAutomation as runZohoAutomation } from "../lib/automationEngine";

const AUTOMATION_ROLES = ["super_admin", "administrator", "care_coordinator"];

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const patientsReq = useFetch("/api/zoho/patients");
  const carePlansReq = useFetch("/api/zoho/carePlans");
  const tasksReq = useFetch("/api/zoho/clinicalTasks");
  const diagnosticsReq = useFetch("/api/zoho/diagnostics");
  const appointmentsReq = useFetch("/api/zoho/appointments");
  const escalationsReq = useFetch("/api/zoho/escalations");
  const careTeamReq = useFetch("/api/zoho/careTeam");
  const [running, setRunning] = useState(false);

  const loading =
    patientsReq.loading || carePlansReq.loading || tasksReq.loading || diagnosticsReq.loading ||
    appointmentsReq.loading || escalationsReq.loading || careTeamReq.loading;
  const error =
    patientsReq.error || carePlansReq.error || tasksReq.error || diagnosticsReq.error ||
    appointmentsReq.error || escalationsReq.error || careTeamReq.error;
  const refetch = () => {
    patientsReq.refetch();
    carePlansReq.refetch();
    tasksReq.refetch();
    diagnosticsReq.refetch();
    appointmentsReq.refetch();
    escalationsReq.refetch();
    careTeamReq.refetch();
  };

  const data = useMemo(() => {
    if (loading || error) return null;
    return buildDashboardData({
      patients: patientsReq.data?.items || [],
      carePlans: carePlansReq.data?.items || [],
      tasks: tasksReq.data?.items || [],
      diagnostics: diagnosticsReq.data?.items || [],
      appointments: appointmentsReq.data?.items || [],
      escalations: escalationsReq.data?.items || [],
      careTeam: careTeamReq.data?.items || [],
      user,
    });
  }, [loading, error, patientsReq.data, carePlansReq.data, tasksReq.data, diagnosticsReq.data, appointmentsReq.data, escalationsReq.data, careTeamReq.data, user]);

  const runAutomation = async () => {
    setRunning(true);
    try {
      const res = await runZohoAutomation();
      const total = Object.values(res).reduce((s, v) => s + (Array.isArray(v) ? v.length : 0), 0);
      toast.success(total > 0 ? `Automation created ${total} new item(s).` : "Automation ran — nothing new to raise.");
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || "Automation run failed.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <AppShell
      title="Dashboard"
      actions={
        AUTOMATION_ROLES.includes(user.role) && (
          <button onClick={runAutomation} disabled={running} className="btn-secondary">
            <Play size={14} /> {running ? "Running..." : "Run Automation"}
          </button>
        )
      }
    >
      {error && <ErrorState message={error} onRetry={refetch} />}
      {loading && !data && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}
      {data && (
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-500">Welcome back, {user.displayName.split(",")[0]}</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <MetricCard label="Active Patients" value={data.kpis.activePatients} icon={Users} tone="brand" onClick={() => navigate("/patients")} />
              <MetricCard label="Active Care Plans" value={data.kpis.activeCarePlans} icon={ClipboardList} onClick={() => navigate("/care-plans")} />
              <MetricCard label="Tasks Due Today" value={data.kpis.tasksDueToday} icon={CheckSquare} onClick={() => navigate("/tasks")} />
              <MetricCard label="Overdue Tasks" value={data.kpis.overdueTasks} icon={AlertOctagon} tone="danger" onClick={() => navigate("/tasks")} />
              <MetricCard label="Today's Appointments" value={data.kpis.todaysAppointments} icon={Calendar} onClick={() => navigate("/appointments")} />
              <MetricCard label="Open Escalations" value={data.kpis.openEscalations} icon={AlertTriangle} tone="warning" onClick={() => navigate("/escalations")} />
              <MetricCard label="High-Risk Patients" value={data.kpis.highRiskPatients} icon={HeartPulse} tone="danger" onClick={() => navigate("/patients?riskLevel=High")} />
              <MetricCard label="Plans Near Completion" value={data.kpis.carePlansNearCompletion} icon={TrendingUp} tone="success" onClick={() => navigate("/care-plans")} />
            </div>
          </div>

          {(data.mine.tasks.length > 0 || data.mine.escalations.length > 0 || data.mine.patients.length > 0) && (
            <div className="card p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">My Workload</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <MiniList title="My open tasks" items={data.mine.tasks.map((t) => ({ id: t.id, primary: t.name, secondary: t.patientName, badge: <PriorityBadge priority={t.priority} /> }))} onSeeAll={() => navigate("/tasks?ownerOnly=true")} />
                <MiniList title="My escalations" items={data.mine.escalations.map((e) => ({ id: e.id, primary: e.name, secondary: e.patientName, badge: <SeverityBadge severity={e.severity} /> }))} onSeeAll={() => navigate("/escalations?ownerOnly=true")} />
                <MiniList title="My patients" items={data.mine.patients.map((p) => ({ id: p.id, primary: p.fullName, secondary: p.primaryDiagnosis, badge: <RiskBadge level={p.riskLevel} /> }))} onSeeAll={() => navigate("/patients")} onClickItem={(id) => navigate(`/patients/${id}`)} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="card p-5 lg:col-span-2">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">Today's Care</h3>
              <div className="grid gap-5 sm:grid-cols-3">
                <MiniList title="Appointments" items={data.todaysCare.appointments.map((a) => ({ id: a.id, primary: `${a.appointmentType} · ${a.provider}`, secondary: a.patientName, badge: <StatusBadge status={a.status} /> }))} onSeeAll={() => navigate("/appointments")} />
                <MiniList title="Tasks due" items={data.todaysCare.tasks.map((t) => ({ id: t.id, primary: t.name, secondary: t.patientName, badge: <PriorityBadge priority={t.priority} /> }))} onSeeAll={() => navigate("/tasks")} />
                <MiniList title="Diagnostics to review" items={data.todaysCare.diagnosticsForReview.map((d) => ({ id: d.id, primary: d.name, secondary: d.patientName, badge: <StatusBadge status={d.status} /> }))} onSeeAll={() => navigate("/diagnostics")} />
              </div>
            </div>

            <div className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Escalation Center</h3>
                <button onClick={() => navigate("/escalations")} className="text-xs font-medium text-brand-600 hover:underline">
                  Open inbox
                </button>
              </div>
              <div className="space-y-2.5">
                <SeverityRow label="Critical" count={data.escalationCenter.critical} tone="bg-red-500" />
                <SeverityRow label="High" count={data.escalationCenter.high} tone="bg-orange-500" />
                <SeverityRow label="Medium" count={data.escalationCenter.medium} tone="bg-amber-500" />
              </div>
              {data.escalationCenter.top.length === 0 ? (
                <p className="mt-4 text-center text-xs text-slate-400">No active escalations. Great work.</p>
              ) : (
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                  {data.escalationCenter.top.slice(0, 4).map((e) => (
                    <button key={e.id} onClick={() => navigate("/escalations")} className="flex w-full items-center justify-between gap-2 rounded-lg px-1.5 py-1 text-left hover:bg-slate-50">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-slate-700">{e.name}</p>
                        <p className="truncate text-[11px] text-slate-400">{e.patientName}</p>
                      </div>
                      <SeverityBadge severity={e.severity} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="card p-5">
              <h3 className="mb-4 text-sm font-semibold text-slate-800">Patient Risk Distribution</h3>
              <div className="space-y-3">
                {["Low", "Medium", "High", "Critical"].map((lvl) => {
                  const total = data.patientRisk.low + data.patientRisk.medium + data.patientRisk.high + data.patientRisk.critical || 1;
                  const val = data.patientRisk[lvl.toLowerCase()];
                  return (
                    <div key={lvl}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <RiskBadge level={lvl} />
                        <span className="font-medium text-slate-500">{val}</span>
                      </div>
                      <ProgressBar value={(val / total) * 100} size="sm" />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Care Plan Progress</h3>
                <button onClick={() => navigate("/care-plans")} className="text-xs font-medium text-brand-600 hover:underline">
                  View all
                </button>
              </div>
              {data.topCarePlans.length === 0 ? (
                <EmptyState title="No active care plans" />
              ) : (
                <div className="space-y-3">
                  {data.topCarePlans.map((p) => (
                    <button key={p.id} onClick={() => navigate(`/care-plans/${p.id}`)} className="block w-full text-left">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="truncate font-medium text-slate-700">{p.name}</span>
                        <span className="shrink-0 text-slate-400">{p.completionPct || 0}%</span>
                      </div>
                      <ProgressBar value={p.completionPct || 0} size="sm" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">Team Workload</h3>
              {data.teamWorkload.length === 0 ? (
                <EmptyState title="No workload data" />
              ) : (
                <div className="space-y-2.5">
                  {data.teamWorkload.slice(0, 6).map((w) => (
                    <div key={w.member} className="flex items-center justify-between text-xs">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-700">{w.member}</p>
                        <p className="text-[11px] text-slate-400">{w.activePatients} patients</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">{w.assignedTasks} tasks</span>
                        {w.overdueTasks > 0 && <span className="rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-600">{w.overdueTasks} overdue</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Recent Activity</h3>
            {data.recentActivity.length === 0 ? (
              <EmptyState title="No recent activity" />
            ) : (
              <div>
                {data.recentActivity.map((a, i) => (
                  <ActivityItem key={i} icon={a.type} text={a.text} at={a.at} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function SeverityRow({ label, count, tone }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`h-2 w-2 rounded-full ${tone}`} />
      <span className="flex-1 text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-800">{count}</span>
    </div>
  );
}

function MiniList({ title, items, onSeeAll, onClickItem }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500">{title}</p>
        {onSeeAll && (
          <button onClick={onSeeAll} className="text-[11px] font-medium text-brand-600 hover:underline">
            See all
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400">Nothing here.</p>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 5).map((it) => (
            <li key={it.id} onClick={() => onClickItem?.(it.id)} className={`flex items-center justify-between gap-2 ${onClickItem ? "cursor-pointer" : ""}`}>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-700">{it.primary}</p>
                <p className="truncate text-[11px] text-slate-400">{it.secondary}</p>
              </div>
              <div className="shrink-0">{it.badge}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
