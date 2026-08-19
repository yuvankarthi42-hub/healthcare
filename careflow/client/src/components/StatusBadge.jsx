import { STATUS_COLORS } from "../data/constants";

export default function StatusBadge({ status, className = "" }) {
  const color = STATUS_COLORS[status] || "bg-slate-100 text-slate-600 ring-slate-500/20";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${color} ${className}`}>
      {status || "—"}
    </span>
  );
}
