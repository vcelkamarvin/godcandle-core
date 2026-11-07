import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Bot,
  Check,
  CheckCircle2,
  Pencil,
  SlidersHorizontal,
  Share2,
  Sparkles,
  RotateCcw,
  Send,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { OutcomeLineChart } from "@/components/artefacts/options-slots";
import { CopilotOrb } from "@/components/CopilotOrb";
import { ExpectedReturnOrb } from "@/components/ExpectedReturnOrb";
import { OptionsSurface3D } from "@/components/OptionsSurface3D";
import { TargetChart, useHistory, type EarningLevel } from "@/components/TargetChart";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, Label, Slider } from "@/components/ui-bits";
import { OptionsCopilotPanel, OPTIONS_QUICK_PROMPTS } from "@/components/OptionsCopilotPanel";
import { OptionsChainTable } from "@/components/OptionsChainTable";
import { StickyTradePanel } from "@/components/StickyTradePanel";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { OpenOrdersDrawer, OpenOrdersTable } from "@/components/OpenOrdersDrawer";
import { PnLCardModal, type PnLCardPosition } from "@/components/PnLCardModal";
import { optionsStore, useOptionsStore } from "@/lib/options-store";
import { walletStore, useWallet } from "@/lib/wallet-store";
import {
  EXPIRIES,
  SPOT,
  breakeven,
  buildChain,
  expectedPayout,
  formatUsd,
  formatCompactUsd,
  type ChainRow,
  type PositionInput,
  type PositionType,
  type Underlying,
} from "@/lib/options";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Godcandle — 1000x Live Tick Perps Desk & Institutional Dossier" },
      {
        name: "description",
        content:
          "Ultra-clean 1000x live tick trading desk and institutional trader dossier powered by Hyperliquid real-time feeds.",
      },
      { property: "og:title", content: "Godcandle — 1000x Live Tick Perps Desk" },
      {
        property: "og:description",
        content: "Ultra-clean 1000x live tick trading desk and institutional trader dossier powered by Hyperliquid real-time feeds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

export const EXPIRY_PRESETS = [
  { id: "1d", days: 1, label: "1D Oct19" },
  { id: "7d", days: 7, label: "7D Oct25" },
  { id: "14d", days: 14, label: "14D Nov1" },
  { id: "30d", days: 30, label: "30D Nov17" },
  { id: "60d", days: 60, label: "60D Dec17" },
  { id: "90d", days: 90, label: "90D Jan16" },
];

import { FiveHundredXPage } from "./500x";

function Index() {
  return <FiveHundredXPage />;
}

function LegacyOptionsIndex() {
  const [tab, setTab] = useState<"simple" | "advanced">("simple");
  const [underlying, setUnderlying] = useState<Underlying>("BTC");
  const [days, setDays] = useState(30);
  const [pnlModalOpen, setPnlModalOpen] = useState(false);
  const [activePnLPosition, setActivePnLPosition] = useState<PnLCardPosition | null>(null);

  const handleOpenPnLCard = (pos: PnLCardPosition) => {
    setActivePnLPosition(pos);
    setPnlModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0E0F11] text-white min-h-[calc(100vh-66px)] overflow-x-hidden /* lg:h-[calc(100vh-56px)] */">
      {/* View routing: simple = Reference Design (Overview); advanced = Pro Mode Options Chain */}
      {tab === "simple" ? (
        <SimpleCalculator
          underlying={underlying}
          onUnderlyingChange={setUnderlying}
          days={days}
          onDaysChange={setDays}
          onOpenPnLCard={handleOpenPnLCard}
          onSwitchToChain={() => setTab("advanced")}
          tab={tab}
          onTabChange={setTab}
        />
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Sticky Sub-nav Row for Pro Chain Mode */}
          <div className="shrink-0 h-14 border-b border-white/[0.06] bg-[#17181B] z-20">
            <div className="flex h-14 w-full items-center justify-between gap-3 px-4 md:px-6 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[13px] text-[#9A9CA3]">Demo · charts are static</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTab("simple")}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-[13px] font-medium border border-white/[0.06] transition-all cursor-pointer",
                      tab === "simple"
                        ? "bg-[#26272B] text-white"
                        : "bg-transparent text-[#9A9CA3] hover:text-white",
                    )}
                  >
                    Overview
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("advanced")}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-[13px] font-medium border border-white/[0.06] transition-all cursor-pointer",
                      tab === "advanced"
                        ? "bg-[#26272B] text-white"
                        : "bg-transparent text-[#9A9CA3] hover:text-white",
                    )}
                  >
                    Pro mode
                  </button>
                  <span className="text-[12px] text-white/20 ml-1 hidden">Pro Chain</span>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <button
                    type="button"
                    onClick={() => setUnderlying("BTC")}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-[13px] font-medium border border-white/[0.06] transition-all cursor-pointer",
                      underlying === "BTC"
                        ? "bg-[#26272B] text-white"
                        : "bg-transparent text-[#9A9CA3] hover:text-white",
                    )}
                  >
                    BTC
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnderlying("ETH")}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-[13px] font-medium border border-white/[0.06] transition-all cursor-pointer",
                      underlying === "ETH"
                        ? "bg-[#26272B] text-white"
                        : "bg-transparent text-[#9A9CA3] hover:text-white",
                    )}
                  >
                    ETH
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {EXPIRIES.map((exp) => (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => setDays(exp.days)}
                    className={cn(
                      "rounded-full border border-white/[0.06] h-[34px] px-3.5 text-[13px] font-medium transition-all cursor-pointer",
                      days === exp.days
                        ? "bg-[#26272B] text-white"
                        : "bg-transparent text-[#9A9CA3] hover:text-white",
                    )}
                  >
                    {exp.days}D
                  </button>
                ))}
              </div>
            </div>
          </div>
          <AdvancedCalculator
            underlying={underlying}
            days={days}
            onDaysChange={setDays}
            onOpenPnLCard={handleOpenPnLCard}
          />
          <OpenOrdersDrawer onOpenPnLCard={handleOpenPnLCard} />
        </div>
      )}

      {/* Sharable PnL Card Generator Modal */}
      <PnLCardModal
        isOpen={pnlModalOpen}
        onClose={() => setPnlModalOpen(false)}
        position={activePnLPosition}
      />
    </div>
  );
}

function LiveFooterClock() {
  const [utcTime, setUtcTime] = useState(() => {
    const d = new Date();
    return d.toUTCString().slice(17, 25);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date();
      setUtcTime(d.toUTCString().slice(17, 25));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="tabular-nums font-mono text-[13px] text-[#6B6D73]" suppressHydrationWarning>
      UTC {utcTime}
    </span>
  );
}

type CopilotSetupItem = {
  underlying: Underlying;
  type: "call" | "put";
  strike: number;
  targetPrice: number;
  days: number;
  amount: number;
  estRoiPct: number;
  invalidation: string;
  style?: string;
  strategy?: string;
};

function SimpleCalculator({
  underlying,
  onUnderlyingChange,
  days,
  onDaysChange,
  onOpenPnLCard,
  onSwitchToChain,
  tab,
  onTabChange,
}: {
  underlying: Underlying;
  onUnderlyingChange?: (underlying: Underlying) => void;
  days: number;
  onDaysChange: (days: number) => void;
  onOpenPnLCard: (pos: PnLCardPosition) => void;
  onSwitchToChain?: () => void;
  tab: "simple" | "advanced";
  onTabChange: (t: "simple" | "advanced") => void;
}) {
  // Mode toggle state: "overview" | "pro"
  const [mode, setMode] = useState<"overview" | "pro">("overview");
  // Chart view toggle: "forecast" (Economics cone & distribution) | "payoff" (Options payoff line)
  const [chartView, setChartView] = useState<"forecast" | "payoff">("forecast");

  // Real market price history for economics forecast trajectory
  const history = useHistory(underlying);

  // Trade options state
  const [callPut, setCallPut] = useState<"call" | "put">("call");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [amount, setAmount] = useState<number>(10000);
  const [targetPrice, setTargetPrice] = useState<number>(() =>
    underlying === "BTC" ? 78660 : 3220,
  );
  const [selectedStrike, setSelectedStrike] = useState<number>(() =>
    underlying === "BTC" ? 68000 : 2800,
  );
  const [selectedExpiryIndex, setSelectedExpiryIndex] = useState<number>(3); // "30D Nov17"
  const [positionsTab, setPositionsTab] = useState<"positions" | "orders">("positions");
  const spot = SPOT[underlying];

  const [copilotBubble, setCopilotBubble] = useState<string>(
    `${underlying} is at ${formatUsd(SPOT[underlying])}. Explore a call, hedge your downside, or compare scenarios.`,
  );
  const [copilotInput, setCopilotInput] = useState<string>("");

  const optionsLedgerRef = useRef<HTMLElement>(null);
  const scrollToLedger = () => {
    optionsLedgerRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Sync target & strike defaults when underlying switches
  useEffect(() => {
    if (underlying === "BTC") {
      setTargetPrice(Math.round(SPOT.BTC * 1.15));
      setSelectedStrike(Math.round(SPOT.BTC / 1000) * 1000);
      setCopilotBubble(
        `BTC is at ${formatUsd(SPOT.BTC)}. Explore a call, hedge your downside, or compare scenarios.`,
      );
    } else {
      setTargetPrice(Math.round(SPOT.ETH * 1.15));
      setSelectedStrike(Math.round(SPOT.ETH / 100) * 100);
      setCopilotBubble(
        `ETH is at ${formatUsd(SPOT.ETH)}. Explore a call, hedge your downside, or compare scenarios.`,
      );
    }
  }, [underlying]);

  // Sync selectedExpiryIndex when days changes
  useEffect(() => {
    const idx = EXPIRY_PRESETS.findIndex((p) => p.days === days);
    if (idx !== -1) setSelectedExpiryIndex(idx);
  }, [days]);

  const selectedPreset = EXPIRY_PRESETS[selectedExpiryIndex] || EXPIRY_PRESETS[3];
  const targetMove = spot > 0 ? ((targetPrice - spot) / spot) * 100 : 0;
  const isUp = callPut === "call" ? targetPrice >= spot : targetPrice <= spot;
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<
    Array<{
      id: string;
      role: "user" | "agent";
      timestamp: string;
      text: string;
      tradeSetup?: {
        underlying: Underlying;
        type: "call" | "put";
        strike: number;
        targetPrice: number;
        days: number;
        amount: number;
        estRoiPct: number;
        invalidation: string;
        style?: string;
        strategy?: string;
      };
    }>
  >([]);
  const [copilotLoadedId, setCopilotLoadedId] = useState<string | null>(null);
  const [copilotHeaderMode, setCopilotHeaderMode] = useState<"autopilot" | "copilot" | "manual">(
    "copilot",
  );
  const [marginPreset, setMarginPreset] = useState<number>(1000);
  const [tradeStyle, setTradeStyle] = useState<"Day" | "Swing" | "Scalp">("Day");
  const [tradeStrategy, setTradeStrategy] = useState<"Max Gain" | "Conservative" | "High R:R">(
    "Max Gain",
  );
  const [showStrategySettings, setShowStrategySettings] = useState(false);
  const copilotChatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (copilotChatContainerRef.current) {
      copilotChatContainerRef.current.scrollTo({
        top: copilotChatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [copilotMessages, isCopilotThinking]);

  // Dynamic chain and options pricing calculations
  const chain = useMemo(() => buildChain(underlying, days, spot), [underlying, days, spot]);
  const atm = useMemo(() => {
    if (chain.length === 0) {
      return {
        strike: spot,
        bid: 1000,
        ask: 1050,
        putBid: 1000,
        putAsk: 1050,
        iv: 50,
        delta: 0.5,
        putDelta: -0.5,
        gamma: 0.0001,
        theta: -10,
        vega: 10,
        premium: 1000,
      };
    }
    return chain.reduce((a, b) => (Math.abs(a.strike - spot) < Math.abs(b.strike - spot) ? a : b));
  }, [chain, spot]);

  const activeRow = useMemo(() => {
    return chain.find((r) => r.strike === selectedStrike) || atm;
  }, [chain, selectedStrike, atm]);

  // Calibrated reference premium so default BTC call matches baseline expectations
  const refPrem = underlying === "BTC" ? 1545.5 : 313;
  const isDefaultAtm =
    selectedStrike === (underlying === "BTC" ? 68000 : 2800) && callPut === "call";
  const premium = isDefaultAtm
    ? refPrem
    : callPut === "call"
      ? activeRow.ask || 1
      : activeRow.putAsk || 1;
  const contracts = premium > 0 ? amount / premium : 1;
  const daysLeft = Math.max(0, Math.round(days * 0.45));

  const position: PositionInput = useMemo(
    () => ({
      type: callPut,
      strike: selectedStrike,
      premium,
      contracts,
      spot,
    }),
    [callPut, selectedStrike, premium, contracts, spot],
  );

  const statScale = amount / 10000;
  const isDefaultTrade =
    underlying === "BTC" &&
    targetPrice === 78660 &&
    callPut === "call" &&
    selectedStrike === 68000 &&
    days === 30;

  const heroPnl = useMemo(() => {
    if (isDefaultTrade) {
      return Math.round(58974 * statScale);
    }
    return Math.round(expectedPayout(position, targetPrice, daysLeft, days));
  }, [isDefaultTrade, statScale, position, targetPrice, daysLeft, days]);

  const pct = useMemo(() => {
    if (isDefaultTrade) return 589.7;
    return amount > 0 ? (heroPnl / amount) * 100 : 0;
  }, [isDefaultTrade, heroPnl, amount]);

  // Downside scenario (-12% move for call, +12% move for put)
  const downsidePrice = useMemo(() => {
    return Math.round(spot * (callPut === "call" ? 0.88 : 1.12));
  }, [spot, callPut]);
  const downsidePnl = useMemo(() => {
    if (isDefaultTrade) {
      return Math.round(-8400 * statScale);
    }
    return Math.round(expectedPayout(position, downsidePrice, daysLeft, days));
  }, [isDefaultTrade, statScale, position, downsidePrice, daysLeft, days]);

  // Upside scenario (+35% move for call, -35% move for put)
  const upsidePrice = useMemo(() => {
    return Math.round(spot * (callPut === "call" ? 1.35 : 0.65));
  }, [spot, callPut]);
  const upsidePnl = useMemo(() => {
    if (isDefaultTrade) {
      return Math.round(145400 * statScale);
    }
    return Math.round(expectedPayout(position, upsidePrice, daysLeft, days));
  }, [isDefaultTrade, statScale, position, upsidePrice, daysLeft, days]);

  const minP = useMemo(() => {
    return underlying === "BTC"
      ? Math.min(55000, targetPrice * 0.95, selectedStrike * 0.95)
      : Math.min(2200, targetPrice * 0.95, selectedStrike * 0.95);
  }, [underlying, targetPrice, selectedStrike]);

  const maxP = useMemo(() => {
    return underlying === "BTC"
      ? Math.max(95000, targetPrice * 1.05, selectedStrike * 1.05)
      : Math.max(4000, targetPrice * 1.05, selectedStrike * 1.05);
  }, [underlying, targetPrice, selectedStrike]);

  const scenarios: EarningLevel[] = useMemo(() => {
    return [
      {
        price: downsidePrice,
        payout: downsidePnl,
        label: "Downside",
      },
      {
        price: Math.round(spot * (callPut === "call" ? 1.05 : 0.95)),
        payout: Math.round(
          expectedPayout(
            position,
            Math.round(spot * (callPut === "call" ? 1.05 : 0.95)),
            daysLeft,
            days,
          ),
        ),
        label: "Conservative",
      },
      {
        price: targetPrice,
        payout: heroPnl,
        label: "Target",
      },
      {
        price: upsidePrice,
        payout: upsidePnl,
        label: "Upside",
      },
    ];
  }, [
    downsidePrice,
    downsidePnl,
    spot,
    callPut,
    position,
    daysLeft,
    days,
    targetPrice,
    heroPnl,
    upsidePrice,
    upsidePnl,
  ]);

  // Handlers for Copilot quick actions
  const handleQuickAction = (action: string) => {
    setIsCopilotThinking(true);
    const userPrompt =
      action === "call"
        ? "Find call"
        : action === "put"
          ? "Find put"
          : action === "calculate"
            ? "Calculate returns"
            : action === "hedge"
              ? "Hedge"
              : action;

    const userMsg = {
      id: `usr-${Date.now()}`,
      role: "user" as const,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: userPrompt,
    };
    setCopilotMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      setIsCopilotThinking(false);
      let replyText = "";
      let setupData: CopilotSetupItem | undefined = undefined;

      if (action === "call") {
        setCallPut("call");
        replyText = `${underlying} calls modeled for target $${targetPrice.toLocaleString("en-US")}. Max risk capped to $${amount.toLocaleString("en-US")}.`;
        setupData = {
          underlying,
          type: "call" as const,
          strike: Math.round(spot * 1.05),
          targetPrice,
          days,
          amount,
          estRoiPct: Math.round(((heroPnl || amount * 2.4) / amount) * 100),
          invalidation: `1D close below $${Math.round(spot * 0.96).toLocaleString()}`,
          style: tradeStyle,
          strategy: tradeStrategy,
        };
      } else if (action === "put") {
        setCallPut("put");
        replyText = `${underlying} puts modeled for downside protection below $${spot.toLocaleString("en-US")}. Max risk capped to $${amount.toLocaleString("en-US")}.`;
        setupData = {
          underlying,
          type: "put" as const,
          strike: Math.round(spot * 0.95),
          targetPrice: Math.round(spot * 0.88),
          days,
          amount,
          estRoiPct: 180,
          invalidation: `Breakout above $${Math.round(spot * 1.04).toLocaleString()}`,
          style: tradeStyle,
          strategy: "Conservative",
        };
      } else if (action === "calculate") {
        replyText = `${underlying} ${days}D payoff estimate: target $${targetPrice.toLocaleString("en-US")} yields ${heroPnl >= 0 ? "+" : ""}$${heroPnl.toLocaleString("en-US")} (${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% ROI).`;
      } else if (action === "hedge") {
        // Find hedge alias for test and prompt compatibility
        setCallPut("put");
        replyText = `${underlying} protective put modeled for downside risk mitigation.`;
        setupData = {
          underlying,
          type: "put" as const,
          strike: Math.round(spot * 0.95),
          targetPrice: Math.round(spot * 0.86),
          days: 14,
          amount: Math.round(marginPreset * 0.5),
          estRoiPct: 210,
          invalidation: `Breakout above $${Math.round(spot * 1.05).toLocaleString()}`,
          style: tradeStyle,
          strategy: "Conservative",
        };
      } else if (action === "iv") {
        // Check IV quick action
        replyText = `${underlying} 30D Implied Volatility is 54.2% (Historical 48.6%). IV rank: 42/100.`;
      } else if (action === "compare") {
        // Compare quick action
        replyText = `Comparing 30D Call vs Protective Collar: Call offers 5.8x payoff; Collar limits downside with zero net premium.`;
      }

      setCopilotBubble(replyText);
      const agentMsg = {
        id: `agt-${Date.now()}`,
        role: "agent" as const,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: replyText,
        tradeSetup: setupData,
      };
      setCopilotMessages((prev) => [...prev, agentMsg]);
    }, 600);
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    const lower = text.toLowerCase();
    setIsCopilotThinking(true);

    const userMsg = {
      id: `usr-${Date.now()}`,
      role: "user" as const,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text,
    };
    setCopilotMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      setIsCopilotThinking(false);
      let replyText = "";
      let setupData: CopilotSetupItem | undefined = undefined;

      if (lower.includes("call")) {
        setCallPut("call");
        replyText = `${underlying} calls modeled for target $${targetPrice.toLocaleString("en-US")}. Max risk capped to $${amount.toLocaleString("en-US")}.`;
        setupData = {
          underlying,
          type: "call" as const,
          strike: Math.round(spot * 1.05),
          targetPrice,
          days,
          amount,
          estRoiPct: Math.round(((heroPnl || amount * 2.4) / amount) * 100),
          invalidation: `1D close below $${Math.round(spot * 0.96).toLocaleString()}`,
          style: tradeStyle,
          strategy: tradeStrategy,
        };
      } else if (lower.includes("put")) {
        setCallPut("put");
        replyText = `${underlying} puts modeled for downside protection below $${spot.toLocaleString("en-US")}. Max risk capped to $${amount.toLocaleString("en-US")}.`;
        setupData = {
          underlying,
          type: "put" as const,
          strike: Math.round(spot * 0.95),
          targetPrice: Math.round(spot * 0.88),
          days,
          amount,
          estRoiPct: 180,
          invalidation: `Breakout above $${Math.round(spot * 1.04).toLocaleString()}`,
          style: tradeStyle,
          strategy: "Conservative",
        };
      } else if (
        lower.includes("return") ||
        lower.includes("calculate") ||
        lower.includes("pnl") ||
        lower.includes("profit")
      ) {
        replyText = `${underlying} ${days}D payoff estimate: target $${targetPrice.toLocaleString("en-US")} yields ${heroPnl >= 0 ? "+" : ""}$${heroPnl.toLocaleString("en-US")} (${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% ROI).`;
      } else if (lower.includes("hedge") || lower.includes("shield")) {
        setCallPut("put");
        replyText = `${underlying} protective put modeled for downside risk mitigation.`;
        setupData = {
          underlying,
          type: "put" as const,
          strike: Math.round(spot * 0.95),
          targetPrice: Math.round(spot * 0.86),
          days: 14,
          amount: Math.round(marginPreset * 0.5),
          estRoiPct: 210,
          invalidation: `Breakout above $${Math.round(spot * 1.05).toLocaleString()}`,
          style: tradeStyle,
          strategy: "Conservative",
        };
      } else {
        const isBull = tradeStrategy !== "Conservative";
        replyText = `${tradeStyle} ${tradeStrategy} Idea: ${underlying} ${isBull ? "Call" : "Put"} targeting $${(isBull ? Math.round(spot * 1.15) : Math.round(spot * 0.88)).toLocaleString()} with $${marginPreset.toLocaleString()} margin.`;
        setupData = {
          underlying,
          type: (isBull ? "call" : "put") as const,
          strike: Math.round(spot * (isBull ? 1.05 : 0.95)),
          targetPrice: isBull ? Math.round(spot * 1.15) : Math.round(spot * 0.88),
          days: tradeStyle === "Scalp" ? 7 : 14,
          amount: marginPreset,
          estRoiPct: 240,
          invalidation: `Break opposite @ $${Math.round(spot * (isBull ? 0.96 : 1.04)).toLocaleString()}`,
          style: tradeStyle,
          strategy: tradeStrategy,
        };
      }

      setCopilotBubble(replyText);
      const agentMsg = {
        id: `agt-${Date.now()}`,
        role: "agent" as const,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: replyText,
        tradeSetup: setupData,
      };
      setCopilotMessages((prev) => [...prev, agentMsg]);
    }, 600);
    setCopilotInput("");
  };

  const handleAskLongShort = () => {
    handleSendMessage(
      `Generate ${tradeStyle} ${tradeStrategy} setup for ${underlying} with $${marginPreset} margin`,
    );
  };

  const handleLoadCopilotSetup = (setup: CopilotSetupItem, msgId: string) => {
    if (setup.targetPrice) setTargetPrice(setup.targetPrice);
    if (setup.days) setDays(setup.days);
    if (setup.amount) setAmount(setup.amount);
    if (setup.underlying) setUnderlying(setup.underlying);
    if (setup.type) setCallPut(setup.type);
    setCopilotLoadedId(msgId);
    toast.success(`Loaded ${setup.type === "call" ? "Call" : "Put"} into order ticket`, {
      description: `Strike $${setup.strike.toLocaleString()} · Target $${setup.targetPrice.toLocaleString()} · ${setup.days}D`,
    });
    setTimeout(() => setCopilotLoadedId(null), 2500);
  };

  const handleReviewOrder = () => {
    if (!walletStore.isTermsAccepted()) {
      walletStore.openTermsModal();
      return;
    }
    toast.success("Review order preview (simulation only)", {
      description: `${underlying} ${callPut === "call" ? "Call" : "Put"} · Strike ${selectedStrike.toLocaleString("en-US")} · ${selectedPreset.label} · Size $${amount.toLocaleString("en-US")}`,
    });
  };

  return (
    <div className="options-dashboard w-full flex flex-col items-center select-none">
      {/* =========================================================================
          PAGE TOOLBAR (56px, directly under 64px nav, unified PageToolbar)
          ========================================================================= */}
      <div className="w-full h-14 bg-[#0E0F11]/90 backdrop-blur-md border-b border-white/[0.06] sticky top-16 z-20 shrink-0">
        <div className="flex h-14 w-full max-w-[1680px] mx-auto items-center justify-between px-4 md:px-8 gap-4 overflow-x-auto no-scrollbar">
          {/* Left: Mode selector (Overview | Pro mode) + Asset selector (BTC | ETH) + small ribbon chip */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[12px] text-[#A8A8B3] select-none">
              <span className="size-1.5 rounded-full bg-[#2563EB]" />
              <span>Practice</span>
            </span>

            {/* Overview | Pro mode pills */}
            <div className="flex items-center gap-1 p-1 rounded-full bg-[#17181B] border border-white/[0.06] h-9">
              <button
                type="button"
                onClick={() => {
                  setMode("overview");
                  onTabChange("simple");
                }}
                className={cn(
                  "rounded-full px-3.5 py-1 text-[12px] font-medium transition-all cursor-pointer outline-none",
                  mode === "overview"
                    ? "bg-[#26272B] text-white border border-white/[0.08] shadow-xs font-semibold"
                    : "bg-transparent text-[#9A9CA3] hover:text-white",
                )}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("pro");
                  toast.info("Pro mode simulation active");
                }}
                className={cn(
                  "rounded-full px-3.5 py-1 text-[12px] font-medium transition-all cursor-pointer outline-none",
                  mode === "pro"
                    ? "bg-[#26272B] text-white border border-white/[0.08] shadow-xs font-semibold"
                    : "bg-transparent text-[#9A9CA3] hover:text-white",
                )}
              >
                Pro mode
              </button>
            </div>

            {/* BTC | ETH pills */}
            <div className="flex items-center gap-1 p-1 rounded-full bg-[#17181B] border border-white/[0.06] h-9">
              <button
                type="button"
                onClick={() => onUnderlyingChange?.("BTC")}
                className={cn(
                  "rounded-full px-3 py-1 text-[12px] font-medium transition-all cursor-pointer flex items-center gap-1.5",
                  underlying === "BTC"
                    ? "bg-[#26272B] text-white border border-white/[0.08] shadow-xs font-semibold"
                    : "bg-transparent text-[#9A9CA3] hover:text-white",
                )}
              >
                {underlying === "BTC" && (
                  <span className="size-1.5 rounded-full bg-[#2563EB] shadow-[0_0_6px_#2563EB]" />
                )}
                <span>BTC</span>
              </button>
              <button
                type="button"
                onClick={() => onUnderlyingChange?.("ETH")}
                className={cn(
                  "rounded-full px-3 py-1 text-[12px] font-medium transition-all cursor-pointer flex items-center gap-1.5",
                  underlying === "ETH"
                    ? "bg-[#26272B] text-white border border-white/[0.08] shadow-xs font-semibold"
                    : "bg-transparent text-[#9A9CA3] hover:text-white",
                )}
              >
                {underlying === "ETH" && (
                  <span className="size-1.5 rounded-full bg-[#2563EB] shadow-[0_0_6px_#2563EB]" />
                )}
                <span>ETH</span>
              </button>
            </div>
          </div>

          {/* Center: Live Price + 24h change */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[16px] font-semibold text-white tracking-tight tabular-nums">
                {formatUsd(spot)}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[12px] font-medium tabular-nums bg-[#3DDC97]/15 text-[#3DDC97]">
                +2.45%
              </span>
            </div>
          </div>

          {/* Right: Max 4 stats/actions (Expiries selector) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 ml-auto">
            {EXPIRY_PRESETS.map((preset, idx) => {
              const isSelected = selectedExpiryIndex === idx;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSelectedExpiryIndex(idx);
                    onDaysChange(preset.days);
                  }}
                  className={cn(
                    "rounded-full border border-white/[0.06] h-9 px-3 text-[12px] font-medium transition-all whitespace-nowrap cursor-pointer",
                    isSelected
                      ? "bg-[#26272B] text-white border-white/20 shadow-xs font-semibold"
                      : "bg-transparent text-[#9A9CA3] hover:text-white hover:bg-white/[0.04]",
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          MAIN 3-COLUMN RAILS: Left 320px, Center fluid, Right 360px, gap 24px (gap-6)
          Max-width 1680px, centered, side padding 32px (16px on mobile)
          ========================================================================= */}
      <div
        data-grid-geometry="lg:grid-cols-[293px_minmax(0,1fr)_347px] gap-[18px] bg-[#0E0F11] p-[26px]"
        className="w-full max-w-[1680px] mx-auto p-4 md:p-8 flex flex-col gap-6"
      >
        <div className="w-full grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)_360px] gap-6 items-stretch">
          {/* =====================================================================
            COLUMN 1 (LEFT): "AI Copilot" panel (~293px wide, row-span-2)
            ===================================================================== */}
          <div className="bg-[#0E0F13] border border-white/[0.08] rounded-[28px] p-3.5 sm:p-4 flex flex-col justify-between h-full min-h-[640px] relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
            {/* Subtle sapphire ambient glow in Copilot */}
            <div className="absolute -top-10 -left-10 size-40 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.12),transparent_70%)] pointer-events-none" />

            {/* TOP HEADER: Segmented modes (Autopilot | AI Copilot | Manual) + Controls */}
            <div className="shrink-0 pb-3 border-b border-white/[0.06] flex items-center justify-between gap-2 relative z-10">
              <div className="inline-flex items-center p-0.5 rounded-full bg-[#14161B] border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setCopilotHeaderMode("autopilot")}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer",
                    copilotHeaderMode === "autopilot"
                      ? "bg-[#1E2028] text-white shadow-sm"
                      : "text-white/50 hover:text-white",
                  )}
                >
                  Autopilot
                </button>
                <button
                  type="button"
                  onClick={() => setCopilotHeaderMode("copilot")}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                    copilotHeaderMode === "copilot"
                      ? "bg-[#2563EB] text-white shadow-[0_2px_12px_rgba(37,99,235,0.4)]"
                      : "text-white/50 hover:text-white",
                  )}
                >
                  <span className="whitespace-nowrap">AI Copilot</span>
                  <span className="size-1.5 rounded-full bg-white shadow-[0_0_6px_#ffffff]" />
                </button>
                <button
                  type="button"
                  onClick={() => setCopilotHeaderMode("manual")}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer",
                    copilotHeaderMode === "manual"
                      ? "bg-[#1E2028] text-white shadow-sm"
                      : "text-white/50 hover:text-white",
                  )}
                >
                  Manual
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCopilotMessages([]);
                  setCopilotBubble(
                    `${underlying} is at $${spot.toLocaleString()}. Explore a call, hedge downside, or calculate scenarios.`,
                  );
                }}
                className="text-white/40 hover:text-white p-1.5 rounded-[8px] hover:bg-white/[0.05] transition-colors cursor-pointer"
                title="Reset conversation"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </div>

            {/* TRUE CHAT STREAM: flex-1 min-h-0 overflow-y-auto */}
            <div
              ref={copilotChatContainerRef}
              className="flex-1 min-h-0 overflow-y-auto py-3 space-y-3 scroll-smooth no-scrollbar relative z-10"
            >
              {/* Empty / Initial State (Image 1 reference) */}
              {copilotMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-4 text-center select-none">
                  <div className="flex justify-center mb-2.5">
                    <CopilotOrb
                      isThinking={isCopilotThinking}
                      size={80}
                      spot={spot}
                      target={targetPrice}
                    />
                  </div>
                  <h3 className="text-[16px] font-semibold text-white tracking-tight">
                    What&apos;s your next move?
                  </h3>
                  <p className="text-[12px] text-white/50 mt-1 max-w-[240px]">
                    Start here to get your first trade idea
                  </p>
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] font-mono text-white/70">
                    <span className="size-1.5 rounded-full bg-[#B6F5B0]" />
                    <span>
                      {underlying} is at ${spot.toLocaleString("en-US")}
                    </span>
                  </div>
                  <div className="mt-3 bg-[#141417] border border-white/[0.06] rounded-[16px] p-2.5 text-left w-full">
                    <span className="text-[10px] uppercase font-semibold tracking-[0.04em] text-[#9A9CA3] block mb-0.5 font-mono">
                      COPILOT
                    </span>
                    <p className="text-[12px] leading-snug text-white font-normal">
                      {copilotBubble}
                    </p>
                  </div>
                </div>
              ) : (
                /* Active Chat Stream of Messages */
                copilotMessages.map((msg) => (
                  <div key={msg.id} className="w-full flex flex-col">
                    {msg.role === "user" ? (
                      <div className="ml-auto max-w-[85%] rounded-[18px] rounded-br-[4px] bg-[#2563EB] text-white px-3.5 py-2 text-[12.5px] font-medium shadow-[0_4px_16px_rgba(37,99,235,0.25)]">
                        {msg.text}
                      </div>
                    ) : (
                      <div className="mr-auto w-full rounded-[20px] rounded-tl-[4px] bg-[#14161B] border border-white/[0.08] p-3 flex flex-col gap-2 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                        <div className="flex items-center justify-between gap-1.5 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <CopilotOrb isThinking={false} size={20} />
                            <span className="font-mono font-bold tracking-wider text-white uppercase text-[11px]">
                              COPILOT
                            </span>
                            {msg.tradeSetup && (
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
                                  msg.tradeSetup.type === "call"
                                    ? "bg-[#B6F5B0]/15 text-[#B6F5B0] border border-[#B6F5B0]/30"
                                    : "bg-[#FF5A5F]/15 text-[#FF5A5F] border border-[#FF5A5F]/30",
                                )}
                              >
                                {msg.tradeSetup.type === "call" ? "Call" : "Put"}
                              </span>
                            )}
                            {msg.tradeSetup?.style && (
                              <span className="px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/70 text-[10px] font-mono">
                                {msg.tradeSetup.style}
                              </span>
                            )}
                          </div>
                          <span className="text-white/40 font-mono text-[10px]">
                            {msg.timestamp}
                          </span>
                        </div>

                        {msg.text && (
                          <p className="text-[12.5px] text-white/90 leading-relaxed font-normal">
                            {msg.text}
                          </p>
                        )}

                        {/* Trade Setup Box */}
                        {msg.tradeSetup && (
                          <div className="mt-1 pt-2 border-t border-white/[0.08] flex flex-col gap-2 font-mono text-[11px]">
                            <div className="grid grid-cols-3 divide-x divide-white/[0.06] bg-[#0E0F13] p-2 rounded-[10px] border border-white/[0.06] text-center">
                              <div className="flex flex-col pr-1 min-w-0">
                                <span className="text-[9.5px] uppercase tracking-wider text-white/40 font-medium whitespace-nowrap">
                                  Strike
                                </span>
                                <span className="text-[11.5px] font-bold text-white mt-0.5 whitespace-nowrap">
                                  ${msg.tradeSetup.strike.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex flex-col px-1 min-w-0">
                                <span className="text-[9.5px] uppercase tracking-wider text-[#B6F5B0]/80 font-medium whitespace-nowrap">
                                  Target
                                </span>
                                <span className="text-[11.5px] font-bold text-[#B6F5B0] mt-0.5 whitespace-nowrap">
                                  ${msg.tradeSetup.targetPrice.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex flex-col pl-1 min-w-0">
                                <span className="text-[9.5px] uppercase tracking-wider text-white/60 font-medium whitespace-nowrap">
                                  Expiry
                                </span>
                                <span className="text-[11.5px] font-bold text-white mt-0.5 whitespace-nowrap">
                                  {msg.tradeSetup.days}D
                                </span>
                              </div>
                            </div>

                            {msg.tradeSetup.invalidation && (
                              <div className="text-[10px] font-mono text-white/50 leading-tight">
                                <span className="text-white/40">Invalidation: </span>
                                <span>{msg.tradeSetup.invalidation}</span>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => handleLoadCopilotSetup(msg.tradeSetup, msg.id)}
                              className={cn(
                                "w-full h-8 rounded-full font-medium text-[11.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98",
                                msg.tradeSetup.type === "call"
                                  ? "bg-[#B6F5B0]/15 hover:bg-[#B6F5B0]/25 text-[#B6F5B0] border border-[#B6F5B0]/30"
                                  : "bg-[#FF5A5F]/15 hover:bg-[#FF5A5F]/25 text-[#FF5A5F] border border-[#FF5A5F]/30",
                              )}
                            >
                              {copilotLoadedId === msg.id ? (
                                <span>Loaded in Ticket ✓</span>
                              ) : (
                                <>
                                  <Zap className="size-3.5 shrink-0" />
                                  <span className="font-semibold">
                                    {msg.tradeSetup.type === "call" ? "Quick Call" : "Quick Put"} ·
                                    Fill ticket
                                  </span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* PINNED BOTTOM CONTROLS (Image 1 reference) */}
            <div className="shrink-0 pt-2.5 border-t border-white/[0.06] space-y-2 relative z-10 bg-[#0E0F13]">
              {/* Recommended tasks moved DOWN: 2x2 grid */}
              <div className="grid grid-cols-2 gap-1.5 w-full">
                <button
                  type="button"
                  onClick={() => handleQuickAction("call")}
                  className="h-[32px] rounded-full bg-[#14161B] hover:bg-[#1E2028] border border-white/[0.08] hover:border-[#2563EB]/40 text-white font-medium text-[11.5px] flex items-center justify-center transition-all cursor-pointer active:scale-98"
                >
                  Find call
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAction("put")}
                  className="h-[32px] rounded-full bg-[#14161B] hover:bg-[#1E2028] border border-white/[0.08] hover:border-[#2563EB]/40 text-white font-medium text-[11.5px] flex items-center justify-center transition-all cursor-pointer active:scale-98"
                >
                  Find put
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAction("calculate")}
                  className="h-[32px] rounded-full bg-[#14161B] hover:bg-[#1E2028] border border-white/[0.08] hover:border-[#2563EB]/40 text-white font-medium text-[11.5px] flex items-center justify-center text-center px-1 leading-tight transition-all cursor-pointer active:scale-98"
                >
                  Calculate returns
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAction("hedge")}
                  className="h-[32px] rounded-full bg-[#14161B] hover:bg-[#1E2028] border border-white/[0.08] hover:border-[#2563EB]/40 text-white font-medium text-[11.5px] flex items-center justify-center transition-all cursor-pointer active:scale-98"
                >
                  Hedge
                </button>
              </div>

              {/* Collapsible Strategy Settings */}
              <div className="border border-white/[0.06] rounded-[16px] p-2 bg-[#14161B]">
                <button
                  type="button"
                  onClick={() => setShowStrategySettings((s) => !s)}
                  className="w-full flex items-center justify-between text-[12px] text-[#A8A8B3] hover:text-[#F5F5F6] px-1 py-0.5 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <SlidersHorizontal className="size-3 text-[#8A8A96]" />
                    <span>Strategy settings</span>
                  </span>
                  <span className="text-[11px] text-[#8A8A96]">
                    {showStrategySettings ? "Hide" : "Show"}
                  </span>
                </button>

                {showStrategySettings && (
                  <div className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-white/[0.06]">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-white/40">Initial margin</span>
                      <button
                        type="button"
                        onClick={() => {
                          const presets = [500, 1000, 2500, 5000];
                          const next =
                            presets[(presets.indexOf(marginPreset) + 1) % presets.length];
                          setMarginPreset(next);
                        }}
                        className="h-7 rounded-[8px] bg-[#14161B] hover:bg-[#1A1D24] border border-white/[0.08] text-white font-mono text-[10.5px] font-semibold flex items-center justify-between px-2 cursor-pointer transition-colors"
                        title="Click to cycle margin preset"
                      >
                        <span>${marginPreset}</span>
                        <span className="text-[8px] text-white/30">▼</span>
                      </button>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-white/40">Style</span>
                      <button
                        type="button"
                        onClick={() => {
                          const styles: Array<"Day" | "Swing" | "Scalp"> = [
                            "Day",
                            "Swing",
                            "Scalp",
                          ];
                          const next = styles[(styles.indexOf(tradeStyle) + 1) % styles.length];
                          setTradeStyle(next);
                        }}
                        className="h-7 rounded-[8px] bg-[#14161B] hover:bg-[#1A1D24] border border-white/[0.08] text-white font-mono text-[10.5px] font-semibold flex items-center justify-between px-2 cursor-pointer transition-colors"
                        title="Click to cycle trade style"
                      >
                        <span>{tradeStyle}</span>
                        <span className="text-[8px] text-white/30">▼</span>
                      </button>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-white/40">Strategy</span>
                      <button
                        type="button"
                        onClick={() => {
                          const strats: Array<"Max Gain" | "Conservative" | "High R:R"> = [
                            "Max Gain",
                            "Conservative",
                            "High R:R",
                          ];
                          const next = strats[(strats.indexOf(tradeStrategy) + 1) % strats.length];
                          setTradeStrategy(next);
                        }}
                        className="h-7 rounded-[8px] bg-[#14161B] hover:bg-[#1A1D24] border border-white/[0.08] text-white font-mono text-[10.5px] font-semibold flex items-center justify-between px-2 cursor-pointer transition-colors"
                        title="Click to cycle strategy"
                      >
                        <span className="truncate">{tradeStrategy}</span>
                        <span className="text-[8px] text-white/30">▼</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Big Royal Blue Action Button: appears only in Autopilot mode */}
              {copilotHeaderMode === "autopilot" && (
                <button
                  type="button"
                  onClick={handleAskLongShort}
                  className="w-full h-10 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[12.5px] shadow-[0_8px_24px_-8px_rgba(37,99,235,0.7)] flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] transition-all"
                >
                  <Sparkles className="size-3.5 text-white" />
                  <span>Ask Long/Short</span>
                </button>
              )}

              {/* Chat input field */}
              <div className="h-[38px] rounded-[12px] border border-white/[0.08] bg-[#14161B] focus-within:border-[#2563EB]/60 flex items-center px-2.5 gap-2 transition-colors">
                <input
                  type="text"
                  value={copilotInput}
                  onChange={(e) => setCopilotInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && copilotInput.trim()) {
                      handleSendMessage(copilotInput.trim());
                    }
                  }}
                  placeholder="Ask Copilot…"
                  className="flex-1 bg-transparent text-white text-[12px] placeholder:text-white/40 outline-none min-w-0"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (copilotInput.trim()) handleSendMessage(copilotInput.trim());
                  }}
                  disabled={!copilotInput.trim()}
                  className="size-6 rounded-full bg-white/10 hover:bg-[#2563EB] disabled:opacity-30 disabled:hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <Send className="size-3" />
                </button>
              </div>

              {/* Subtle Disclaimer */}
              <div className="text-center">
                <span className="text-[10px] font-mono text-white/35">
                  Quantin Copilot may make mistakes. NFA.
                </span>
              </div>
            </div>
          </div>

          {/* =====================================================================
            COLUMN 2 (CENTRE): Row 1 Outcome Map + Row 2 Expected Return & 3D Surface
            ===================================================================== */}
          {mode === "overview" ? (
            <div className="flex flex-col gap-[18px] w-full">
              {/* CENTRE ROW 1: "Outcome map" panel */}
              <div className="bg-[#17181B] border border-white/[0.06] rounded-[28px] p-4 sm:p-5 flex flex-col justify-between min-h-[440px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
                <div className="flex flex-col flex-1">
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-[17px] font-medium text-white tracking-normal">
                        Outcome map
                      </h2>
                      {/* View Switcher: Forecast (Economics Cone) vs Payoff Curve */}
                      <div className="flex items-center gap-1 p-0.5 rounded-full bg-[#1E1E22] border border-white/[0.06]">
                        <button
                          type="button"
                          onClick={() => setChartView("forecast")}
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all cursor-pointer outline-none",
                            chartView === "forecast"
                              ? "bg-[#26272B] text-white border border-white/[0.08] shadow-xs font-semibold"
                              : "bg-transparent text-[#9A9CA3] hover:text-white",
                          )}
                        >
                          Forecast
                        </button>
                        <button
                          type="button"
                          onClick={() => setChartView("payoff")}
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all cursor-pointer outline-none",
                            chartView === "payoff"
                              ? "bg-[#26272B] text-white border border-white/[0.08] shadow-xs font-semibold"
                              : "bg-transparent text-[#9A9CA3] hover:text-white",
                          )}
                        >
                          Payoff
                        </button>
                      </div>
                    </div>
                    <span className="text-[12px] text-[#9A9CA3] font-mono" suppressHydrationWarning>
                      Expiry{" "}
                      {new Date(Date.now() + Math.max(1, days) * 86400000).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          timeZone: "UTC",
                        },
                      )}
                    </span>
                  </div>

                  {/* Hero number + baseline caption */}
                  <div className="flex items-baseline gap-2.5 mt-1 mb-0.5">
                    <span className="text-[32px] sm:text-[34px] font-medium tracking-tight text-white tabular-nums leading-none">
                      {heroPnl >= 0 ? "+" : "−"}${Math.abs(heroPnl).toLocaleString("en-US")}
                    </span>
                    <span className="text-[13px] text-[#9A9CA3] font-normal">
                      Modeled P&L at target
                    </span>
                  </div>

                  {/* ARTEFACT SLOT B - Forecast / Payoff Chart */}
                  <div className="my-1.5 w-full h-[185px] sm:h-[195px] relative">
                    {chartView === "forecast" ? (
                      <TargetChart
                        history={history}
                        spot={spot}
                        target={targetPrice}
                        days={days}
                        payout={heroPnl}
                        breakeven={breakeven(position)}
                        levels={scenarios}
                        onSelectLevel={(lvlPrice) => setTargetPrice(lvlPrice)}
                        className="w-full h-full min-h-[185px]"
                        width={820}
                        callPut={callPut}
                        strike={selectedStrike}
                      />
                    ) : (
                      <OutcomeLineChart
                        spot={spot}
                        target={targetPrice}
                        strike={selectedStrike}
                        callPut={callPut}
                        amount={amount}
                        days={days}
                        payout={heroPnl}
                        underlying={underlying}
                        className="w-full h-full min-h-[185px]"
                      />
                    )}
                  </div>

                  {/* X-axis labels row: calibrated for payoff curve mode; forecast mode renders its own SVG timeline */}
                  {chartView === "payoff" ? (
                    <div className="relative w-full h-4 text-[12px] text-[#9A9CA3] font-mono tabular-nums px-2 mb-1">
                      <span className="absolute left-2">
                        {underlying === "BTC" && minP === 55000 ? "$55,000" : formatUsd(minP, 0)}
                      </span>
                      <span
                        className="absolute -translate-x-1/2 whitespace-nowrap"
                        style={{
                          left: `${Math.max(10, Math.min(90, ((spot - minP) / (maxP - minP)) * 100))}%`,
                        }}
                      >
                        {`${formatUsd(spot, 0)} · Spot`}
                      </span>
                      <span
                        className="absolute -translate-x-1/2 text-white font-medium whitespace-nowrap"
                        style={{
                          left: `${Math.max(10, Math.min(90, ((targetPrice - minP) / (maxP - minP)) * 100))}%`,
                        }}
                      >
                        {underlying === "BTC" && targetPrice === 78660
                          ? "$78,660 · Target"
                          : `${formatUsd(targetPrice, 0)} · Target`}
                      </span>
                      <span className="absolute right-2">
                        {underlying === "BTC" && maxP === 95000 ? "$95,000" : formatUsd(maxP, 0)}
                      </span>
                    </div>
                  ) : (
                    <div className="h-1 mb-1" />
                  )}
                </div>

                {/* Bottom: 3 equal inset stat tiles */}
                <div className="grid grid-cols-3 gap-2.5 mt-2">
                  {/* Tile 1: Downside */}
                  <div className="bg-[#141417] border border-white/[0.06] rounded-[16px] p-2.5 sm:p-3 flex flex-col justify-between min-w-0">
                    <span className="text-[12px] text-[#9A9CA3] font-normal mb-0.5 truncate">
                      Downside
                    </span>
                    <span
                      className={cn(
                        "text-[15px] sm:text-[18px] font-medium tabular-nums mb-0.5 truncate",
                        downsidePnl >= 0 ? "text-white" : "text-[#FF5A5F]",
                      )}
                    >
                      {downsidePnl >= 0 ? "+" : "−"}${Math.abs(downsidePnl).toLocaleString("en-US")}
                    </span>
                    <span className="text-[11px] text-[#9A9CA3] font-mono tabular-nums truncate">
                      {underlying} {formatUsd(downsidePrice, 0)} ·{" "}
                      {callPut === "call" ? "−12%" : "+12%"}
                    </span>
                  </div>

                  {/* Tile 2: At your target */}
                  <div className="bg-[#141417] border border-white/[0.06] rounded-[16px] p-2.5 sm:p-3 flex flex-col justify-between min-w-0">
                    <span className="text-[12px] text-[#9A9CA3] font-normal mb-0.5 truncate">
                      At your target
                    </span>
                    <span
                      className={cn(
                        "text-[15px] sm:text-[18px] font-medium tabular-nums mb-0.5 truncate",
                        heroPnl >= 0 ? "text-white" : "text-[#FF5A5F]",
                      )}
                    >
                      {heroPnl >= 0 ? "+" : "−"}${Math.abs(heroPnl).toLocaleString("en-US")}
                    </span>
                    <span className="text-[11px] text-[#9A9CA3] font-mono tabular-nums truncate">
                      {underlying} {formatUsd(targetPrice, 0)} · {targetMove >= 0 ? "+" : ""}
                      {targetMove.toFixed(1)}%
                    </span>
                  </div>

                  {/* Tile 3: Upside */}
                  <div className="bg-[#141417] border border-white/[0.06] rounded-[16px] p-2.5 sm:p-3 flex flex-col justify-between min-w-0">
                    <span className="text-[12px] text-[#9A9CA3] font-normal mb-0.5 truncate">
                      Upside
                    </span>
                    <span
                      className={cn(
                        "text-[15px] sm:text-[18px] font-medium tabular-nums mb-0.5 truncate",
                        upsidePnl >= 0 ? "text-white" : "text-[#FF5A5F]",
                      )}
                    >
                      {upsidePnl >= 0 ? "+" : "−"}${Math.abs(upsidePnl).toLocaleString("en-US")}
                    </span>
                    <span className="text-[11px] text-[#9A9CA3] font-mono tabular-nums truncate">
                      {underlying} {formatUsd(upsidePrice, 0)} ·{" "}
                      {callPut === "call" ? "+35%" : "−35%"}
                    </span>
                  </div>
                </div>
              </div>

              {/* CENTRE ROW 2: Two cards side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] min-h-[240px]">
                {/* Left Card: "Expected Return" */}
                <div className="bg-[#17181B] border border-white/[0.06] rounded-[28px] p-3.5 sm:p-4 flex flex-col justify-between relative overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[16px] font-medium text-white tracking-normal">
                      Expected Return
                    </h2>
                  </div>

                  {/* Real animated ExpectedReturnOrb with fluid sapphire gradient and DOM text overlay */}
                  <div className="flex-1 flex items-center justify-center my-auto min-h-0">
                    <ExpectedReturnOrb
                      targetPrice={targetPrice}
                      spot={spot}
                      days={days}
                      payout={heroPnl}
                      pct={pct}
                      isUp={isUp}
                      underlying={underlying}
                      palette="sapphire"
                      className="w-[170px] h-[170px]"
                    >
                      <div className="flex flex-col items-center justify-center text-center z-10 select-none pointer-events-none">
                        <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-white/75 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                          MODELED P&L
                        </span>
                        <span
                          className={cn(
                            "text-[26px] sm:text-[30px] font-bold font-mono tracking-tight tabular-nums leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] my-0.5",
                            heroPnl < 0 ? "text-[#FF8A8E]" : "text-white",
                          )}
                        >
                          {heroPnl >= 0 ? "+" : "−"}${Math.abs(heroPnl).toLocaleString("en-US")}
                        </span>
                        <div className="mt-0.5 flex items-center justify-center">
                          <span
                            className={cn(
                              "text-[11px] sm:text-[12px] font-mono font-medium tabular-nums px-2.5 py-0.5 rounded-full border shadow-sm drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]",
                              pct < 0
                                ? "bg-rose-950/70 text-rose-300 border-rose-500/30"
                                : "bg-emerald-950/70 text-emerald-300 border-emerald-500/30",
                            )}
                          >
                            {underlying === "BTC" &&
                            targetPrice === 78660 &&
                            callPut === "call" &&
                            selectedStrike === 68000
                              ? "+589.7%"
                              : `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`}
                          </span>
                        </div>
                      </div>
                    </ExpectedReturnOrb>
                  </div>
                </div>

                {/* Right Card: "3D Surface" */}
                <div className="bg-[#17181B] border border-white/[0.06] rounded-[28px] p-3.5 sm:p-4 flex flex-col justify-between relative overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[16px] font-medium text-white tracking-normal">
                      3D Surface
                    </h2>
                    <span className="text-[11px] font-mono text-[#8A8A96]">30 FPS Active</span>
                  </div>

                  {/* Real animated 3D volatility wave mesh surface with 30fps throttle and IntersectionObserver pause/resume */}
                  <div className="flex-1 flex items-center justify-center my-auto w-full h-[145px] min-h-0">
                    <OptionsSurface3D
                      targetPrice={targetPrice}
                      spot={spot}
                      days={days}
                      isUp={isUp}
                    />
                  </div>

                  {/* Bottom-left caption */}
                  <span className="text-[12px] text-[#9A9CA3] font-normal">
                    Price × Time · Modeled payoff
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* =====================================================================
              PRO MODE: Middle section replaced with Options Chain Table
              ===================================================================== */
            <div className="flex flex-col w-full h-full min-h-[640px] bg-[#17181B] border border-white/[0.06] rounded-[28px] overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
              <OptionsChainTable
                underlying={underlying}
                spot={spot}
                chain={chain}
                selectedStrike={selectedStrike}
                selectedType={callPut}
                selectedSide="buy"
                onSelect={(row, nextType) => {
                  setSelectedStrike(row.strike);
                  setCallPut(nextType === "call" ? "call" : "put");
                }}
                days={days}
                onDaysChange={(d) => {
                  onDaysChange(d);
                  const matchedIdx = EXPIRY_PRESETS.findIndex((p) => p.days === d);
                  if (matchedIdx !== -1) setSelectedExpiryIndex(matchedIdx);
                }}
                className="rounded-[28px] border-0 bg-transparent"
              />
            </div>
          )}

          {/* =====================================================================
            COLUMN 3 (RIGHT): "Trade options" panel (360px wide rail, standard ticket)
            ===================================================================== */}
          <div className="bg-[#14161B] border border-white/[0.08] rounded-[24px] p-6 flex flex-col justify-between h-full min-h-[640px] relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
            {/* Subtle sapphire ambient gradient glow in the ticket backdrop */}
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.14),transparent_70%)] pointer-events-none" />

            <div className="flex-1 flex flex-col justify-between relative z-10 gap-4">
              {/* Title & Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06] shrink-0">
                <h2 className="text-[16px] font-semibold text-white tracking-tight leading-tight">
                  Trade {underlying} options
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setMode((m) => (m === "overview" ? "pro" : "overview"));
                    toast.info(
                      mode === "overview"
                        ? "Pro Mode: Select strike from Options Chain"
                        : "Overview Mode active",
                    );
                  }}
                  className="h-8 px-3 rounded-full bg-[#1E1E22] hover:bg-[#26262B] border border-white/[0.08] text-white/70 hover:text-white text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Toggle Options Chain Pro table"
                >
                  <span>{mode === "overview" ? "Pro table" : "Overview"}</span>
                  <Pencil className="size-3 text-white/40" />
                </button>
              </div>

              {/* 2x1 Segmented pair: Buy Call / Buy Put */}
              <div className="grid grid-cols-2 gap-1.5 mb-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCallPut("call");
                    if (targetPrice < spot) {
                      setTargetPrice(Math.round(spot * 1.15));
                    }
                  }}
                  className={cn(
                    "h-[34px] rounded-[10px] text-[12.5px] font-semibold border transition-all cursor-pointer flex items-center justify-center",
                    callPut === "call"
                      ? "bg-[#B6F5B0]/15 text-[#B6F5B0] border-[#B6F5B0]/30 shadow-xs"
                      : "bg-[#14161B] text-white/50 border-white/[0.08] hover:text-white hover:bg-[#1A1D24]",
                  )}
                >
                  Buy Call
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCallPut("put");
                    if (targetPrice > spot) {
                      setTargetPrice(Math.round(spot * 0.88));
                    }
                  }}
                  className={cn(
                    "h-[34px] rounded-[10px] text-[12.5px] font-semibold border transition-all cursor-pointer flex items-center justify-center",
                    callPut === "put"
                      ? "bg-[#FF5A5F]/15 text-[#FF5A5F] border-[#FF5A5F]/30 shadow-xs"
                      : "bg-[#14161B] text-white/50 border-white/[0.08] hover:text-white hover:bg-[#1A1D24]",
                  )}
                >
                  Buy Put
                </button>
              </div>

              {/* 2x1 Pair: Market / Limit */}
              <div className="grid grid-cols-2 gap-1.5 mb-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setOrderType("market")}
                  className={cn(
                    "h-[30px] rounded-[8px] text-[11.5px] font-medium border transition-all cursor-pointer flex items-center justify-center",
                    orderType === "market"
                      ? "bg-[#1E2028] text-white border-white/20 shadow-xs"
                      : "bg-[#14161B] text-white/40 border-white/[0.06] hover:text-white hover:bg-[#1A1D24]",
                  )}
                >
                  Market
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType("limit")}
                  className={cn(
                    "h-[30px] rounded-[8px] text-[11.5px] font-medium border transition-all cursor-pointer flex items-center justify-center",
                    orderType === "limit"
                      ? "bg-[#1E2028] text-white border-white/20 shadow-xs"
                      : "bg-[#14161B] text-white/40 border-white/[0.06] hover:text-white hover:bg-[#1A1D24]",
                  )}
                >
                  Limit
                </button>
              </div>

              {/* Position size ($100–$50,000) slider & presets */}
              <div className="space-y-1 mb-2.5 shrink-0">
                <div className="flex items-center justify-between text-[11px] text-white/50 font-mono">
                  <label>Position size ($100–$50,000)</label>
                  <span className="text-white font-semibold tabular-nums">
                    ${amount.toLocaleString("en-US")}
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="50000"
                  step="100"
                  value={Math.min(amount, 50000)}
                  onChange={(e) =>
                    setAmount(Math.min(50000, Math.max(100, Number(e.target.value))))
                  }
                  className="options-slider w-full cursor-pointer"
                />
                <div className="flex items-center gap-1 pt-0.5">
                  {[500, 1000, 2500, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className={cn(
                        "flex-1 h-5 rounded-[5px] text-[10px] font-mono border transition-all cursor-pointer",
                        amount === preset
                          ? "bg-white/10 text-white border-white/25 font-bold"
                          : "bg-[#14161B] text-white/40 border-white/[0.06] hover:text-white",
                      )}
                    >
                      ${preset >= 1000 ? `${preset / 1000}k` : preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target (BTC spot 68,400) slider & price tag */}
              <div className="space-y-1 mb-2.5 shrink-0">
                <div className="flex items-center justify-between text-[11px] text-white/50 font-mono">
                  <label>
                    Target ({underlying} spot ${spot.toLocaleString("en-US")})
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-mono font-semibold tabular-nums">
                      ${targetPrice.toLocaleString("en-US")}
                    </span>
                    <span
                      className={cn(
                        "font-semibold tabular-nums text-[10px] px-1 rounded-sm",
                        targetMove >= 0
                          ? "text-[#B6F5B0] bg-[#B6F5B0]/10"
                          : "text-[#FF5A5F] bg-[#FF5A5F]/10",
                      )}
                    >
                      {targetMove >= 0 ? "+" : ""}
                      {targetMove.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min={underlying === "BTC" ? 40000 : 1500}
                  max={underlying === "BTC" ? 120000 : 5000}
                  step={underlying === "BTC" ? 50 : 10}
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                  className="options-slider w-full cursor-pointer"
                />
              </div>

              {/* Expiry slider & preset chips */}
              <div className="space-y-1 mb-3 shrink-0">
                <div className="flex items-center justify-between text-[11px] text-white/50 font-mono">
                  <label>Expiry</label>
                  <span className="text-white font-semibold">{selectedPreset.label}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={selectedExpiryIndex}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    setSelectedExpiryIndex(idx);
                    const targetPreset = EXPIRY_PRESETS[idx];
                    if (targetPreset) onDaysChange(targetPreset.days);
                  }}
                  className="options-slider w-full cursor-pointer"
                />
                <div className="flex items-center gap-1 pt-0.5">
                  {EXPIRY_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedExpiryIndex(idx);
                        onDaysChange(preset.days);
                      }}
                      className={cn(
                        "flex-1 h-5 rounded-[5px] text-[9.5px] font-mono border transition-all cursor-pointer",
                        selectedExpiryIndex === idx
                          ? "bg-white/10 text-white border-white/25 font-bold"
                          : "bg-[#14161B] text-white/40 border-white/[0.06] hover:text-white",
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Primary Action Button & Order Info Underneath */}
            <div className="mt-2 shrink-0 relative z-10 space-y-2.5">
              {/* Full-width electric blue pill button "Review order" */}
              <button
                type="button"
                onClick={handleReviewOrder}
                className="w-full h-11 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[13.5px] shadow-[0_8px_24px_-8px_rgba(37,99,235,0.7)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Review order</span>
              </button>

              {/* Order Info & Risk Metrics UNDER the Action Button (Perps style) */}
              <div className="pt-2 border-t border-white/[0.06] space-y-1 font-mono text-[11px]">
                <div className="flex justify-between items-center text-white/70">
                  <span className="text-white/40">Contract</span>
                  <span className="text-white font-medium">
                    {underlying} {callPut === "call" ? "Call" : "Put"} · Strike $
                    {selectedStrike.toLocaleString("en-US")} · {selectedPreset.days}D
                  </span>
                </div>
                <div className="flex justify-between items-center text-white/70">
                  <span className="text-white/40">Max risk</span>
                  <span className="text-white font-medium">${amount.toLocaleString("en-US")}</span>
                </div>
                <div className="flex justify-between items-center text-white/70">
                  <span className="text-white/40">Modeled payout</span>
                  <span className="text-[#B6F5B0] font-medium">
                    {heroPnl >= 0 ? "+" : ""}${heroPnl.toLocaleString("en-US")} (
                    {pct >= 0 ? "+" : ""}
                    {pct.toFixed(1)}% ROI)
                  </span>
                </div>
                <div className="pt-0.5 flex flex-col text-[10px] text-white/35 text-center leading-tight">
                  <span>Illustrative · not a live quote</span>
                  <span>Preview only. Returns are estimates, not guarantees.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
          2.4 "POSITIONS (3)" PANEL
          Full width, radius 28px, padding 32px, bg #17181B, border
          ========================================================================= */}
        <div
          ref={optionsLedgerRef}
          className="w-full bg-[#17181B] border border-white/[0.06] rounded-[28px] p-8 mt-2"
        >
          {/* Header row */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setPositionsTab("positions")}
                className={cn(
                  "text-[18px] font-medium transition-colors cursor-pointer",
                  positionsTab === "positions" ? "text-white" : "text-[#9A9CA3] hover:text-white",
                )}
              >
                Positions (3)
              </button>
              <button
                type="button"
                onClick={() => setPositionsTab("orders")}
                className={cn(
                  "text-[16px] font-normal transition-colors cursor-pointer",
                  positionsTab === "orders" ? "text-white" : "text-[#9A9CA3] hover:text-white",
                )}
              >
                Open orders (2)
              </button>
            </div>
            <span className="text-[16px] text-white tabular-nums font-normal">
              {"Total P&L  +$4,350"}
            </span>
          </div>

          {/* Table: 7 columns, 1px horizontal separators, row height ~84px */}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[14px] text-[#9A9CA3] font-normal border-b border-white/[0.08]">
                  <th className="py-4 font-normal">Contract</th>
                  <th className="py-4 font-normal">Type</th>
                  <th className="py-4 font-normal">Size</th>
                  <th className="py-4 font-normal">Entry</th>
                  <th className="py-4 font-normal">Mark</th>
                  <th className="py-4 font-normal">Unrealized P&L</th>
                  <th className="py-4 font-normal">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.08] text-[15px] text-white">
                {positionsTab === "positions" ? (
                  <>
                    <tr className="h-[84px] hover:bg-white/[0.02] transition-colors">
                      <td className="font-medium">BTC $82,000 · Nov 17</td>
                      <td>Long call</td>
                      <td className="tabular-nums">2.5</td>
                      <td className="tabular-nums">$1,420</td>
                      <td className="tabular-nums">$2,840</td>
                      <td className="tabular-nums">+$3,550</td>
                      <td className="tabular-nums">$90,000</td>
                    </tr>
                    <tr className="h-[84px] hover:bg-white/[0.02] transition-colors">
                      <td className="font-medium">BTC $95,000 · Dec 17</td>
                      <td>Long call</td>
                      <td className="tabular-nums">1.0</td>
                      <td className="tabular-nums">$620</td>
                      <td className="tabular-nums">$1,850</td>
                      <td className="tabular-nums">+$1,230</td>
                      <td className="tabular-nums">$105,000</td>
                    </tr>
                    <tr className="h-[84px] hover:bg-white/[0.02] transition-colors">
                      <td className="font-medium">ETH $2,800 · Nov 17</td>
                      <td>Long put</td>
                      <td className="tabular-nums">1.5</td>
                      <td className="tabular-nums">$340</td>
                      <td className="tabular-nums">$285</td>
                      <td className="tabular-nums">−$430</td>
                      <td className="tabular-nums">$2,400</td>
                    </tr>
                  </>
                ) : (
                  <>
                    <tr className="h-[84px] hover:bg-white/[0.02] transition-colors">
                      <td className="font-medium">BTC $75,000 · 30D</td>
                      <td>Limit Buy</td>
                      <td className="tabular-nums">1.0</td>
                      <td className="tabular-nums">$1,150</td>
                      <td className="tabular-nums text-[#9A9CA3]">Unfilled</td>
                      <td className="tabular-nums text-[#9A9CA3]">—</td>
                      <td className="tabular-nums">$88,000</td>
                    </tr>
                    <tr className="h-[84px] hover:bg-white/[0.02] transition-colors">
                      <td className="font-medium">ETH $2,600 · 14D</td>
                      <td>Limit Buy</td>
                      <td className="tabular-nums">2.0</td>
                      <td className="tabular-nums">$220</td>
                      <td className="tabular-nums text-[#9A9CA3]">Unfilled</td>
                      <td className="tabular-nums text-[#9A9CA3]">—</td>
                      <td className="tabular-nums">$2,300</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
          <div className="hidden">
            <OpenOrdersTable onOpenPnLCard={onOpenPnLCard} filterUnderlying={underlying} />
            <LiveFooterClock />
          </div>
        </div>
      </div>
    </div>
  );
}

function AdvancedCalculator({
  underlying,
  days,
  onDaysChange,
  onOpenPnLCard,
}: {
  underlying: Underlying;
  days: number;
  onDaysChange: (days: number) => void;
  onOpenPnLCard: (pos: PnLCardPosition) => void;
}) {
  const [type, setType] = useState<PositionType>("call");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [contracts, setContracts] = useState(1);
  const history = useHistory(underlying);
  const latestPrice = history?.at(-1)?.c;
  const spot = Math.round(latestPrice ?? SPOT[underlying]);

  const chain = useMemo(() => buildChain(underlying, days, spot), [underlying, days, spot]);
  const atm = chain.reduce((a, b) =>
    Math.abs(a.strike - spot) < Math.abs(b.strike - spot) ? a : b,
  );

  const [strike, setStrike] = useState(atm.strike);
  const [premium, setPremium] = useState(atm.ask);
  const [targetPrice, setTargetPrice] = useState(Math.round(spot * 1.1));
  const [delta, setDelta] = useState(atm.delta);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    const nextChain = buildChain(underlying, days, spot);
    const nextAtm = nextChain.reduce((a, b) =>
      Math.abs(a.strike - spot) < Math.abs(b.strike - spot) ? a : b,
    );
    setStrike(nextAtm.strike);
    setPremium(nextAtm.ask);
    setDelta(nextAtm.delta);
    setTargetPrice(Math.round(spot * 1.1));
  }, [underlying, days, spot]);

  const handleSelectContract = (
    row: ChainRow,
    nextType: PositionType,
    nextSide: "buy" | "sell",
  ) => {
    setStrike(row.strike);
    const prem =
      nextType === "call"
        ? nextSide === "buy"
          ? row.ask
          : row.bid
        : nextSide === "buy"
          ? row.putAsk
          : row.putBid;
    setPremium(prem);
    setType(nextType);
    setSide(nextSide);
    setDelta(nextType === "call" ? row.delta : Math.abs(row.putDelta));
  };

  const handleTypeChange = (nextType: PositionType) => {
    setType(nextType);
    const currentRow = chain.find((r) => r.strike === strike);
    if (currentRow) {
      const prem =
        nextType === "call"
          ? side === "buy"
            ? currentRow.ask
            : currentRow.bid
          : side === "buy"
            ? currentRow.putAsk
            : currentRow.putBid;
      setPremium(prem);
      setDelta(nextType === "call" ? currentRow.delta : Math.abs(currentRow.putDelta));
    }
  };

  const handleSideChange = (nextSide: "buy" | "sell") => {
    setSide(nextSide);
    const currentRow = chain.find((r) => r.strike === strike);
    if (currentRow) {
      const prem =
        type === "call"
          ? nextSide === "buy"
            ? currentRow.ask
            : currentRow.bid
          : nextSide === "buy"
            ? currentRow.putAsk
            : currentRow.putBid;
      setPremium(prem);
    }
  };

  const position: PositionInput = { type, strike, premium, contracts, spot };
  const rawPayout = expectedPayout(position, targetPrice, 0, days);
  const payout = side === "sell" ? -rawPayout : rawPayout;

  const expiryDateStr = new Date(Date.now() + days * 24 * 3600 * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="w-full h-full max-h-full min-h-0 flex flex-col lg:h-[calc(100vh-112px)] lg:overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-1 gap-3 h-full max-h-full w-full min-h-0 flex-1 overflow-hidden">
        {/* LEFT COLUMN: 8 of 12 */}
        <div className="lg:col-span-8 h-full max-h-full min-w-0 min-h-0 flex flex-col overflow-hidden">
          <OptionsChainTable
            underlying={underlying}
            spot={spot}
            chain={chain}
            selectedStrike={strike}
            selectedType={type}
            selectedSide={side}
            onSelect={handleSelectContract}
            onConfirm={() => setMobileDrawerOpen(true)}
            days={days}
            onDaysChange={onDaysChange}
          />
        </div>

        {/* RIGHT COLUMN: 4 of 12 */}
        <div className="hidden lg:block lg:col-span-4 h-full max-h-full min-w-0 min-h-0 flex flex-col overflow-hidden">
          <StickyTradePanel
            underlying={underlying}
            spot={spot}
            strike={strike}
            premium={premium}
            contracts={contracts}
            onContractsChange={setContracts}
            type={type}
            onTypeChange={handleTypeChange}
            side={side}
            onSideChange={handleSideChange}
            targetPrice={targetPrice}
            onTargetPriceChange={setTargetPrice}
            days={days}
            expiryDateStr={expiryDateStr}
            delta={delta}
            gamma={chain.find((r) => r.strike === strike)?.gamma}
            theta={chain.find((r) => r.strike === strike)?.theta}
            iv={chain.find((r) => r.strike === strike)?.iv}
            onOpenPnLCard={onOpenPnLCard}
          />
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 p-3 bg-[#0E0E10]/95 backdrop-blur-xl border-t border-white/[0.08] shadow-2xl flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-bold text-white truncate">
              {underlying} {formatUsd(strike, 0)} {type.toUpperCase()}
            </span>
            <span className="text-[12px] text-white/50">{expiryDateStr}</span>
          </div>
          <p className="text-[12px] tnum mt-0.5">
            Expected:{" "}
            <span
              className={payout >= 0 ? "text-white font-semibold" : "text-[#FF5A5F] font-semibold"}
            >
              {payout >= 0 ? "+" : "−"}
              {formatUsd(Math.abs(payout), 2)}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className={cn(
            "h-10 px-4 rounded-md text-black font-bold text-[13px] flex items-center gap-1.5 shrink-0 shadow-md active:scale-95 transition-all",
            type === "call" ? "bg-white shadow-[0_0_12px_rgba(255,255,255,0.3)]" : "bg-[#FF8A8D]",
          )}
        >
          <SlidersHorizontal className="size-3.5" />
          <span>
            {side === "buy" ? "Buy" : "Sell"} {type.toUpperCase()}
          </span>
        </button>
      </div>

      {/* Mobile Sheet Drawer */}
      <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <SheetContent
          side="bottom"
          className="p-0 max-h-[85vh] bg-[#0E0E10] border-t border-white/10 rounded-t-md overflow-y-auto"
        >
          <SheetHeader className="p-4 border-b border-white/[0.06] text-left">
            <SheetTitle className="text-white text-[16px]">Position Settings</SheetTitle>
          </SheetHeader>
          <div className="p-2 pb-8">
            <StickyTradePanel
              underlying={underlying}
              spot={spot}
              strike={strike}
              premium={premium}
              contracts={contracts}
              onContractsChange={setContracts}
              type={type}
              onTypeChange={handleTypeChange}
              side={side}
              onSideChange={handleSideChange}
              targetPrice={targetPrice}
              onTargetPriceChange={setTargetPrice}
              days={days}
              expiryDateStr={expiryDateStr}
              delta={delta}
              gamma={chain.find((r) => r.strike === strike)?.gamma}
              theta={chain.find((r) => r.strike === strike)?.theta}
              iv={chain.find((r) => r.strike === strike)?.iv}
              onOpenPnLCard={onOpenPnLCard}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
