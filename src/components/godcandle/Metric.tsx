export function Metric({
  label,
  value,
  note,
  tone = "",
}: {
  label: string;
  value: string;
  note?: string;
  tone?: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-black/[0.06] bg-white p-3.5 shadow-2xs">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`metric-value mt-2 break-words font-mono font-bold ${tone || "text-foreground"}`}>{value}</p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

export function Segments({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="flex max-w-full overflow-x-auto rounded-xl bg-[#F0F2F5] p-1 border border-black/[0.04]">
      {items.map((s) => (
        <button
          key={s}
          type="button"
          className={`h-7 shrink-0 rounded-lg px-3 text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer ${
            s === value
              ? "bg-white text-[#0A0A0A] shadow-xs"
              : "text-[#737887] hover:text-[#0A0A0A] hover:bg-white/60"
          }`}
          onClick={() => onChange(s)}
        >
          {s}
        </button>
      ))}
    </div>
  );
}