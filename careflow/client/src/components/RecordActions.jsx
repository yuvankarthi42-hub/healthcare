import { Pencil, Trash2 } from "lucide-react";
import PermissionGate from "./PermissionGate";

/** Row-level Edit / Delete buttons. Click is stopped so the table row navigation still works. */
export default function RecordActions({ moduleKey, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
      {onEdit && (
        <PermissionGate moduleKey={moduleKey} require="edit">
          <button type="button" title="Edit" onClick={onEdit} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <Pencil size={14} />
          </button>
        </PermissionGate>
      )}
      {onDelete && (
        <PermissionGate moduleKey={moduleKey} require="delete">
          <button type="button" title="Delete" onClick={onDelete} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
            <Trash2 size={14} />
          </button>
        </PermissionGate>
      )}
    </div>
  );
}

export function withRowActions(columns, { moduleKey, onEdit, onDelete }) {
  return [
    ...columns,
    {
      key: "_actions",
      label: "",
      className: "w-[88px] text-right",
      render: (row) => (
        <RecordActions
          moduleKey={moduleKey}
          onEdit={onEdit ? () => onEdit(row) : undefined}
          onDelete={onDelete ? () => onDelete(row) : undefined}
        />
      ),
    },
  ];
}
