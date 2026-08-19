import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AppShell from "../../components/AppShell";
import { MATRIX, MODULE_KEYS, ROLES } from "../../data/rbac";
import { ROLE_LABELS } from "../../data/constants";

const MODULE_LABELS = {
  patients: "Patients",
  carePlans: "Care Plans",
  careTeam: "Care Team",
  clinicalTasks: "Care Tasks",
  diagnostics: "Diagnostics",
  treatment: "Treatment",
  appointments: "Appointments",
  escalations: "Escalations",
  careProgress: "Care Progress",
  usersRoles: "Users & Roles",
  auditLog: "Audit Log",
  settings: "Settings",
};

function summarize(perm) {
  if (!perm || perm.view === "none") return { label: "None", tone: "bg-slate-100 text-slate-400" };
  if (perm.view === "all" && perm.edit === "all" && perm.create && perm.delete) return { label: "Full", tone: "bg-emerald-50 text-emerald-700" };
  if (perm.view === "limited") return { label: "Limited", tone: "bg-amber-50 text-amber-700" };
  if (perm.view === "scoped") return { label: "Scoped", tone: "bg-sky-50 text-sky-700" };
  if (perm.view === "assigned" && perm.edit !== "none") return { label: "Assigned (edit)", tone: "bg-brand-50 text-brand-700" };
  if (perm.view === "assigned") return { label: "Assigned (view)", tone: "bg-slate-100 text-slate-600" };
  if (perm.create && perm.edit !== "all") return { label: "Create/View", tone: "bg-brand-50 text-brand-700" };
  if (perm.view === "all" && perm.edit === "all") return { label: "Create/Edit", tone: "bg-brand-50 text-brand-700" };
  if (perm.view === "all" && perm.edit !== "none" && perm.edit !== "all") return { label: "Track", tone: "bg-sky-50 text-sky-700" };
  if (perm.view === "all") return { label: "View", tone: "bg-slate-100 text-slate-600" };
  return { label: "Custom", tone: "bg-slate-100 text-slate-500" };
}

export default function PermissionMatrix() {
  const navigate = useNavigate();
  const roles = ROLES.map((id) => ({ id, label: ROLE_LABELS[id] }));

  return (
    <AppShell title="Permission Matrix">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={14} /> Back
      </button>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Module</th>
              {roles.map((r) => (
                <th key={r.id} className="px-3 py-3 text-center">{r.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MODULE_KEYS.map((mk) => (
              <tr key={mk}>
                <td className="px-4 py-3 font-medium text-slate-700">{MODULE_LABELS[mk] || mk}</td>
                {roles.map((r) => {
                  const s = summarize(MATRIX[r.id]?.[mk]);
                  return (
                    <td key={r.id} className="px-3 py-3 text-center">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${s.tone}`}>{s.label}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-slate-400">
        Writes to Zoho Projects records are also checked on the server. Hiding a button here is not the security boundary.
      </p>
    </AppShell>
  );
}
