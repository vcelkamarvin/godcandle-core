import { Lock, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fmtUsd } from "@/lib/trade";
import { Wordmark } from "./bits";

const ITEMS = ["Trade", "Positions", "History", "Rewards", "Fairness", "Account"];

export function Header({ balance }: { balance: number }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="flex h-16 items-center gap-4 md:gap-8">
        <Wordmark />
        <div className="hidden h-9 items-center rounded-full border border-hairline p-1 sm:flex">
          <button className="pill pill-ink h-7 px-4 text-sm">Practice</button>
          <button
            className="pill h-7 px-4 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => toast("Live opens at launch")}
          >
            <Lock className="h-3.5 w-3.5" /> Live
          </button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="pill tabular hidden h-10 border border-hairline px-4 text-sm md:inline-flex">
            ${fmtUsd(balance)} <span className="font-normal text-muted-foreground">USDC</span>
          </span>
          <button className="pill pill-outline h-10 px-5 text-sm" onClick={() => toast("Wallets connect at launch")}>
            Connect Wallet
          </button>
          <button
            aria-label="Open menu"
            className="pill pill-outline h-10 w-10"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-foreground text-background animate-in fade-in duration-200">
          <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-end px-4 md:px-8">
            <button
              aria-label="Close menu"
              className="pill h-10 w-10 border border-background/30"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col items-center justify-center gap-1">
            {ITEMS.map((it) => (
              <button
                key={it}
                onClick={() => (it === "Trade" ? setOpen(false) : toast("Coming soon"))}
                className={`tight rounded-2xl px-5 py-1 text-5xl font-medium md:text-6xl ${it === "Trade" ? "bg-background text-foreground" : "hover:opacity-60"}`}
              >
                {it}
              </button>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
