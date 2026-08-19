import { useMemo } from "react";
import { useFetch } from "./useApi";

/**
 * Resolves a `patientId` value found on a non-patient record (task,
 * diagnostic, appointment, etc.) to the Zoho record id CareFlow's routes
 * use in URLs (`/patients/:id`). Cross-module records store the patient
 * reference as a plain text field (no native Zoho Projects lookup - see
 * README > Limitations), so this indirection keeps every screen working
 * regardless of whether that text field holds the patient's business code
 * or its underlying Zoho id.
 */
export function usePatientLookup() {
  const { data } = useFetch("/api/zoho/patients");
  const patients = data?.items || [];

  const resolve = useMemo(() => {
    const byCode = new Map(patients.map((p) => [p.patientId, p.id]));
    const byId = new Set(patients.map((p) => String(p.id)));
    return (rawPatientId) => {
      if (!rawPatientId) return null;
      if (byCode.has(rawPatientId)) return byCode.get(rawPatientId);
      if (byId.has(String(rawPatientId))) return String(rawPatientId);
      return null;
    };
  }, [patients]);

  return { patients, resolvePatientRecordId: resolve };
}
