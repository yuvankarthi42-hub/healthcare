import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, ClipboardList, UsersRound, CheckSquare, Activity, Pill, Calendar,
  AlertTriangle, TrendingUp, Shield, FileText, Settings, HeartPulse,
} from "lucide-react";
import { MAIN_NAV, ADMIN_NAV, ROLE_LABELS } from "../data/constants";
import { canView } from "../data/rbac";
import { useAuth } from "../context/AuthContext";

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

function NavItem({ item }) {
  const Icon = ICONS[item.icon];
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`
      }
    >
      {Icon && <Icon size={16} strokeWidth={2} />}
      {item.label}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  const mainItems = MAIN_NAV.filter((i) => !i.moduleKey || canView(user.role, i.moduleKey));
  const adminItems = ADMIN_NAV.filter((i) => canView(user.role, i.moduleKey));

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
          <HeartPulse size={17} />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-slate-900">CareFlow</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Care Operations</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {mainItems.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}

        {adminItems.length > 0 && (
          <>
            <p className="mb-1 mt-5 px-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Administration</p>
            {adminItems.map((item) => (
              <NavItem key={item.to} item={item} />
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="rounded-lg bg-slate-50 px-3 py-2.5">
          <p className="truncate text-xs font-semibold text-slate-700">{user.displayName}</p>
          <p className="text-[11px] text-slate-400">{ROLE_LABELS[user.role]}</p>
        </div>
      </div>
    </aside>
  );
}
