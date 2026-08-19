import PatientAvatar from "./PatientAvatar";
import { RiskBadge } from "./RiskBadge";
import StatusBadge from "./StatusBadge";
import { age, formatDate } from "../lib/format";
import { Phone, Mail, Calendar, Stethoscope, UserRound } from "lucide-react";

export default function PatientHeader({ patient, activePlan, nextAppointment, actions }) {
  const patientAge = age(patient.dateOfBirth);
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <PatientAvatar name={patient.fullName} size={56} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">{patient.fullName}</h2>
              <RiskBadge level={patient.riskLevel} />
              <StatusBadge status={patient.patientStatus} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {patient.patientId} • {patientAge != null ? `${patientAge} yrs` : "Age n/a"} • {patient.gender || "—"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-start gap-3">
          {patient.phone && (
            <span className="flex items-center gap-1.5 text-slate-500">
              <Phone size={13} /> {patient.phone}
            </span>
          )}
          {patient.email && (
            <span className="flex items-center gap-1.5 text-slate-500">
              <Mail size={13} /> {patient.email}
            </span>
          )}
          {actions}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-4">
        <Field icon={Stethoscope} label="Primary Diagnosis" value={patient.primaryDiagnosis} />
        <Field icon={UserRound} label="Care Coordinator" value={patient.careCoordinator} />
        <Field icon={UserRound} label="Current Care Plan" value={activePlan ? activePlan.name : "None active"} />
        <Field icon={Calendar} label="Next Appointment" value={nextAppointment ? `${formatDate(nextAppointment.date)} · ${nextAppointment.appointmentType}` : "None scheduled"} />
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        <Icon size={11} /> {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium text-slate-800">{value || "—"}</p>
    </div>
  );
}
