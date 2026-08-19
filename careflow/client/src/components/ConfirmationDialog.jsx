import Modal from "./Modal";
import { ShieldAlert } from "lucide-react";

export default function ConfirmationDialog({ open, onClose, onConfirm, title = "Are you sure?", message, confirmLabel = "Continue", tone = "danger", loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500">
          <ShieldAlert size={20} />
        </div>
        <p className="text-sm text-slate-600">{message || "This action cannot be easily reversed. Continue?"}</p>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn-secondary" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button className={tone === "danger" ? "btn-danger" : "btn-primary"} onClick={onConfirm} disabled={loading}>
          {loading ? "Working..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
