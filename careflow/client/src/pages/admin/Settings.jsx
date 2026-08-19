import { useState } from "react";
import { Play, Database, ShieldCheck, Info } from "lucide-react";
import AppShell from "../../components/AppShell";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { runAutomation as runZohoAutomation } from "../../lib/automationEngine";

// Mirrors ALLOWED_ROLES in functions/careflow-api/src/routes/automation.js.
const AUTOMATION_ROLES = ["super_admin", "administrator", "care_coordinator"];

export default function Settings() {
  const [running, setRunning] = useState(false);
  const toast = useToast();
  const { user } = useAuth();
  const canRunAutomation = AUTOMATION_ROLES.includes(user?.role);

  const runAutomation = async () => {
    setRunning(true);
    try {
      const res = await runZohoAutomation();
      const total = Object.values(res).reduce((s, v) => s + (Array.isArray(v) ? v.length : 0), 0);
      toast.success(total > 0 ? `Automation created ${total} new item(s).` : "Automation ran — nothing new to raise.");
    } catch (err) {
      toast.error(err.response?.data?.error || "Automation run failed.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <AppShell title="Settings">
      <div className="max-w-3xl space-y-5">
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Database size={16} className="text-brand-600" />
            <h3 className="text-sm font-semibold text-slate-800">Data Backbone</h3>
          </div>
          <p className="text-sm text-slate-600">
            Every persistent CareFlow record — patients, care plans, care team, tasks, diagnostics, treatment plans, appointments, escalations,
            progress, and audit entries — lives in Zoho Projects custom modules. This UI is a purpose-built healthcare layer on top; no external
            database is used as a source of truth.
          </p>
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Play size={16} className="text-brand-600" />
            <h3 className="text-sm font-semibold text-slate-800">Workflow Automation</h3>
          </div>
          <p className="mb-3 text-sm text-slate-600">
            CareFlow's escalation engine scans for overdue high-priority tasks, missed appointments, diagnostic results awaiting review,
            high-risk patients with no recent activity, and care plans nearing their target date with low completion — raising escalations (and
            review tasks) automatically. In this demo it runs on demand; in a production Catalyst deployment it would run on a scheduled Cron
            Trigger calling the same function.
          </p>
          {canRunAutomation ? (
            <button onClick={runAutomation} disabled={running} className="btn-primary">
              <Play size={14} /> {running ? "Running..." : "Run Automation Now"}
            </button>
          ) : (
            <p className="text-xs text-slate-400">Your role cannot trigger automation.</p>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck size={16} className="text-brand-600" />
            <h3 className="text-sm font-semibold text-slate-800">Your Session</h3>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-slate-400">Signed in as</dt>
              <dd className="font-medium text-slate-700">{user?.displayName}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Role</dt>
              <dd className="font-medium text-slate-700">{user?.title}</dd>
            </div>
          </dl>
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Info size={16} className="text-brand-600" />
            <h3 className="text-sm font-semibold text-slate-800">Known Limitations</h3>
          </div>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-600">
            <li>Zoho Projects custom modules have no native cross-module lookup fields; relationships are implemented via plain-text reference IDs, resolved by CareFlow's API layer.</li>
            <li>Zoho Projects picklist fields returned an unrecoverable API error on record create/update, so enum fields (status, priority, severity, etc.) are single-line text fields with validation enforced by CareFlow.</li>
            <li>Zoho Projects has no API to provision new portal users, so the 8 demo personas are CareFlow's own JWT-based accounts rather than distinct Zoho portal logins.</li>
            <li>See the README for the full list, plus what specifically broke during the build.</li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
