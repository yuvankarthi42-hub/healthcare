export default function ProgressBar({ value = 0, size = "md", tone = "brand", showLabel = false, className = "" }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const heights = { sm: "h-1.5", md: "h-2", lg: "h-2.5" };
  const tones = {
    brand: "bg-brand-500",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
  };
  const barTone = pct >= 80 ? tones.success : pct >= 40 ? tones.brand : tones.warning;
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-full overflow-hidden rounded-full bg-slate-100 ${heights[size]}`}>
        <div className={`h-full rounded-full ${tone === "brand" ? barTone : tones[tone]} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && <span className="w-9 shrink-0 text-right text-xs font-medium text-slate-500">{pct}%</span>}
    </div>
  );
}
