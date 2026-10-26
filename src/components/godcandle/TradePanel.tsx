import { ChevronUp, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import {
  FEE_RATE,
  LEVERAGES,
  STAKES,
  feeUsd,
  fmtDuration,
  fmtSigned,
  fmtUsd,
  liqDistancePct,
  liqHealth,
  liqPrice,
  notional,
  pnlOf,
  type Position,
  type Side,
} from "@/lib/trade";
import { LiqBar, RollingNumber } from "./bits";

interface Props {
  price: number;
  stake: number;
  setStake: (n: number) => void;
  leverage: number;
  setLeverage: (n: number) => void;
  position: Position | null;
  onOpen: (s: Side) => void;
  onClose: () => void;
}

function Row({ k, v, tone }: { k: string; v: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className={`tabular font-medium ${tone ?? ""}`}>{v}</span>
    </div>
  );
}

export function TradePanel(p: Props) {
  const [expanded, setExpanded] = useState(false);
  const [custom, setCustom] = useState("");
  const details = expanded ? "block" : "hidden lg:block";

  if (p.position) {
    const pos = p.position;
    const pnl = pnlOf(pos, p.price);
    const up = pnl >= 0;
    const pct = (pnl / pos.stake) * 100;
    const health = liqHealth(pos, p.price);
    const liq = liqPrice(pos.entry, pos.leverage, pos.side);
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="tight text-2xl font-medium leading-none">Position</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              BTC · <span className={pos.side === "long" ? "text-gain" : "text-loss"}>{pos.side.toUpperCase()}</span> {pos.leverage}x
            </p>
          </div>
          <span className="tabular text-sm text-muted-foreground">{fmtDuration(Date.now() - pos.openedAt)}</span>
        </div>
        <div>
          <RollingNumber
            value={fmtSigned(pnl)}
            className={`tight text-[56px] font-medium ${up ? "text-gain" : "text-loss"}`}
          />
          <p className={`tabular mt-2 text-sm ${up ? "text-gain" : "text-loss"}`}>
            {pct >= 0 ? "+" : ""}
            {pct.toFixed(1)}% of ${fmtUsd(pos.stake, 0)} stake
          </p>
        </div>
        <div className={details}>
          <div className="mb-2 flex justify-between text-xs text-muted-foreground">
            <span>Distance to liquidation</span>
            <span className={`tabular ${health < 0.25 ? "text-loss" : ""}`}>
              {((Math.abs(p.price - liq) / p.price) * 100).toFixed(3)}%
            </span>
          </div>
          <LiqBar health={health} />
          <div className="mt-4 divide-y divide-hairline">
            <Row k="Entry" v={`$${fmtUsd(pos.entry)}`} />
            <Row k="Mark" v={`$${fmtUsd(p.price)}`} />
            <Row k="Liquidation" v={`$${fmtUsd(liq)}`} tone="text-loss" />
            <Row k="Notional" v={`$${fmtUsd(notional(pos.stake, pos.leverage), 0)}`} />
          </div>
        </div>
        <button
          onClick={p.onClose}
          className={`pill pill-ink tabular h-16 w-full text-lg ${up ? "" : ""}`}
        >
          Close · <span className={up ? "text-gain" : "text-loss"}>{fmtSigned(pnl, 0)}</span>
        </button>
        <p className="hidden text-center text-xs text-muted-foreground lg:block">Space or C to close</p>
      </div>
    );
  }

  const n = notional(p.stake, p.leverage);
  const dist = liqDistancePct(p.leverage);
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="tight text-2xl font-medium leading-none">Trade</h2>
          <p className="mt-1 text-sm text-muted-foreground">BTC</p>
        </div>
        <button
          className="pill pill-ghost h-8 w-8 lg:hidden"
          aria-label="Toggle details"
          onClick={() => setExpanded((e) => !e)}
        >
          <ChevronUp className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className={`${details} space-y-6`}>
        <section>
          <p className="mb-3 text-xs text-muted-foreground">Stake</p>
          <div className="grid grid-cols-3 gap-2">
            {STAKES.map((s) => (
              <button
                key={s}
                onClick={() => {
                  p.setStake(s);
                  setCustom("");
                }}
                className={`pill tabular h-9 text-sm ${p.stake === s && !custom ? "pill-ink" : "pill-ghost"}`}
              >
                ${s}
              </button>
            ))}
          </div>
          <input
            inputMode="decimal"
            placeholder="Custom amount"
            value={custom}
            onChange={(e) => {
              const v = e.target.value.replace(/[^\d.]/g, "");
              setCustom(v);
              const num = Number(v);
              if (num > 0) p.setStake(Math.min(num, 5000));
            }}
            className="tabular mt-2 h-10 w-full rounded-2xl border border-hairline px-4 text-sm outline-none focus:border-foreground"
          />
        </section>

        <section>
          <p className="mb-3 text-xs text-muted-foreground">Leverage</p>
          <div className="grid grid-cols-5 gap-2">
            {LEVERAGES.map((l) => (
              <button
                key={l}
                onClick={() => p.setLeverage(l)}
                className={`pill tabular h-9 text-sm ${p.leverage === l ? "pill-ink" : "pill-ghost"}`}
              >
                {l}x
              </button>
            ))}
          </div>
        </section>

        <section className="divide-y divide-hairline border-y border-hairline">
          <Row k="Notional" v={`$${fmtUsd(n, 0)}`} />
          <Row k="Liquidation distance" v={`${dist.toFixed(2)}%`} />
          <Row k="Liq. price (long / short)" v={`$${fmtUsd(liqPrice(p.price, p.leverage, "long"), 0)} / $${fmtUsd(liqPrice(p.price, p.leverage, "short"), 0)}`} />
          <Row k={`Fee / spread ${(FEE_RATE * 100).toFixed(2)}%`} v={`$${fmtUsd(feeUsd(p.stake, p.leverage))}`} />
          <Row k="Max loss" v={`$${fmtUsd(p.stake)}`} />
        </section>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => p.onOpen("long")} className="pill btn-long h-14 text-base">
          <TrendingUp className="h-4 w-4" /> Long
        </button>
        <button onClick={() => p.onOpen("short")} className="pill btn-short h-14 text-base">
          <TrendingDown className="h-4 w-4" /> Short
        </button>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Most 1000x trades end in a loss. Only trade what you can afford to lose.
      </p>
    </div>
  );
}
