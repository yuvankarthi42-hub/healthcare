import { useState } from "react";
import { Search, LogOut, ChevronDown, PanelLeft, PanelLeftClose, Sun, Moon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { ROLE_LABELS, PRODUCT_NAME } from "../data/constants";
import PatientAvatar from "./PatientAvatar";

export default function Topbar({ title, actions, onOpenSearch, onToggleSidebar, sidebarCollapsed }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
        <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {actions}
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-700"
        >
          <Search size={14} />
          <span className="hidden sm:inline">Search {PRODUCT_NAME}</span>
          <kbd className="hidden rounded border border-slate-300 bg-white px-1 text-[10px] font-medium text-slate-400 dark:border-slate-600 dark:bg-slate-900 sm:inline">⌘K</kbd>
        </button>

        <div className="relative">
          <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-800">
            <PatientAvatar name={user?.displayName} size={30} />
            <div className="hidden text-left md:block">
              <p className="text-xs font-semibold leading-tight text-slate-800 dark:text-slate-100">{user?.displayName}</p>
              <p className="text-[11px] leading-tight text-slate-400">{ROLE_LABELS[user?.role]}</p>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-xl border border-slate-100 bg-white p-1.5 shadow-popover dark:border-slate-700 dark:bg-slate-900">
                <div className="px-2.5 py-2">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{user?.displayName}</p>
                  <p className="text-[11px] text-slate-400">{user?.email}</p>
                </div>
                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
