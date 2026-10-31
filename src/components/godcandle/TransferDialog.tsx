import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTrading } from "./TradingProvider";
import { fmtUsd } from "@/lib/engine";
import { useAccount } from "wagmi";
import { toast } from "sonner";

export function TransferDialog({
  mode,
  onClose,
}: {
  mode: "Deposit" | "Withdraw" | null;
  onClose: () => void;
}) {
  const { available, deposit, withdraw } = useTrading();
  const { address: wagmiAddress, isConnected } = useAccount();
  const localAddr = typeof window !== "undefined" ? localStorage.getItem("godcandle_wallet_address") : null;
  const activeAddr = wagmiAddress || localAddr;

  const [tab, setTab] = useState<"Deposit" | "Withdraw">(mode ?? "Deposit");
  const [network, setNetwork] = useState("HyperEVM");
  const [amount, setAmount] = useState("500");
  const [address, setAddress] = useState("");

  const handleAction = () => {
    const val = Number(amount) || 0;
    if (val <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (tab === "Deposit") {
      deposit(val);
      onClose();
    } else {
      withdraw(val);
      onClose();
    }
  };

  return (
    <Dialog open={Boolean(mode)} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-[calc(100%-32px)] max-w-[460px] rounded-3xl p-6 shadow-none">
        <DialogTitle className="text-2xl">{tab}</DialogTitle>
        <DialogDescription className="sr-only">USDC transfer details</DialogDescription>
        <div className="flex rounded-full bg-secondary p-1">
          {(["Deposit", "Withdraw"] as const).map((s) => (
            <Button
              variant="terminal"
              key={s}
              onClick={() => setTab(s)}
              className={`pill h-9 flex-1 ${s === tab ? "pill-ink" : "text-muted-foreground"}`}
            >
              {s}
            </Button>
          ))}
        </div>
        <div className="flex justify-between data-label">
          <span>Network</span>
          <span>USDC</span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {["HyperEVM", "Arbitrum", "Base", "Ethereum"].map((n) => (
            <Button
              variant="terminal"
              key={n}
              onClick={() => setNetwork(n)}
              className={`h-10 rounded-xl px-1 text-xs ${network === n ? "pill-ink" : "bg-secondary"}`}
            >
              {n}
            </Button>
          ))}
        </div>
        <div className="flex justify-between data-label">
          <label htmlFor="transfer-amount">Amount</label>
          <span>
            {tab === "Withdraw"
              ? `Available $${fmtUsd(available)}`
              : activeAddr
              ? `Connected: ${activeAddr.slice(0, 6)}...${activeAddr.slice(-4)}`
              : "Wallet not connected"}
          </span>
        </div>
        <div className="flex items-center rounded-xl border border-foreground px-4">
          <span className="text-2xl text-muted-foreground">$</span>
          <input
            id="transfer-amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="tabular h-16 w-full min-w-0 bg-transparent px-2 text-3xl outline-none"
          />
          <Button
            variant="terminal"
            className="pill h-8 bg-secondary text-[10px]"
            disabled={tab === "Deposit"}
            onClick={() => setAmount(String(available))}
          >
            MAX
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {(tab === "Deposit" ? [100, 500, 1000, 5000] : [25, 50, 75, 100]).map((n) => (
            <Button
              variant="terminal"
              key={n}
              onClick={() => setAmount(String(tab === "Deposit" ? n : (available * n) / 100))}
              className="h-9 rounded-xl bg-secondary px-1 tabular text-xs"
            >
              {tab === "Deposit" ? `$${fmtUsd(n, 0)}` : `${n}%`}
            </Button>
          ))}
        </div>
        {tab === "Withdraw" && (
          <>
            <label htmlFor="withdraw-address" className="data-label">
              To address
            </label>
            <input
              id="withdraw-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="tabular h-11 rounded-xl border px-3 text-xs"
              placeholder="0x…"
            />
          </>
        )}
        <div className="space-y-3 rounded-xl bg-secondary p-4 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Asset</span>
            <span>USDC · {network}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Network fee</span>
            <span>Zero (House Subsidized)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Wallet</span>
            <span>{activeAddr ? `${activeAddr.slice(0, 6)}...${activeAddr.slice(-4)}` : "Not connected"}</span>
          </div>
        </div>
        <Button variant="terminal" className="pill pill-ink h-12" onClick={handleAction}>
          {tab} ${fmtUsd(Number(amount) || 0)}
        </Button>
        <p className="text-[10px] text-muted-foreground text-center">
          Instant atomic execution against HyperEVM House Pool reserves.
        </p>
      </DialogContent>
    </Dialog>
  );
}