import { Check } from "lucide-react";

/**
 * stages: [{ key, label, status: 'done'|'active'|'pending', count, hint, onClick }]
 */
export default function CareJourney({ stages }) {
  return (
    <div className="card overflow-x-auto p-4">
      <div className="flex min-w-max items-start">
        {stages.map((s, i) => (
          <div key={s.key} className="flex items-start">
            <button
              onClick={s.onClick}
              disabled={!s.onClick}
              className={`flex w-32 flex-col items-center gap-1.5 rounded-lg px-2 py-1.5 text-center ${s.onClick ? "hover:bg-slate-50" : ""}`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ring-4 ${
                  s.status === "done"
                    ? "bg-emerald-500 text-white ring-emerald-50"
                    : s.status === "active"
                    ? "bg-brand-600 text-white ring-brand-50"
                    : "bg-slate-100 text-slate-400 ring-white"
                }`}
              >
                {s.status === "done" ? <Check size={16} /> : i + 1}
              </div>
              <p className={`text-xs font-medium ${s.status === "pending" ? "text-slate-400" : "text-slate-700"}`}>{s.label}</p>
              {s.count !== undefined && <p className="text-[11px] text-slate-400">{s.count}</p>}
            </button>
            {i < stages.length - 1 && <div className={`mt-4 h-px w-8 shrink-0 ${s.status === "done" ? "bg-emerald-300" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>
    </div>
  );
}
