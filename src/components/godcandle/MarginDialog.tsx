import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { fmtUsd } from "@/lib/engine";

export function MarginDialog({ open, onOpenChange, stake, available, min, max, onApply }: { open: boolean; onOpenChange: (open: boolean) => void; stake: number; available: number; min: number; max: number; onApply: (n: number) => void }) {
  const [amount, setAmount] = useState(String(stake));
  const [error, setError] = useState("");
  const limit = Math.min(max, available);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-32px)] rounded-lg border-hairline bg-card p-6 shadow-xl sm:max-w-md font-mono">
        <DialogTitle className="text-xl font-bold font-mono">Set Margin</DialogTitle>
        <DialogDescription className="font-mono text-xs text-muted-foreground">
          Available balance <span className="tabular text-foreground font-semibold">${fmtUsd(available)} USDC</span>
        </DialogDescription>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(amount);
            if (!Number.isFinite(n) || n < min || n > limit) {
              setError(`Enter an amount between $${fmtUsd(min, 0)} and $${fmtUsd(limit)}.`);
              return;
            }
            onApply(n);
            onOpenChange(false);
          }}
          className="space-y-4 pt-2 font-mono"
        >
          <div>
            <label htmlFor="margin-amount" className="text-xs text-muted-foreground">
              Margin amount (USDC)
            </label>
            <div className="mt-1.5 flex items-center gap-2 rounded-md border border-hairline bg-secondary px-3">
              <span className="text-xl font-bold">$</span>
              <input
                id="margin-amount"
                autoFocus
                inputMode="decimal"
                type="number"
                min={min}
                max={limit}
                step="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError("");
                }}
                className="tabular h-12 w-full min-w-0 bg-transparent text-2xl font-mono font-bold outline-none"
              />
              <span className="text-xs text-muted-foreground font-semibold">USDC</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-mono">
            Min ${fmtUsd(min, 0)} · Max ${fmtUsd(limit)}
          </p>
          {error && <p role="alert" className="text-xs text-loss">{error}</p>}
          <Button
            type="submit"
            variant="terminal"
            className="rounded-md bg-foreground text-background font-mono font-bold text-xs h-10 w-full hover:opacity-90 shadow-xs"
          >
            Apply Margin
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}