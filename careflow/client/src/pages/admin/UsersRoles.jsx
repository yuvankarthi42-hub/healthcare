import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import AppShell from "../../components/AppShell";
import DataTable from "../../components/DataTable";
import ErrorState from "../../components/ErrorState";
import { useFetch } from "../../lib/useApi";
import { DEMO_ACCOUNTS, ROLE_LABELS, PRODUCT_NAME } from "../../data/constants";

export default function UsersRoles() {
  const { data, loading, error, refetch } = useFetch("/api/zoho/careTeam");
  const careTeam = data?.items || [];

  const rows = DEMO_ACCOUNTS.map((u) => {
    const assignments = careTeam.filter((m) => m.teamMember?.toLowerCase() === u.displayName.toLowerCase() && m.status !== "Removed");
    return {
      email: u.email,
      displayName: u.displayName,
      title: u.title,
      roleLabel: ROLE_LABELS[u.role],
      assignedPatients: new Set(assignments.map((w) => w.patientId)).size,
    };
  });

  return (
    <AppShell
      title="Users & Roles"
      actions={
        <Link to="/admin/permission-matrix" className="btn-secondary">
          <Shield size={14} /> View Permission Matrix
        </Link>
      }
    >
      {error && <ErrorState message={error} onRetry={refetch} />}
      {!error && (
        <DataTable
          columns={[
            { key: "displayName", label: "Name", sortable: true },
            { key: "email", label: "Email" },
            { key: "roleLabel", label: "Role", sortable: true },
            { key: "title", label: "Title" },
            { key: "assignedPatients", label: "Assigned Patients", sortable: true },
          ]}
          rows={rows}
          loading={loading}
          keyField="email"
          emptyTitle="No demo users configured"
        />
      )}
      <p className="mt-4 text-xs text-slate-400">
        {PRODUCT_NAME} ships {DEMO_ACCOUNTS.length} demo personas. Zoho Projects does not support programmatic portal-user
        provisioning, so these are demo logins rather than distinct Zoho Projects portal accounts.
      </p>
    </AppShell>
  );
}
