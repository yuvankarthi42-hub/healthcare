import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, ClipboardList, UsersRound, CheckSquare, Activity, Pill, Calendar,
  AlertTriangle, TrendingUp, Shield, FileText, Settings, HeartPulse, X,
} from "lucide-react";
import { MAIN_NAV, ADMIN_NAV, ROLE_LABELS, PRODUCT_NAME, PRODUCT_TAGLINE } from "../data/constants";
import { canView } from "../data/rbac";
import { useAuth } from "../context/AuthContext";
import clsx from "clsx";

const ICONS = {
  "layout-dashboard": LayoutDashboard,
  users: Users,
  "clipboard-list": ClipboardList,
  "user-group": UsersRound,
  "check-square": CheckSquare,
  activity: Activity,
  pill: Pill,
  calendar: Calendar,
  "alert-triangle": AlertTriangle,
  "trending-up": TrendingUp,
  shield: Shield,
  "file-text": FileText,
  settings: Settings,
};

function NavItem({ item, collapsed, onNavigate }) {
  const Icon = ICONS[item.icon];
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      title={collapsed ? item.label : undefined}
      onClick={onNavigate}
      className={({ isActive }) =>
        clsx(
          "flex items-center rounded-lg text-sm font-medium transition-colors",
          collapsed ? "justify-center px-2 py-2.5" : "gap-2.5 px-3 py-2",
          isActive
            ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        )
      }
    >
      {Icon && <Icon size={16} strokeWidth={2} className="shrink-0" />}
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

export default function Sidebar({ collapsed, mobileOpen, onMobileClose }) {
  const { user } = useAuth();
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia("(min-width: 1024px)").matches);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (!user) return null;

  const showCollapsed = collapsed && isDesktop;

  const mainItems = MAIN_NAV.filter((i) => !i.moduleKey || canView(user.role, i.moduleKey));
  const adminItems = ADMIN_NAV.filter((i) => canView(user.role, i.moduleKey));

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={onMobileClose} aria-hidden="true" />}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-slate-200 bg-white transition-[width,transform] duration-200 dark:border-slate-800 dark:bg-slate-900",
          "w-64 lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "lg:w-[4.5rem]" : "lg:w-60"
        )}
      >
        <div className={clsx("flex items-center border-b border-slate-200 dark:border-slate-800", showCollapsed ? "justify-center px-2 py-4 lg:px-2" : "justify-between px-4 py-4")}>
          <div className={clsx("flex min-w-0 items-center", showCollapsed ? "justify-center" : "gap-2.5")}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white dark:bg-brand-500">
              <HeartPulse size={18} />
            </div>
            {!showCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white">{PRODUCT_NAME}</p>
                <p className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-400">{PRODUCT_TAGLINE}</p>
              </div>
            )}
          </div>
          {mobileOpen && (
            <button type="button" onClick={onMobileClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800">
              <X size={16} />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3 lg:px-3">
          {mainItems.map((item) => (
            <NavItem key={item.to} item={item} collapsed={showCollapsed} onNavigate={onMobileClose} />
          ))}

          {adminItems.length > 0 && (
            <>
              {!showCollapsed && (
                <p className="mb-1 mt-5 px-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Administration</p>
              )}
              {showCollapsed && <div className="my-3 border-t border-slate-200 dark:border-slate-800" />}
              {adminItems.map((item) => (
                <NavItem key={item.to} item={item} collapsed={showCollapsed} onNavigate={onMobileClose} />
              ))}
            </>
          )}
        </nav>

        <div className="border-t border-slate-200 p-2 dark:border-slate-800 lg:p-3">
          <div className={clsx("rounded-lg bg-slate-50 dark:bg-slate-800/60", showCollapsed ? "flex justify-center px-2 py-2.5" : "px-3 py-2.5")}>
            {!showCollapsed ? (
              <>
                <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{user.displayName}</p>
                <p className="text-[11px] text-slate-400">{ROLE_LABELS[user.role]}</p>
              </>
            ) : (
              <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400" title={user.displayName}>
                {user.displayName?.[0] || "U"}
              </span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
