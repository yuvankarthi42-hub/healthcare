import { CheckCircle2, ClipboardList, Activity, Pill, Calendar, AlertTriangle, TrendingUp, UserPlus } from "lucide-react";
import { formatRelative, formatDateTime } from "../lib/format";

const ICONS = {
  care_plan: ClipboardList,
  care_team: UserPlus,
  task: CheckCircle2,
  diagnostic: Activity,
  treatment: Pill,
  appointment: Calendar,
  escalation: AlertTriangle,
  progress: TrendingUp,
};

const TONES = {
  care_plan: "bg-brand-50 text-brand-600",
  care_team: "bg-violet-50 text-violet-600",
  task: "bg-emerald-50 text-emerald-600",
  diagnostic: "bg-sky-50 text-sky-600",
  treatment: "bg-fuchsia-50 text-fuchsia-600",
  appointment: "bg-amber-50 text-amber-600",
  escalation: "bg-red-50 text-red-600",
  progress: "bg-teal-50 text-teal-600",
};

export function ActivityItem({ icon, text, at }) {
  const Icon = ICONS[icon] || Activity;
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${TONES[icon] || "bg-slate-100 text-slate-500"}`}>
          <Icon size={14} />
        </div>
        <div className="mt-1 w-px flex-1 bg-slate-100" />
      </div>
      <div className="pb-5">
        <p className="text-sm text-slate-700">{text}</p>
        <p className="mt-0.5 text-xs text-slate-400" title={formatDateTime(at)}>
          {formatRelative(at)}
        </p>
      </div>
    </div>
  );
}

export default function Timeline({ events = [] }) {
  if (!events.length) {
    return <p className="py-6 text-center text-sm text-slate-400">No activity recorded yet.</p>;
  }
  return (
    <div>
      {events.map((e, i) => (
        <ActivityItem key={i} icon={e.icon} text={e.text} at={e.at} />
      ))}
    </div>
  );
}
