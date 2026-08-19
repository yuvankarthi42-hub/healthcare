import { useEffect, useState } from "react";
import Modal from "../../components/Modal";
import api from "../../lib/apiClient";
import { useToast } from "../../context/ToastContext";
import { ENUMS } from "../../data/constants";

const empty = {
  firstName: "",
  lastName: "",
  preferredName: "",
  dateOfBirth: "",
  gender: "Female",
  phone: "",
  email: "",
  address: "",
  emergencyContact: "",
  primaryPhysician: "",
  primaryDiagnosis: "",
  secondaryConditions: "",
  allergies: "",
  riskLevel: "Low",
  insuranceProvider: "",
  insuranceId: "",
  patientStatus: "Active",
  careCoordinator: "",
  preferredLanguage: "English",
  communicationPreference: "Phone",
};

export default function PatientFormModal({ open, onClose, onCreated, patient }) {
  const isEdit = Boolean(patient?.id);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    if (patient) {
      const parts = String(patient.fullName || "").trim().split(/\s+/);
      setForm({
        ...empty,
        ...patient,
        firstName: patient.firstName || parts[0] || "",
        lastName: patient.lastName || parts.slice(1).join(" ") || "",
      });
    } else {
      setForm(empty);
    }
  }, [open, patient]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fullName = `${form.firstName} ${form.lastName}`.trim() || form.fullName;
      const payload = {
        ...form,
        fullName,
      };
      delete payload.id;
      delete payload.zohoStatus;
      delete payload.createdTime;
      delete payload.updatedTime;
      delete payload.patientId;
      if (isEdit) {
        await api.patch(`/api/zoho/patients/${patient.id}`, payload);
        toast.success("Patient updated.");
      } else {
        await api.post("/api/zoho/patients", {
          ...payload,
          patientCode: `PT-${Math.floor(1000 + Math.random() * 9000)}`,
          registrationDate: new Date().toISOString().slice(0, 10),
        });
        toast.success("Patient registered.");
        setForm(empty);
      }
      onClose();
      onCreated?.();
    } catch (err) {
      toast.error(err.response?.data?.error || (isEdit ? "Could not update patient." : "Could not register patient."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Patient" : "Register New Patient"} size="lg" footer={
      <>
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" form="patient-form" type="submit" disabled={saving}>{saving ? "Saving..." : isEdit ? "Save Changes" : "Register Patient"}</button>
      </>
    }>
      <form id="patient-form" onSubmit={submit} className="grid grid-cols-2 gap-4">
        <Text label="First Name" value={form.firstName} onChange={set("firstName")} required />
        <Text label="Last Name" value={form.lastName} onChange={set("lastName")} required />
        <Text label="Preferred Name" value={form.preferredName} onChange={set("preferredName")} />
        <Text label="Date of Birth" type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} required />
        <Select label="Gender" value={form.gender} onChange={set("gender")} options={["Female", "Male", "Non-binary", "Prefer not to say"]} />
        <Text label="Phone" value={form.phone} onChange={set("phone")} />
        <Text label="Email" type="email" value={form.email} onChange={set("email")} />
        <Text label="Emergency Contact" value={form.emergencyContact} onChange={set("emergencyContact")} placeholder="Name · Relationship · Phone" />
        <Text label="Address" value={form.address} onChange={set("address")} className="col-span-2" />
        <Text label="Primary Physician" value={form.primaryPhysician} onChange={set("primaryPhysician")} />
        <Text label="Care Coordinator" value={form.careCoordinator} onChange={set("careCoordinator")} />
        <Text label="Primary Diagnosis" value={form.primaryDiagnosis} onChange={set("primaryDiagnosis")} className="col-span-2" />
        <Text label="Secondary Conditions" value={form.secondaryConditions} onChange={set("secondaryConditions")} className="col-span-2" />
        <Text label="Allergies" value={form.allergies} onChange={set("allergies")} className="col-span-2" />
        <Select label="Risk Level" value={form.riskLevel} onChange={set("riskLevel")} options={ENUMS.riskLevel} />
        <Select label="Patient Status" value={form.patientStatus} onChange={set("patientStatus")} options={ENUMS.patientStatus} />
        <Text label="Insurance Provider" value={form.insuranceProvider} onChange={set("insuranceProvider")} />
        <Text label="Insurance ID" value={form.insuranceId} onChange={set("insuranceId")} />
        <Text label="Preferred Language" value={form.preferredLanguage} onChange={set("preferredLanguage")} />
        <Select label="Communication Preference" value={form.communicationPreference} onChange={set("communicationPreference")} options={["Phone", "Email", "SMS", "Portal"]} />
      </form>
    </Modal>
  );
}

function Text({ label, className = "", ...props }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      <input className="input" {...props} />
    </div>
  );
}
function Select({ label, options, className = "", ...props }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      <select className="input" {...props}>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
