import { useState } from "react";
import AppShell from "../../components/AppShell";
import FilterBar from "../../components/FilterBar";
import DataTable from "../../components/DataTable";
import ErrorState from "../../components/ErrorState";
import { useFetch } from "../../lib/useApi";
import { formatDateTime } from "../../lib/format";

const ENTITY_TYPES = ["Patient", "Care Plan", "Care Team Member", "Clinical Task", "Diagnostic", "Treatment Plan", "Appointment", "Escalation", "Session", "System"];

export default function AuditLog() {
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("");
  const { data, loading, error, refetch } = useFetch("/api/zoho/auditLog", { search: search || undefined, entityType: entityType || undefined });

  return (
    <AppShell title="Audit Log">
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by user, action, or entity..."
        filters={[{ key: "entityType", label: "Entity", options: ENTITY_TYPES.map((t) => ({ value: t, label: t })) }]}
        values={{ entityType }}
        onChange={(_key, v) => setEntityType(v)}
        onClear={() => {
          setSearch("");
          setEntityType("");
        }}
      />
      {error && <ErrorState message={error} onRetry={refetch} />}
      {!error && (
        <DataTable
          columns={[
            { key: "createdTime", label: "Timestamp", sortable: true, sortValue: (r) => new Date(r.createdTime || 0).getTime(), render: (r) => formatDateTime(r.createdTime) },
            { key: "actorUser", label: "User" },
            { key: "actionType", label: "Action" },
            { key: "entityType", label: "Entity" },
            { key: "entityName", label: "Details" },
            { key: "newValue", label: "New Value", className: "max-w-xs truncate" },
          ]}
          rows={data?.items || []}
          loading={loading}
          emptyTitle="No audit entries match your filters"
        />
      )}
    </AppShell>
  );
}
