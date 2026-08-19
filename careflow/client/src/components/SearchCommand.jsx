import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, ClipboardList, UsersRound, CheckSquare, Activity, Calendar, AlertTriangle, X } from "lucide-react";
import api from "../lib/apiClient";
import { runSearch } from "../lib/searchEngine";

const TYPE_META = {
  patient: { icon: User, label: "Patient", to: (r) => `/patients/${r.id}` },
  carePlan: { icon: ClipboardList, label: "Care Plan", to: (r) => `/care-plans/${r.id}` },
  careTeam: { icon: UsersRound, label: "Care Team", to: () => `/care-team` },
  task: { icon: CheckSquare, label: "Task", to: () => `/tasks` },
  diagnostic: { icon: Activity, label: "Diagnostic", to: () => `/diagnostics` },
  appointment: { icon: Calendar, label: "Appointment", to: () => `/appointments` },
  escalation: { icon: AlertTriangle, label: "Escalation", to: () => `/escalations` },
};

export default function SearchCommand({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const [patients, carePlans, careTeam, tasks, diagnostics, appointments, escalations] = await Promise.all([
          api.get("/api/zoho/patients"),
          api.get("/api/zoho/carePlans"),
          api.get("/api/zoho/careTeam"),
          api.get("/api/zoho/clinicalTasks"),
          api.get("/api/zoho/diagnostics"),
          api.get("/api/zoho/appointments"),
          api.get("/api/zoho/escalations"),
        ]);
        const { results: next } = runSearch(query, {
          patients: patients.data.items || [],
          carePlans: carePlans.data.items || [],
          careTeam: careTeam.data.items || [],
          tasks: tasks.data.items || [],
          diagnostics: diagnostics.data.items || [],
          appointments: appointments.data.items || [],
          escalations: escalations.data.items || [],
        });
        setResults(next);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(handle);
  }, [open, query]);

  if (!open) return null;

  const flatGroups = results
    ? Object.entries(results)
        .filter(([, items]) => items.length > 0)
        .map(([type, items]) => ({ type, items }))
    : [];

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24">
      <div className="absolute inset-0 bg-slate-900/40 animate-fade-in" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl animate-fade-in overflow-hidden rounded-2xl bg-white shadow-popover">
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3.5">
          <Search size={17} className="text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients, care plans, tasks, diagnostics, appointments, escalations..."
            className="flex-1 text-sm outline-none placeholder:text-slate-400"
          />
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {loading && <p className="px-3 py-6 text-center text-sm text-slate-400">Searching...</p>}
          {!loading && query.trim().length >= 2 && flatGroups.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-slate-400">No results for "{query}"</p>
          )}
          {!loading &&
            flatGroups.map((group) => {
              const meta = TYPE_META[group.items[0]?.type] || {};
              const Icon = meta.icon || Search;
              return (
                <div key={group.type} className="mb-1">
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{meta.label}s</p>
                  {group.items.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => {
                        onClose();
                        navigate(meta.to(item));
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <Icon size={15} className="shrink-0 text-slate-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{item.title}</p>
                        {item.subtitle && <p className="truncate text-xs text-slate-400">{item.subtitle}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
          {query.trim().length < 2 && <p className="px-3 py-6 text-center text-xs text-slate-400">Type at least 2 characters to search across CareFlow.</p>}
        </div>
      </div>
    </div>
  );
}
