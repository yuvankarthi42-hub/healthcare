import { Search, X } from "lucide-react";

/**
 * `filters` = [{ key, label, options: [{value,label}] }]
 * `values` = { [key]: value }
 */
export default function FilterBar({ search, onSearchChange, searchPlaceholder = "Search...", filters = [], values = {}, onChange, onClear }) {
  const hasActive = Object.values(values).some(Boolean) || !!search;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative w-full max-w-xs">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search || ""}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="input pl-8"
        />
      </div>
      {filters.map((f) => (
        <select
          key={f.key}
          value={values[f.key] || ""}
          onChange={(e) => onChange(f.key, e.target.value)}
          className="input w-auto min-w-[140px] cursor-pointer bg-white py-2 text-sm"
        >
          <option value="">{f.label}: All</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
      {hasActive && (
        <button onClick={onClear} className="btn-ghost text-xs">
          <X size={13} /> Clear
        </button>
      )}
    </div>
  );
}
