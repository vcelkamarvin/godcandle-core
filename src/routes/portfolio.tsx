import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Dock } from "@/components/godcandle/Dock";
import { ShareModal } from "@/components/godcandle/ShareModal";
import { useTrading } from "@/components/godcandle/TradingProvider";
import { fmtSigned, fmtUsd, pnlOf, type ClosedTrade } from "@/lib/engine";
export const Route = createFileRoute("/portfolio")({ head: () => ({ meta: [{ title: "godcandle — Portfolio" }, { name: "description", content: "Your balances, open positions and trading history in one portfolio." }, { property: "og:title", content: "godcandle — Portfolio" }, { property: "og:description", content: "Track your margin and current profit or loss." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: Portfolio });
function Portfolio() {
  const t = useTrading();
  const [share, setShare] = useState<ClosedTrade | null>(null);
  const pnl = t.positions.reduce((sum, p) => sum + pnlOf(p, t.feeds[p.market].price), 0);
  return <main className="mx-auto max-w-[1440px] px-5 py-8 lg:px-8"><h1 className="text-3xl font-semibold">Portfolio</h1><section className="mt-8 grid gap-5 sm:grid-cols-3">{[["Account value", `$${fmtUsd(t.balance + pnl)}`, ""], ["Available balance", `$${fmtUsd(t.available)}`, ""], ["Unrealized profit / loss", fmtSigned(pnl), pnl >= 0 ? "text-gain" : "text-loss"]].map(([label, value, tone]) => <div key={label} className="rounded-3xl border border-hairline p-6"><p className="text-xs text-muted-foreground">{label}</p><p className={`tabular mt-4 text-3xl font-semibold ${tone}`}>{value}</p></div>)}</section><section className="mt-8 border-t border-hairline"><Dock feeds={t.feeds} open={t.positions} history={t.history} onSelect={() => {}} onClose={t.close} onShare={setShare}/></section><ShareModal trade={share} onOpenChange={o => { if (!o) setShare(null); }}/></main>;
}