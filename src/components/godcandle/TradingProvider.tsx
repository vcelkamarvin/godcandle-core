import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useAccount, useSignTypedData } from "wagmi";
import { getMarket, type MarketSymbol } from "@/config/markets";
import { getSnap, startFeed, useFeeds, updateHlPrices } from "@/lib/price-feed";
import {
  fmtSigned,
  fmtUsd,
  isLiquidated,
  liquidation,
  openingError,
  pnlOf,
  type ClosedTrade,
  type Position,
  type Side,
  type TradingMode,
  type TradingEngine,
  paperEngineInstance,
  hyperliquidEngineInstance,
} from "@/lib/engine";
import { marketStore } from "@/lib/hyperliquid/market-data";

export interface TradingContextType {
  mode: TradingMode;
  setMode: (mode: TradingMode) => void;
  engine: TradingEngine;
  feeds: ReturnType<typeof useFeeds>;
  positions: Position[];
  history: ClosedTrade[];
  balance: number;
  available: number;
  open: (market: MarketSymbol, side: Side, stake: number, leverage: number, tp?: number | null, sl?: number | null) => void;
  close: (target: string, liquidated?: boolean, trigger?: "tp" | "sl" | "liquidation" | "manual") => void;
  deposit: (amount: number) => void;
  withdraw: (amount: number) => void;
  resetPaperBalance: () => Promise<{ success: boolean; error?: string; remainingCooldownSec?: number }>;
  isAgentApproved: boolean;
  approveAgent: () => Promise<boolean>;
  revokeSessionKeys: () => void;
}

function useTradingState() {
  const feeds = useFeeds();
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const [isAgentApproved, setIsAgentApproved] = useState<boolean>(() =>
    hyperliquidEngineInstance.getAgentState()?.isApproved ?? false
  );

  // Mode: 'perps' (real Hyperliquid) or 'paper1000x' (test paper trading)
  const [mode, setModeState] = useState<TradingMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("godcandle_active_mode");
      if (saved === "perps" || saved === "paper1000x") return saved;
      if (window.location.pathname === "/trade") return "paper1000x";
      if (window.location.pathname === "/") return "perps";
    }
    return "paper1000x";
  });

  const setMode = (m: TradingMode) => {
    setModeState(m);
    if (typeof window !== "undefined") {
      localStorage.setItem("godcandle_active_mode", m);
    }
  };

  // Sync connected wallet to Hyperliquid Engine and Paper Engine
  useEffect(() => {
    hyperliquidEngineInstance.setConnectedWallet(address ?? null);
    paperEngineInstance.attachWallet(address ?? null);

    if (address) {
      hyperliquidEngineInstance.checkIsAgentApproved(address).then((approved) => {
        setIsAgentApproved(approved);
      });
    } else {
      setIsAgentApproved(false);
    }
  }, [address]);

  // Paper Mode State
  const [paperPositions, setPaperPositions] = useState<Position[]>(() =>
    paperEngineInstance.getPositions() as Position[]
  );
  const [paperHistory, setPaperHistory] = useState<ClosedTrade[]>(() =>
    paperEngineInstance.getHistory() as ClosedTrade[]
  );
  const [paperBalance, setPaperBalance] = useState<number>(10000);

  // Perps Mode State (Real account data)
  const [perpsPositions, setPerpsPositions] = useState<Position[]>([]);
  const [perpsHistory, setPerpsHistory] = useState<ClosedTrade[]>([]);
  const [perpsBalance, setPerpsBalance] = useState<number>(0);
  const [perpsAvailable, setPerpsAvailable] = useState<number>(0);

  // Subscribe to Paper Engine updates
  useEffect(() => {
    const unsub = paperEngineInstance.subscribe(() => {
      setPaperPositions([...(paperEngineInstance.getPositions() as Position[])]);
      setPaperHistory([...(paperEngineInstance.getHistory() as ClosedTrade[])]);
      paperEngineInstance.getBalance().then((b) => setPaperBalance(b.balance));
    });
    paperEngineInstance.getBalance().then((b) => setPaperBalance(b.balance));

    // Poll server-side liquidations every 10s
    const syncInterval = setInterval(() => {
      paperEngineInstance.syncServerState();
    }, 10000);

    return () => {
      unsub();
      clearInterval(syncInterval);
    };
  }, []);

  // Poll Real Hyperliquid Data when in perps mode or wallet changes
  useEffect(() => {
    if (!address) {
      setPerpsPositions([]);
      setPerpsHistory([]);
      setPerpsBalance(0);
      setPerpsAvailable(0);
      return;
    }

    let active = true;
    const fetchHlData = async () => {
      try {
        const [positions, history, balance] = await Promise.all([
          hyperliquidEngineInstance.getPositions(),
          hyperliquidEngineInstance.getHistory(),
          hyperliquidEngineInstance.getBalance(),
        ]);
        if (active) {
          setPerpsPositions(positions as Position[]);
          setPerpsHistory(history as ClosedTrade[]);
          setPerpsBalance(balance.balance);
          setPerpsAvailable(balance.available);
        }
      } catch {}
    };

    fetchHlData();
    const interval = setInterval(fetchHlData, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [address, mode]);

  // Start feeds & marketStore, and pipe live HL ticks to price feed
  useEffect(() => {
    startFeed();
    marketStore.init();
    const unsubMids = marketStore.subscribeMids((mids) => {
      updateHlPrices(mids);
    });
    return () => {
      unsubMids();
    };
  }, []);

  const activeEngine: TradingEngine = mode === "perps" ? hyperliquidEngineInstance : paperEngineInstance;

  // Active positions & history strictly separated
  const positions = mode === "perps" ? perpsPositions : paperPositions;
  const history = mode === "perps" ? perpsHistory : paperHistory;
  const balance = mode === "perps" ? perpsBalance : paperBalance;
  const available =
    mode === "perps"
      ? perpsAvailable
      : Math.max(0, paperBalance - paperPositions.reduce((s, p) => s + p.stake, 0));

  async function open(
    market: MarketSymbol,
    side: Side,
    stake: number,
    leverage: number,
    tp?: number | null,
    sl?: number | null
  ) {
    const price = feeds[market]?.price ?? getSnap(market).price;

    if (mode === "paper1000x") {
      const res = await paperEngineInstance.placeOrder(
        {
          asset: market,
          side,
          margin: stake,
          leverage,
          tp,
          sl,
        },
        price
      );
      if (res.success) {
        toast.success(`1000x Paper Order Placed!`, {
          description: `$${stake} margin @ ${leverage}x on ${market}.`,
        });
      } else {
        toast.error(res.error || "Failed to place paper order");
      }
    } else {
      // Perps Mode (Real funds)
      const res = await hyperliquidEngineInstance.placeOrder(
        {
          asset: market,
          side,
          margin: stake,
          leverage,
        },
        price
      );
      if (res.success) {
        toast.success(`Real Hyperliquid Perp Placed!`, {
          description: `$${stake} margin @ ${leverage}x on ${market}`,
        });
      } else {
        toast.error(res.error || "Order rejected by Hyperliquid");
      }
    }
  }

  async function close(
    target: string,
    liquidated = false,
    trigger?: "tp" | "sl" | "liquidation" | "manual"
  ) {
    const pos = positions.find((p) => p.id === target || p.market === target);
    if (!pos) return;

    const price = feeds[pos.market]?.price ?? getSnap(pos.market).price;

    if (mode === "paper1000x") {
      const res = await paperEngineInstance.closePosition(pos.id, price);
      if (res.success) {
        if (liquidated || trigger === "liquidation") {
          toast.error(`${pos.market} liquidated at $${fmtUsd(price)}`);
        } else if (trigger === "tp") {
          toast.success(`Take Profit triggered for ${pos.market} (${fmtSigned(res.pnl ?? 0)})`);
        } else if (trigger === "sl") {
          toast.error(`Stop Loss triggered for ${pos.market} (${fmtSigned(res.pnl ?? 0)})`);
        } else {
          toast(`Closed ${pos.market} (${fmtSigned(res.pnl ?? 0)})`);
        }
      }
    } else {
      const res = await hyperliquidEngineInstance.closePosition(pos.id, price);
      if (res.success) {
        toast.success(`Real Hyperliquid position closed for ${pos.market}`);
      } else {
        toast.error(res.error || "Failed to close real position");
      }
    }
  }

  function deposit(amount: number) {
    if (amount <= 0 || !Number.isFinite(amount)) return;
    if (mode === "paper1000x") {
      toast.info("Paper mode uses simulated USDC. Use Reset Balance to reset to $10,000.");
    } else {
      toast.info("Deposit to Hyperliquid via the official bridge or Arbitrum deposit.");
    }
  }

  function withdraw(amount: number) {
    if (amount <= 0 || !Number.isFinite(amount)) return;
    if (mode === "paper1000x") {
      toast.info("Paper trading mode has no real withdrawals.");
    } else {
      toast.info("Withdraw from Hyperliquid via clearinghouse bridge.");
    }
  }

  async function resetPaperBalance() {
    return await paperEngineInstance.resetBalance();
  }

  const agentState = hyperliquidEngineInstance.getAgentState();

  async function approveAgent(): Promise<boolean> {
    if (!address) {
      toast.error("Please connect your wallet first");
      return false;
    }
    const nonce = Date.now();
    try {
      const payload = hyperliquidEngineInstance.createApproveAgentPayload(nonce);
      const sigHex = await signTypedDataAsync(payload as any);
      const res = await hyperliquidEngineInstance.submitApprovedAgent(address, sigHex, nonce);
      if (res.success) {
        setIsAgentApproved(true);
        toast.success("1-Click Hyperliquid Agent Approved!");
        return true;
      } else {
        toast.error(res.error || "Hyperliquid rejected agent approval");
        return false;
      }
    } catch (err: any) {
      console.error("Agent approval signature failed:", err);
      toast.error(err?.message || "Failed to sign agent approval");
      return false;
    }
  }

  function revokeSessionKeys() {
    hyperliquidEngineInstance.revokeSessionKeys();
    setIsAgentApproved(false);
    toast.info("Session keys revoked. Local trading keys cleared.");
  }

  return {
    mode,
    setMode,
    engine: activeEngine,
    feeds,
    positions,
    history,
    balance,
    available,
    open,
    close,
    deposit,
    withdraw,
    resetPaperBalance,
    isAgentApproved,
    approveAgent,
    revokeSessionKeys,
  };
}

const TradingContext = createContext<TradingContextType | null>(null);

export function TradingProvider({ children }: { children: ReactNode }) {
  const state = useTradingState();
  return <TradingContext.Provider value={state}>{children}</TradingContext.Provider>;
}

export function useTrading() {
  const context = useContext(TradingContext);
  if (!context) throw new Error("TradingProvider is required");
  return context;
}