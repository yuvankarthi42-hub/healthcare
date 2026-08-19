import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { HeartPulse, Eye, EyeOff, ChevronRight, Sun, Moon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { ROLE_LABELS, DEMO_ACCOUNTS, DEMO_PASSWORD, PRODUCT_NAME, PRODUCT_TAGLINE } from "../data/constants";

export default function Login() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("care.coordinator@zohotest.com");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const demoAccounts = DEMO_ACCOUNTS;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-[440px] lg:shrink-0 lg:px-14">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white dark:bg-brand-500">
            <HeartPulse size={20} />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{PRODUCT_NAME}</p>
            <p className="text-xs text-slate-400">{PRODUCT_TAGLINE}</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sign in</h1>
        <p className="mt-1.5 text-sm text-slate-500">One connected workflow for every patient's care journey.</p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@zohotest.com" required />
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                className="input pr-9"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter demo password"
                required
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in..." : "Sign in"}
            {!loading && <ChevronRight size={15} />}
          </button>
        </form>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Demo accounts</p>
          <div className="max-h-52 space-y-1 overflow-y-auto pr-1">
            {demoAccounts.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => {
                  setEmail(a.email);
                  setPassword(DEMO_PASSWORD);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-slate-50 ${
                  email === a.email ? "bg-brand-50" : ""
                }`}
              >
                <span className="font-medium text-slate-700">{ROLE_LABELS[a.role]}</span>
                <span className="text-slate-400">{a.email}</span>
              </button>
            ))}
          </div>
          <p className="mt-2.5 border-t border-slate-100 pt-2.5 text-[11px] text-slate-400">
            Click a role to fill email and the shared demo password.
          </p>
        </div>
      </div>

      <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-slate-900 lg:flex">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="relative z-10 max-w-md px-10 text-white">
          <p className="text-3xl font-bold leading-tight tracking-tight">Every patient's journey, in one connected workflow.</p>
          <p className="mt-4 text-brand-100/80">
            Care plans, care tasks, diagnostics, treatment, appointments and escalations — unified around the patient, not the paperwork.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              ["Live escalation inbox", "Never miss an overdue task or missed appointment."],
              ["AI patient summaries", "Operational context at a glance, not a diagnosis."],
              ["Role-based workspaces", "Physicians, nurses, coordinators — one shared source of truth."],
              ["Full audit trail", "Every action traceable, every change accountable."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-sm font-semibold">{t}</p>
                <p className="mt-1 text-xs text-brand-100/70">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
