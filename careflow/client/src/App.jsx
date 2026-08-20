import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RequireModule from "./components/RequireModule";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PatientsList from "./pages/patients/PatientsList";
import PatientWorkspace from "./pages/patients/PatientWorkspace";
import CarePlansList from "./pages/carePlans/CarePlansList";
import CarePlanDetail from "./pages/carePlans/CarePlanDetail";
import CareTeam from "./pages/CareTeam";
import ClinicalTasks from "./pages/ClinicalTasks";
import Diagnostics from "./pages/Diagnostics";
import TreatmentPlans from "./pages/TreatmentPlans";
import Appointments from "./pages/Appointments";
import Escalations from "./pages/Escalations";
import CareProgress from "./pages/CareProgress";
import UsersRoles from "./pages/admin/UsersRoles";
import AuditLog from "./pages/admin/AuditLog";
import Settings from "./pages/admin/Settings";

function P({ moduleKey, children }) {
  return (
    <ProtectedRoute>
      {moduleKey ? <RequireModule moduleKey={moduleKey}>{children}</RequireModule> : children}
    </ProtectedRoute>
  );
}

export default function App() {
  const rawBase = import.meta.env.BASE_URL || "/";
  const basename = rawBase === "/" ? undefined : rawBase.replace(/\/$/, "");
  return (
    <BrowserRouter basename={basename}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={<P><Dashboard /></P>} />

            <Route path="/patients" element={<P moduleKey="patients"><PatientsList /></P>} />
            <Route path="/patients/:id" element={<P moduleKey="patients"><PatientWorkspace /></P>} />

            <Route path="/care-plans" element={<P moduleKey="carePlans"><CarePlansList /></P>} />
            <Route path="/care-plans/:id" element={<P moduleKey="carePlans"><CarePlanDetail /></P>} />

            <Route path="/care-team" element={<P moduleKey="careTeam"><CareTeam /></P>} />
            <Route path="/tasks" element={<P moduleKey="clinicalTasks"><ClinicalTasks /></P>} />
            <Route path="/diagnostics" element={<P moduleKey="diagnostics"><Diagnostics /></P>} />
            <Route path="/treatments" element={<P moduleKey="treatment"><TreatmentPlans /></P>} />
            <Route path="/appointments" element={<P moduleKey="appointments"><Appointments /></P>} />
            <Route path="/escalations" element={<P moduleKey="escalations"><Escalations /></P>} />
            <Route path="/progress" element={<P moduleKey="careProgress"><CareProgress /></P>} />

            <Route path="/admin/users" element={<P moduleKey="usersRoles"><UsersRoles /></P>} />
            <Route path="/admin/audit-log" element={<P moduleKey="auditLog"><AuditLog /></P>} />
            <Route path="/admin/settings" element={<P moduleKey="settings"><Settings /></P>} />

            <Route path="*" element={<P><Dashboard /></P>} />
          </Routes>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
