import { useAuth } from "../context/AuthContext";
import { getPermission } from "../data/rbac";

/**
 * UI-level convenience gate. Hides children the current role can't act on.
 * This is a UX affordance ONLY - every corresponding action is re-verified
 * server-side (see functions/careflow-api/src/rbac.js) regardless of what
 * is rendered here.
 */
export default function PermissionGate({ moduleKey, require = "view", fallback = null, children }) {
  const { user } = useAuth();
  if (!user) return fallback;
  const perm = getPermission(user.role, moduleKey);

  let allowed = false;
  if (require === "view") allowed = perm.view !== "none";
  else if (require === "create") allowed = !!perm.create;
  else if (require === "edit") allowed = perm.edit !== "none" && perm.edit !== false;
  else if (require === "editAll") allowed = perm.edit === "all" || perm.edit === true;
  else if (require === "delete") allowed = !!perm.delete;

  return allowed ? children : fallback;
}
