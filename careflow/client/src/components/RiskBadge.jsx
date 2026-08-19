import { RISK_COLORS, SEVERITY_COLORS, PRIORITY_COLORS, ADHERENCE_COLORS } from "../data/constants";
import { AlertTriangle } from "lucide-react";

export function RiskBadge({ level, className = "" }) {
  const color = RISK_COLORS[level] || "bg-slate-100 text-slate-600 ring-slate-500/20";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${color} ${className}`}>
      {(level === "High" || level === "Critical") && <AlertTriangle size={11} strokeWidth={2.5} />}
      {level || "Unrisked"}
    </span>
  );
}

export function SeverityBadge({ severity, className = "" }) {
  const color = SEVERITY_COLORS[severity] || "bg-slate-100 text-slate-600 ring-slate-500/20";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${color} ${className}`}>
      {severity || "—"}
    </span>
  );
}

export function PriorityBadge({ priority, className = "" }) {
  const color = PRIORITY_COLORS[priority] || "bg-slate-100 text-slate-600 ring-slate-500/20";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${color} ${className}`}>
      {priority || "—"}
    </span>
  );
}

export function AdherenceBadge({ adherence, className = "" }) {
  const color = ADHERENCE_COLORS[adherence] || "bg-slate-100 text-slate-600 ring-slate-500/20";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${color} ${className}`}>
      {adherence || "Unknown"}
    </span>
  );
}
