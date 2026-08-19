import { ShieldOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { canView } from "../data/rbac";
import AppShell from "./AppShell";

export default function RequireModule({ moduleKey, children }) {
  const { user } = useAuth();
  if (!canView(user.role, moduleKey)) {
    return (
      <AppShell title="Access Restricted">
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <ShieldOff size={20} />
          </div>
          <p className="text-sm font-medium text-slate-700">Your role doesn't have access to this area</p>
          <p className="mt-1 text-sm text-slate-500">Contact your Super Admin if you believe this is incorrect.</p>
        </div>
      </AppShell>
    );
  }
  return children;
}
