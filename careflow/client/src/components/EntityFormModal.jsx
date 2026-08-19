import { useEffect, useState } from "react";
import Modal from "./Modal";
import api from "../lib/apiClient";
import { useToast } from "../context/ToastContext";

const STRIP_KEYS = new Set(["id", "zohoStatus", "createdTime", "updatedTime", "limitedView", "timestamp", "counts"]);

function payloadFrom(values) {
  const out = {};
  for (const [key, value] of Object.entries(values || {})) {
    if (STRIP_KEYS.has(key) || key.startsWith("_")) continue;
    out[key] = value;
  }
  return out;
}

/**
 * Generic create/edit form modal driven by a field schema.
 * Create: POST `endpoint`. Edit: PATCH `endpoint/:recordId` when `recordId` is set.
 * fields: [{ key, label, type: 'text'|'textarea'|'date'|'select'|'number'|'patientSelect', options, required, colSpan }]
 */
export default function EntityFormModal({
  open,
  onClose,
  title,
  endpoint,
  fields,
  initialValues = {},
  recordId,
  onSaved,
  successMessage,
  patients,
}) {
  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const isEdit = Boolean(recordId);

  useEffect(() => {
    if (open) setValues(initialValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, recordId]);

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = payloadFrom(values);
      if (isEdit) {
        await api.patch(`${endpoint}/${recordId}`, payload);
      } else {
        await api.post(endpoint, payload);
      }
      toast.success(successMessage || (isEdit ? "Updated." : "Saved."));
      onClose();
      onSaved?.();
    } catch (err) {
      toast.error(err.response?.data?.error || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" form="entity-form" type="submit" disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Save"}
          </button>
        </>
      }
    >
      <form id="entity-form" onSubmit={submit} className="grid grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.key} className={f.colSpan === 2 ? "col-span-2" : ""}>
            <label className="label">
              {f.label}
              {f.required && <span className="text-red-400"> *</span>}
            </label>
            {f.type === "patientSelect" ? (
              <select
                className="input"
                value={values.patientId ?? ""}
                onChange={(e) => {
                  const p = patients?.find((pt) => pt.patientId === e.target.value);
                  setValues((v) => ({ ...v, patientId: e.target.value, patientName: p?.fullName || "" }));
                }}
                required={f.required}
              >
                <option value="" disabled>
                  Select patient...
                </option>
                {patients?.map((p) => (
                  <option key={p.id} value={p.patientId}>
                    {p.fullName} ({p.patientId})
                  </option>
                ))}
              </select>
            ) : f.type === "select" ? (
              <select className="input" value={values[f.key] ?? ""} onChange={set(f.key)} required={f.required}>
                <option value="" disabled>
                  Select...
                </option>
                {f.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea className="input" rows={3} value={values[f.key] ?? ""} onChange={set(f.key)} required={f.required} />
            ) : (
              <input
                className="input"
                type={f.type || "text"}
                value={values[f.key] ?? ""}
                onChange={set(f.key)}
                required={f.required}
                placeholder={f.placeholder}
              />
            )}
          </div>
        ))}
      </form>
    </Modal>
  );
}
