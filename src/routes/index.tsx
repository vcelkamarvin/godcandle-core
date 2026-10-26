import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import { Dock } from "@/components/godcandle/Dock";
import { Header } from "@/components/godcandle/Header";
import { PriceChart } from "@/components/godcandle/PriceChart";
import { ShareModal } from "@/components/godcandle/ShareModal";
import { TradePanel } from "@/components/godcandle/TradePanel";
import { startFeed, toggleHighVol, useFeed } from "@/lib/price-feed";
import {
  fmtSigned,
  fmtUsd,
  isLiquidated,
  liqPrice,
  pnlOf,
  type ClosedTrade,
  type Position,
  type Side,
} from "@/lib/trade";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "godcandle — BTC 1000x trading terminal" },
      { name: "description", content: "A minimal BTC-only high-leverage practice terminal with a live tick-stream chart." },
      { property: "og:title", content: "godcandle — BTC 1000x trading terminal" },
      { property: "og:description", content: "One tap to open, one tap to close. Practice BTC trades up to 1000x." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Terminal,
});

const SEED: ClosedTrade[] = [
  { id: "s2", side: "long", stake: 100, leverage: 500, entry: 64211.4, exit: 64335.8, pnl: 76.86, durationMs: 41000, liquidated: false, closedAt: 2 },
  { id: "s1", side: "short", stake: 50, leverage: 1000, entry: 64102.1, exit: 64166.2, pnl: -50, durationMs: 18000, liquidated: true, closedAt: 1 },
];

function Terminal() {
  const feed = useFeed();
  const price = feed.price;
  const [stake, setStake] = useState(100);
  const [leverage, setLeverage] = useState(500);
  const [position, setPosition] = useState<Position | null>(null);
  const [history, setHistory] = useState<ClosedTrade[]>(SEED);
  const [balance, setBalance] = useState(4823);
  const [share, setShare] = useState<ClosedTrade | null>(null);
  const [flash, setFlash] = useState(0);
  const posRef = useRef(position);
  posRef.current = position;

  useEffect(() => startFeed(), []);

  const settle = useCallback((exit: number, liquidated: boolean) => {
    const pos = posRef.current;
    if (!pos) return;
    const pnl = liquidated ? -pos.stake : pnlOf(pos, exit);
    const trade: ClosedTrade = {
      id: pos.id,
      side: pos.side,
      stake: pos.stake,
      leverage: pos.leverage,
      entry: pos.entry,
      exit,
      pnl,
      durationMs: Date.now() - pos.openedAt,
      liquidated,
      closedAt: Date.now(),
    };
    posRef.current = null;
    setPosition(null);
    setHistory((h) => [trade, ...h]);
    setBalance((b) => b + pnl);
    if (liquidated) {
      setFlash((f) => f + 1);
      toast.error("Liquidated", { description: `Margin $${fmtUsd(pos.stake)} → $0.00` });
    } else {
      toast(`Closed ${fmtSigned(pnl)}`, {
        description: `${pos.side.toUpperCase()} ${pos.leverage}x · exit $${fmtUsd(exit)}`,
        action: { label: "Share", onClick: () => setShare(trade) },
        cancel: { label: "Trade again", onClick: () => {} },
      });
    }
  }, []);

  const open = (side: Side) => {
    if (posRef.current) return;
    if (stake > balance) return toast("Not enough balance");
    const p: Position = { id: Math.random().toString(36).slice(2, 8), side, stake, leverage, entry: price, openedAt: Date.now() };
    posRef.current = p;
    setPosition(p);
  };
  const close = useCallback(() => settle(feed.price, false), [settle, feed.price]);

  useEffect(() => {
    if (position && isLiquidated(position, price)) settle(liqPrice(position.entry, position.leverage, position.side), true);
  }, [price, position, settle]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "v" || e.key === "V") toast(toggleHighVol() ? "High volatility demo on" : "Volatility back to normal");
      if ((e.key === " " || e.key === "c" || e.key === "C") && posRef.current) {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const change = ((price - feed.open24) / feed.open24) * 100;
  const pnl = position ? pnlOf(position, price) : 0;

  return (
    <div className="mx-auto min-h-screen max-w-[1440px] px-4 pb-72 md:px-8 lg:pb-8">
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: 24, border: "1px solid var(--foreground)", boxShadow: "none", fontFamily: "inherit" } }} />
      <Header balance={balance} />

      <section className="flex flex-wrap items-end gap-x-4 gap-y-2 border-t border-hairline pb-6 pt-6">
        <div>
          <p className="text-xs text-muted-foreground">BTC/USD</p>
          <p className="tabular tight text-[44px] font-medium leading-none md:text-[56px]">${fmtUsd(price)}</p>
        </div>
        <span
          className={`pill tabular mb-2 h-7 border px-3 text-sm ${change >= 0 ? "border-gain text-gain" : "border-loss text-loss"}`}
        >
          {change >= 0 ? "+" : ""}
          {change.toFixed(2)}%
        </span>
        {feed.highVol && <span className="mb-2 ml-auto text-xs text-muted-foreground">High volatility · V</span>}
      </section>

      <div className="grid grid-cols-12 gap-6">
        <div
          key={flash}
          className={`gc-card col-span-12 h-[360px] overflow-hidden md:h-[520px] lg:col-span-8 xl:col-span-9 ${flash ? "animate-liq-flash" : ""}`}
        >
          <PriceChart position={position} pnlLabel={fmtSigned(pnl, 0)} pnlPositive={pnl >= 0} onClose={close} />
        </div>

        <aside className="col-span-12 lg:col-span-4 xl:col-span-3">
          <div className="gc-card fixed inset-x-0 bottom-0 z-30 max-h-[80vh] overflow-y-auto rounded-b-none lg:static lg:max-h-none lg:rounded-b-3xl">
            <TradePanel
              price={price}
              stake={stake}
              setStake={setStake}
              leverage={leverage}
              setLeverage={setLeverage}
              position={position}
              onOpen={open}
              onClose={close}
            />
          </div>
        </aside>

        <div className="gc-card col-span-12">
          <Dock price={price} open={position ? [position] : []} history={history} onClose={close} onShare={setShare} />
        </div>
      </div>

      <ShareModal trade={share} onOpenChange={(o) => !o && setShare(null)} />
    </div>
  );
}
