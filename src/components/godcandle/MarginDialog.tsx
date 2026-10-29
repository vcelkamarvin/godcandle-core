import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { fmtUsd } from "@/lib/engine";

export function MarginDialog({ open, onOpenChange, stake, available, min, max, onApply }: { open: boolean; onOpenChange: (open: boolean) => void; stake: number; available: number; min: number; max: number; onApply: (n: number) => void }) {
  const [amount, setAmount] = useState(String(stake));
  const [error, setError] = useState("");
  const limit = Math.min(max, available);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-[calc(100%-32px)] rounded-3xl border-hairline bg-card p-7 shadow-none sm:max-w-md">
    <DialogTitle className="text-2xl">Set margin</DialogTitle>
    <DialogDescription>Available balance <span className="tabular text-foreground">${fmtUsd(available)} USDC</span></DialogDescription>
    <form onSubmit={e => { e.preventDefault(); const n = Number(amount); if (!Number.isFinite(n) || n < min || n > limit) { setError(`Enter an amount between $${fmtUsd(min, 0)} and $${fmtUsd(limit)}.`); return; } onApply(n); onOpenChange(false); }} className="space-y-5">
      <div><label htmlFor="margin-amount" className="text-xs text-muted-foreground">Margin amount</label><div className="mt-2 flex items-center gap-2 rounded-2xl border border-hairline bg-secondary px-4"><span className="text-2xl">$</span><input id="margin-amount" autoFocus inputMode="decimal" type="number" min={min} max={limit} step="0.01" value={amount} onChange={e => { setAmount(e.target.value); setError(""); }} className="tabular h-16 w-full min-w-0 bg-transparent text-3xl outline-none"/><span className="text-xs text-muted-foreground">USDC</span></div></div>
      <p className="text-xs text-muted-foreground">Min ${fmtUsd(min, 0)} · Max ${fmtUsd(limit)}</p>
      {error && <p role="alert" className="text-sm text-loss">{error}</p>}
      <Button type="submit" variant="terminal" className="pill pill-ink h-12 w-full">Apply margin</Button>
    </form>
  </DialogContent></Dialog>;
}