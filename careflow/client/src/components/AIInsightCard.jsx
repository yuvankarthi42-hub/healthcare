import { Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { formatRelative } from "../lib/format";

export default function AIInsightCard({ summary, loading, onRefresh }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-brand-50 to-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Sparkles size={14} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">AI Patient Summary</p>
            <p className="text-[11px] text-slate-400">{summary ? `Updated ${formatRelative(summary.generatedAt)}` : "Operational summary"}</p>
          </div>
        </div>
        {onRefresh && (
          <button onClick={onRefresh} disabled={loading} className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-brand-600">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        )}
      </div>
      <div className="px-4 py-4">
        {loading && !summary ? (
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-4/6 animate-pulse rounded bg-slate-100" />
          </div>
        ) : summary ? (
          <>
            <ul className="space-y-2.5 text-sm leading-relaxed text-slate-600">
              {summary.sections.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
            {summary.attentionItems?.length > 0 && (
              <div className="mt-4 rounded-lg bg-amber-50 p-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                  <AlertCircle size={13} /> Attention Areas
                </p>
                <ul className="space-y-1 text-xs text-amber-700">
                  {summary.attentionItems.map((a, i) => (
                    <li key={i}>• {a}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] italic text-slate-400">{summary.disclaimer}</p>
          </>
        ) : (
          <p className="text-sm text-slate-400">No summary available.</p>
        )}
      </div>
    </div>
  );
}
