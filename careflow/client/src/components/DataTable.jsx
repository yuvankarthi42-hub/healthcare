import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import EmptyState from "./EmptyState";
import { TableSkeleton } from "./LoadingSkeleton";

/**
 * columns: [{ key, label, render?: (row) => node, sortValue?: (row) => value|number, className? }]
 */
export default function DataTable({ columns, rows, loading, onRowClick, emptyTitle = "No records found", emptyDescription, keyField = "id" }) {
  const [sort, setSort] = useState(null); // { key, dir }

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const getVal = col.sortValue || ((r) => r[col.key]);
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return sort.dir === "asc" ? av - bv : bv - av;
      return sort.dir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [rows, sort, columns]);

  const toggleSort = (key) => {
    setSort((s) => {
      if (!s || s.key !== key) return { key, dir: "asc" };
      if (s.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  };

  if (loading) return <TableSkeleton cols={columns.length} />;
  if (!rows || rows.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
            {columns.map((c) => (
              <th key={c.key} className={`px-5 py-3 font-medium ${c.className || ""}`}>
                {c.sortValue || c.sortable ? (
                  <button className="inline-flex items-center gap-1 hover:text-slate-600" onClick={() => toggleSort(c.key)}>
                    {c.label}
                    {sort?.key === c.key ? sort.dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} /> : <ChevronsUpDown size={12} className="opacity-40" />}
                  </button>
                ) : (
                  c.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sorted.map((row) => (
            <tr
              key={row[keyField]}
              onClick={() => onRowClick?.(row)}
              className={`transition-colors ${onRowClick ? "cursor-pointer hover:bg-slate-50" : ""}`}
            >
              {columns.map((c) => (
                <td key={c.key} className={`px-5 py-3.5 align-middle ${c.className || ""}`}>
                  {c.render ? c.render(row) : row[c.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
