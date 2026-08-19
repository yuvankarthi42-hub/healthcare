import { useMemo } from "react";
import { useFetch } from "./useApi";
import { buildPatientAISummary } from "./aiSummary";
import { buildPatientTimeline } from "./timeline";

/**
 * Assembles everything the Patient Workspace needs from the generic
 * `/api/zoho/*` endpoints: the patient record, every related module's
 * records scoped to this patient, the AI summary, and the activity
 * timeline - all computed in the browser instead of a bespoke backend
 * "patient bundle" endpoint. Cross-module records reference a patient by a
 * plain-text field that may hold either the business code or the Zoho
 * record id (no native Zoho lookup - see README > Limitations), so matching
 * happens against both.
 */
export function usePatientBundle(patientRecordId) {
  const patientReq = useFetch(patientRecordId ? `/api/zoho/patients/${patientRecordId}` : null);
  const carePlansReq = useFetch("/api/zoho/carePlans");
  const careTeamReq = useFetch("/api/zoho/careTeam");
  const tasksReq = useFetch("/api/zoho/clinicalTasks");
  const diagnosticsReq = useFetch("/api/zoho/diagnostics");
  const treatmentsReq = useFetch("/api/zoho/treatment");
  const appointmentsReq = useFetch("/api/zoho/appointments");
  const escalationsReq = useFetch("/api/zoho/escalations");
  const progressReq = useFetch("/api/zoho/careProgress");

  const loading =
    patientReq.loading ||
    carePlansReq.loading ||
    careTeamReq.loading ||
    tasksReq.loading ||
    diagnosticsReq.loading ||
    treatmentsReq.loading ||
    appointmentsReq.loading ||
    escalationsReq.loading ||
    progressReq.loading;
  const error = patientReq.error;
  const patient = patientReq.data?.item;

  const bundle = useMemo(() => {
    if (!patient) return null;
    const byPatient = (arr) => (arr || []).filter((r) => r.patientId === patient.patientId || String(r.patientId) === String(patient.id));
    return {
      carePlans: byPatient(carePlansReq.data?.items),
      careTeam: byPatient(careTeamReq.data?.items),
      tasks: byPatient(tasksReq.data?.items),
      diagnostics: byPatient(diagnosticsReq.data?.items),
      treatments: byPatient(treatmentsReq.data?.items),
      appointments: byPatient(appointmentsReq.data?.items),
      escalations: byPatient(escalationsReq.data?.items),
      progress: byPatient(progressReq.data?.items),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    patient,
    carePlansReq.data,
    careTeamReq.data,
    tasksReq.data,
    diagnosticsReq.data,
    treatmentsReq.data,
    appointmentsReq.data,
    escalationsReq.data,
    progressReq.data,
  ]);

  const timeline = useMemo(() => (bundle ? buildPatientTimeline(bundle) : []), [bundle]);
  const summary = useMemo(() => (patient && bundle ? buildPatientAISummary({ patient, ...bundle }) : null), [patient, bundle]);

  const data = useMemo(() => {
    if (!patient || !bundle) return null;
    return { item: patient, permission: patientReq.data?.permission, ...bundle, timeline };
  }, [patient, bundle, timeline, patientReq.data]);

  const refetch = () => {
    patientReq.refetch();
    carePlansReq.refetch();
    careTeamReq.refetch();
    tasksReq.refetch();
    diagnosticsReq.refetch();
    treatmentsReq.refetch();
    appointmentsReq.refetch();
    escalationsReq.refetch();
    progressReq.refetch();
  };

  return { data, summary, loading, error, refetch };
}
