import { useState } from "react";
import { Search, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS } from "../data/constants";
import PatientAvatar from "./PatientAvatar";

export default function Topbar({ title, actions, onOpenSearch }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur">
      <h1 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h1>

      <div className="flex items-center gap-3">
        {actions}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-100"
        >
          <Search size={14} />
          <span className="hidden sm:inline">Search CareFlow</span>
          <kbd className="hidden rounded border border-slate-300 bg-white px-1 text-[10px] font-medium text-slate-400 sm:inline">⌘K</kbd>
        </button>

        <div className="relative">
          <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-slate-100">
            <PatientAvatar name={user?.displayName} size={30} />
            <div className="hidden text-left md:block">
              <p className="text-xs font-semibold leading-tight text-slate-800">{user?.displayName}</p>
              <p className="text-[11px] leading-tight text-slate-400">{ROLE_LABELS[user?.role]}</p>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-xl border border-slate-100 bg-white p-1.5 shadow-popover">
                <div className="px-2.5 py-2">
                  <p className="text-xs font-semibold text-slate-800">{user?.displayName}</p>
                  <p className="text-[11px] text-slate-400">{user?.email}</p>
                </div>
                <div className="my-1 border-t border-slate-100" />
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-red-600 hover:bg-red-50"
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
