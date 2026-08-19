export default function MetricCard({ label, value, icon: Icon, tone = "default", hint, onClick }) {
  const toneClasses = {
    default: "text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400",
    brand: "text-brand-600 bg-brand-50 dark:bg-brand-500/15 dark:text-brand-300",
    warning: "text-amber-600 bg-amber-50 dark:bg-amber-500/15 dark:text-amber-300",
    danger: "text-red-600 bg-red-50 dark:bg-red-500/15 dark:text-red-300",
    success: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-300",
  };
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`card flex items-center justify-between px-4 py-4 text-left ${onClick ? "transition-shadow hover:shadow-popover dark:hover:ring-1 dark:hover:ring-slate-700" : ""}`}
    >
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
      </div>
      {Icon && (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
          <Icon size={18} />
        </div>
      )}
    </Comp>
  );
}
