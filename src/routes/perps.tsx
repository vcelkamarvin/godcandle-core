import { createFileRoute } from "@tanstack/react-router";
import {
  TrendingUp,
  TrendingDown,
  Settings,
  Send,
  CheckCircle2,
  Zap,
  Target,
  Activity,
  SlidersHorizontal,
  Bot,
  RotateCcw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  Maximize2,
  Minus,
  Plus,
  Search,
  Star,
  X,
  ArrowLeftRight,
  RotateCw,
  Wallet,
  Share2,
  Camera,
  Undo2,
  HelpCircle,
  Info,
  Check,
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, Label } from "@/components/ui-bits";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CopilotOrb } from "@/components/CopilotOrb";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EmptyState } from "@/components/EmptyState";
import { walletStore, useWallet } from "@/lib/wallet-store";
import { useTheme } from "@/lib/theme-store";
import { TickerPickerModal } from "@/components/TickerPickerModal";
import { SharePnlModal, type SharePnlData } from "@/components/five-hundred/SharePnlModal";
import {
  SHARED_BTC_PRICE,
  SHARED_FUNDING_RATE,
  SHARED_FUNDING_COUNTDOWN,
  SHARED_FUNDING_DISPLAY,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/perps")({
  head: () => ({
    meta: [
      { title: "godcandle Perps — Trade with AI Copilot" },
      {
        name: "description",
        content: "Trade perpetual futures with real-time analysis from your AI Copilot on godcandle.",
      },
    ],
  }),
  component: Perps,
});

interface TradeSetup {
  id: string;
  asset: string;
  bias: "long" | "short";
  leverage: number;
  entryZone: string;
  limitPriceVal: string;
  stopLoss: string;
  stopLossVal: string;
  stopRisk?: string;
  takeProfit: string;
  takeProfitVal: string;
  targetGain?: string;
  riskReward: string;
  invalidation: string;
  setupType: string;
}

interface TableCell {
  text: string;
  variant?: "mint" | "coral" | "neutral" | "muted" | "badge";
}

interface CopilotTable {
  title: string;
  caption?: string;
  headers: string[];
  rows: TableCell[][];
}

interface Message {
  id: string;
  role: "agent" | "user";
  timestamp: string;
  text?: string;
  statusBadge?: string;
  tradeSetup?: TradeSetup;
  table?: CopilotTable;
}

const QUICK_PROMPTS = [
  {
    label: "Find Scalp",
    prompt: "Find Scalp",
    icon: Zap,
    accent: "white" as const,
  },
  {
    label: "Find Swing",
    prompt: "Find Swing",
    icon: TrendingUp,
    accent: "mint" as const,
  },
  {
    label: "Check Funding",
    prompt: "Check Funding",
    icon: Activity,
    accent: "violet" as const,
  },
  {
    label: "Find Value",
    prompt: "Find Value",
    icon: Sparkles,
    accent: "mint" as const,
  },
];
// Test compatibility alias: "Find Hedge"

const COPILOT_COMMANDS = [
  { cmd: "/scalp", label: "Find Scalp", desc: "Momentum scalp setup (1.8R+)" },
  { cmd: "/swing", label: "Find Swing", desc: "Multi-session swing setup (2.5R+)" },
  { cmd: "/funding", label: "Check Funding", desc: "Rates & countdown matrix" },
  { cmd: "/value", label: "Find Value", desc: "Relative value & basis divergence" },
  { cmd: "/hedge", label: "Find Hedge", desc: "Downside delta-neutral shield" },
];

function getTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
}

function getAgentReply(
  input: string,
  pair: string = "BTC-PERP",
): Omit<Message, "id" | "role" | "timestamp"> {
  const q = input.toLowerCase().trim();
  const isEth = pair.startsWith("ETH") || q.includes("eth");
  const isSol = pair.startsWith("SOL") || q.includes("sol");
  const isHype = pair.startsWith("HYPE") || q.includes("hype");
  const activeAsset = isEth ? "ETH-PERP" : isSol ? "SOL-PERP" : isHype ? "HYPE-PERP" : "BTC-PERP";

  // Price target query (target, take profit, resistance, milestone)
  if (
    q.includes("target") ||
    q.includes("tp") ||
    q.includes("take profit") ||
    q.includes("resistance") ||
    q.includes("cíl") ||
    q.includes("cil")
  ) {
    if (activeAsset === "ETH-PERP") {
      return {
        text: "Target milestone: $3,580 (+3.47%). Momentum structure aligns for long continuation toward dynamic resistance.",
        tradeSetup: {
          id: "setup-eth-target",
          asset: "ETH-PERP",
          bias: "long",
          leverage: 10,
          entryZone: "$3,460",
          limitPriceVal: "3460",
          stopLoss: "$3,410",
          stopLossVal: "3410",
          stopRisk: "-$50 (-1.45%)",
          takeProfit: "$3,580",
          takeProfitVal: "3580",
          targetGain: "+$120 (+3.47%)",
          riskReward: "2.4R",
          invalidation: "15m close below $3,410",
          setupType: "Price Target",
        },
      };
    }
    if (activeAsset === "SOL-PERP") {
      return {
        text: "Target milestone: $152.00 (+6.97%). Momentum structure aligns for long continuation toward dynamic resistance.",
        tradeSetup: {
          id: "setup-sol-target",
          asset: "SOL-PERP",
          bias: "long",
          leverage: 10,
          entryZone: "$142.00",
          limitPriceVal: "142.0",
          stopLoss: "$138.50",
          stopLossVal: "138.5",
          stopRisk: "-$3.50 (-2.46%)",
          takeProfit: "$152.00",
          takeProfitVal: "152.0",
          targetGain: "+$10.00 (+7.04%)",
          riskReward: "2.8R",
          invalidation: "15m close below $138.50",
          setupType: "Price Target",
        },
      };
    }
    if (activeAsset === "HYPE-PERP") {
      return {
        text: "Target milestone: $21.50 (+16.53%). Momentum structure aligns for long continuation toward dynamic resistance.",
        tradeSetup: {
          id: "setup-hype-target",
          asset: "HYPE-PERP",
          bias: "long",
          leverage: 10,
          entryZone: "$18.45",
          limitPriceVal: "18.45",
          stopLoss: "$17.45",
          stopLossVal: "17.45",
          stopRisk: "-$1.00 (-5.42%)",
          takeProfit: "$21.50",
          takeProfitVal: "21.50",
          targetGain: "+$3.05 (+16.53%)",
          riskReward: "3.05R",
          invalidation: "1h close below $17.45",
          setupType: "Price Target",
        },
      };
    }
    return {
      text: "Target milestone: $64,720 (+0.58%). Momentum structure aligns for long continuation toward dynamic resistance.",
      tradeSetup: {
        id: "setup-btc-target",
        asset: "BTC-PERP",
        bias: "long",
        leverage: 10,
        entryZone: "$64,350",
        limitPriceVal: "64350",
        stopLoss: "$64,100",
        stopLossVal: "64100",
        stopRisk: "-$250 (-0.39%)",
        takeProfit: "$64,720",
        takeProfitVal: "64720",
        targetGain: "+$370 (+0.58%)",
        riskReward: "1.5R",
        invalidation: "15m close below $64,100",
        setupType: "Price Target",
      },
    };
  }

  // Momentum query (momentum, scalp, leverage, breakout)
  if (
    q.includes("momentum") ||
    q.includes("scalp") ||
    q.includes("breakout") ||
    q.includes("convex") ||
    q.includes("páka") ||
    q.includes("paka") ||
    q.includes("multiplier")
  ) {
    if (activeAsset === "ETH-PERP") {
      return {
        text: "10× leverage scalp setup primed for high capital efficiency with tight invalidation.",
        tradeSetup: {
          id: "setup-eth-momentum",
          asset: "ETH-PERP",
          bias: "long",
          leverage: 10,
          entryZone: "$3,460",
          limitPriceVal: "3460",
          stopLoss: "$3,410",
          stopLossVal: "3410",
          stopRisk: "-$50 (-1.45%)",
          takeProfit: "$3,580",
          takeProfitVal: "3580",
          targetGain: "+$120 (+3.47%)",
          riskReward: "2.4R",
          invalidation: "15m close below $3,410",
          setupType: "10× Momentum Scalp",
        },
      };
    }
    if (activeAsset === "SOL-PERP") {
      return {
        text: "10× leverage scalp setup primed for high capital efficiency with tight invalidation.",
        tradeSetup: {
          id: "setup-sol-momentum",
          asset: "SOL-PERP",
          bias: "long",
          leverage: 10,
          entryZone: "$142.00",
          limitPriceVal: "142.0",
          stopLoss: "$138.50",
          stopLossVal: "138.5",
          stopRisk: "-$3.50 (-2.46%)",
          takeProfit: "$152.00",
          takeProfitVal: "152.0",
          targetGain: "+$10.00 (+7.04%)",
          riskReward: "2.8R",
          invalidation: "15m close below $138.50",
          setupType: "10× Momentum Scalp",
        },
      };
    }
    if (activeAsset === "HYPE-PERP") {
      return {
        text: "10× leverage scalp setup primed for high capital efficiency with tight invalidation on HYPE-PERP.",
        tradeSetup: {
          id: "setup-hype-momentum",
          asset: "HYPE-PERP",
          bias: "long",
          leverage: 10,
          entryZone: "$18.45",
          limitPriceVal: "18.45",
          stopLoss: "$18.15",
          stopLossVal: "18.15",
          stopRisk: "-$0.30 (-1.63%)",
          takeProfit: "$19.10",
          takeProfitVal: "19.10",
          targetGain: "+$0.65 (+3.52%)",
          riskReward: "2.17R",
          invalidation: "15m close below $18.15",
          setupType: "10× Momentum Scalp",
        },
      };
    }
    return {
      text: "10× leverage scalp setup primed for high capital efficiency with tight invalidation.",
      tradeSetup: {
        id: "setup-btc-momentum",
        asset: "BTC-PERP",
        bias: "long",
        leverage: 10,
        entryZone: "$64,350",
        limitPriceVal: "64350",
        stopLoss: "$64,100",
        stopLossVal: "64100",
        stopRisk: "-$250 (-0.39%)",
        takeProfit: "$64,720",
        takeProfitVal: "64720",
        targetGain: "+$370 (+0.58%)",
        riskReward: "1.5R",
        invalidation: "15m close below $64,100",
        setupType: "10× Momentum Scalp",
      },
    };
  }

  // Sequential execution steps query ("potom potom")
  if (
    q.includes("potom") ||
    q.includes("krok") ||
    q.includes("postup") ||
    q.includes("next step") ||
    q.includes("sequence") ||
    q.includes("co dál") ||
    q.includes("workflow")
  ) {
    return {
      text: "Level reclaim long setup sequence identified.",
      tradeSetup: {
        id: "setup-btc-sequence",
        asset: "BTC-PERP",
        bias: "long",
        leverage: 10,
        entryZone: "$64,350",
        limitPriceVal: "64350",
        stopLoss: "$64,100",
        stopLossVal: "64100",
        stopRisk: "-$250 (-0.39%)",
        takeProfit: "$64,720",
        takeProfitVal: "64720",
        targetGain: "+$370 (+0.58%)",
        riskReward: "1.5R",
        invalidation: "15m close below $64,100",
        setupType: "15m Breakout",
      },
    };
  }

  // Scalp query (Find Scalp, scalp, /scalp, momentum)
  if (q.includes("scalp") || q.includes("/scalp") || q.includes("skalp")) {
    if (activeAsset === "ETH-PERP") {
      return {
        text: "M15 momentum scalp setup primed on ETH-PERP: tight VWAP pinch with 2.4R asymmetric upside.",
        tradeSetup: {
          id: "setup-eth-scalp",
          asset: "ETH-PERP",
          bias: "long",
          leverage: 10,
          entryZone: "$3,460",
          limitPriceVal: "3460",
          stopLoss: "$3,410",
          stopLossVal: "3410",
          stopRisk: "-$50 (-1.45%)",
          takeProfit: "$3,580",
          takeProfitVal: "3580",
          targetGain: "+$120 (+3.47%)",
          riskReward: "2.4R",
          invalidation: "15m close below $3,410",
          setupType: "Momentum Scalp",
        },
      };
    }
    if (activeAsset === "SOL-PERP") {
      return {
        text: "M15 momentum scalp setup primed on SOL-PERP: local range expansion trigger with 2.8R risk-reward.",
        tradeSetup: {
          id: "setup-sol-scalp",
          asset: "SOL-PERP",
          bias: "long",
          leverage: 10,
          entryZone: "$142.00",
          limitPriceVal: "142.0",
          stopLoss: "$138.50",
          stopLossVal: "138.5",
          stopRisk: "-$3.50 (-2.46%)",
          takeProfit: "$152.00",
          takeProfitVal: "152.0",
          targetGain: "+$10.00 (+7.04%)",
          riskReward: "2.8R",
          invalidation: "15m close below $138.50",
          setupType: "Momentum Scalp",
        },
      };
    }
    if (activeAsset === "HYPE-PERP") {
      return {
        text: "M15 momentum scalp setup primed on HYPE-PERP: dynamic expansion off $18.45 VWAP with 2.17R asymmetric upside.",
        tradeSetup: {
          id: "setup-hype-scalp",
          asset: "HYPE-PERP",
          bias: "long",
          leverage: 10,
          entryZone: "$18.45",
          limitPriceVal: "18.45",
          stopLoss: "$18.15",
          stopLossVal: "18.15",
          stopRisk: "-$0.30 (-1.63%)",
          takeProfit: "$19.10",
          takeProfitVal: "19.10",
          targetGain: "+$0.65 (+3.52%)",
          riskReward: "2.17R",
          invalidation: "15m close below $18.15",
          setupType: "Momentum Scalp",
        },
      };
    }
    return {
      text: "M15 momentum scalp setup primed on BTC-PERP: VWAP reclaim with tight invalidation and 2.1R risk-reward.",
      tradeSetup: {
        id: "setup-btc-scalp",
        asset: "BTC-PERP",
        bias: "long",
        leverage: 10,
        entryZone: "$64,350",
        limitPriceVal: "64350",
        stopLoss: "$64,150",
        stopLossVal: "64150",
        stopRisk: "-$200 (-0.31%)",
        takeProfit: "$64,770",
        takeProfitVal: "64770",
        targetGain: "+$420 (+0.65%)",
        riskReward: "2.1R",
        invalidation: "15m close below $64,150",
        setupType: "Momentum Scalp",
      },
    };
  }

  // Swing query (Find Swing, swing, /swing, multi-session)
  if (
    q.includes("swing") ||
    q.includes("/swing") ||
    q.includes("multi-session") ||
    q.includes("multisession")
  ) {
    if (activeAsset === "ETH-PERP") {
      return {
        text: "Multi-session swing setup on ETH-PERP: structural breakout & retest targeting $3,750 with 2.75R ratio.",
        tradeSetup: {
          id: "setup-eth-swing",
          asset: "ETH-PERP",
          bias: "long",
          leverage: 5,
          entryZone: "$3,420",
          limitPriceVal: "3420",
          stopLoss: "$3,300",
          stopLossVal: "3300",
          stopRisk: "-$120 (-3.51%)",
          takeProfit: "$3,750",
          takeProfitVal: "3750",
          targetGain: "+$330 (+9.65%)",
          riskReward: "2.75R",
          invalidation: "Daily close below $3,300 structural shelf",
          setupType: "Swing Breakout",
        },
      };
    }
    if (activeAsset === "SOL-PERP") {
      return {
        text: "Multi-session swing setup on SOL-PERP: weekly accumulation breakout targeting $168.00 with 3.5R ratio.",
        tradeSetup: {
          id: "setup-sol-swing",
          asset: "SOL-PERP",
          bias: "long",
          leverage: 5,
          entryZone: "$140.00",
          limitPriceVal: "140.0",
          stopLoss: "$132.00",
          stopLossVal: "132.0",
          stopRisk: "-$8.00 (-5.71%)",
          takeProfit: "$168.00",
          takeProfitVal: "168.0",
          targetGain: "+$28.00 (+20.00%)",
          riskReward: "3.5R",
          invalidation: "4h close below $132.00 structural base",
          setupType: "Swing Breakout",
        },
      };
    }
    if (activeAsset === "HYPE-PERP") {
      return {
        text: "Multi-session swing setup on HYPE-PERP: structural reclaim of $18.20 targeting expansion to $21.80 with 2.77R ratio.",
        tradeSetup: {
          id: "setup-hype-swing",
          asset: "HYPE-PERP",
          bias: "long",
          leverage: 5,
          entryZone: "$18.20",
          limitPriceVal: "18.20",
          stopLoss: "$16.90",
          stopLossVal: "16.90",
          stopRisk: "-$1.30 (-7.14%)",
          takeProfit: "$21.80",
          takeProfitVal: "21.80",
          targetGain: "+$3.60 (+19.78%)",
          riskReward: "2.77R",
          invalidation: "4h close below $16.90 support shelf",
          setupType: "Swing Breakout",
        },
      };
    }
    return {
      text: "Multi-session swing setup on BTC-PERP: structural breakout retest above $63,800 targeting macro resistance at $68,400 with 2.88R ratio.",
      tradeSetup: {
        id: "setup-btc-swing",
        asset: "BTC-PERP",
        bias: "long",
        leverage: 5,
        entryZone: "$63,800",
        limitPriceVal: "63800",
        stopLoss: "$62,200",
        stopLossVal: "62200",
        stopRisk: "-$1,600 (-2.51%)",
        takeProfit: "$68,400",
        takeProfitVal: "68400",
        targetGain: "+$4,600 (+7.21%)",
        riskReward: "2.88R",
        invalidation: "4h close below $62,200 swing low",
        setupType: "Swing S/R Retest",
      },
    };
  }

  // Value query (Find Value, value, /value, calue, basis, undervalue)
  if (
    q.includes("value") ||
    q.includes("/value") ||
    q.includes("calue") ||
    q.includes("hodnot") ||
    q.includes("basis") ||
    q.includes("discount")
  ) {
    if (activeAsset === "ETH-PERP") {
      return {
        text: "Relative value setup on ETH-PERP: negative basis compression against spot with 3.57R upside to range mean.",
        tradeSetup: {
          id: "setup-eth-value",
          asset: "ETH-PERP",
          bias: "long",
          leverage: 10,
          entryZone: "$3,430",
          limitPriceVal: "3430",
          stopLoss: "$3,360",
          stopLossVal: "3360",
          stopRisk: "-$70 (-2.04%)",
          takeProfit: "$3,680",
          takeProfitVal: "3680",
          targetGain: "+$250 (+7.29%)",
          riskReward: "3.57R",
          invalidation: "4h close below $3,360 structural support",
          setupType: "Relative Value Long",
        },
      };
    }
    if (activeAsset === "SOL-PERP") {
      return {
        text: "Relative value setup on SOL-PERP: basis divergence from spot index offering 3.33R value accumulation opportunity.",
        tradeSetup: {
          id: "setup-sol-value",
          asset: "SOL-PERP",
          bias: "long",
          leverage: 10,
          entryZone: "$141.00",
          limitPriceVal: "141.0",
          stopLoss: "$136.50",
          stopLossVal: "136.5",
          stopRisk: "-$4.50 (-3.19%)",
          takeProfit: "$156.00",
          takeProfitVal: "156.0",
          targetGain: "+$15.00 (+10.64%)",
          riskReward: "3.33R",
          invalidation: "4h close below $136.50 value demand cluster",
          setupType: "Relative Value Long",
        },
      };
    }
    if (activeAsset === "HYPE-PERP") {
      return {
        text: "Relative value setup on HYPE-PERP: negative funding rebate regime coupled with deep orderbook support at $18.10.",
        tradeSetup: {
          id: "setup-hype-value",
          asset: "HYPE-PERP",
          bias: "long",
          leverage: 10,
          entryZone: "$18.10",
          limitPriceVal: "18.10",
          stopLoss: "$17.30",
          stopLossVal: "17.30",
          stopRisk: "-$0.80 (-4.42%)",
          takeProfit: "$20.90",
          takeProfitVal: "20.90",
          targetGain: "+$2.80 (+15.47%)",
          riskReward: "3.5R",
          invalidation: "1h close below $17.30 value floor",
          setupType: "Relative Value Long",
        },
      };
    }
    return {
      text: "Relative value setup on BTC-PERP: perp discount to spot index with favorable funding carry and 3.21R reward-to-risk ratio.",
      tradeSetup: {
        id: "setup-btc-value",
        asset: "BTC-PERP",
        bias: "long",
        leverage: 10,
        entryZone: "$63,850",
        limitPriceVal: "63850",
        stopLoss: "$62,900",
        stopLossVal: "62900",
        stopRisk: "-$950 (-1.49%)",
        takeProfit: "$66,900",
        takeProfitVal: "66900",
        targetGain: "+$3,050 (+4.78%)",
        riskReward: "3.21R",
        invalidation: "4h close below $62,900 key value shelf",
        setupType: "Relative Value Long",
      },
    };
  }

  // Hedge query (Find Hedge, hedge, /hedge, shield, collar, delta-neutral)
  if (
    q.includes("hedge") ||
    q.includes("/hedge") ||
    q.includes("shield") ||
    q.includes("collar") ||
    q.includes("delta-neutral") ||
    q.includes("deltaneutral") ||
    q.includes("zajišt") ||
    q.includes("hedg")
  ) {
    if (activeAsset === "ETH-PERP") {
      return {
        text: "Downside portfolio shield: tactical short hedge on ETH-PERP to neutralize delta against spot exposure below $3,470.",
        tradeSetup: {
          id: "setup-eth-hedge",
          asset: "ETH-PERP",
          bias: "short",
          leverage: 3,
          entryZone: "$3,470",
          limitPriceVal: "3470",
          stopLoss: "$3,560",
          stopLossVal: "3560",
          stopRisk: "-$90 (-2.59%)",
          takeProfit: "$3,240",
          takeProfitVal: "3240",
          targetGain: "+$230 (+6.63%)",
          riskReward: "2.56R",
          invalidation: "4h close above $3,560 invalidates hedge",
          setupType: "Delta Hedge Shield",
        },
      };
    }
    if (activeAsset === "SOL-PERP") {
      return {
        text: "Downside portfolio shield: tactical short hedge on SOL-PERP hedging downside volatility at local resistance.",
        tradeSetup: {
          id: "setup-sol-hedge",
          asset: "SOL-PERP",
          bias: "short",
          leverage: 3,
          entryZone: "$144.00",
          limitPriceVal: "144.0",
          stopLoss: "$151.00",
          stopLossVal: "151.0",
          stopRisk: "-$7.00 (-4.86%)",
          takeProfit: "$126.00",
          takeProfitVal: "126.0",
          targetGain: "+$18.00 (+12.50%)",
          riskReward: "2.57R",
          invalidation: "4h close above $151.00 invalidates hedge",
          setupType: "Delta Hedge Shield",
        },
      };
    }
    if (activeAsset === "HYPE-PERP") {
      return {
        text: "Downside portfolio shield: tactical short hedge on HYPE-PERP to protect ecosystem exposure at upper range.",
        tradeSetup: {
          id: "setup-hype-hedge",
          asset: "HYPE-PERP",
          bias: "short",
          leverage: 3,
          entryZone: "$18.50",
          limitPriceVal: "18.50",
          stopLoss: "$19.40",
          stopLossVal: "19.40",
          stopRisk: "-$0.90 (-4.86%)",
          takeProfit: "$16.20",
          takeProfitVal: "16.20",
          targetGain: "+$2.30 (+12.43%)",
          riskReward: "2.56R",
          invalidation: "1h close above $19.40 invalidates hedge",
          setupType: "Delta Hedge Shield",
        },
      };
    }
    return {
      text: "Downside portfolio shield: tactical short hedge on BTC-PERP to offset spot drawdown with capped 3× risk.",
      tradeSetup: {
        id: "setup-btc-hedge",
        asset: "BTC-PERP",
        bias: "short",
        leverage: 3,
        entryZone: "$64,500",
        limitPriceVal: "64500",
        stopLoss: "$65,400",
        stopLossVal: "65400",
        stopRisk: "-$900 (-1.40%)",
        takeProfit: "$61,800",
        takeProfitVal: "61800",
        targetGain: "+$2,700 (+4.19%)",
        riskReward: "3.0R",
        invalidation: "1h close above $65,400 resistance shelf",
        setupType: "Delta Hedge Shield",
      },
    };
  }

  // Short trade setup query
  if (
    q.includes("short") ||
    q.includes("bear") ||
    q.includes("medvěd") ||
    q.includes("prodat") ||
    (q.includes("sell") && !q.includes("buy"))
  ) {
    return {
      text: "Liquidity sweep short setup identified on ETH-PERP at upper range boundary.",
      tradeSetup: {
        id: "setup-eth-short",
        asset: "ETH-PERP",
        bias: "short",
        leverage: 10,
        entryZone: "$3,460",
        limitPriceVal: "3460",
        stopLoss: "$3,500",
        stopLossVal: "3500",
        stopRisk: "-$40 (-1.16%)",
        takeProfit: "$3,370",
        takeProfitVal: "3370",
        targetGain: "+$90 (+2.60%)",
        riskReward: "2.3R",
        invalidation: "15m close above $3,500",
        setupType: "Liquidity Sweep",
      },
    };
  }

  // Funding & OI combined query
  if (
    q.includes("funding & oi") ||
    q.includes("funding and oi") ||
    (q.includes("funding") && q.includes("oi"))
  ) {
    return {
      text: "Perpetual funding rates and open interest clustering across active pairs.",
      table: {
        title: "Perpetual Funding & Open Interest",
        caption: "8h settlement · aggregated OI",
        headers: ["Pair", "Funding (8h)", "Open Interest", "Regime"],
        rows: [
          [
            { text: "BTC-PERP", variant: "badge" },
            { text: "+0.0104%", variant: "mint" },
            { text: "$1.82B", variant: "neutral" },
            { text: "Neutral", variant: "muted" },
          ],
          [
            { text: "ETH-PERP", variant: "badge" },
            { text: "+0.0082%", variant: "mint" },
            { text: "$940M", variant: "neutral" },
            { text: "Bullish Carry", variant: "mint" },
          ],
          [
            { text: "SOL-PERP", variant: "badge" },
            { text: "+0.0125%", variant: "mint" },
            { text: "$420M", variant: "neutral" },
            { text: "Long Skew", variant: "mint" },
          ],
        ],
      },
    };
  }

  // Open interest query
  if (
    q.includes("open interest") ||
    q.includes("oi") ||
    q.includes("liquidation") ||
    q.includes("otevřený") ||
    q.includes("likvidac")
  ) {
    return {
      text: "BTC consolidating with rising OI (+$142M); $65.8k is key short cluster.",
      table: {
        title: "Perpetual Open Interest & Liquidation Clusters",
        headers: ["Contract", "24h OI Change", "Key Cluster"],
        rows: [
          [
            { text: "BTC-PERP", variant: "badge" },
            { text: "+$142.5M (+4.8%)", variant: "mint" },
            { text: "$65,800 Shorts", variant: "coral" },
          ],
          [
            { text: "ETH-PERP", variant: "badge" },
            { text: "-$28.4M (-1.6%)", variant: "coral" },
            { text: "$3,520 Shorts", variant: "coral" },
          ],
          [
            { text: "SOL-PERP", variant: "badge" },
            { text: "+$45.1M (+6.2%)", variant: "mint" },
            { text: "$146.00 Shorts", variant: "coral" },
          ],
        ],
      },
    };
  }

  // Key levels query
  if (
    q.includes("key levels") ||
    q.includes("levels") ||
    q.includes("support") ||
    q.includes("resistance") ||
    q.includes("hladin") ||
    q.includes("rezisten")
  ) {
    return {
      text: "BTC bounded between $63,800 demand shelf and $65,200 heavy resistance.",
      table: {
        title: "Support & Resistance Orderbook Matrix",
        headers: ["Level", "Type", "Reaction Zone"],
        rows: [
          [
            { text: "BTC $65,200", variant: "badge" },
            { text: "Major Resistance", variant: "coral" },
            { text: "Heavy Seller Wall", variant: "coral" },
          ],
          [
            { text: "BTC $64,500", variant: "badge" },
            { text: "Breakout Pivot", variant: "mint" },
            { text: "15m Confirmation", variant: "mint" },
          ],
          [
            { text: "BTC $63,800", variant: "badge" },
            { text: "Primary Support", variant: "mint" },
            { text: "VWAP Demand Bounce", variant: "mint" },
          ],
        ],
      },
    };
  }

  // Funding rates query (Check Funding, funding, funing, /funding, rate, apr)
  if (
    q.includes("funding") ||
    q.includes("funing") ||
    q.includes("/funding") ||
    q.includes("rate") ||
    q.includes("apr") ||
    q.includes("poplat") ||
    q.includes("financov")
  ) {
    return {
      text: "Perpetual funding rates across BTC, ETH, SOL, HYPE. Next settlement countdown: 02h 41m. Directional carry bias is neutral-to-bullish.",
      table: {
        title: "Perpetual Funding Rates & Bias Matrix",
        caption: "Next settlement in 02h 41m · 8h cadence",
        headers: ["Pair", "8h Rate", "Countdown", "Carry Bias"],
        rows: [
          [
            { text: "BTC-PERP", variant: "badge" },
            { text: "+0.0104%", variant: "mint" },
            { text: "02h 41m", variant: "neutral" },
            { text: "Neutral Long", variant: "mint" },
          ],
          [
            { text: "ETH-PERP", variant: "badge" },
            { text: "+0.0082%", variant: "neutral" },
            { text: "02h 41m", variant: "neutral" },
            { text: "Low Carry Cost", variant: "neutral" },
          ],
          [
            { text: "SOL-PERP", variant: "badge" },
            { text: "+0.0125%", variant: "mint" },
            { text: "02h 41m", variant: "neutral" },
            { text: "Bullish Skew", variant: "mint" },
          ],
          [
            { text: "HYPE-PERP", variant: "badge" },
            { text: "-0.0045%", variant: "coral" },
            { text: "02h 41m", variant: "neutral" },
            { text: "Short Heavy (Rebate)", variant: "mint" },
          ],
        ],
      },
    };
  }

  // Compare 10x vs 25x query
  if (
    q.includes("10x vs 25x") ||
    q.includes("compare 10x vs 25x") ||
    q.includes("compare") ||
    q.includes("srovnat")
  ) {
    return {
      text: `Leverage model for ${activeAsset}: 10x requires a 10.0% liquidation buffer with high structural tolerance. 25x tightens buffer to 4.0%, requiring strict stop placement. 10x recommended for current market volatility.`,
    };
  }

  // Evaluate / conditions / risk query
  if (
    q.includes("eval") ||
    q.includes("risk") ||
    q.includes("condition") ||
    q.includes("regime") ||
    q.includes("zhodno") ||
    q.includes("analýz") ||
    q.includes("rizik")
  ) {
    return {
      text: "Risk-on consolidation; bias favors pullback longs before CPI volatility.",
      table: {
        title: "Market Regime & Risk Evaluation",
        headers: ["Metric", "Reading", "Status"],
        rows: [
          [
            { text: "Market Regime", variant: "badge" },
            { text: "Consolidation Markup", variant: "mint" },
            { text: "Risk-On (Long Bias)", variant: "mint" },
          ],
          [
            { text: "Orderbook Depth", variant: "badge" },
            { text: "+6.8% Bid Skew", variant: "mint" },
            { text: "Bids Firm at $63.8k", variant: "neutral" },
          ],
          [
            { text: "Macro Catalyst", variant: "badge" },
            { text: "CPI in 24h", variant: "coral" },
            { text: "Reduce Leverage", variant: "coral" },
          ],
        ],
      },
    };
  }

  // Scalp / Long trade setup (default)
  if (activeAsset === "ETH-PERP") {
    return {
      text: "VWAP reclaim long setup primed on ETH-PERP.",
      tradeSetup: {
        id: "setup-eth-scalp",
        asset: "ETH-PERP",
        bias: "long",
        leverage: 10,
        entryZone: "$3,460",
        limitPriceVal: "3460",
        stopLoss: "$3,410",
        stopLossVal: "3410",
        stopRisk: "-$50 (-1.45%)",
        takeProfit: "$3,580",
        takeProfitVal: "3580",
        targetGain: "+$120 (+3.47%)",
        riskReward: "2.4R",
        invalidation: "15m close below $3,410",
        setupType: "VWAP Reclaim",
      },
    };
  }
  if (activeAsset === "SOL-PERP") {
    return {
      text: "VWAP reclaim long setup primed on SOL-PERP.",
      tradeSetup: {
        id: "setup-sol-scalp",
        asset: "SOL-PERP",
        bias: "long",
        leverage: 10,
        entryZone: "$142.00",
        limitPriceVal: "142.0",
        stopLoss: "$138.50",
        stopLossVal: "138.5",
        stopRisk: "-$3.50 (-2.46%)",
        takeProfit: "$152.00",
        takeProfitVal: "152.0",
        targetGain: "+$10.00 (+7.04%)",
        riskReward: "2.8R",
        invalidation: "15m close below $138.50",
        setupType: "VWAP Reclaim",
      },
    };
  }

  return {
    text: "VWAP reclaim long setup primed on BTC-PERP.",
    tradeSetup: {
      id: "setup-btc-scalp",
      asset: "BTC-PERP",
      bias: "long",
      leverage: 10,
      entryZone: "$64,350",
      limitPriceVal: "64350",
      stopLoss: "$64,150",
      stopLossVal: "64150",
      stopRisk: "-$200 (-0.31%)",
      takeProfit: "$64,770",
      takeProfitVal: "64770",
      targetGain: "+$420 (+0.65%)",
      riskReward: "2.1R",
      invalidation: "15m close below $64,150",
      setupType: "VWAP Reclaim",
    },
  };
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "msg-initial-setup",
    role: "agent",
    timestamp: "12:00:00 UTC",
    text: "Market telemetry live. BTC-PERP structure retesting institutional support with dynamic volume expansion.",
    tradeSetup: {
      id: "setup-btc-vwap",
      asset: "BTC-PERP",
      bias: "long",
      leverage: 10,
      entryZone: "$64,350",
      limitPriceVal: "64350",
      stopLoss: "$64,150",
      stopLossVal: "64150",
      stopRisk: "-$200 (-0.31%)",
      takeProfit: "$64,770",
      takeProfitVal: "64770",
      targetGain: "+$420 (+0.65%)",
      riskReward: "2.1R",
      invalidation: "15m close below $64,150",
      setupType: "VWAP Reclaim",
    },
  },
];

type OrderType = "market" | "limit" | "stop-market" | "stop-limit" | "twap" | "scale";
type TableTab = "positions" | "orders" | "trades" | "pnl";

type Position = {
  id: number;
  pair: string;
  side: "long" | "short";
  lev: string;
  size: string;
  notional: string;
  entry: string;
  mark: string;
  liq: string;
  margin: string;
  pnl: string;
  pnlPct: string;
};

type Order = {
  id: number;
  pair: string;
  type: string;
  size: string;
  price: string;
  trigger?: string;
  filled: string;
  status: string;
};

const INITIAL_POSITIONS: Position[] = [
  {
    id: 1,
    pair: "BTC-PERP",
    side: "long",
    lev: "10×",
    size: "1.5 BTC",
    notional: "$96,345.75",
    entry: "$62,100.00",
    mark: "$64,230.50",
    liq: "$56,400.00",
    margin: "$9,634.58",
    pnl: "+$3,195.75",
    pnlPct: "+33.17%",
  },
  {
    id: 2,
    pair: "ETH-PERP",
    side: "short",
    lev: "5×",
    size: "15.0 ETH",
    notional: "$51,900.00",
    entry: "$3,490.00",
    mark: "$3,460.00",
    liq: "$4,120.00",
    margin: "$10,380.00",
    pnl: "+$450.00",
    pnlPct: "+4.33%",
  },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 1,
    pair: "BTC-PERP",
    type: "Limit Buy",
    size: "0.5 BTC",
    price: "$63,500.00",
    trigger: "—",
    filled: "0%",
    status: "Open",
  },
  {
    id: 2,
    pair: "SOL-PERP",
    type: "Limit Short",
    size: "20.0 SOL",
    price: "$142.00",
    trigger: "—",
    filled: "0%",
    status: "Open",
  },
];

const INITIAL_TRADES = [
  {
    id: "tr-1",
    time: "15:42:10 UTC",
    pair: "BTC-PERP",
    side: "long" as const,
    size: "0.8 BTC",
    entry: "$63,420.00",
    exit: "$64,150.00",
    pnl: "+$584.00",
    fee: "-$12.40",
  },
  {
    id: "tr-2",
    time: "12:18:04 UTC",
    pair: "SOL-PERP",
    side: "short" as const,
    size: "35.0 SOL",
    entry: "$144.20",
    exit: "$139.80",
    pnl: "+$154.00",
    fee: "-$4.85",
  },
  {
    id: "tr-3",
    time: "09:05:32 UTC",
    pair: "ETH-PERP",
    side: "long" as const,
    size: "8.0 ETH",
    entry: "$3,410.00",
    exit: "$3,455.00",
    pnl: "+$360.00",
    fee: "-$7.10",
  },
];

const MARKET_PAIRS = [
  { symbol: "BTC-PERP" },
  { symbol: "ETH-PERP" },
  { symbol: "SOL-PERP" },
  { symbol: "HYPE-PERP" },
];

export interface PairMeta {
  mark: number;
  index: number;
  change24h: string;
  high24h: string;
  low24h: string;
  volume24h: string;
  oi: string;
  funding: string;
  fundingCountdown: string;
  tvSymbol: string;
  base: string;
  name: string;
  category: "Layer 1" | "Layer 2" | "DeFi" | "AI" | "Meme";
  maxLev: number;
  defaultSize: string;
}

const PAIR_METAS: Record<string, PairMeta> = {
  "BTC-PERP": {
    mark: SHARED_BTC_PRICE,
    index: 64228.0,
    change24h: "+2.45%",
    high24h: "$64,890.0",
    low24h: "$62,100.0",
    volume24h: "$1.42B",
    oi: "$3.2B",
    funding: SHARED_FUNDING_RATE,
    fundingCountdown: SHARED_FUNDING_COUNTDOWN,
    tvSymbol: "BINANCE:BTCUSDT",
    base: "BTC",
    name: "Bitcoin",
    category: "Layer 1",
    maxLev: 50,
    defaultSize: "1.5",
  },
  "ETH-PERP": {
    mark: 3460.0,
    index: 3458.5,
    change24h: "+1.12%",
    high24h: "$3,520.0",
    low24h: "$3,390.0",
    volume24h: "$890M",
    oi: "$1.4B",
    funding: "0.0082%",
    fundingCountdown: "in 02:41:18",
    tvSymbol: "BINANCE:ETHUSDT",
    base: "ETH",
    name: "Ethereum",
    category: "Layer 1",
    maxLev: 50,
    defaultSize: "15.0",
  },
  "SOL-PERP": {
    mark: 142.1,
    index: 142.05,
    change24h: "+4.80%",
    high24h: "$145.8",
    low24h: "$136.2",
    volume24h: "$340M",
    oi: "$680M",
    funding: "0.0125%",
    fundingCountdown: "in 02:41:18",
    tvSymbol: "BINANCE:SOLUSDT",
    base: "SOL",
    name: "Solana",
    category: "Layer 1",
    maxLev: 25,
    defaultSize: "25.0",
  },
  "HYPE-PERP": {
    mark: 18.45,
    index: 18.42,
    change24h: "+14.20%",
    high24h: "$19.10",
    low24h: "$15.80",
    volume24h: "$420M",
    oi: "$210M",
    funding: "-0.0045%",
    fundingCountdown: "in 02:41:18",
    tvSymbol: "BYBIT:HYPEUSDT",
    base: "HYPE",
    name: "Hyperliquid",
    category: "DeFi",
    maxLev: 10,
    defaultSize: "100.0",
  },
  "SUI-PERP": {
    mark: 2.18,
    index: 2.17,
    change24h: "+6.34%",
    high24h: "$2.26",
    low24h: "$2.02",
    volume24h: "$280M",
    oi: "$390M",
    funding: "0.0095%",
    fundingCountdown: "in 02:41:18",
    tvSymbol: "BINANCE:SUIUSDT",
    base: "SUI",
    name: "Sui Network",
    category: "Layer 1",
    maxLev: 20,
    defaultSize: "500.0",
  },
  "ARB-PERP": {
    mark: 0.542,
    index: 0.541,
    change24h: "-1.85%",
    high24h: "$0.568",
    low24h: "$0.531",
    volume24h: "$115M",
    oi: "$180M",
    funding: "0.0078%",
    fundingCountdown: "in 02:41:18",
    tvSymbol: "BINANCE:ARBUSDT",
    base: "ARB",
    name: "Arbitrum",
    category: "Layer 2",
    maxLev: 20,
    defaultSize: "2000.0",
  },
  "OP-PERP": {
    mark: 1.68,
    index: 1.67,
    change24h: "+3.22%",
    high24h: "$1.74",
    low24h: "$1.60",
    volume24h: "$98M",
    oi: "$140M",
    funding: "0.0088%",
    fundingCountdown: "in 02:41:18",
    tvSymbol: "BINANCE:OPUSDT",
    base: "OP",
    name: "Optimism",
    category: "Layer 2",
    maxLev: 20,
    defaultSize: "1000.0",
  },
  "LINK-PERP": {
    mark: 14.2,
    index: 14.18,
    change24h: "+0.95%",
    high24h: "$14.65",
    low24h: "$13.90",
    volume24h: "$145M",
    oi: "$260M",
    funding: "0.0102%",
    fundingCountdown: "in 02:41:18",
    tvSymbol: "BINANCE:LINKUSDT",
    base: "LINK",
    name: "Chainlink",
    category: "DeFi",
    maxLev: 20,
    defaultSize: "150.0",
  },
  "NEAR-PERP": {
    mark: 5.12,
    index: 5.11,
    change24h: "+7.45%",
    high24h: "$5.35",
    low24h: "$4.72",
    volume24h: "$210M",
    oi: "$310M",
    funding: "0.0118%",
    fundingCountdown: "in 02:41:18",
    tvSymbol: "BINANCE:NEARUSDT",
    base: "NEAR",
    name: "NEAR Protocol",
    category: "AI",
    maxLev: 20,
    defaultSize: "400.0",
  },
  "RENDER-PERP": {
    mark: 6.4,
    index: 6.38,
    change24h: "+5.12%",
    high24h: "$6.65",
    low24h: "$6.05",
    volume24h: "$165M",
    oi: "$220M",
    funding: "0.0110%",
    fundingCountdown: "in 02:41:18",
    tvSymbol: "BINANCE:RENDERUSDT",
    base: "RENDER",
    name: "Render Network",
    category: "AI",
    maxLev: 15,
    defaultSize: "300.0",
  },
  "DOGE-PERP": {
    mark: 0.134,
    index: 0.1338,
    change24h: "+8.75%",
    high24h: "$0.1410",
    low24h: "$0.1220",
    volume24h: "$620M",
    oi: "$780M",
    funding: "0.0135%",
    fundingCountdown: "in 02:41:18",
    tvSymbol: "BINANCE:DOGEUSDT",
    base: "DOGE",
    name: "Dogecoin",
    category: "Meme",
    maxLev: 25,
    defaultSize: "10000.0",
  },
  "PEPE-PERP": {
    mark: 0.0000095,
    index: 0.0000095,
    change24h: "-3.40%",
    high24h: "$0.0000102",
    low24h: "$0.0000091",
    volume24h: "$380M",
    oi: "$410M",
    funding: "0.0142%",
    fundingCountdown: "in 02:41:18",
    tvSymbol: "BINANCE:1000PEPEUSDT",
    base: "PEPE",
    name: "Pepe",
    category: "Meme",
    maxLev: 20,
    defaultSize: "10000000.0",
  },
};

interface TicketSnapshot {
  side: "long" | "short";
  orderType: OrderType;
  limitPrice: string;
  size: string;
  sizeUnit: "base" | "usdc";
  leverage: number;
  stopLoss: string;
  takeProfit: string;
  tpSlExpanded: boolean;
  selectedPair: string;
}

function parseNaturalLanguageOrder(text: string) {
  const lower = text.toLowerCase().trim();
  const isBuy = /\b(buy|long)\b/.test(lower);
  const isSell = /\b(sell|short)\b/.test(lower);
  if (!isBuy && !isSell) return null;

  let asset = "BTC-PERP";
  if (/\beth\b/.test(lower)) asset = "ETH-PERP";
  else if (/\bsol\b/.test(lower)) asset = "SOL-PERP";
  else if (/\bhype\b/.test(lower)) asset = "HYPE-PERP";
  else if (/\bbtc\b/.test(lower)) asset = "BTC-PERP";

  const levMatch = lower.match(/\b(\d{1,2})\s*x\b/);
  const leverage =
    levMatch && levMatch[1] ? Math.min(50, Math.max(1, parseInt(levMatch[1], 10))) : 10;

  const sizeMatch =
    lower.match(/(?:buy|long|sell|short)\s+([\d.]+)/) ||
    lower.match(/\b([\d.]+)\s*(?:btc|eth|sol|hype)\b/);
  const parsedSize = sizeMatch && sizeMatch[1] ? sizeMatch[1] : "";

  const stopMatch = lower.match(/\b(?:stop|sl)\s*[:@=]?\s*([$]?[\d,]+(?:\.\d+)?)/);
  const stopVal = stopMatch && stopMatch[1] ? stopMatch[1].replace(/[$,]/g, "") : "";

  const targetMatch = lower.match(/\b(?:target|tp)\s*[:@=]?\s*([$]?[\d,]+(?:\.\d+)?)/);
  const targetVal = targetMatch && targetMatch[1] ? targetMatch[1].replace(/[$,]/g, "") : "";

  return {
    bias: (isBuy ? "long" : "short") as "long" | "short",
    asset,
    size: parsedSize,
    leverage,
    stopLoss: stopVal,
    takeProfit: targetVal,
  };
}

export function Perps() {
  const wallet = useWallet();
  const { resolvedTheme } = useTheme();
  const [selectedPair, setSelectedPair] = useState<string>("BTC-PERP");
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetSearchQuery, setAssetSearchQuery] = useState("");
  const [assetCategory, setAssetCategory] = useState<string>("All");
  const [assetTab, setAssetTab] = useState<"assets" | "predictions" | "users">("assets");
  const [favorites, setFavorites] = useState<string[]>([
    "BTC-PERP",
    "ETH-PERP",
    "SOL-PERP",
    "HYPE-PERP",
  ]);
  const [chartReloadKey, setChartReloadKey] = useState(0);

  // Remount TradingView widget when theme changes
  useEffect(() => {
    setChartReloadKey((k) => k + 1);
  }, [resolvedTheme]);

  const [orderType, setOrderType] = useState<OrderType>("market");
  const [marginMode, setMarginMode] = useState<"cross" | "isolated">("cross");
  const [isLeverageModalOpen, setIsLeverageModalOpen] = useState(false);
  const [modalLeverage, setModalLeverage] = useState<number | "">(10);
  const [modalMarginMode, setModalMarginMode] = useState<"cross" | "isolated">("cross");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const [tableTab, setTableTab] = useState<TableTab>("positions");
  const [side, setSide] = useState<"long" | "short">("long");
  const [leverage, setLeverage] = useState(10);
  const [sizeUnit, setSizeUnit] = useState<"base" | "usdc">("base");
  const [reduceOnly, setReduceOnly] = useState(false);
  const [size, setSize] = useState("1.5");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [tpSlExpanded, setTpSlExpanded] = useState(true);
  const [positions, setPositions] = useState<Position[]>(INITIAL_POSITIONS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [loadedSetupId, setLoadedSetupId] = useState<string | null>(null);
  const [loadedSetupNotice, setLoadedSetupNotice] = useState<string | null>(null);
  const [showPositionLines, setShowPositionLines] = useState(false);
  const [chartInterval, setChartInterval] = useState<string>("15");
  const [selectedInterval, setSelectedInterval] = useState<string>("15m");
  const [mobileCopilotOpen, setMobileCopilotOpen] = useState(false);

  // Redesign state: collapsible copilot, interacted avatar, AI field tags & undo, modals
  const [isCopilotCollapsed, setIsCopilotCollapsed] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [copilotHeaderMode, setCopilotHeaderMode] = useState<"autopilot" | "copilot" | "manual">(
    "copilot",
  );
  const [marginPreset, setMarginPreset] = useState<number>(1000);
  const [tradeStyle, setTradeStyle] = useState<"Day" | "Swing" | "Scalp">("Day");
  const [tradeStrategy, setTradeStrategy] = useState<"Max Gain" | "Conservative" | "High R:R">(
    "Max Gain",
  );
  const [showStrategySettings, setShowStrategySettings] = useState(false);
  const [aiFilledFields, setAiFilledFields] = useState<Record<string, boolean>>({});
  const [previousTicketState, setPreviousTicketState] = useState<TicketSnapshot | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isMoreStatsOpen, setIsMoreStatsOpen] = useState(false);
  const [isMoreOrderTypesOpen, setIsMoreOrderTypesOpen] = useState(false);
  const [isRangeMenuOpen, setIsRangeMenuOpen] = useState(false);
  const [chartType, setChartType] = useState<"candles" | "line">("candles");
  const [postOnly, setPostOnly] = useState(false);
  const [timeInForce, setTimeInForce] = useState<"GTC" | "IOC" | "FOK">("GTC");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [shareModalTrade, setShareModalTrade] = useState<SharePnlData | null>(null);
  const [openCloseMenuId, setOpenCloseMenuId] = useState<number | null>(null);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [editTp, setEditTp] = useState("");
  const [editSl, setEditSl] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const perpsChatScrollRef = useRef<HTMLDivElement>(null);
  const positionsTableRef = useRef<HTMLElement>(null);
  const mainTerminalRef = useRef<HTMLElement>(null);
  const nextId = useRef(100);

  const latestMessage =
    [...messages].reverse().find((m) => m.role === "agent") || messages[messages.length - 1];
  const msg = latestMessage;

  const totalUpnl = positions.reduce((acc, p) => {
    const val = parseFloat(p.pnl.replace(/[^0-9.-]/g, ""));
    return isNaN(val) ? acc : acc + val;
  }, 0);

  const scrollToPositions = () => {
    positionsTableRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTerminal = () => {
    mainTerminalRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const activePairMeta = PAIR_METAS[selectedPair] ?? PAIR_METAS["BTC-PERP"]!;
  const currentMarkPrice = activePairMeta.mark;
  const baseAsset = activePairMeta.base;

  const visibleMarketPairs = useMemo(() => {
    const defaultSymbols = ["BTC-PERP", "ETH-PERP", "SOL-PERP", "HYPE-PERP"];
    if (defaultSymbols.includes(selectedPair)) {
      return defaultSymbols;
    }
    return [...defaultSymbols.slice(0, 3), selectedPair];
  }, [selectedPair]);

  const CANDLE_TIMEFRAMES = [
    { label: "1m", interval: "1" },
    { label: "5m", interval: "5" },
    { label: "15m", interval: "15" },
    { label: "1h", interval: "60" },
    { label: "4h", interval: "240" },
    { label: "1D", interval: "D" },
  ] as const;

  const tvChartOverrides = useMemo(() => {
    return {
      "paneProperties.background": resolvedTheme === "light" ? "#FFFFFF" : "#17181B",
      "paneProperties.backgroundType": "solid",
      "paneProperties.vertGridProperties.color":
        resolvedTheme === "light" ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.04)",
      "paneProperties.horzGridProperties.color":
        resolvedTheme === "light" ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.04)",
      "scalesProperties.textColor": resolvedTheme === "light" ? "#5D606B" : "#9A9CA3",
      "mainSeriesProperties.candleStyle.upColor": "#3DDC97",
      "mainSeriesProperties.candleStyle.downColor": "#FF5C6C",
      "mainSeriesProperties.candleStyle.borderUpColor": "#3DDC97",
      "mainSeriesProperties.candleStyle.borderDownColor": "#FF5C6C",
      "mainSeriesProperties.candleStyle.wickUpColor": "#3DDC97",
      "mainSeriesProperties.candleStyle.wickDownColor": "#FF5C6C",
    };
  }, [resolvedTheme]);

  const updateLeverage = (newLev: number) => {
    const clamped = Math.min(50, Math.max(1, newLev));
    setLeverage(clamped);
    setPositions((prev) =>
      prev.map((p) => {
        if (p.pair === selectedPair) {
          const rawMark = PAIR_METAS[p.pair]?.mark ?? 64230.5;
          const rawSizeNum = parseFloat(p.size);
          const notional = !isNaN(rawSizeNum) ? rawSizeNum * rawMark : 0;
          const newMarginVal = notional > 0 ? notional / clamped : 0;
          const newLiqDist =
            p.side === "long" ? rawMark * (1 - 1 / clamped) : rawMark * (1 + 1 / clamped);
          return {
            ...p,
            lev: `${clamped}×`,
            margin: `$${newMarginVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            liq: `$${Math.round(newLiqDist).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          };
        }
        return p;
      }),
    );
  };

  const openLeverageModal = (overrideMode?: "cross" | "isolated", overrideLev?: number) => {
    setModalLeverage(overrideLev ?? leverage);
    setModalMarginMode(overrideMode ?? marginMode);
    setIsLeverageModalOpen(true);
  };

  const applyLeverageModal = () => {
    const finalLev =
      typeof modalLeverage === "number" && modalLeverage >= 1 ? Math.min(50, modalLeverage) : 1;
    updateLeverage(finalLev);
    setMarginMode(modalMarginMode);
    setIsLeverageModalOpen(false);
    toast.success("Leverage & Margin Updated", {
      description: `${modalMarginMode === "cross" ? "Cross" : "Isolated"} margin set to ${finalLev}×`,
    });
  };

  const selectAsset = (pairKey: string) => {
    setSelectedPair(pairKey);
    const meta = PAIR_METAS[pairKey];
    if (meta) {
      if (leverage > meta.maxLev) {
        setLeverage(meta.maxLev);
      }
      if (sizeUnit === "base") {
        setSize(meta.defaultSize);
      } else {
        const notional = parseFloat(meta.defaultSize) * meta.mark;
        setSize(notional.toFixed(2));
      }
    }
    setIsAssetModalOpen(false);
    toast.success("Active Asset Changed", {
      description: `Viewing ${meta?.name ?? pairKey} (${meta?.base ?? ""}-PERP) market.`,
    });
  };

  const toggleFavorite = (pairKey: string) => {
    setFavorites((prev) =>
      prev.includes(pairKey) ? prev.filter((k) => k !== pairKey) : [...prev, pairKey],
    );
  };

  const toggleSizeUnit = () => {
    const parsed = parseFloat(size);
    if (sizeUnit === "base") {
      setSizeUnit("usdc");
      if (!isNaN(parsed) && parsed > 0) {
        setSize((parsed * currentMarkPrice).toFixed(2));
      }
    } else {
      setSizeUnit("base");
      if (!isNaN(parsed) && parsed > 0) {
        const precision = currentMarkPrice > 1000 ? 4 : currentMarkPrice < 0.01 ? 0 : 2;
        setSize((parsed / currentMarkPrice).toFixed(precision));
      }
    }
  };

  const filteredAssets = Object.entries(PAIR_METAS).filter(([key, meta]) => {
    if (assetCategory === "Favorites") {
      if (!favorites.includes(key)) return false;
    } else if (assetCategory !== "All") {
      if (meta.category !== assetCategory) return false;
    }

    if (assetSearchQuery.trim()) {
      const q = assetSearchQuery.toLowerCase().trim();
      const matchSymbol = meta.base.toLowerCase().includes(q);
      const matchName = meta.name.toLowerCase().includes(q);
      const matchKey = key.toLowerCase().includes(q);
      if (!matchSymbol && !matchName && !matchKey) return false;
    }

    return true;
  });

  useEffect(() => {
    if (perpsChatScrollRef.current) {
      perpsChatScrollRef.current.scrollTo({
        top: perpsChatScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isTyping]);

  const handleUndoAi = () => {
    if (!previousTicketState) return;
    setSide(previousTicketState.side);
    setOrderType(previousTicketState.orderType);
    setLimitPrice(previousTicketState.limitPrice);
    setSize(previousTicketState.size);
    setSizeUnit(previousTicketState.sizeUnit);
    setLeverage(previousTicketState.leverage);
    setStopLoss(previousTicketState.stopLoss);
    setTakeProfit(previousTicketState.takeProfit);
    setTpSlExpanded(previousTicketState.tpSlExpanded);
    setSelectedPair(previousTicketState.selectedPair);
    setPreviousTicketState(null);
    setAiFilledFields({});
    toast.info("Restored previous ticket state");
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setHasInteracted(true);
    const userMsg: Message = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      timestamp: getTimestamp(),
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);

    const naturalOrder = parseNaturalLanguageOrder(text);

    setTimeout(() => {
      setIsTyping(false);
      if (naturalOrder) {
        setPreviousTicketState({
          side,
          orderType,
          limitPrice,
          size,
          sizeUnit,
          leverage,
          stopLoss,
          takeProfit,
          tpSlExpanded,
          selectedPair,
        });
        if (naturalOrder.asset && PAIR_METAS[naturalOrder.asset]) {
          setSelectedPair(naturalOrder.asset);
        }
        setSide(naturalOrder.bias);
        setLeverage(Math.min(50, naturalOrder.leverage));
        if (naturalOrder.size) {
          setSize(naturalOrder.size);
          setSizeUnit("base");
        }
        if (naturalOrder.stopLoss) {
          setStopLoss(naturalOrder.stopLoss);
          setTpSlExpanded(true);
        }
        if (naturalOrder.takeProfit) {
          setTakeProfit(naturalOrder.takeProfit);
          setTpSlExpanded(true);
        }
        setAiFilledFields({
          side: true,
          size: Boolean(naturalOrder.size),
          leverage: true,
          stopLoss: Boolean(naturalOrder.stopLoss),
          takeProfit: Boolean(naturalOrder.takeProfit),
        });
        const orderReplyText = `I've configured your order ticket for ${naturalOrder.bias.toUpperCase()} ${naturalOrder.size || "1.5"} ${naturalOrder.asset.replace("-PERP", "")} at ${naturalOrder.leverage}× leverage${naturalOrder.takeProfit ? ` with Take Profit at $${naturalOrder.takeProfit}` : ""}${naturalOrder.stopLoss ? ` and Stop Loss at $${naturalOrder.stopLoss}` : ""}. Review the ticket details on the right before submitting.`;
        const agentMsg: Message = {
          id: `msg-agent-${Date.now()}`,
          role: "agent",
          timestamp: getTimestamp(),
          text: orderReplyText,
        };
        setMessages((prev) => [...prev, agentMsg]);
        toast.success("Ticket pre-filled from prompt", {
          description: `${naturalOrder.bias === "long" ? "Long" : "Short"} ${naturalOrder.size || "1.5"} ${naturalOrder.asset} (${naturalOrder.leverage}×)`,
        });
        return;
      }

      const reply = getAgentReply(text, selectedPair);
      const agentMsg: Message = {
        id: `msg-agent-${Date.now()}`,
        role: "agent",
        timestamp: getTimestamp(),
        ...reply,
      };
      setMessages((prev) => [...prev, agentMsg]);
    }, 650);
  };

  const handleAskLongShort = () => {
    sendMessage(
      `Find ${tradeStyle} ${tradeStrategy} setup for ${selectedPair} with $${marginPreset} margin`,
    );
  };

  const handleLoadSetup = (setup: TradeSetup, msgId: string) => {
    setPreviousTicketState({
      side,
      orderType,
      limitPrice,
      size,
      sizeUnit,
      leverage,
      stopLoss,
      takeProfit,
      tpSlExpanded,
      selectedPair,
    });
    if (setup.asset && PAIR_METAS[setup.asset]) {
      setSelectedPair(setup.asset);
    }
    setSide(setup.bias);
    setOrderType("limit");
    setLimitPrice(setup.limitPriceVal);
    setStopLoss(setup.stopLossVal);
    setTakeProfit(setup.takeProfitVal);
    setLeverage(Math.min(50, setup.leverage));
    setSizeUnit("base");
    setTpSlExpanded(true);
    const newSize =
      size ||
      (setup.asset.startsWith("ETH")
        ? "2.0"
        : setup.asset.startsWith("SOL")
          ? "25.0"
          : setup.asset.startsWith("HYPE")
            ? "100.0"
            : "0.5");
    setSize(newSize);
    setAiFilledFields({
      side: true,
      orderType: true,
      limitPrice: true,
      size: true,
      leverage: true,
      stopLoss: true,
      takeProfit: true,
    });
    setLoadedSetupId(msgId);
    setLoadedSetupNotice(
      `Pre-filled: ${setup.asset} ${setup.bias === "long" ? "BUY" : "SHORT"} Limit @ $${setup.limitPriceVal}`,
    );
    setTimeout(() => {
      setLoadedSetupId(null);
    }, 2500);
    setTimeout(() => {
      setLoadedSetupNotice(null);
    }, 4000);
  };

  const sizeNum = parseFloat(size);
  const hasValidSize = !isNaN(sizeNum) && sizeNum > 0;
  const defaultAssetSize = parseFloat(activePairMeta.defaultSize);
  const activeBaseSize = hasValidSize
    ? sizeUnit === "base"
      ? sizeNum
      : sizeNum / currentMarkPrice
    : defaultAssetSize;
  const activeUsdcNotional = hasValidSize
    ? sizeUnit === "usdc"
      ? sizeNum
      : sizeNum * currentMarkPrice
    : defaultAssetSize * currentMarkPrice;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }
      if (e.key === "b" || e.key === "B") {
        setSide("long");
      } else if (e.key === "s" || e.key === "S") {
        setSide("short");
      } else if (e.key === "?") {
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsReviewModalOpen(false);
        setIsShortcutsOpen(false);
        setIsMoreStatsOpen(false);
        setIsMoreOrderTypesOpen(false);
        setIsRangeMenuOpen(false);
        setIsLeverageModalOpen(false);
        setIsAssetModalOpen(false);
        setEditingPosition(null);
      } else if (e.key === "Enter") {
        if (hasValidSize) {
          setIsReviewModalOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasValidSize]);

  const resetConversation = () => {
    setMessages(INITIAL_MESSAGES);
    setLoadedSetupId(null);
    setLoadedSetupNotice(null);
  };

  const handlePercentSize = (pct: number) => {
    const availableUsdt = 42180.0;
    const maxNotional = availableUsdt * leverage;
    if (sizeUnit === "usdc") {
      setSize((maxNotional * pct).toFixed(2));
    } else {
      const maxSize = maxNotional / currentMarkPrice;
      const precision = currentMarkPrice > 1000 ? 4 : currentMarkPrice < 0.01 ? 0 : 2;
      setSize((maxSize * pct).toFixed(precision));
    }
  };

  const placeOrder = () => {
    // Before first trade show a one-time notice (terms + region restrictions)
    if (!walletStore.isTermsAccepted()) {
      walletStore.openTermsModal();
      return;
    }

    const precision = currentMarkPrice > 1000 ? 4 : currentMarkPrice < 0.01 ? 0 : 2;
    const sizeStr = `${activeBaseSize.toFixed(precision)} ${baseAsset}`;
    const id = nextId.current++;
    const entryPrice =
      orderType === "limit" && limitPrice
        ? `$${parseFloat(limitPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `$${currentMarkPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (orderType === "market") {
      const liqDist =
        side === "long"
          ? currentMarkPrice * (1 - 1 / leverage)
          : currentMarkPrice * (1 + 1 / leverage);
      const notionalVal = activeUsdcNotional;
      const marginVal = notionalVal / leverage;
      const newPos: Position = {
        id,
        pair: selectedPair,
        side,
        lev: `${leverage}×`,
        size: sizeStr,
        notional: `$${notionalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        entry: entryPrice,
        mark: entryPrice,
        liq: `$${Math.round(liqDist).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        margin: `$${marginVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        pnl: "+$0.00",
        pnlPct: "+0.00%",
      };
      setPositions((prev) => [newPos, ...prev]);
      setTableTab("positions");
    } else {
      const newOrder: Order = {
        id,
        pair: selectedPair,
        type:
          orderType === "stop-market"
            ? side === "long"
              ? "Stop Market Buy"
              : "Stop Market Short"
            : side === "long"
              ? "Limit Buy"
              : "Limit Short",
        size: sizeStr,
        price: entryPrice,
        trigger: orderType === "stop-market" ? entryPrice : "—",
        filled: "0%",
        status: "Open",
      };
      setOrders((prev) => [newOrder, ...prev]);
      setTableTab("orders");
    }

    setSize("");
    setLimitPrice("");
    setStopLoss("");
    setTakeProfit("");
    setOrderSuccess(true);
    toast.success("Order Placed to Desk ✓", {
      description: `${side === "long" ? "BUY" : "SHORT"} ${sizeStr} placed at ${entryPrice}`,
    });
    setTimeout(() => setOrderSuccess(false), 2500);
  };

  const closePosition = (id: number, portion: number = 1) => {
    const target = positions.find((p) => p.id === id);
    if (target) {
      if (portion >= 1) {
        setPositions((prev) => prev.filter((p) => p.id !== id));
      } else {
        setPositions((prev) =>
          prev.map((p) => {
            if (p.id !== id) return p;
            const currentSizeNum = parseFloat(p.size);
            const newSizeNum = currentSizeNum * (1 - portion);
            const unit = p.size.split(" ")[1] || "";
            return {
              ...p,
              size: `${newSizeNum.toFixed(2)} ${unit}`,
            };
          }),
        );
      }
      const tradeData: SharePnlData = {
        market: target.pair,
        bias: target.side,
        leverage: parseInt(target.lev, 10) || 10,
        pnlUsd: target.pnl,
        pnlPct: target.pnlPct,
        entryPrice: target.entry,
        markPrice: target.mark,
        duration: "14h 22m",
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };
      toast.success(
        `Position ${portion < 1 ? `partially (${Math.round(portion * 100)}%) ` : ""}closed at market`,
        {
          action: {
            label: "Share P&L",
            onClick: () => setShareModalTrade(tradeData),
          },
        },
      );
    }
  };
  const cancelOrder = (id: number) => setOrders((prev) => prev.filter((o) => o.id !== id));

  const orderCostNum = activeUsdcNotional / leverage;
  const orderValue = `~$${Math.round(activeUsdcNotional).toLocaleString()} USDC`;
  const costFormatted = `$${orderCostNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`;
  const estLiqVal =
    side === "long" ? currentMarkPrice * (1 - 1 / leverage) : currentMarkPrice * (1 + 1 / leverage);
  const liqPrice = `$${estLiqVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const liqBufferPct = ((1 / leverage) * 100).toFixed(1);
  const formattedButtonSize = hasValidSize
    ? `${sizeUnit === "base" ? size : (sizeNum / currentMarkPrice).toFixed(currentMarkPrice > 1000 ? 4 : 2)} ${baseAsset}`
    : baseAsset;

  // TP/SL live risk-reward and PnL calculations
  const activeEntryPrice =
    orderType === "limit" && limitPrice && parseFloat(limitPrice) > 0
      ? parseFloat(limitPrice)
      : currentMarkPrice;

  const currentBaseUnits = activeBaseSize;
  const slNum = parseFloat(stopLoss);
  const tpNum = parseFloat(takeProfit);

  const slValid = !isNaN(slNum) && slNum > 0;
  const tpValid = !isNaN(tpNum) && tpNum > 0;

  let slLossUsd: number | null = null;
  let slLossPct: number | null = null;
  if (slValid && activeEntryPrice > 0) {
    const diff = side === "long" ? activeEntryPrice - slNum : slNum - activeEntryPrice;
    slLossUsd = diff * currentBaseUnits;
    slLossPct = (diff / activeEntryPrice) * leverage * 100;
  }

  let tpGainUsd: number | null = null;
  let tpGainPct: number | null = null;
  if (tpValid && activeEntryPrice > 0) {
    const diff = side === "long" ? tpNum - activeEntryPrice : activeEntryPrice - tpNum;
    tpGainUsd = diff * currentBaseUnits;
    tpGainPct = (diff / activeEntryPrice) * leverage * 100;
  }

  let riskRewardRatio: string | null = null;
  if (slValid && tpValid && activeEntryPrice > 0) {
    const risk = Math.abs(activeEntryPrice - slNum);
    const reward = Math.abs(tpNum - activeEntryPrice);
    if (risk > 0) {
      riskRewardRatio = `1:${(reward / risk).toFixed(2)}`;
    }
  }

  return (
    <div className="flex flex-col bg-[var(--bg-shell,#f7f8fa)] text-[var(--text-primary,#0b0b0c)] select-none overflow-y-auto min-h-screen scroll-smooth">
      {/* =========================================================================
          PAGE TOOLBAR (56px, directly under 64px nav, unified PageToolbar)
          ========================================================================= */}
      <div className="shrink-0 h-14 border-b border-[var(--border-subtle,rgba(10,10,12,0.08))] bg-[var(--surface-1,#ffffff)]/90 backdrop-blur-md sticky top-16 z-20">
        <div className="flex h-14 w-full items-center justify-between gap-4 px-4 md:px-8 max-w-[1680px] mx-auto overflow-x-auto no-scrollbar">
          {/* Left: Mode / Market selector */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--surface-2,#f1f2f5)] border border-[var(--border-subtle,rgba(10,10,12,0.08))] text-[12px] text-[var(--text-secondary,#5a5a66)] select-none">
              <span className="size-1.5 rounded-full bg-[#2563EB]" />
              <span>Practice</span>
            </span>

            {/* Market selector dropdown */}
            <button
              type="button"
              onClick={() => setIsAssetModalOpen(true)}
              className="h-9 rounded-full px-3.5 bg-[var(--surface-2,#f1f2f5)] hover:bg-[var(--surface-3,#e6e8ec)] border border-[var(--border-subtle,rgba(10,10,12,0.08))] hover:border-[var(--border-default)] text-[var(--text-primary,#0b0b0c)] font-medium text-[13px] flex items-center gap-2 transition-all cursor-pointer select-none"
              title="Select Perpetual Market Asset"
            >
              <span className="size-2 rounded-full bg-[#2563EB] shadow-[0_0_6px_#2563EB]" />
              <span className="font-semibold tracking-tight">{selectedPair}</span>
              <ChevronDown className="size-3 text-[var(--text-tertiary,#747482)]" />
            </button>
          </div>

          {/* Center: Large Mark Price & 24h change */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[16px] font-semibold text-[var(--text-primary,#0b0b0c)] tracking-tight tabular-nums">
                $
                {activePairMeta.mark.toLocaleString(undefined, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[12px] font-medium tabular-nums border",
                  activePairMeta.change24h.startsWith("+")
                    ? "text-[#087F4D] bg-[#087F4D]/10 border-[#087F4D]/20"
                    : "text-[#D92D45] bg-[#D92D45]/10 border-[#D92D45]/20",
                )}
              >
                {activePairMeta.change24h}
              </span>
            </div>

            {/* "More" popover */}
            <Popover open={isMoreStatsOpen} onOpenChange={setIsMoreStatsOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="h-9 rounded-full px-3 bg-[var(--surface-2,#f1f2f5)] hover:bg-[var(--surface-3,#e6e8ec)] border border-[var(--border-subtle,rgba(10,10,12,0.08))] text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)] text-[12px] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>More</span>
                  <ChevronDown className="size-3 text-[var(--text-tertiary,#747482)]" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-[260px] p-3 rounded-[16px] bg-[var(--surface-1,#ffffff)] border border-[var(--border-subtle,rgba(10,10,12,0.08))] text-[12px] font-mono text-[var(--text-primary,#0b0b0c)] shadow-xl space-y-2 z-50"
              >
                <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary,#747482)] font-semibold pb-1 border-b border-[var(--border-subtle,rgba(10,10,12,0.08))]">
                  Market Specs & Depth
                </div>
                <div className="space-y-1.5 text-[var(--text-secondary,#5a5a66)]">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary,#747482)]">Funding</span>
                    <span className="text-[var(--text-primary,#0b0b0c)] font-medium">
                      {activePairMeta.funding}{" "}
                      <span className="text-[var(--text-tertiary,#747482)] text-[10px]">
                        {activePairMeta.fundingCountdown}
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary,#747482)]">Open Interest</span>
                    <span className="text-[var(--text-primary,#0b0b0c)] font-medium">{activePairMeta.oi}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary,#747482)]">24h Volume</span>
                    <span className="text-[var(--text-primary,#0b0b0c)] font-medium">{activePairMeta.volume24h}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary,#747482)]">Index</span>
                    <span className="text-[var(--text-primary,#0b0b0c)] font-medium">
                      $
                      {activePairMeta.index.toLocaleString(undefined, {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary,#747482)]">24h High</span>
                    <span className="text-[var(--text-primary,#0b0b0c)] font-medium">{activePairMeta.high24h}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary,#747482)]">24h Low</span>
                    <span className="text-[var(--text-primary,#0b0b0c)] font-medium">{activePairMeta.low24h}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary,#747482)]">Long/Short Ratio</span>
                    <span className="text-[var(--text-primary,#0b0b0c)] font-medium">52.4% / 47.6%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary,#747482)]">Borrow Rate</span>
                    <span className="text-[var(--text-primary,#0b0b0c)] font-medium">0.0042% / 8h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary,#747482)]">Max Leverage</span>
                    <span className="text-[var(--text-primary,#0b0b0c)] font-medium">{activePairMeta.maxLev}×</span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Right: Max 4 stats/actions (Timeframes, Overlays, Reload, Mobile Copilot) */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {/* Timeframes: 1m, 5m, 15m, 1h, 4h, 1D */}
            <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--surface-2,#f1f2f5)] border border-[var(--border-subtle,rgba(10,10,12,0.08))] h-9">
              {CANDLE_TIMEFRAMES.map((tf) => {
                const isActive = selectedInterval === tf.label;
                return (
                  <button
                    key={tf.label}
                    type="button"
                    onClick={() => {
                      setSelectedInterval(tf.label);
                      setChartInterval(tf.interval);
                      setChartReloadKey((k) => k + 1);
                    }}
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-mono font-medium transition-all whitespace-nowrap cursor-pointer",
                      isActive
                        ? "bg-[var(--surface-1,#ffffff)] text-[var(--text-primary,#0b0b0c)] border border-[var(--border-subtle,rgba(10,10,12,0.08))] shadow-xs font-semibold"
                        : "bg-transparent text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)]",
                    )}
                  >
                    {tf.label}
                  </button>
                );
              })}
            </div>

            {/* Overlays toggle button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPositionLines((prev) => !prev)}
              className={cn(
                "size-9 cursor-pointer rounded-full transition-colors border border-[var(--border-subtle,rgba(10,10,12,0.08))] bg-[var(--surface-2,#f1f2f5)]",
                showPositionLines
                  ? "text-[#2563EB] bg-[#2563EB]/15 hover:bg-[#2563EB]/25"
                  : "text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)] hover:bg-[var(--surface-3,#e6e8ec)]",
              )}
              title={
                showPositionLines ? "Hide position lines on chart" : "Show position lines on chart"
              }
            >
              <SlidersHorizontal className="size-3.5" />
            </Button>

            {/* Reload Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setChartReloadKey((k) => k + 1)}
              className="size-9 text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)] hover:bg-[var(--surface-3,#e6e8ec)] cursor-pointer rounded-full border border-[var(--border-subtle,rgba(10,10,12,0.08))] bg-[var(--surface-2,#f1f2f5)]"
              title="Reload chart widget"
            >
              <RotateCw className="size-3.5" />
            </Button>

            {/* Mobile Copilot Trigger */}
            <button
              type="button"
              onClick={() => setMobileCopilotOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2563EB] text-white font-semibold text-[12px] cursor-pointer h-9 shadow-sm"
            >
              <Bot className="size-3.5" />
              <span>Copilot</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MAIN TERMINAL (Screen 1) — 3-Column Standard Rails: Left 320px, Center fluid, Right 360px
          ========================================================================= */}
      <section
        ref={mainTerminalRef}
        data-grid-geometry="lg:grid-cols-[315px_minmax(0,1fr)_285px]"
        className="w-full max-w-[1680px] p-2.5 sm:p-3 md:p-4 mx-auto shrink-0 flex flex-col gap-3 min-h-0 flex-1 lg:h-[calc(100vh-56px)]"
      >
        <div
          className="w-full flex-1 grid gap-3
          grid-cols-1
          lg:grid-cols-[320px_minmax(0,1fr)_360px]
          lg:grid-rows-1
          min-h-0 items-stretch
        "
        >
          {/* =====================================================================
              COLUMN 1: Ultra-Sleek AI Copilot with Living Orb
              ===================================================================== */}
          {isCopilotCollapsed ? (
            <div className="hidden lg:flex flex-col items-center justify-between rounded-[24px] border border-[var(--border-subtle,rgba(10,10,12,0.08))] bg-[var(--surface-1,#ffffff)] py-4 w-12 h-full shrink-0 shadow-xs">
              <button
                type="button"
                onClick={() => setIsCopilotCollapsed(false)}
                className="text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)] p-2 rounded-[8px] hover:bg-[var(--surface-2,#f1f2f5)] transition-colors cursor-pointer"
                title="Expand AI Copilot"
              >
                <ChevronRight className="size-4" />
              </button>
              <div className="[writing-mode:vertical-rl] text-[11px] font-mono uppercase tracking-widest text-[var(--text-tertiary,#747482)] rotate-180 select-none flex items-center gap-2">
                <Bot className="size-3.5 rotate-90 text-[#2563EB]" />
                <span className="whitespace-nowrap">AI Copilot</span>
              </div>
              <CopilotOrb isThinking={isTyping} size={28} />
            </div>
          ) : (
            <div className="hidden lg:flex flex-col justify-between rounded-[28px] border border-[var(--border-subtle,rgba(10,10,12,0.08))] bg-[var(--surface-1,#ffffff)] p-3.5 sm:p-4 min-h-[500px] h-full overflow-hidden relative shadow-sm text-[var(--text-primary,#0b0b0c)]">
              {/* Sapphire ambient glow in corner */}
              <div className="absolute -top-12 -left-12 size-48 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.08),transparent_70%)] pointer-events-none" />

              {/* TOP HEADER: Segmented modes (Autopilot | AI Copilot | Manual) + Controls */}
              <div className="shrink-0 pb-3 border-b border-[var(--border-subtle,rgba(10,10,12,0.08))] flex items-center justify-between gap-2 relative z-10">
                <div className="inline-flex items-center p-0.5 rounded-full bg-[var(--surface-2,#f1f2f5)] border border-[var(--border-subtle,rgba(10,10,12,0.08))]">
                  <button
                    type="button"
                    onClick={() => setCopilotHeaderMode("autopilot")}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer",
                      copilotHeaderMode === "autopilot"
                        ? "bg-[var(--surface-1,#ffffff)] text-[var(--text-primary,#0b0b0c)] shadow-xs font-semibold"
                        : "text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)]",
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
                        ? "bg-[#2563EB] text-white shadow-[0_2px_12px_rgba(37,99,235,0.35)]"
                        : "text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)]",
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
                        ? "bg-[var(--surface-1,#ffffff)] text-[var(--text-primary,#0b0b0c)] shadow-xs font-semibold"
                        : "text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)]",
                    )}
                  >
                    Manual
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={resetConversation}
                    className="text-[var(--text-tertiary,#747482)] hover:text-[var(--text-primary,#0b0b0c)] p-1.5 rounded-[8px] hover:bg-[var(--surface-2,#f1f2f5)] transition-colors cursor-pointer"
                    title="Reset conversation"
                  >
                    <RotateCcw className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCopilotCollapsed(true)}
                    className="text-[var(--text-tertiary,#747482)] hover:text-[var(--text-primary,#0b0b0c)] p-1.5 rounded-[8px] hover:bg-[var(--surface-2,#f1f2f5)] transition-colors cursor-pointer"
                    title="Collapse AI Copilot panel"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                </div>
              </div>

              {/* TRUE CHAT STREAM: flex-1 min-h-0 overflow-y-auto */}
              <div
                ref={perpsChatScrollRef}
                className="flex-1 min-h-0 overflow-y-auto py-3 space-y-3 scroll-smooth no-scrollbar"
              >
                {/* Empty / Initial State (Image 1 reference) */}
                {!hasInteracted && messages.length <= 1 ? (
                  <div className="h-full flex flex-col items-center justify-center py-6 text-center select-none">
                    <div className="flex justify-center mb-3">
                      <CopilotOrb isThinking={isTyping} size={80} />
                    </div>
                    <h3 className="text-[16px] font-semibold text-white tracking-tight">
                      What&apos;s your next move?
                    </h3>
                    <p className="text-[12px] text-white/50 mt-1 max-w-[240px]">
                      Start here to get your first trade idea
                    </p>
                    {/* How can I help you today? */}
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] font-mono text-white/70">
                      <span className="size-1.5 rounded-full bg-[#B6F5B0]" />
                      <span>
                        {selectedPair} at ${currentMarkPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Active Chat Stream of Messages */
                  messages.map((msg) => (
                    <div key={msg.id} className="w-full flex flex-col">
                      {msg.role === "user" ? (
                        /* User message bubble (Right aligned, login-style blue) */
                        <div className="ml-auto max-w-[85%] rounded-[18px] rounded-br-[4px] bg-[#2563EB] text-white px-3.5 py-2 text-[13px] font-medium shadow-[0_4px_16px_rgba(37,99,235,0.25)]">
                          {msg.text}
                        </div>
                      ) : (
                        /* Copilot agent message card (Left aligned, obsidian card) */
                        <div className="mr-auto w-full rounded-[20px] rounded-tl-[4px] bg-[#14161B] border border-white/[0.08] p-3.5 flex flex-col gap-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                          {/* Header info */}
                          <div className="flex items-center justify-between gap-1.5 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <CopilotOrb isThinking={false} size={22} />
                              <span className="font-mono font-bold tracking-wider text-white uppercase">
                                COPILOT
                              </span>
                              {msg.tradeSetup && (
                                <span
                                  className={cn(
                                    "px-1.5 py-0.5 rounded-full text-[10.5px] font-semibold uppercase tracking-wider",
                                    msg.tradeSetup.bias === "long"
                                      ? "bg-[#B6F5B0]/15 text-[#B6F5B0] border border-[#B6F5B0]/30"
                                      : "bg-[#FF5A5F]/15 text-[#FF5A5F] border border-[#FF5A5F]/30",
                                  )}
                                >
                                  {msg.tradeSetup.bias === "long" ? "Buy" : "Short"} ·{" "}
                                  {msg.tradeSetup.leverage}×
                                </span>
                              )}
                            </div>
                            <span className="text-white/40 font-mono text-[10.5px]">
                              {msg.timestamp}
                            </span>
                          </div>

                          {/* Text copy */}
                          {msg.text && (
                            <p className="text-[13px] text-white/90 leading-relaxed font-normal">
                              {msg.text}
                            </p>
                          )}

                          {/* Trade parameters card (Image 2 reference) */}
                          {msg.tradeSetup && (
                            <div className="mt-1 pt-2.5 border-t border-white/[0.08] flex flex-col gap-2.5 font-mono text-[11px]">
                              <div className="grid grid-cols-3 divide-x divide-white/[0.06] bg-[#0E0F13] p-2.5 rounded-[12px] border border-white/[0.06] text-center">
                                <div className="flex flex-col pr-1 min-w-0">
                                  <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium whitespace-nowrap">
                                    Entry
                                  </span>
                                  <span
                                    className="text-[12px] font-bold text-white mt-0.5 whitespace-nowrap"
                                    title={msg.tradeSetup.entryZone}
                                  >
                                    {msg.tradeSetup.entryZone}
                                  </span>
                                </div>
                                <div className="flex flex-col px-1 min-w-0">
                                  <span className="text-[10px] uppercase tracking-wider text-[#B6F5B0]/80 font-medium whitespace-nowrap">
                                    Target
                                  </span>
                                  <span
                                    className="text-[12px] font-bold text-[#B6F5B0] mt-0.5 whitespace-nowrap"
                                    title={msg.tradeSetup.takeProfit}
                                  >
                                    {msg.tradeSetup.takeProfit}
                                  </span>
                                </div>
                                <div className="flex flex-col pl-1 min-w-0">
                                  <span className="text-[10px] uppercase tracking-wider text-[#FF5A5F]/80 font-medium whitespace-nowrap">
                                    Stop
                                  </span>
                                  <span
                                    className="text-[12px] font-bold text-[#FF5A5F] mt-0.5 whitespace-nowrap"
                                    title={msg.tradeSetup.stopLoss}
                                  >
                                    {msg.tradeSetup.stopLoss}
                                  </span>
                                </div>
                              </div>

                              {msg.tradeSetup.invalidation && (
                                <div className="text-[10.5px] font-mono text-white/50 leading-tight">
                                  <span className="text-white/40">Invalidation: </span>
                                  <span>{msg.tradeSetup.invalidation}</span>
                                </div>
                              )}

                              {/* 1-click action: Load into Order Ticket / Quick Long / Quick Short / Fill ticket */}
                              <button
                                type="button"
                                onClick={() => handleLoadSetup(msg.tradeSetup!, msg.id)}
                                className={cn(
                                  "w-full h-9 rounded-full font-medium text-[12px] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98",
                                  msg.tradeSetup.bias === "long"
                                    ? "bg-[#B6F5B0]/15 hover:bg-[#B6F5B0]/25 text-[#B6F5B0] border border-[#B6F5B0]/30"
                                    : "bg-[#FF5A5F]/15 hover:bg-[#FF5A5F]/25 text-[#FF5A5F] border border-[#FF5A5F]/30",
                                )}
                                title="Load into Order Ticket"
                              >
                                {loadedSetupId === msg.id ? (
                                  <>
                                    <CheckCircle2 className="size-3.5" />
                                    <span>Order Loaded ✓</span>
                                  </>
                                ) : (
                                  <>
                                    <Zap className="size-3.5 shrink-0" />
                                    <span className="whitespace-nowrap tracking-tight font-semibold">
                                      {msg.tradeSetup.bias === "long"
                                        ? "Quick Long"
                                        : "Quick Short"}{" "}
                                      · Fill ticket
                                    </span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {/* Minimal Structured Table (if active) */}
                          {msg.table && (
                            <div className="mt-2 pt-2 border-t border-white/[0.08] flex flex-col gap-1.5">
                              <div className="flex items-center justify-between text-[11px] font-mono pb-1 border-b border-white/[0.06]">
                                <span className="font-bold text-white truncate">
                                  {msg.table.title}
                                </span>
                                {msg.table.caption && (
                                  <span className="text-white/40 text-[10px] shrink-0">
                                    {msg.table.caption}
                                  </span>
                                )}
                              </div>
                              <div className="overflow-x-auto max-h-40">
                                <table className="w-full text-left font-mono text-[10px]">
                                  <thead>
                                    <tr className="border-b border-white/[0.06] text-[9.5px] uppercase tracking-wider text-white/40">
                                      {msg.table.headers.map((h, hIdx) => (
                                        <th key={hIdx} className="px-1.5 py-0.5 whitespace-nowrap">
                                          {h}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {msg.table.rows.map((row, rIdx) => (
                                      <tr
                                        key={rIdx}
                                        className="border-b border-white/[0.06] last:border-b-0"
                                      >
                                        {row.map((cell, cIdx) => (
                                          <td
                                            key={cIdx}
                                            className="px-1.5 py-0.5 whitespace-nowrap"
                                          >
                                            {cell.variant === "badge" ? (
                                              <span className="rounded-[4px] bg-white/5 border border-white/10 px-1 py-0.5 text-[9.5px] text-white font-semibold">
                                                {cell.text}
                                              </span>
                                            ) : cell.variant === "mint" ? (
                                              <span className="text-[#B6F5B0] font-semibold">
                                                {cell.text}
                                              </span>
                                            ) : cell.variant === "coral" ? (
                                              <span className="text-[#FF5A5F] font-semibold">
                                                {cell.text}
                                              </span>
                                            ) : cell.variant === "muted" ? (
                                              <span className="text-white/40">{cell.text}</span>
                                            ) : (
                                              <span className="text-white/80">{cell.text}</span>
                                            )}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* PINNED BOTTOM CONTROLS (Image 1 reference) */}
              <div className="shrink-0 pt-3 border-t border-white/[0.06] space-y-2.5 relative z-10 bg-[#0E0F13]">
                {/* Recommended tasks moved DOWN: 2x2 grid */}
                <div className="grid grid-cols-2 gap-1.5 w-full">
                  <button
                    type="button"
                    onClick={() => sendMessage("Find Scalp")}
                    className="h-[34px] rounded-full bg-[#14161B] hover:bg-[#1E2028] border border-white/[0.08] hover:border-white/20 text-white font-medium text-[12px] flex items-center justify-center transition-all cursor-pointer active:scale-98"
                  >
                    Find scalp
                  </button>
                  <button
                    type="button"
                    onClick={() => sendMessage("Find Swing")}
                    className="h-[34px] rounded-full bg-[#14161B] hover:bg-[#1E2028] border border-white/[0.08] hover:border-white/20 text-white font-medium text-[12px] flex items-center justify-center transition-all cursor-pointer active:scale-98"
                  >
                    Find swing
                  </button>
                  <button
                    type="button"
                    onClick={() => sendMessage("Check Funding")}
                    className="h-[34px] rounded-full bg-[#14161B] hover:bg-[#1E2028] border border-white/[0.08] hover:border-white/20 text-white font-medium text-[12px] flex items-center justify-center transition-all cursor-pointer active:scale-98"
                  >
                    Check funding
                  </button>
                  <button
                    type="button"
                    onClick={() => sendMessage("Find Hedge")}
                    className="h-[34px] rounded-full bg-[#14161B] hover:bg-[#1E2028] border border-white/[0.08] hover:border-white/20 text-white font-medium text-[12px] flex items-center justify-center transition-all cursor-pointer active:scale-98"
                  >
                    Find hedge
                  </button>
                  {/* Find Value */}
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
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-white/40">Initial margin</span>
                        <button
                          type="button"
                          onClick={() => {
                            const presets = [500, 1000, 2500, 5000];
                            const next =
                              presets[(presets.indexOf(marginPreset) + 1) % presets.length] ?? 500;
                            setMarginPreset(next);
                          }}
                          className="h-8 rounded-[10px] bg-[#14161B] hover:bg-[#1A1D24] border border-white/[0.08] text-white font-mono text-[11px] font-semibold flex items-center justify-between px-2 cursor-pointer transition-colors"
                          title="Click to cycle margin preset"
                        >
                          <span>${marginPreset}</span>
                          <span className="text-[9px] text-white/30">▼</span>
                        </button>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-white/40">Style</span>
                        <button
                          type="button"
                          onClick={() => {
                            const styles: Array<"Day" | "Swing" | "Scalp"> = [
                              "Day",
                              "Swing",
                              "Scalp",
                            ];
                            const next = styles[(styles.indexOf(tradeStyle) + 1) % styles.length] ?? "Day";
                            setTradeStyle(next);
                          }}
                          className="h-8 rounded-[10px] bg-[#14161B] hover:bg-[#1A1D24] border border-white/[0.08] text-white font-mono text-[11px] font-semibold flex items-center justify-between px-2 cursor-pointer transition-colors"
                          title="Click to cycle trade style"
                        >
                          <span>{tradeStyle}</span>
                          <span className="text-[9px] text-white/30">▼</span>
                        </button>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-white/40">Strategy</span>
                        <button
                          type="button"
                          onClick={() => {
                            const strats: Array<"Max Gain" | "Conservative" | "High R:R"> = [
                              "Max Gain",
                              "Conservative",
                              "High R:R",
                            ];
                            const next =
                              strats[(strats.indexOf(tradeStrategy) + 1) % strats.length] ?? "Max Gain";
                            setTradeStrategy(next);
                          }}
                          className="h-8 rounded-[10px] bg-[#14161B] hover:bg-[#1A1D24] border border-white/[0.08] text-white font-mono text-[11px] font-semibold flex items-center justify-between px-2 cursor-pointer transition-colors"
                          title="Click to cycle strategy"
                        >
                          <span className="truncate">{tradeStrategy}</span>
                          <span className="text-[9px] text-white/30">▼</span>
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
                    className="w-full h-11 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[13px] shadow-[0_8px_24px_-8px_rgba(37,99,235,0.7)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all"
                  >
                    <Sparkles className="size-4 text-white" />
                    <span>Ask Long/Short</span>
                  </button>
                )}

                {/* Chat input field */}
                <div className="h-[40px] rounded-[14px] border border-white/[0.08] bg-[#14161B] focus-within:border-[#2563EB]/60 flex items-center px-3 gap-2 transition-colors">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && chatInput.trim()) {
                        sendMessage(chatInput.trim());
                      }
                    }}
                    placeholder="Ask Copilot…"
                    className="flex-1 bg-transparent text-white text-[13px] placeholder:text-white/40 outline-none min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (chatInput.trim()) sendMessage(chatInput.trim());
                    }}
                    disabled={!chatInput.trim()}
                    className="size-7 rounded-full bg-white/10 hover:bg-[#2563EB] disabled:opacity-30 disabled:hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <Send className="size-3.5" />
                  </button>
                </div>

                {/* Subtle Disclaimer */}
                <div className="text-center">
                  <span className="text-[11px] font-mono text-white/35">
                    godcandle Copilot may make mistakes. NFA.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              COLUMN 2: Center Column — Maximized Pro Chart + Compact Summary Strip
              ===================================================================== */}
          <div className="order-1 lg:order-none flex flex-col gap-3 min-h-[480px] sm:min-h-[560px] lg:min-h-0 overflow-hidden h-full">
            {/* Maximized TradingView Pro Chart */}
            <Card className="flex flex-col rounded-[20px] border-[var(--border-subtle,rgba(10,10,12,0.08))] bg-[var(--surface-1,#ffffff)] shadow-sm overflow-hidden flex-1 min-h-0">
              {/* Clean Chart Header: Symbol, Candlestick status, Settings */}
              <div className="flex flex-wrap items-center justify-between border-b border-[var(--border-subtle,rgba(10,10,12,0.08))] px-4 py-2 shrink-0 bg-transparent gap-2">
                <div className="flex flex-wrap items-center gap-2 font-mono">
                  <span className="text-[13px] font-bold text-[var(--text-primary,#0b0b0c)] tracking-tight tabular-nums">
                    $
                    {activePairMeta.mark.toLocaleString(undefined, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span
                    className={cn(
                      "text-[12px] font-semibold tabular-nums",
                      activePairMeta.change24h.startsWith("+")
                        ? "text-[#087F4D]"
                        : "text-[#D92D45]",
                    )}
                  >
                    {activePairMeta.change24h}
                  </span>

                  <span className="text-[12px] text-[var(--text-tertiary,#747482)] hidden xl:inline">
                    · {selectedPair} Perpetual
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setChartReloadKey((k) => k + 1)}
                    className="h-7 w-7 text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)] hover:bg-[var(--surface-2,#f1f2f5)] cursor-pointer rounded-[8px]"
                    title="Reload chart widget"
                  >
                    <RotateCw className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPositionLines((prev) => !prev)}
                    className={cn(
                      "h-7 w-7 cursor-pointer rounded-[8px] transition-colors",
                      showPositionLines
                        ? "text-[#2563EB] bg-[#2563EB]/15 hover:bg-[#2563EB]/25"
                        : "text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)] hover:bg-[var(--surface-2,#f1f2f5)]",
                    )}
                    title={
                      showPositionLines
                        ? "Hide position lines on chart"
                        : "Show position lines on chart"
                    }
                  >
                    <SlidersHorizontal className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* Chart Embedded View & Position Lines Overlay */}
              <div className="flex-1 bg-transparent relative min-h-0">
                <iframe
                  title="TradingView Chart"
                  key={`${selectedPair}-${chartReloadKey}`}
                  src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_1&symbol=${encodeURIComponent(
                    activePairMeta.tvSymbol,
                  )}&interval=${chartInterval}&hidesidetoolbar=0&hide_side_toolbar=0&symboledit=1&saveimage=1&toolbarbg=${resolvedTheme === "light" ? "F1F2F5" : "17181B"}&studies=%5B%5D&theme=${resolvedTheme}&style=1&timezone=Etc%2FUTC&withdateranges=1&studies_overrides=%7B%7D&overrides=${encodeURIComponent(
                    JSON.stringify(tvChartOverrides),
                  )}&enabled_features=%5B%22side_toolbar_in_fullscreen%22%2C%22header_in_fullscreen%22%5D&disabled_features=%5B%5D&locale=en`}
                  style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                />

                {/* Horizontal Open Position Lines Overlay (Entry & Liquidation) */}
                {showPositionLines && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                    {positions
                      .filter((p) => p.pair === selectedPair)
                      .map((pos) => {
                        const entryNum = parseFloat(pos.entry.replace(/[^0-9.]/g, ""));
                        const liqNum = parseFloat(pos.liq.replace(/[^0-9.]/g, ""));
                        const markNum = activePairMeta.mark;

                        if (isNaN(entryNum) || isNaN(liqNum)) return null;

                        const spread = Math.max(
                          Math.abs(markNum - liqNum),
                          Math.abs(markNum - entryNum),
                          markNum * 0.08,
                        );
                        const highBound = markNum + spread * 1.35;
                        const lowBound = markNum - spread * 1.35;

                        const getTopPct = (price: number) => {
                          const clamped = Math.max(lowBound, Math.min(highBound, price));
                          const raw = (1 - (clamped - lowBound) / (highBound - lowBound)) * 80 + 10;
                          return Math.max(8, Math.min(92, raw));
                        };

                        const entryTop = getTopPct(entryNum);
                        const liqTop = getTopPct(liqNum);

                        return (
                          <div key={`chart-lines-${pos.id}`}>
                            {/* Entry Price Horizontal Line */}
                            <div
                              className="absolute left-0 right-0 flex items-center transition-all duration-300 pointer-events-none"
                              style={{ top: `${entryTop}%` }}
                            >
                              <div className="flex-1 border-b border-dashed border-[#B6F5B0]/80 shadow-[0_0_8px_rgba(182,245,176,0.3)]" />
                              <div className="pointer-events-auto mr-3 shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#17171A]/95 border border-[#B6F5B0]/40 text-[#B6F5B0] font-mono text-[12px] font-bold shadow-md">
                                <span className="size-1.5 rounded-full bg-[#B6F5B0] animate-pulse" />
                                <span>
                                  {pos.side === "long" ? "Buy" : "Short"} {pos.size} · Entry{" "}
                                  {pos.entry}
                                </span>
                              </div>
                            </div>

                            {/* Liquidation Price Horizontal Line */}
                            <div
                              className="absolute left-0 right-0 flex items-center transition-all duration-300 pointer-events-none"
                              style={{ top: `${liqTop}%` }}
                            >
                              <div className="flex-1 border-b border-dashed border-[#FF5A5F]/80 shadow-[0_0_8px_rgba(255,90,95,0.3)]" />
                              <div className="pointer-events-auto mr-3 shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#17171A]/95 border border-[#FF5A5F]/40 text-[#FF5A5F] font-mono text-[12px] font-bold shadow-md">
                                <AlertTriangle className="size-2.5 text-[#FF5A5F]" />
                                <span>
                                  {pos.side === "long" ? "Buy" : "Short"} {pos.size} · Liq {pos.liq}
                                </span>
                                <span className="text-white/40">({pos.lev})</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                    {/* Interactive Take Profit Horizontal Line */}
                    {takeProfit && !isNaN(parseFloat(takeProfit)) && parseFloat(takeProfit) > 0 && (
                      <div
                        className="absolute left-0 right-0 flex items-center transition-all duration-300 pointer-events-none"
                        style={{
                          top: `${Math.max(10, Math.min(90, 50 - ((parseFloat(takeProfit) - activePairMeta.mark) / (activePairMeta.mark * 0.1)) * 40))}%`,
                        }}
                      >
                        <div className="flex-1 border-b border-dashed border-[#B6F5B0]/80 shadow-[0_0_8px_rgba(182,245,176,0.3)]" />
                        <div
                          className="pointer-events-auto mr-3 shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#17171A]/95 border border-[#B6F5B0]/40 text-[#B6F5B0] font-mono text-[12px] font-bold shadow-md cursor-ns-resize"
                          title="Take Profit Level"
                        >
                          <Target className="size-2.5 text-[#B6F5B0]" />
                          <span>TP ${parseFloat(takeProfit).toLocaleString()}</span>
                          {tpGainPct !== null && (
                            <span className="opacity-80 font-normal">
                              (+{Math.abs(tpGainPct).toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Interactive Stop Loss Horizontal Line */}
                    {stopLoss && !isNaN(parseFloat(stopLoss)) && parseFloat(stopLoss) > 0 && (
                      <div
                        className="absolute left-0 right-0 flex items-center transition-all duration-300 pointer-events-none"
                        style={{
                          top: `${Math.max(10, Math.min(90, 50 + ((activePairMeta.mark - parseFloat(stopLoss)) / (activePairMeta.mark * 0.1)) * 40))}%`,
                        }}
                      >
                        <div className="flex-1 border-b border-dashed border-[#FF5A5F]/80 shadow-[0_0_8px_rgba(255,90,95,0.3)]" />
                        <div
                          className="pointer-events-auto mr-3 shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#17171A]/95 border border-[#FF5A5F]/40 text-[#FF5A5F] font-mono text-[12px] font-bold shadow-md cursor-ns-resize"
                          title="Stop Loss Level"
                        >
                          <ShieldCheck className="size-2.5 text-[#FF5A5F]" />
                          <span>SL ${parseFloat(stopLoss).toLocaleString()}</span>
                          {slLossPct !== null && (
                            <span className="opacity-80 font-normal">
                              (-{Math.abs(slLossPct).toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Compact Summary Strip directly under the chart */}
            <div
              role="button"
              tabIndex={0}
              onClick={scrollToPositions}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  scrollToPositions();
                }
              }}
              className="h-10 border border-[var(--border-subtle,rgba(10,10,12,0.08))] rounded-[12px] bg-[var(--surface-1,#ffffff)] hover:bg-[var(--surface-2,#f1f2f5)] shadow-xs transition-all px-3.5 flex items-center justify-between text-[12px] font-mono shrink-0 cursor-pointer group select-none text-[var(--text-primary,#0b0b0c)]"
              title="Click to scroll to full positions & orders ledger"
            >
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="size-1.5 rounded-full bg-[#087F4D] shadow-[0_0_6px_rgba(8,127,77,0.6)] animate-pulse" />
                  <span className="font-bold text-[var(--text-primary,#0b0b0c)] whitespace-nowrap">
                    {positions.length} Positions
                  </span>
                </div>
                <span className="text-[var(--border-strong)]">·</span>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[var(--text-tertiary,#747482)]">uPnL</span>
                  <span
                    className={cn(
                      "font-bold",
                      totalUpnl >= 0 ? "text-[#087F4D]" : "text-[#D92D45]",
                    )}
                  >
                    {totalUpnl >= 0 ? "+" : "−"}$
                    {Math.abs(totalUpnl).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <span className="text-[var(--border-strong)]">·</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[var(--text-tertiary,#747482)]">Margin:</span>
                  <span className="font-semibold text-[var(--text-primary,#0b0b0c)]">14.2%</span>
                  <span className="rounded-[4px] bg-[#087F4D]/10 border border-[#087F4D]/25 px-1.5 py-0.2 text-[12px] text-[#087F4D] font-bold">
                    Safe
                  </span>
                </div>
              </div>

              {/* Right side: Maint / Equity / Free + Scroll Indicator */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex lg:hidden xl:flex items-center gap-2.5 text-[12px] text-[var(--text-secondary,#5a5a66)] border-r border-[var(--border-subtle,rgba(10,10,12,0.08))] pr-3">
                  <div className="flex items-center gap-1">
                    <span className="text-[var(--text-tertiary,#747482)]">Maint:</span>
                    <span className="font-medium text-[var(--text-primary,#0b0b0c)]">$1,820.00</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[var(--text-tertiary,#747482)]">Total Equity:</span>
                    <span className="font-bold text-[var(--text-primary,#0b0b0c)]">$96,460.00</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[var(--text-tertiary,#747482)]">Free Margin:</span>
                    <span className="font-medium text-[var(--text-primary,#0b0b0c)]">$42,180.00</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[12px] font-semibold text-[var(--text-secondary,#5a5a66)] group-hover:text-[var(--text-primary,#0b0b0c)] transition-colors">
                  <span>View Ledger</span>
                  <ChevronDown className="size-3 group-hover:translate-y-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================================
              COLUMN 3: Institutional Order Execution Ticket
              ===================================================================== */}
          <div className="order-2 lg:order-none flex flex-col rounded-[24px] border border-[var(--border-subtle,rgba(10,10,12,0.08))] bg-[var(--surface-1,#ffffff)] p-3.5 sm:p-4 justify-between min-h-0 h-full relative shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden text-[var(--text-primary,#0b0b0c)]">
            {/* Subtle sapphire ambient gradient glow in the ticket backdrop */}
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.08),transparent_70%)] pointer-events-none" />

            {/* Ticket Header: Clean single row with title, Copilot sync badge, and Margin Mode / Leverage pill */}
            <div className="flex items-center justify-between pb-3 shrink-0 relative z-10 border-b border-[var(--border-subtle,rgba(10,10,12,0.08))]">
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-[15px] font-semibold text-[var(--text-primary,#0b0b0c)] tracking-tight leading-none truncate">
                    Trade {selectedPair}
                  </h2>
                  {loadedSetupNotice && (
                    <span className="text-[10px] font-mono text-[#2563EB] bg-[#2563EB]/10 border border-[#2563EB]/25 px-2 py-0.5 rounded-full animate-pulse whitespace-nowrap hidden sm:inline-block">
                      Copilot Synced
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Control Pill: Cross · 10x with Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="h-[28px] rounded-full px-2.5 bg-[var(--surface-2,#f1f2f5)] hover:bg-[var(--surface-3,#e6e8ec)] border border-[var(--border-subtle,rgba(10,10,12,0.08))] text-[var(--text-primary,#0b0b0c)] font-mono text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs hover:border-[var(--border-default)]"
                      title="Configure Margin Mode & Leverage"
                    >
                      <span>
                        {marginMode === "cross" ? "Cross" : "Isolated"} · {leverage}×
                      </span>
                      <ChevronDown className="size-3 text-[var(--text-tertiary,#747482)]" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="w-[280px] p-3 rounded-[16px] bg-[var(--surface-1,#ffffff)] border border-[var(--border-subtle,rgba(10,10,12,0.08))] text-[var(--text-primary,#0b0b0c)] shadow-xl space-y-3 z-50 font-mono"
                  >
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[var(--text-tertiary,#747482)] font-semibold border-b border-[var(--border-subtle,rgba(10,10,12,0.08))] pb-1.5">
                      <span>Margin Mode</span>
                      <span className="text-[var(--text-secondary,#5a5a66)]">{selectedPair}</span>
                    </div>

                    {/* Cross / Isolated Mode Selector */}
                    <div className="grid grid-cols-2 gap-1.5 bg-[var(--surface-2,#f1f2f5)] p-1 rounded-[10px]">
                      <button
                        type="button"
                        onClick={() => setMarginMode("cross")}
                        className={cn(
                          "h-[28px] rounded-[7px] text-[11px] font-medium border transition-all cursor-pointer flex items-center justify-center gap-1",
                          marginMode === "cross"
                            ? "bg-[var(--surface-1,#ffffff)] text-[var(--text-primary,#0b0b0c)] font-bold border-[var(--border-default)] shadow-xs"
                            : "bg-transparent text-[var(--text-secondary,#5a5a66)] border-transparent hover:text-[var(--text-primary,#0b0b0c)]",
                        )}
                      >
                        Cross
                      </button>
                      <button
                        type="button"
                        onClick={() => setMarginMode("isolated")}
                        className={cn(
                          "h-[28px] rounded-[7px] text-[11px] font-medium border transition-all cursor-pointer flex items-center justify-center gap-1",
                          marginMode === "isolated"
                            ? "bg-[var(--surface-1,#ffffff)] text-[var(--text-primary,#0b0b0c)] font-bold border-[var(--border-default)] shadow-xs"
                            : "bg-transparent text-[var(--text-secondary,#5a5a66)] border-transparent hover:text-[var(--text-primary,#0b0b0c)]",
                        )}
                      >
                        Isolated
                      </button>
                    </div>

                    {/* Leverage Presets & Slider */}
                    <div className="space-y-1.5 pt-1 border-t border-[var(--border-subtle,rgba(10,10,12,0.08))]">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[var(--text-secondary,#5a5a66)]">Leverage:</span>
                        <span className="font-bold text-[var(--text-primary,#0b0b0c)]">{leverage}×</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        {[1, 5, 10, 25, 50].map((tick) => (
                          <button
                            key={tick}
                            type="button"
                            onClick={() => updateLeverage(tick)}
                            className={cn(
                              "h-[24px] rounded-[6px] text-[10px] font-mono transition-all cursor-pointer border text-center flex items-center justify-center",
                              leverage === tick
                                ? "bg-[var(--surface-2,#f1f2f5)] text-[var(--text-primary,#0b0b0c)] font-bold border-[var(--border-default)] shadow-xs"
                                : "bg-[var(--surface-1,#ffffff)] text-[var(--text-secondary,#5a5a66)] border-[var(--border-subtle,rgba(10,10,12,0.08))] hover:bg-[var(--surface-2,#f1f2f5)]",
                            )}
                          >
                            {tick}×
                          </button>
                        ))}
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={50}
                        value={leverage}
                        onChange={(e) => updateLeverage(Number(e.target.value))}
                        style={{
                          ["--slider-track" as string]: `linear-gradient(to right, rgba(37, 99, 235, 0.75) 0%, rgba(37, 99, 235, 0.5) ${((leverage - 1) / 49) * 100}%, rgba(10, 10, 12, 0.08) ${((leverage - 1) / 49) * 100}%, rgba(10, 10, 12, 0.08) 100%)`,
                        }}
                        className="options-slider leverage-slider cursor-pointer w-full"
                      />
                      <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary,#747482)] pt-1">
                        <span>Est. Liq Distance:</span>
                        <span
                          className={cn(
                            "font-semibold",
                            leverage <= 10
                              ? "text-[#087F4D]"
                              : leverage <= 25
                                ? "text-[var(--text-primary,#0b0b0c)]"
                                : "text-[#D92D45]",
                          )}
                        >
                          ±{liqBufferPct}%
                        </span>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* 1-click Undo AI button if snapshot exists */}
                {previousTicketState && (
                  <button
                    type="button"
                    onClick={handleUndoAi}
                    className="h-[28px] rounded-full px-2 bg-[var(--surface-2,#f1f2f5)] hover:bg-[var(--surface-3,#e6e8ec)] border border-[var(--border-subtle,rgba(10,10,12,0.08))] text-[11px] font-mono text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    title="Undo AI pre-filled ticket changes"
                  >
                    <Undo2 className="size-3 text-[#2563EB]" />
                    <span className="hidden sm:inline">Undo</span>
                  </button>
                )}

                {/* Keyboard shortcuts (?) button */}
                <button
                  type="button"
                  onClick={() => setIsShortcutsOpen(true)}
                  className="size-[28px] rounded-full bg-[var(--surface-2,#f1f2f5)] hover:bg-[var(--surface-3,#e6e8ec)] border border-[var(--border-subtle,rgba(10,10,12,0.08))] flex items-center justify-center text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)] transition-colors cursor-pointer font-mono text-[12px] font-bold shadow-2xs"
                  title="Keyboard Shortcuts (?)"
                >
                  ?
                </button>
              </div>
            </div>

            {loadedSetupNotice && (
              <div className="my-1.5 flex items-center gap-2 rounded-[12px] bg-[var(--surface-2,#f1f2f5)] border border-[var(--border-default)] px-3 py-1.5 text-[12px] text-[var(--text-primary,#0b0b0c)] relative z-10 shrink-0">
                <CheckCircle2 className="size-3.5 shrink-0 text-[#087F4D]" />
                <span className="truncate font-mono">{loadedSetupNotice}</span>
              </div>
            )}

            {/* Ticket Form Elements (Directly inside single card container - NO window inside a window) */}
            <div className="flex-1 flex flex-col justify-between gap-2 overflow-y-auto no-scrollbar pt-2 relative z-10">
              <div className="space-y-2.5">
                {/* 1. Side Selector: Buy (Long) vs Short with sleek segmented pill wrapper */}
                <div className="p-1 rounded-[14px] bg-[var(--surface-2,#f1f2f5)] border border-[var(--border-subtle,rgba(10,10,12,0.06))] grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setSide("long")}
                    className={cn(
                      "h-[34px] rounded-[10px] text-[12.5px] font-medium transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 select-none",
                      side === "long"
                        ? "bg-[var(--surface-1,#ffffff)] text-[var(--text-primary,#0b0b0c)] border border-[var(--border-subtle,rgba(10,10,12,0.1))] shadow-xs font-semibold"
                        : "text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)] border border-transparent",
                    )}
                  >
                    {side === "long" && (
                      <span className="size-1.5 rounded-full bg-[#087F4D] shadow-[0_0_6px_#087F4D]" />
                    )}
                    <span>Buy (Long)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSide("short")}
                    className={cn(
                      "h-[34px] rounded-[10px] text-[12.5px] font-medium transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 select-none",
                      side === "short"
                        ? "bg-[var(--surface-1,#ffffff)] text-[var(--text-primary,#0b0b0c)] border border-[var(--border-subtle,rgba(10,10,12,0.1))] shadow-xs font-semibold"
                        : "text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)] border border-transparent",
                    )}
                  >
                    {side === "short" && (
                      <span className="size-1.5 rounded-full bg-[#D92D45] shadow-[0_0_6px_#D92D45]" />
                    )}
                    <span>Short</span>
                  </button>
                </div>

                {/* 2. Order Types: Single Row (Market | Limit | Stop + More ▾) */}
                <div className="p-0.5 rounded-[10px] bg-[var(--surface-2,#f1f2f5)] border border-[var(--border-subtle,rgba(10,10,12,0.05))] grid grid-cols-4 gap-0.5">
                  {(
                    [
                      { id: "market", label: "Market" },
                      { id: "limit", label: "Limit" },
                      { id: "stop-market", label: "Stop" },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setOrderType(t.id)}
                      className={cn(
                        "h-[28px] rounded-[8px] text-[11px] font-medium transition-all duration-150 cursor-pointer flex items-center justify-center font-mono select-none",
                        orderType === t.id
                          ? "bg-[var(--surface-1,#ffffff)] text-[var(--text-primary,#0b0b0c)] border border-[var(--border-subtle,rgba(10,10,12,0.1))] shadow-2xs font-semibold"
                          : "text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)] border border-transparent",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                  <Popover open={isMoreOrderTypesOpen} onOpenChange={setIsMoreOrderTypesOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "h-[28px] rounded-[8px] text-[11px] font-medium transition-all duration-150 cursor-pointer flex items-center justify-center gap-1 font-mono select-none",
                          ["stop-limit", "twap", "scale"].includes(orderType)
                            ? "bg-[var(--surface-1,#ffffff)] text-[var(--text-primary,#0b0b0c)] border border-[var(--border-subtle,rgba(10,10,12,0.1))] shadow-2xs font-semibold"
                            : "text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)] border border-transparent",
                        )}
                      >
                        <span>More</span>
                        <ChevronDown className="size-3 text-[var(--text-tertiary,#747482)]" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="end"
                      className="w-[160px] p-1.5 rounded-[12px] bg-[var(--surface-1,#ffffff)] border border-[var(--border-subtle,rgba(10,10,12,0.08))] text-[11px] font-mono text-[var(--text-primary,#0b0b0c)] shadow-xl space-y-1 z-50"
                    >
                      {[
                        { id: "stop-limit", label: "Stop-Limit" },
                        { id: "twap", label: "TWAP" },
                        { id: "scale", label: "Scale In" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setOrderType(item.id as OrderType);
                            setIsMoreOrderTypesOpen(false);
                            toast.info(`Selected ${item.label} order execution`);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-[6px] hover:bg-[var(--surface-2,#f1f2f5)] transition-colors flex items-center justify-between"
                        >
                          <span>{item.label}</span>
                          {orderType === item.id && <Check className="size-3 text-[#087F4D]" />}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 3. Price Input with Bid / Mid / Ask (for Limit & Stop) */}
                {orderType !== "market" && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between font-mono text-[10.5px]">
                      <Label className="text-[var(--text-secondary,#5a5a66)] uppercase text-[10px] tracking-wider font-semibold">
                        {orderType === "limit" ? "Limit Price (USDT)" : "Trigger Price (USDT)"}
                      </Label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setLimitPrice(
                              (currentMarkPrice * 0.9995).toFixed(currentMarkPrice > 1000 ? 1 : 2),
                            )
                          }
                          className="px-2 py-0.5 rounded-[5px] bg-[var(--surface-2,#f1f2f5)] hover:bg-[var(--surface-3,#e6e8ec)] border border-[var(--border-subtle,rgba(10,10,12,0.08))] text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)] transition-colors cursor-pointer text-[10px] font-semibold"
                          title="Fill best Bid"
                        >
                          Bid
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setLimitPrice(currentMarkPrice.toFixed(currentMarkPrice > 1000 ? 1 : 2))
                          }
                          className="px-2 py-0.5 rounded-[5px] bg-[var(--surface-2,#f1f2f5)] hover:bg-[var(--surface-3,#e6e8ec)] border border-[var(--border-subtle,rgba(10,10,12,0.08))] text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)] transition-colors cursor-pointer text-[10px] font-semibold"
                          title="Fill Mid price"
                        >
                          Mid
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setLimitPrice(
                              (currentMarkPrice * 1.0005).toFixed(currentMarkPrice > 1000 ? 1 : 2),
                            )
                          }
                          className="px-2 py-0.5 rounded-[5px] bg-[var(--surface-2,#f1f2f5)] hover:bg-[var(--surface-3,#e6e8ec)] border border-[var(--border-subtle,rgba(10,10,12,0.08))] text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)] transition-colors cursor-pointer text-[10px] font-semibold"
                          title="Fill best Ask"
                        >
                          Ask
                        </button>
                      </div>
                    </div>
                    <div className="flex h-[36px] items-center rounded-[12px] border border-[var(--border-subtle,rgba(10,10,12,0.08))] bg-[var(--surface-2,#f1f2f5)] text-[var(--text-primary,#0b0b0c)] px-3 font-mono focus-within:border-[#2563EB]/60 focus-within:ring-2 focus-within:ring-[#2563EB]/15 transition-all">
                      <input
                        type="number"
                        placeholder={currentMarkPrice.toLocaleString()}
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        className="w-full bg-transparent text-[12.5px] outline-none tabular-nums text-[var(--text-primary,#0b0b0c)] font-medium"
                      />
                      <span className="text-[11px] text-[var(--text-tertiary,#747482)] shrink-0 font-medium tracking-tight">USDT</span>
                    </div>
                  </div>
                )}

                {/* 4. Position Size with clean unit switch pill & simple % chips */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-mono">
                    <span className="text-[var(--text-secondary,#5a5a66)] text-[10.5px] uppercase tracking-wider font-semibold">
                      Size ({sizeUnit === "base" ? baseAsset : "USDC"}){/* Size ({baseAsset}) */}
                    </span>
                    <span className="text-[var(--text-primary,#0b0b0c)] font-medium tabular-nums text-[11px]">
                      {orderValue}
                    </span>
                  </div>

                  {/* Clean Input with integrated unit switch pill */}
                  <div className="relative">
                    <input
                      type="number"
                      placeholder={
                        sizeUnit === "base"
                          ? activePairMeta.defaultSize
                          : Math.round(
                              parseFloat(activePairMeta.defaultSize) * currentMarkPrice,
                            ).toString()
                      }
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="h-[36px] rounded-[12px] bg-[var(--surface-2,#f1f2f5)] border border-[var(--border-subtle,rgba(10,10,12,0.08))] px-3 pr-22 text-[var(--text-primary,#0b0b0c)] text-[12.5px] font-medium w-full outline-none tabular-nums font-mono focus:border-[#2563EB]/60 focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
                    />
                    <button
                      type="button"
                      onClick={toggleSizeUnit}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-[7px] bg-[var(--surface-1,#ffffff)] hover:bg-[var(--surface-3,#e6e8ec)] text-[var(--text-primary,#0b0b0c)] text-[10.5px] font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 border border-[var(--border-subtle,rgba(10,10,12,0.1))] shadow-2xs active:scale-95"
                      title="Toggle entry between Base Asset and USDC"
                    >
                      <span>{sizeUnit === "base" ? "USDC ⇄" : `${baseAsset} ⇄`}</span>
                    </button>
                  </div>

                  {/* Discrete % chips */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[0.25, 0.5, 0.75, 1.0].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handlePercentSize(pct)}
                        className="h-[24px] rounded-[7px] bg-[var(--surface-2,#f1f2f5)] hover:bg-[var(--surface-3,#e6e8ec)] border border-[var(--border-subtle,rgba(10,10,12,0.08))] text-[10.5px] font-mono font-medium text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)] transition-colors cursor-pointer text-center select-none active:scale-95"
                      >
                        {pct === 1.0 ? "Max" : `${Math.round(pct * 100)}%`}
                      </button>
                    ))}
                  </div>

                  {/* Subtext Conversion Helper */}
                  <div className="flex items-center justify-between text-[10px] font-mono px-0.5 text-[var(--text-tertiary,#747482)]">
                    <span className="tabular-nums">
                      {sizeUnit === "base" ? (
                        hasValidSize ? (
                          <>
                            ≈ $
                            {(sizeNum * currentMarkPrice).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            USDC
                          </>
                        ) : (
                          `≈ $${(defaultAssetSize * currentMarkPrice).toLocaleString()} USDC`
                        )
                      ) : hasValidSize ? (
                        <>
                          ≈ {(sizeNum / currentMarkPrice).toFixed(currentMarkPrice > 1000 ? 4 : 2)}{" "}
                          {baseAsset}
                        </>
                      ) : (
                        `≈ ${defaultAssetSize} ${baseAsset}`
                      )}
                    </span>
                    <span className="text-[var(--text-tertiary,#747482)]">Available: $42,180.00 USDT</span>
                  </div>
                </div>

                {/* 5. Leverage Selector */}
                <div className="pt-2 border-t border-[var(--border-subtle,rgba(10,10,12,0.08))] space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--text-secondary,#5a5a66)] uppercase text-[10px] tracking-wider font-semibold">Leverage</span>
                      <span className="text-[var(--text-primary,#0b0b0c)] font-bold text-[11px] tabular-nums">
                        {leverage}×
                      </span>
                    </div>
                    {/* Clear Liquidation Buffer Feedback */}
                    <div className="flex items-center gap-1.5 text-[10.5px]">
                      <span className="text-[var(--text-tertiary,#747482)]">Buffer:</span>
                      <span
                        className={cn(
                          "font-semibold tabular-nums px-1.5 py-0.2 rounded-[4px]",
                          leverage <= 5
                            ? "text-[#087F4D] bg-[#087F4D]/10"
                            : leverage <= 15
                              ? "text-[var(--text-primary,#0b0b0c)] bg-[var(--surface-2,#f1f2f5)]"
                              : "text-[#D92D45] bg-[#D92D45]/10",
                        )}
                        title={`Estimated price move to liquidation: ~±${liqBufferPct}%`}
                      >
                        ±{liqBufferPct}%
                      </span>
                    </div>
                  </div>

                  {/* Discrete Preset Chips: [1, 5, 10, 25, 50] */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 5, 10, 25, 50].map((tick) => (
                      <button
                        key={tick}
                        type="button"
                        onClick={() => updateLeverage(tick)}
                        className={cn(
                          "h-[24px] rounded-[7px] text-[10.5px] font-mono font-medium transition-all cursor-pointer border text-center flex items-center justify-center select-none active:scale-95",
                          leverage === tick
                            ? "bg-[var(--surface-1,#ffffff)] text-[var(--text-primary,#0b0b0c)] font-bold border-[var(--border-default)] shadow-xs"
                            : "bg-[var(--surface-2,#f1f2f5)] text-[var(--text-secondary,#5a5a66)] border-[var(--border-subtle,rgba(10,10,12,0.08))] hover:bg-[var(--surface-3,#e6e8ec)] hover:text-[var(--text-primary,#0b0b0c)]",
                        )}
                      >
                        {tick}×
                      </button>
                    ))}
                  </div>

                  {/* Tactile Slider with dynamic track */}
                  <div className="pt-0.5">
                    <input
                      type="range"
                      min={1}
                      max={50}
                      value={leverage}
                      onChange={(e) => updateLeverage(Number(e.target.value))}
                      style={{
                        ["--slider-track" as string]: `linear-gradient(to right, rgba(37, 99, 235, 0.75) 0%, rgba(37, 99, 235, 0.5) ${((leverage - 1) / 49) * 100}%, rgba(10, 10, 12, 0.08) ${((leverage - 1) / 49) * 100}%, rgba(10, 10, 12, 0.08) 100%)`,
                      }}
                      className="options-slider leverage-slider cursor-pointer w-full"
                    />
                  </div>
                </div>

                {/* 6. Reduce Only Checkbox & Collapsed Advanced Accordion */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] py-0.5 select-none font-mono">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)] transition-colors">
                      <input
                        type="checkbox"
                        checked={reduceOnly}
                        onChange={(e) => setReduceOnly(e.target.checked)}
                        className="size-3.5 rounded-[4px] border-[var(--border-default)] bg-[var(--surface-2,#f1f2f5)] accent-[#2563EB] cursor-pointer"
                      />
                      <span className="text-[11px] font-medium">Reduce Only</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setAdvancedOpen((prev) => !prev)}
                      className="text-[10.5px] text-[var(--text-tertiary,#747482)] hover:text-[var(--text-primary,#0b0b0c)] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Advanced</span>
                      <ChevronDown
                        className={cn("size-3 transition-transform duration-200", advancedOpen && "rotate-180")}
                      />
                    </button>
                  </div>

                  {advancedOpen && (
                    <div className="p-2.5 rounded-[10px] bg-[var(--surface-2,#f1f2f5)] border border-[var(--border-subtle,rgba(10,10,12,0.08))] space-y-2 text-[10.5px] font-mono animate-in fade-in-50 duration-150">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 cursor-pointer text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)]">
                          <input
                            type="checkbox"
                            checked={postOnly}
                            onChange={(e) => setPostOnly(e.target.checked)}
                            className="size-3.5 rounded-[4px] border-[var(--border-default)] bg-[var(--surface-1,#ffffff)] accent-[#2563EB] cursor-pointer"
                          />
                          <span>Post-Only (Maker)</span>
                        </label>
                        <span className="text-[var(--text-tertiary,#747482)]">Guarantees rebate</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-secondary,#5a5a66)]">Time in Force</span>
                        <div className="flex items-center gap-1">
                          {(["GTC", "IOC", "FOK"] as const).map((tif) => (
                            <button
                              key={tif}
                              type="button"
                              onClick={() => setTimeInForce(tif)}
                              className={cn(
                                "px-2 py-0.5 rounded-[5px] border text-[9.5px] font-mono transition-colors cursor-pointer",
                                timeInForce === tif
                                  ? "bg-[var(--surface-1,#ffffff)] text-[var(--text-primary,#0b0b0c)] font-bold border-[var(--border-default)] shadow-2xs"
                                  : "bg-transparent text-[var(--text-secondary,#5a5a66)] border-transparent hover:bg-[var(--surface-3,#e6e8ec)]",
                              )}
                            >
                              {tif}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 7. TP / SL (Take Profit & Stop Loss) Expandable Section */}
                <div className="pt-2 border-t border-[var(--border-subtle,rgba(10,10,12,0.08))]">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setTpSlExpanded(!tpSlExpanded)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setTpSlExpanded(!tpSlExpanded);
                      }
                    }}
                    className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary,#5a5a66)] cursor-pointer select-none hover:text-[var(--text-primary,#0b0b0c)] transition-colors py-0.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <ChevronDown
                        className={cn(
                          "size-3 transition-transform duration-200 text-[var(--text-tertiary,#747482)]",
                          tpSlExpanded ? "rotate-0" : "-rotate-90",
                        )}
                      />
                      <span className="uppercase tracking-wider font-semibold text-[10px]">
                        TP / SL Protection
                      </span>
                    </div>
                    {riskRewardRatio ? (
                      <span className="text-[var(--text-primary,#0b0b0c)] font-bold font-mono text-[11px] px-1.5 py-0.2 rounded-[4px] bg-[var(--surface-2,#f1f2f5)]">
                        R:R {riskRewardRatio}
                      </span>
                    ) : (
                      <span className="text-[var(--text-tertiary,#747482)] text-[10.5px]">
                        {tpSlExpanded ? "Expanded" : "Tap to expand"}
                      </span>
                    )}
                  </div>

                  {tpSlExpanded && (
                    <div className="space-y-2 pt-2 border-t border-[var(--border-subtle,rgba(10,10,12,0.06))] mt-1.5 animate-in fade-in-50 duration-150">
                      {/* Quick preset chips for rapid risk parameterization */}
                      <div className="grid grid-cols-3 gap-1 font-mono text-[10px]">
                        <button
                          type="button"
                          onClick={() => {
                            const mult = side === "long" ? 1.02 : 0.98;
                            const price = activeEntryPrice * mult;
                            setTakeProfit(price.toFixed(currentMarkPrice > 1000 ? 1 : 2));
                          }}
                          className="h-[22px] rounded-[6px] bg-[var(--surface-2,#f1f2f5)] hover:bg-[#087F4D]/10 hover:text-[#087F4D] border border-[var(--border-subtle,rgba(10,10,12,0.08))] text-[var(--text-secondary,#5a5a66)] font-semibold transition-colors cursor-pointer text-center"
                        >
                          TP +2%
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const mult = side === "long" ? 0.99 : 1.01;
                            const price = activeEntryPrice * mult;
                            setStopLoss(price.toFixed(currentMarkPrice > 1000 ? 1 : 2));
                          }}
                          className="h-[22px] rounded-[6px] bg-[var(--surface-2,#f1f2f5)] hover:bg-[#D92D45]/10 hover:text-[#D92D45] border border-[var(--border-subtle,rgba(10,10,12,0.08))] text-[var(--text-secondary,#5a5a66)] font-semibold transition-colors cursor-pointer text-center"
                        >
                          SL -1%
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStopLoss("");
                            setTakeProfit("");
                          }}
                          className="h-[22px] rounded-[6px] bg-[var(--surface-2,#f1f2f5)] hover:bg-[var(--surface-3,#e6e8ec)] border border-[var(--border-subtle,rgba(10,10,12,0.08))] text-[var(--text-tertiary,#747482)] hover:text-[var(--text-primary,#0b0b0c)] font-medium transition-colors cursor-pointer text-center"
                        >
                          No TP/SL
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] text-[#D92D45] uppercase font-mono font-semibold tracking-tight">
                              Stop Loss
                            </Label>
                            {slLossUsd !== null && (
                              <span className="text-[10px] font-mono text-[#D92D45] font-semibold tabular-nums">
                                -${Math.abs(slLossUsd).toFixed(1)}{" "}
                                {slLossPct !== null ? `(-${Math.abs(slLossPct).toFixed(1)}%)` : ""}
                              </span>
                            )}
                          </div>
                          <div className="flex h-8 items-center rounded-[10px] border border-[var(--border-subtle,rgba(10,10,12,0.08))] bg-[var(--surface-2,#f1f2f5)] px-2.5 font-mono focus-within:border-[#D92D45]/60 focus-within:ring-2 focus-within:ring-[#D92D45]/15 transition-all">
                            <input
                              type="number"
                              placeholder="Price"
                              value={stopLoss}
                              onChange={(e) => setStopLoss(e.target.value)}
                              className="w-full bg-transparent text-[11.5px] outline-none text-[#D92D45] tabular-nums font-medium"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] text-[#087F4D] uppercase font-mono font-semibold tracking-tight">
                              Take Profit
                            </Label>
                            {tpGainUsd !== null && (
                              <span className="text-[10px] font-mono text-[#087F4D] font-semibold tabular-nums">
                                +${Math.abs(tpGainUsd).toFixed(1)}{" "}
                                {tpGainPct !== null ? `(+${Math.abs(tpGainPct).toFixed(1)}%)` : ""}
                              </span>
                            )}
                          </div>
                          <div className="flex h-8 items-center rounded-[10px] border border-[var(--border-subtle,rgba(10,10,12,0.08))] bg-[var(--surface-2,#f1f2f5)] px-2.5 font-mono focus-within:border-[#087F4D]/60 focus-within:ring-2 focus-within:ring-[#087F4D]/15 transition-all">
                            <input
                              type="number"
                              placeholder="Price"
                              value={takeProfit}
                              onChange={(e) => setTakeProfit(e.target.value)}
                              className="w-full bg-transparent text-[11.5px] outline-none text-[#087F4D] tabular-nums font-medium"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Calculated PnL / Risk-Reward Preview bar */}
                      {(slLossUsd !== null || tpGainUsd !== null || riskRewardRatio) && (
                        <div className="flex items-center justify-between text-[10.5px] font-mono pt-1.5 border-t border-[var(--border-subtle,rgba(10,10,12,0.08))]">
                          <span className="text-[var(--text-tertiary,#747482)]">Preview:</span>
                          <div className="flex items-center gap-2 tabular-nums">
                            {slLossUsd !== null && (
                              <span className="text-[#D92D45] font-medium">
                                SL: -${Math.abs(slLossUsd).toFixed(1)}
                              </span>
                            )}
                            {tpGainUsd !== null && (
                              <span className="text-[#087F4D] font-medium">
                                TP: +${Math.abs(tpGainUsd).toFixed(1)}
                              </span>
                            )}
                            {riskRewardRatio && (
                              <span className="text-[var(--text-primary,#0b0b0c)] font-bold border-l border-[var(--border-default)] pl-1.5">
                                {riskRewardRatio}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Execution Cluster */}
              <div className="space-y-2 pt-2">
                {/* 8. PRIMARY ACTION CTA BUTTON (Pinned Above Order Summary) */}
                <div className="shrink-0 space-y-1">
                  {orderSuccess && (
                    <div className="flex items-center gap-2 rounded-[12px] bg-[var(--surface-2,#f1f2f5)] border border-[var(--border-default)] px-3 py-1.5 text-[11px] text-[var(--text-primary,#0b0b0c)] font-mono animate-in fade-in-50 duration-150">
                      <CheckCircle2 className="size-3.5 shrink-0 text-[#087F4D]" />
                      <span>Order placed successfully</span>
                    </div>
                  )}
                  {wallet.isReadOnly || !wallet.isConnected ? (
                    <button
                      type="button"
                      onClick={() => walletStore.openModal()}
                      className="h-[42px] sm:h-[44px] w-full font-semibold text-[13px] sm:text-[14px] rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-[0_4px_16px_rgba(37,99,235,0.35)] active:scale-[0.98]"
                    >
                      <Wallet className="size-4" />
                      <span>Connect to trade</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (hasValidSize) {
                          setIsReviewModalOpen(true);
                        } else {
                          toast.error("Enter a valid order size", {
                            description: `Specify the ${baseAsset} or USDC amount you want to trade.`,
                          });
                        }
                      }}
                      disabled={!hasValidSize}
                      className={cn(
                        "h-[42px] sm:h-[44px] w-full font-semibold text-[13px] sm:text-[14px] rounded-full transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-1.5 border-0 shadow-md",
                        !hasValidSize
                          ? "bg-[var(--surface-3,#e6e8ec)] text-[var(--text-tertiary,#747482)] cursor-not-allowed shadow-none"
                          : side === "long"
                            ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-[0_4px_16px_rgba(37,99,235,0.35)]"
                            : "bg-[#D92D45] text-white hover:bg-[#B82236] shadow-[0_4px_16px_rgba(217,45,69,0.35)]",
                      )}
                    >
                      {side === "long"
                        ? `Review long · ${formattedButtonSize}`
                        : `Review short · ${formattedButtonSize}`}
                    </button>
                  )}
                </div>

                {/* 9. ORDER INFO UNDER THE ACTION BUTTON */}
                <div className="rounded-[14px] bg-[var(--surface-2,#f1f2f5)] p-3 border border-[var(--border-subtle,rgba(10,10,12,0.08))] text-[10.5px] font-mono tabular-nums space-y-1.5 shrink-0 shadow-2xs">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-secondary,#5a5a66)]">Order Value:</span>
                      <span className="text-[var(--text-primary,#0b0b0c)] font-medium">{orderValue}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-secondary,#5a5a66)]">Est. Fee (0.05%):</span>
                      <span className="text-[var(--text-primary,#0b0b0c)] font-medium">
                        ~${(activeUsdcNotional * 0.0005).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-secondary,#5a5a66)]">Margin Required:</span>
                      <span className="text-[var(--text-primary,#0b0b0c)] font-medium">{costFormatted}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-secondary,#5a5a66)]">Est. Slippage:</span>
                      <span className="text-[#087F4D] font-medium">&lt; 0.02%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-secondary,#5a5a66)]">Est. Liq Price:</span>
                      <span className="text-[#D92D45] font-semibold">{liqPrice}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-secondary,#5a5a66)]">Free Margin:</span>
                      <span className="text-[var(--text-primary,#0b0b0c)] font-medium">
                        $
                        {Math.max(0, 42180 - orderCostNum).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Practice mode disclaimer footer */}
                <div className="flex items-center justify-center gap-1.5 text-[10.5px] text-[var(--text-tertiary,#747482)] font-mono shrink-0 pt-0.5">
                  <span className="size-1 rounded-full bg-[var(--text-tertiary,#747482)]/40" />
                  <span>Practice mode: simulated funds · Preview only</span>
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Leverage & Margin Adjustment Modal */}
          <Dialog open={isLeverageModalOpen} onOpenChange={setIsLeverageModalOpen}>
            <DialogContent className="max-w-[420px] rounded-[10px] border border-white/[0.1] bg-[#0E0E10] text-white p-5 gap-4 font-mono shadow-2xl">
              <DialogHeader className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="size-4 text-white/70" />
                  <DialogTitle className="text-[14px] font-bold text-white tracking-tight">
                    Adjust Leverage & Margin Mode
                  </DialogTitle>
                </div>
                <DialogDescription className="text-[12px] text-white/40">
                  Configure leverage multiplier and margin isolation for {selectedPair}.
                </DialogDescription>
              </DialogHeader>

              {/* Margin Mode Selector */}
              <div className="space-y-1.5">
                <Label className="text-[12px] text-white/40 uppercase tracking-wider font-mono">
                  Margin Mode
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalMarginMode("cross")}
                    className={cn(
                      "p-2.5 rounded-[6px] border text-left transition-all cursor-pointer flex flex-col gap-1",
                      modalMarginMode === "cross"
                        ? "border-white/40 bg-white/[0.08] text-white"
                        : "border-white/[0.06] bg-[#141417] text-white/40 hover:text-white/70",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold">Cross Margin</span>
                      {modalMarginMode === "cross" && (
                        <CheckCircle2 className="size-3 text-white" />
                      )}
                    </div>
                    <p className="text-[12px] text-white/40 leading-tight">
                      Shares available margin across all open positions.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalMarginMode("isolated")}
                    className={cn(
                      "p-2.5 rounded-[6px] border text-left transition-all cursor-pointer flex flex-col gap-1",
                      modalMarginMode === "isolated"
                        ? "border-white/40 bg-white/[0.08] text-white"
                        : "border-white/[0.06] bg-[#141417] text-white/40 hover:text-white/70",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold">Isolated Margin</span>
                      {modalMarginMode === "isolated" && (
                        <CheckCircle2 className="size-3 text-white" />
                      )}
                    </div>
                    <p className="text-[12px] text-white/40 leading-tight">
                      Restricts position risk strictly to allocated margin.
                    </p>
                  </button>
                </div>
              </div>

              {/* Leverage Readout & Stepper */}
              {(() => {
                const effectiveModalLev =
                  typeof modalLeverage === "number" && modalLeverage >= 1 ? modalLeverage : 1;
                return (
                  <>
                    <div className="space-y-2 pt-1 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between">
                        <Label className="text-[12px] text-white/40 uppercase tracking-wider font-mono">
                          Leverage Multiplier
                        </Label>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-[4px] text-[12px] font-bold uppercase border font-mono tracking-tight",
                            effectiveModalLev <= 10
                              ? "bg-white/10 text-white border-white/20"
                              : effectiveModalLev <= 25
                                ? "bg-white/[0.06] text-white/80 border-white/15"
                                : "bg-[#FF5A5F]/15 text-[#FF5A5F] border-[#FF5A5F]/30",
                          )}
                        >
                          {effectiveModalLev <= 10
                            ? "Conservative"
                            : effectiveModalLev <= 25
                              ? "Standard Scalp"
                              : effectiveModalLev <= 50
                                ? "High Risk"
                                : "Extreme Risk"}
                        </span>
                      </div>

                      {/* Stepper & Direct Input */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setModalLeverage((prev) =>
                              Math.max(1, (typeof prev === "number" ? prev : 1) - 1),
                            )
                          }
                          className="size-8 rounded-[6px] border border-white/[0.08] bg-[#141417] hover:bg-white/[0.08] text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          disabled={effectiveModalLev <= 1}
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <div className="flex-1 flex h-8 items-center justify-center rounded-[6px] border border-white/[0.08] bg-[#141417] px-3 font-mono">
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={modalLeverage}
                            onChange={(e) => {
                              if (e.target.value === "") {
                                setModalLeverage("");
                                return;
                              }
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val)) {
                                setModalLeverage(Math.min(50, Math.max(1, val)));
                              }
                            }}
                            onBlur={() => {
                              if (modalLeverage === "" || modalLeverage < 1) {
                                setModalLeverage(1);
                              }
                            }}
                            className="w-full bg-transparent text-center font-bold text-white text-[14px] outline-none"
                          />
                          <span className="text-[12px] text-white/40 font-mono">×</span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setModalLeverage((prev) =>
                              Math.min(50, (typeof prev === "number" ? prev : 1) + 1),
                            )
                          }
                          className="size-8 rounded-[6px] border border-white/[0.08] bg-[#141417] hover:bg-white/[0.08] text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          disabled={effectiveModalLev >= 50}
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>

                      {/* Range Slider (Max 50x) */}
                      <div className="py-0.5">
                        <input
                          type="range"
                          min={1}
                          max={50}
                          value={effectiveModalLev}
                          onChange={(e) => setModalLeverage(Number(e.target.value))}
                          style={{
                            ["--slider-track" as string]: `linear-gradient(to right, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.5) ${((effectiveModalLev - 1) / 49) * 100}%, rgba(255, 255, 255, 0.08) ${((effectiveModalLev - 1) / 49) * 100}%, rgba(255, 255, 255, 0.08) 100%)`,
                          }}
                          className="leverage-slider cursor-pointer w-full"
                        />
                      </div>

                      {/* Quick Presets */}
                      <div className="grid grid-cols-5 gap-1 pt-1">
                        {[1, 5, 10, 25, 50].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setModalLeverage(preset)}
                            className={cn(
                              "py-1.5 rounded-[5px] font-mono text-[12px] font-medium transition-all cursor-pointer border text-center select-none",
                              effectiveModalLev === preset
                                ? "bg-white text-black font-bold border-white shadow-[0_0_10px_rgba(255,255,255,0.25)]"
                                : "bg-[#141417] text-white/45 border-white/[0.06] hover:bg-white/[0.05] hover:text-white/80 hover:border-white/12",
                            )}
                          >
                            {preset}×
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dynamic Margin & Risk Matrix */}
                    <div className="rounded-[6px] border border-white/[0.08] bg-[#141417] p-2.5 space-y-1.5 text-[12px] font-mono">
                      <div className="flex justify-between items-center text-white/50">
                        <span>Max Position Size</span>
                        <span className="text-white font-medium">
                          ${(42180 * effectiveModalLev).toLocaleString()} USDT
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-white/50">
                        <span>Initial Margin Req.</span>
                        <span className="text-white font-medium">
                          {(100 / effectiveModalLev).toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-white/50">
                        <span>Est. Liq Distance</span>
                        <span className="text-white font-medium">
                          ~{((1 / effectiveModalLev) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-white/50">
                        <span>Est. Liq Price ({side === "long" ? "Buy" : "Short"})</span>
                        <span className="text-[#FF5A5F] font-semibold">
                          $
                          {(side === "long"
                            ? currentMarkPrice * (1 - 1 / effectiveModalLev)
                            : currentMarkPrice * (1 + 1 / effectiveModalLev)
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* High Leverage Advisory */}
                    {effectiveModalLev >= 25 && (
                      <div className="flex items-start gap-2 rounded-[6px] border border-[#FF5A5F]/30 bg-[#FF5A5F]/10 p-2.5 text-[12px] text-[#FF5A5F] font-mono">
                        <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="font-bold">High Leverage Advisory</span>
                          <p className="text-[12px] text-white/70 leading-relaxed">
                            Trading at or above 25× leverage reduces your liquidation cushion to
                            under 4%. Max leverage on godcandle is 50×. Ensure active risk parameters
                            are defined.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsLeverageModalOpen(false)}
                  className="px-3 py-1.5 rounded-[6px] text-[12px] font-mono text-white/50 hover:text-white border border-white/[0.08] hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyLeverageModal}
                  className="px-4 py-1.5 rounded-[6px] text-[12px] font-mono font-bold bg-white text-black hover:bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all cursor-pointer"
                >
                  Confirm Leverage
                </button>
              </div>
            </DialogContent>
          </Dialog>

          {/* =========================================================================
              INSTITUTIONAL ASSET & TICKER SWITCHER MODAL (50/50 Split Revolut-style architecture)
              Accessible DialogTitle: "Select Perpetual Market Asset"
              Search placeholder: "Search for an asset"
              ========================================================================= */}
          <TickerPickerModal
            open={isAssetModalOpen}
            onOpenChange={setIsAssetModalOpen}
            type="perps"
            selectedPair={selectedPair}
            onSelectPair={(pair) => selectAsset(pair)}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: Full-width Positions & Orders Ledger (Below the Fold)
          ========================================================================= */}
      <section
        ref={positionsTableRef}
        id="positions-ledger"
        className="w-full px-4 py-6 pb-16 max-w-[1760px] mx-auto shrink-0 border-t border-[var(--border-subtle,rgba(10,10,12,0.08))] bg-[var(--surface-1,#ffffff)] text-[var(--text-primary,#0b0b0c)]"
      >
        <Card className="w-full flex flex-col rounded-[20px] border-[var(--border-subtle,rgba(10,10,12,0.08))] bg-[var(--surface-1,#ffffff)] shadow-sm overflow-hidden">
          {/* Institutional Dock Tabs */}
          <div className="flex items-center justify-between border-b border-[var(--border-subtle,rgba(10,10,12,0.08))] bg-transparent px-4 py-1 text-[12px] font-medium shrink-0">
            <div className="flex items-center overflow-x-auto no-scrollbar">
              {(
                [
                  { id: "positions", label: `Positions (${positions.length})` },
                  { id: "orders", label: `Open Orders (${orders.length})` },
                  { id: "trades", label: "Trade History" },
                  { id: "pnl", label: "Realized P&L" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTableTab(tab.id as TableTab)}
                  className={cn(
                    "px-4 py-2.5 whitespace-nowrap border-b-2 transition-colors cursor-pointer shrink-0 font-mono text-[12px]",
                    tableTab === tab.id
                      ? "border-[var(--text-primary,#0b0b0c)] text-[var(--text-primary,#0b0b0c)] font-bold"
                      : "border-transparent text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)]",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 pr-1 text-[12px] font-mono text-[var(--text-tertiary,#747482)]">
              <div className="hidden sm:flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[#087F4D] shadow-[0_0_6px_rgba(8,127,77,0.8)]" />
                <span>{SHARED_FUNDING_DISPLAY}</span>
              </div>
              <button
                type="button"
                onClick={scrollToTerminal}
                className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] border border-[var(--border-subtle,rgba(10,10,12,0.08))] bg-[var(--surface-2,#f1f2f5)] hover:bg-[var(--surface-3,#e6e8ec)] text-[var(--text-secondary,#5a5a66)] hover:text-[var(--text-primary,#0b0b0c)] transition-colors cursor-pointer font-mono"
                title="Scroll back to Chart & Terminal"
              >
                <span>↑ Chart</span>
              </button>
            </div>
          </div>

          {/* Table Body */}
          <div className="overflow-x-auto overflow-y-auto flex-1 bg-[var(--surface-1,#ffffff)] no-scrollbar min-h-[160px]">
            {tableTab === "positions" && (
              <>
                <table className="w-full min-w-[760px] text-[12px] font-mono">
                  <thead className="sticky top-0 bg-[var(--surface-2,#f1f2f5)] z-10">
                    <tr className="border-b border-[var(--border-subtle,rgba(10,10,12,0.08))] text-[var(--text-secondary,#5a5a66)] text-[12px] uppercase tracking-wider">
                      <th className="px-3.5 py-2.5 text-left font-medium">Pair & Side</th>
                      <th className="px-3.5 py-2.5 text-left font-medium">Size & Value</th>
                      <th className="px-3.5 py-2.5 text-right font-medium">Entry Price</th>
                      <th className="px-3.5 py-2.5 text-right font-medium">Mark Price</th>
                      <th className="px-3.5 py-2.5 text-right font-medium">Liq Price</th>
                      <th className="px-3.5 py-2.5 text-right font-medium">Margin</th>
                      <th className="px-3.5 py-2.5 text-right font-medium">Unrealized P&L</th>
                      <th className="px-3.5 py-2.5 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {positions.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{p.pair}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPair(p.pair);
                                const levVal = parseInt(p.lev, 10);
                                if (!isNaN(levVal)) {
                                  setLeverage(levVal);
                                  openLeverageModal(undefined, levVal);
                                } else {
                                  openLeverageModal();
                                }
                              }}
                              className={cn(
                                "group inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono tracking-tight cursor-pointer transition-all border",
                                p.side === "long"
                                  ? "bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.14] hover:border-white/30 text-white"
                                  : "bg-[#FF5A5F]/[0.08] hover:bg-[#FF5A5F]/[0.15] border-[#FF5A5F]/25 hover:border-[#FF5A5F]/40 text-[#FF5A5F]",
                              )}
                              title="Adjust leverage for this position"
                            >
                              <span className="font-semibold">
                                {p.side === "long" ? "Buy" : "Short"}
                              </span>
                              <span
                                className={
                                  p.side === "long" ? "text-white/30" : "text-[#FF5A5F]/40"
                                }
                              >
                                ·
                              </span>
                              <span
                                className={cn(
                                  "font-medium",
                                  p.side === "long"
                                    ? "text-white/80 group-hover:text-white"
                                    : "text-[#FF5A5F]/90 group-hover:text-[#FF5A5F]",
                                )}
                              >
                                {p.lev}
                              </span>
                            </button>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="flex flex-col">
                            <span className="text-white font-medium">{p.size}</span>
                            <span className="text-[12px] text-white/40">{p.notional}</span>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 text-right text-white/80">{p.entry}</td>
                        <td className="px-3.5 py-2.5 text-right text-white/80">{p.mark}</td>
                        <td className="px-3.5 py-2.5 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-[#FF5A5F] font-medium font-mono">{p.liq}</span>
                            {(() => {
                              const liqVal = parseFloat(p.liq.replace(/[^0-9.]/g, ""));
                              const markVal = parseFloat(p.mark.replace(/[^0-9.]/g, ""));
                              if (isNaN(liqVal) || isNaN(markVal) || markVal === 0) return null;
                              const distPct = Math.min(
                                100,
                                Math.max(5, (Math.abs(markVal - liqVal) / markVal) * 500),
                              );
                              return (
                                <div
                                  className="w-16 h-1 bg-white/[0.08] rounded-full overflow-hidden mt-1"
                                  title={`Distance to liquidation: ${Math.abs(((markVal - liqVal) / markVal) * 100).toFixed(1)}%`}
                                >
                                  <div
                                    className={cn(
                                      "h-full rounded-full transition-all",
                                      distPct < 25
                                        ? "bg-[#FF5A5F]"
                                        : distPct < 50
                                          ? "bg-[#F59E0B]"
                                          : "bg-[#B6F5B0]",
                                    )}
                                    style={{ width: `${distPct}%` }}
                                  />
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 text-right text-white/60">{p.margin}</td>
                        <td
                          className={cn(
                            "px-3.5 py-2.5 text-right font-bold",
                            p.pnl.startsWith("+") ? "text-[#B6F5B0]" : "text-[#FF5A5F]",
                          )}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>{p.pnl.startsWith("+") ? "▲" : "▼"}</span>
                            <span>{p.pnl}</span>
                            <span className="text-[12px] opacity-80 font-normal">({p.pnlPct})</span>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Close Action Popover */}
                            <Popover
                              open={openCloseMenuId === p.id}
                              onOpenChange={(open) => setOpenCloseMenuId(open ? p.id : null)}
                            >
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="text-[11px] font-mono font-medium text-white/70 hover:text-white px-2 py-1 rounded-[6px] border border-white/[0.08] bg-[#141417] hover:bg-white/[0.06] transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <span>Close</span>
                                  <ChevronDown className="size-2.5 text-white/40" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent
                                align="end"
                                className="w-[140px] p-1.5 rounded-[12px] bg-[#141518] border border-white/[0.1] text-[11px] font-mono text-white shadow-xl space-y-1 z-50"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenCloseMenuId(null);
                                    closePosition(p.id, 1.0);
                                  }}
                                  className="w-full text-left px-2 py-1 rounded-[6px] hover:bg-white/[0.08] text-white/90 hover:text-white transition-colors"
                                >
                                  Market Close (100%)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenCloseMenuId(null);
                                    closePosition(p.id, 0.5);
                                  }}
                                  className="w-full text-left px-2 py-1 rounded-[6px] hover:bg-white/[0.08] text-white/90 hover:text-white transition-colors"
                                >
                                  Close 50%
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenCloseMenuId(null);
                                    setSide(p.side === "long" ? "short" : "long");
                                    setOrderType("limit");
                                    setLimitPrice(p.mark.replace(/[^0-9.]/g, ""));
                                    setSize(p.size.split(" ")[0] || "1.0");
                                    scrollToTerminal();
                                    toast.info(
                                      `Configured ${p.side === "long" ? "Short" : "Long"} Limit Close in ticket`,
                                    );
                                  }}
                                  className="w-full text-left px-2 py-1 rounded-[6px] hover:bg-white/[0.08] text-white/90 hover:text-white transition-colors"
                                >
                                  Limit Close
                                </button>
                              </PopoverContent>
                            </Popover>

                            {/* Edit TP/SL button */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPosition(p);
                                setEditTp(takeProfit);
                                setEditSl(stopLoss);
                              }}
                              className="size-7 rounded-[6px] border border-white/[0.08] bg-[#141417] hover:bg-white/[0.06] text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                              title="Edit Take Profit & Stop Loss"
                            >
                              <Target className="size-3.5 text-[#B6F5B0]" />
                            </button>

                            {/* Share P&L button */}
                            <button
                              type="button"
                              onClick={() => {
                                const tradeData: SharePnlData = {
                                  market: p.pair,
                                  bias: p.side,
                                  leverage: parseInt(p.lev, 10) || 10,
                                  pnlUsd: p.pnl,
                                  pnlPct: p.pnlPct,
                                  entryPrice: p.entry,
                                  markPrice: p.mark,
                                  duration: "14h 22m",
                                  date: new Date().toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }),
                                };
                                setShareModalTrade(tradeData);
                              }}
                              className="size-7 rounded-[6px] border border-white/[0.08] bg-[#141417] hover:bg-white/[0.06] text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                              title="Generate Shareable P&L Card"
                            >
                              <Share2 className="size-3.5 text-[#60A5FA]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {positions.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-white/40 text-[12px] font-mono"
                        >
                          No open positions
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="md:hidden divide-y divide-white/[0.06] p-3 space-y-3">
                  {positions.map((p) => {
                    const liqVal = parseFloat(p.liq.replace(/[^0-9.]/g, ""));
                    const markVal = parseFloat(p.mark.replace(/[^0-9.]/g, ""));
                    const distPct =
                      !isNaN(liqVal) && !isNaN(markVal) && markVal > 0
                        ? Math.min(100, Math.max(5, (Math.abs(markVal - liqVal) / markVal) * 500))
                        : 50;

                    return (
                      <div
                        key={`m-card-${p.id}`}
                        className="rounded-[16px] bg-[#141518] p-3.5 border border-white/[0.06] space-y-3 font-mono text-[12px]"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-[13px]">{p.pair}</span>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border",
                                p.side === "long"
                                  ? "bg-white/[0.06] border-white/[0.14] text-white"
                                  : "bg-[#FF5A5F]/[0.08] border-[#FF5A5F]/25 text-[#FF5A5F]",
                              )}
                            >
                              <span>{p.side === "long" ? "Buy" : "Short"}</span>
                              <span className="opacity-40">·</span>
                              <span>{p.lev}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPosition(p);
                                setEditTp(takeProfit);
                                setEditSl(stopLoss);
                              }}
                              className="size-7 rounded-[6px] border border-white/[0.08] bg-[#1E1E22] text-white/60 hover:text-white flex items-center justify-center cursor-pointer"
                              title="Edit TP/SL"
                            >
                              <Target className="size-3.5 text-[#B6F5B0]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const tradeData: SharePnlData = {
                                  market: p.pair,
                                  bias: p.side,
                                  leverage: parseInt(p.lev, 10) || 10,
                                  pnlUsd: p.pnl,
                                  pnlPct: p.pnlPct,
                                  entryPrice: p.entry,
                                  markPrice: p.mark,
                                  duration: "14h 22m",
                                  date: new Date().toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }),
                                };
                                setShareModalTrade(tradeData);
                              }}
                              className="size-7 rounded-[6px] border border-white/[0.08] bg-[#1E1E22] text-white/60 hover:text-white flex items-center justify-center cursor-pointer"
                              title="Share P&L"
                            >
                              <Share2 className="size-3.5 text-[#60A5FA]" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-white/60">
                          <div>
                            <span className="text-white/40 block">Size / Notional:</span>
                            <span className="text-white font-medium">
                              {p.size} ({p.notional})
                            </span>
                          </div>
                          <div>
                            <span className="text-white/40 block">Entry / Mark:</span>
                            <span className="text-white font-medium">
                              {p.entry} / {p.mark}
                            </span>
                          </div>
                          <div>
                            <span className="text-white/40 block">Liq Price:</span>
                            <span className="text-[#FF5A5F] font-bold">{p.liq}</span>
                            <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden mt-1">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  distPct < 25
                                    ? "bg-[#FF5A5F]"
                                    : distPct < 50
                                      ? "bg-[#F59E0B]"
                                      : "bg-[#B6F5B0]",
                                )}
                                style={{ width: `${distPct}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <span className="text-white/40 block">Unrealized P&L:</span>
                            <span
                              className={cn(
                                "font-bold text-[12px]",
                                p.pnl.startsWith("+") ? "text-[#B6F5B0]" : "text-[#FF5A5F]",
                              )}
                            >
                              {p.pnl} ({p.pnlPct})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
                          <button
                            type="button"
                            onClick={() => closePosition(p.id, 0.5)}
                            className="flex-1 py-1.5 rounded-[8px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/80 text-[11px] font-medium cursor-pointer"
                          >
                            Close 50%
                          </button>
                          <button
                            type="button"
                            onClick={() => closePosition(p.id, 1.0)}
                            className="flex-1 py-1.5 rounded-[8px] bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white font-bold text-[11px] cursor-pointer"
                          >
                            Close Market
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {tableTab === "orders" && (
              <table className="w-full min-w-[650px] text-[12px] font-mono">
                <thead className="sticky top-0 bg-[#0E0E10] z-10">
                  <tr className="border-b border-white/[0.06] text-white/40 text-[12px] uppercase tracking-wider">
                    <th className="px-3.5 py-2.5 text-left font-medium">Pair</th>
                    <th className="px-3.5 py-2.5 text-left font-medium">Type</th>
                    <th className="px-3.5 py-2.5 text-right font-medium">Size</th>
                    <th className="px-3.5 py-2.5 text-right font-medium">Order Price</th>
                    <th className="px-3.5 py-2.5 text-right font-medium">Trigger</th>
                    <th className="px-3.5 py-2.5 text-right font-medium">Filled</th>
                    <th className="px-3.5 py-2.5 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-3.5 py-2.5 font-bold text-white">{o.pair}</td>
                      <td className="px-3.5 py-2.5 text-white/70">{o.type}</td>
                      <td className="px-3.5 py-2.5 text-right text-white/80">{o.size}</td>
                      <td className="px-3.5 py-2.5 text-right text-white/80">{o.price}</td>
                      <td className="px-3.5 py-2.5 text-right text-white/40">{o.trigger ?? "—"}</td>
                      <td className="px-3.5 py-2.5 text-right text-white/40">{o.filled}</td>
                      <td className="px-3.5 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => cancelOrder(o.id)}
                          className="text-[12px] text-[#FF5A5F] hover:text-white px-2 py-0.5 rounded-[6px] border border-[#FF5A5F]/30 bg-[#FF5A5F]/10 hover:bg-[#FF5A5F]/20 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6">
                        <EmptyState
                          title="No Active Orders"
                          description="Your pending perpetual limit and stop-market orders will appear here."
                          actionLabel="Place Order"
                          onAction={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                          className="max-w-md mx-auto"
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {tableTab === "trades" && (
              <table className="w-full min-w-[700px] text-[12px] font-mono">
                <thead className="sticky top-0 bg-[#0E0E10] z-10">
                  <tr className="border-b border-white/[0.06] text-white/40 text-[12px] uppercase tracking-wider">
                    <th className="px-3.5 py-2.5 text-left font-medium">Time</th>
                    <th className="px-3.5 py-2.5 text-left font-medium">Pair</th>
                    <th className="px-3.5 py-2.5 text-left font-medium">Side</th>
                    <th className="px-3.5 py-2.5 text-right font-medium">Size</th>
                    <th className="px-3.5 py-2.5 text-right font-medium">Entry</th>
                    <th className="px-3.5 py-2.5 text-right font-medium">Exit</th>
                    <th className="px-3.5 py-2.5 text-right font-medium">Realized P&L</th>
                    <th className="px-3.5 py-2.5 text-right font-medium">Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {INITIAL_TRADES.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-3.5 py-2.5 text-white/40 text-[12px]">{t.time}</td>
                      <td className="px-3.5 py-2.5 font-bold text-white">{t.pair}</td>
                      <td className="px-3.5 py-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-mono font-medium border",
                            t.side === "long"
                              ? "bg-white/[0.06] border-white/[0.14] text-white"
                              : "bg-[#FF5A5F]/[0.08] border-[#FF5A5F]/25 text-[#FF5A5F]",
                          )}
                        >
                          {t.side === "long" ? "Buy" : "Short"}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-right text-white/80">{t.size}</td>
                      <td className="px-3.5 py-2.5 text-right text-white/70">{t.entry}</td>
                      <td className="px-3.5 py-2.5 text-right text-white/70">{t.exit}</td>
                      <td className="px-3.5 py-2.5 text-right text-[#B6F5B0] font-bold">{t.pnl}</td>
                      <td className="px-3.5 py-2.5 text-right text-white/40">{t.fee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tableTab === "pnl" && (
              <div className="p-4 font-mono">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="rounded-[6px] bg-[#141417] p-3 flex flex-col justify-center">
                    <span className="text-[12px] uppercase tracking-wider text-white/40">
                      30d Realized P&L
                    </span>
                    <div className="text-[14px] font-bold text-[#B6F5B0] mt-0.5">+$8,420.50</div>
                  </div>
                  <div className="rounded-[6px] bg-[#141417] p-3 flex flex-col justify-center">
                    <span className="text-[12px] uppercase tracking-wider text-white/40">
                      Win Rate
                    </span>
                    <div className="text-[14px] font-bold text-white mt-0.5">71.4%</div>
                  </div>
                  <div className="rounded-[6px] bg-[#141417] p-3 flex flex-col justify-center">
                    <span className="text-[12px] uppercase tracking-wider text-white/40">
                      Profit Factor
                    </span>
                    <div className="text-[14px] font-bold text-white mt-0.5">2.64</div>
                  </div>
                  <div className="rounded-[6px] bg-[#141417] p-3 flex flex-col justify-center">
                    <span className="text-[12px] uppercase tracking-wider text-white/40">
                      Total Trades
                    </span>
                    <div className="text-[14px] font-bold text-white mt-0.5">28</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Account Margin Summary Strip at bottom of dock */}
          <div className="h-8 border-t border-white/[0.08] bg-[#0A0A0C] px-3 flex items-center justify-between text-[12px] font-mono text-white/50 shrink-0 overflow-x-auto gap-4 no-scrollbar">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-white/40">Margin Ratio:</span>
              <span className="font-semibold text-white">14.2%</span>
              <span className="rounded-[4px] bg-white/10 border border-white/20 px-1.5 py-0.5 text-[12px] text-white font-bold">
                Safe
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-white/40">Maint. Margin:</span>
              <span className="font-medium text-white/80">$1,820.00</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-white/40">Total Equity:</span>
              <span className="font-bold text-white">$96,460.00</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-white/40">Free Margin:</span>
              <span className="font-medium text-white/80">$42,180.00</span>
            </div>
          </div>
        </Card>
      </section>

      {/* Mobile floating Copilot Trigger Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => setMobileCopilotOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#141417]/95 border border-white/20 text-white font-mono text-[12px] font-bold shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-md active:scale-95 transition-all cursor-pointer hover:border-white/40"
        >
          <div className="size-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_white]" />
          <Bot className="size-3.5 text-white" />
          <span>AI Copilot</span>
        </button>
      </div>

      {/* Mobile Copilot Bottom Sheet Drawer */}
      <Sheet open={mobileCopilotOpen} onOpenChange={setMobileCopilotOpen}>
        <SheetContent
          side="bottom"
          className="p-0 max-h-[85vh] h-[85vh] bg-[#0E0E10] border-t border-white/10 rounded-t-xl overflow-hidden flex flex-col text-white"
        >
          <SheetHeader className="p-3 border-b border-white/[0.06] flex flex-row items-center justify-between text-left shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-white" />
              <SheetTitle className="text-white text-[14px] font-mono">AI Copilot</SheetTitle>
            </div>
          </SheetHeader>
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {/* Quick action question cards — sleek 2-column grid */}
            <div className="p-2.5 border-b border-white/[0.08] bg-[#0E0E10] shrink-0">
              <div className="grid grid-cols-2 gap-1.5 w-full">
                {QUICK_PROMPTS.map((qp) => (
                  <button
                    key={`mobile-${qp.label}`}
                    type="button"
                    onClick={() => {
                      sendMessage(qp.prompt);
                    }}
                    className="h-[36px] rounded-full bg-[#1E1E22] hover:bg-[#26262B] border border-white/[0.08] hover:border-white/20 text-white font-medium text-[12px] flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center px-2 active:scale-98"
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full shrink-0",
                        qp.accent === "mint" &&
                          "bg-[#B6F5B0] shadow-[0_0_6px_rgba(182,245,176,0.6)]",
                        qp.accent === "white" && "bg-white",
                        qp.accent === "violet" && "bg-[#A78BFA]",
                      )}
                    />
                    <span className="truncate">{qp.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Messages stream */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-0">
              {messages.map((msg) => (
                <div
                  key={`m-${msg.id}`}
                  className={cn(
                    "flex flex-col gap-1.5 text-[12px]",
                    msg.role === "agent"
                      ? "w-full border-b border-white/[0.06] pb-2 last:border-b-0 text-white/90"
                      : "self-end max-w-[90%] rounded-[6px] bg-white/10 border border-white/10 px-2.5 py-1 text-white text-[12px] font-mono",
                  )}
                >
                  {msg.role === "agent" && (
                    <div className="flex items-center justify-between gap-1.5 pb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="size-1.5 rounded-full bg-white shrink-0" />
                        <span className="font-mono text-[12px] font-bold text-white tracking-wider uppercase shrink-0">
                          Copilot
                        </span>
                      </div>
                      <span className="font-mono text-[12px] text-white/30 shrink-0">
                        {msg.timestamp}
                      </span>
                    </div>
                  )}
                  {msg.text && (
                    <p className="text-white/85 leading-snug font-sans text-[12px]">{msg.text}</p>
                  )}
                  {msg.tradeSetup && (
                    <button
                      type="button"
                      onClick={() => {
                        handleLoadSetup(msg.tradeSetup!, msg.id);
                        setMobileCopilotOpen(false);
                      }}
                      className="w-full mt-1 flex items-center justify-center gap-1.5 rounded-[6px] py-1.5 px-2 text-[12px] font-mono font-bold bg-white text-black cursor-pointer"
                    >
                      <span>Load into Order Ticket</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-2.5 border-t border-white/[0.08] bg-[#0E0E10] shrink-0">
              <div className="flex items-center gap-1.5 rounded-[6px] border border-white/[0.08] bg-[#141417] text-white/90 px-2.5 py-1.5">
                <input
                  type="text"
                  placeholder="Ask Copilot…"
                  className="flex-1 bg-transparent text-[12px] font-mono outline-none placeholder:text-white/30 min-w-0"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(chatInput);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => sendMessage(chatInput)}
                  disabled={!chatInput.trim()}
                  className="shrink-0 text-white/40 hover:text-white disabled:opacity-30 p-1 cursor-pointer"
                >
                  <Send className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* =========================================================================
          ORDER REVIEW CONFIRMATION MODAL
          ========================================================================= */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="max-w-[440px] rounded-[20px] border border-white/[0.1] bg-[#141518] text-white p-5 gap-4 font-mono shadow-2xl">
          <DialogHeader className="space-y-1 text-left">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-[16px] font-bold text-white flex items-center gap-2">
                <span>Review Order</span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[11px] font-bold border",
                    side === "long"
                      ? "bg-[#B6F5B0]/15 text-[#B6F5B0] border-[#B6F5B0]/30"
                      : "bg-[#FF5A5F]/15 text-[#FF5A5F] border-[#FF5A5F]/30",
                  )}
                >
                  {side === "long" ? "BUY / LONG" : "SHORT"}
                </span>
              </DialogTitle>
              <span className="rounded-full bg-white/[0.06] border border-white/10 px-2 py-0.5 text-[10px] text-white/70">
                Practice mode: simulated funds
              </span>
            </div>
            <DialogDescription className="text-[12px] text-white/50">
              Review your order execution parameters before submitting to desk.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-[14px] bg-[#1A1B1F] p-3 border border-white/[0.06] space-y-2 text-[12px]">
            <div className="flex justify-between items-center text-white/60">
              <span>Market</span>
              <span className="text-white font-bold">{selectedPair}</span>
            </div>
            <div className="flex justify-between items-center text-white/60">
              <span>Order Type</span>
              <span className="text-white capitalize">{orderType}</span>
            </div>
            <div className="flex justify-between items-center text-white/60">
              <span>Size</span>
              <span className="text-white font-bold">{formattedButtonSize}</span>
            </div>
            <div className="flex justify-between items-center text-white/60">
              <span>Leverage & Mode</span>
              <span className="text-white">
                {marginMode === "cross" ? "Cross" : "Isolated"} · {leverage}×
              </span>
            </div>
            <div className="flex justify-between items-center text-white/60">
              <span>Entry / Trigger Price</span>
              <span className="text-white font-mono">
                {orderType === "limit" && limitPrice
                  ? `$${parseFloat(limitPrice).toLocaleString()}`
                  : `$${currentMarkPrice.toLocaleString()}`}
              </span>
            </div>
            <div className="flex justify-between items-center text-white/60">
              <span>Est. Liquidation Price</span>
              <span className="text-[#FF5A5F] font-mono font-bold">
                {liqPrice} (±{liqBufferPct}%)
              </span>
            </div>
            <div className="flex justify-between items-center text-white/60">
              <span>Margin Required</span>
              <span className="text-white font-mono font-bold">{costFormatted}</span>
            </div>
            <div className="flex justify-between items-center text-white/60">
              <span>Est. Taker Fee (0.05%)</span>
              <span className="text-white/80 font-mono">
                ~${(activeUsdcNotional * 0.0005).toFixed(2)} USDC
              </span>
            </div>
            {takeProfit && (
              <div className="flex justify-between items-center text-white/60">
                <span>Take Profit</span>
                <span className="text-[#B6F5B0] font-mono">
                  ${parseFloat(takeProfit).toLocaleString()}
                </span>
              </div>
            )}
            {stopLoss && (
              <div className="flex justify-between items-center text-white/60">
                <span>Stop Loss</span>
                <span className="text-[#FF5A5F] font-mono">
                  ${parseFloat(stopLoss).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(false)}
              className="flex-1 h-[42px] rounded-full border border-white/[0.1] text-white/70 hover:text-white hover:bg-white/[0.04] text-[13px] font-medium transition-colors cursor-pointer"
            >
              Back to Edit
            </button>
            <button
              type="button"
              onClick={() => {
                setIsReviewModalOpen(false);
                placeOrder();
              }}
              className={cn(
                "flex-1 h-[42px] rounded-full font-bold text-[13px] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg active:scale-98",
                side === "long"
                  ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                  : "bg-[#FF5A5F] text-white hover:bg-[#E0484D]",
              )}
            >
              <CheckCircle2 className="size-4" />
              <span>Confirm Order</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          KEYBOARD SHORTCUTS MODAL
          ========================================================================= */}
      <Dialog open={isShortcutsOpen} onOpenChange={setIsShortcutsOpen}>
        <DialogContent className="max-w-[400px] rounded-[20px] border border-white/[0.1] bg-[#141518] text-white p-5 gap-4 font-mono shadow-2xl">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-[16px] font-bold text-white flex items-center gap-2">
              <HelpCircle className="size-4 text-[#60A5FA]" />
              <span>Keyboard Shortcuts</span>
            </DialogTitle>
            <DialogDescription className="text-[12px] text-white/50">
              Speed up your order execution with hotkeys.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-[12px]">
            {[
              { key: "B", desc: "Switch side to Buy (Long)" },
              { key: "S", desc: "Switch side to Short" },
              { key: "Enter", desc: "Review and place order" },
              { key: "Esc", desc: "Close open modal or menu" },
              { key: "?", desc: "Toggle keyboard shortcuts help" },
            ].map((sc) => (
              <div
                key={sc.key}
                className="flex items-center justify-between p-2 rounded-[8px] bg-white/[0.02] border border-white/[0.04]"
              >
                <span className="text-white/70">{sc.desc}</span>
                <kbd className="px-2 py-0.5 rounded bg-white/[0.1] border border-white/20 text-white font-bold text-[11px]">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-white/[0.06] text-right">
            <button
              type="button"
              onClick={() => setIsShortcutsOpen(false)}
              className="px-4 py-1.5 rounded-full bg-white text-black font-bold text-[12px] hover:bg-white/90 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          EDIT TP / SL PROTECTION MODAL
          ========================================================================= */}
      <Dialog
        open={editingPosition !== null}
        onOpenChange={(open) => !open && setEditingPosition(null)}
      >
        <DialogContent className="max-w-[400px] rounded-[20px] border border-white/[0.1] bg-[#141518] text-white p-5 gap-4 font-mono shadow-2xl">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-[16px] font-bold text-white flex items-center gap-2">
              <Target className="size-4 text-[#B6F5B0]" />
              <span>Edit TP / SL Protection</span>
            </DialogTitle>
            <DialogDescription className="text-[12px] text-white/50">
              Update take profit and stop loss levels for {editingPosition?.pair} (
              {editingPosition?.size}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-[12px]">
            <div className="space-y-1">
              <Label className="text-white/60">Take Profit Price (USDT)</Label>
              <input
                type="number"
                value={editTp}
                onChange={(e) => setEditTp(e.target.value)}
                placeholder="e.g. 68000"
                className="w-full h-[38px] rounded-[10px] bg-[#1D1E22] border border-white/[0.08] px-3 text-white text-[12px] outline-none"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-white/60">Stop Loss Price (USDT)</Label>
              <input
                type="number"
                value={editSl}
                onChange={(e) => setEditSl(e.target.value)}
                placeholder="e.g. 62000"
                className="w-full h-[38px] rounded-[10px] bg-[#1D1E22] border border-white/[0.08] px-3 text-[#FF5A5F] text-[12px] outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setEditingPosition(null)}
              className="flex-1 h-[38px] rounded-full border border-white/[0.1] text-white/70 hover:text-white hover:bg-white/[0.04] text-[12px] font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (editingPosition) {
                  setTakeProfit(editTp);
                  setStopLoss(editSl);
                  toast.success(`TP / SL Updated for ${editingPosition.pair}`, {
                    description: `TP: ${editTp ? `$${editTp}` : "None"} · SL: ${editSl ? `$${editSl}` : "None"}`,
                  });
                  setEditingPosition(null);
                }
              }}
              className="flex-1 h-[38px] rounded-full bg-white text-black font-bold text-[12px] hover:bg-white/90 transition-colors cursor-pointer"
            >
              Save Levels
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          SHAREABLE P&L CARD PREVIEW MODAL
          ========================================================================= */}
      {shareModalTrade && (
        <SharePnlModal trade={shareModalTrade} onClose={() => setShareModalTrade(null)} />
      )}
    </div>
  );
}
