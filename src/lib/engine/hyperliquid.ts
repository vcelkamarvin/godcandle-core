/**
 * HyperliquidEngine: Real Hyperliquid Perps Implementation of TradingEngine
 *
 * Characteristics:
 * - Real live funds, non-custodial via EIP-712 Phantom Agent signing
 * - Asset list and maxLeverage dynamically loaded from Hyperliquid meta (cached 5 min)
 * - Leverage capped strictly at asset's maxLeverage
 * - Isolated margin by default
 * - Size rounded to szDecimals, min $10 notional enforced
 * - Configurable network via NEXT_PUBLIC_HL_NETWORK (mainnet / testnet)
 * - Optional builder fee via NEXT_PUBLIC_HL_BUILDER_ADDRESS & NEXT_PUBLIC_HL_BUILDER_FEE_BPS
 * - Confirmation step required on first order of session
 */

import { keccak256, parseUnits, formatUnits } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type {
  TradingEngine,
  TradingMode,
  EngineMarket,
  OrderParams,
  QuoteResult,
  OrderResult,
  CloseResult,
  EnginePosition,
  EngineClosedTrade,
  EngineBalance,
} from "./types";
import {
  fetchHlMeta,
  fetchHlMetaAndAssetCtxs,
  getHlHttpUrl,
  getNetwork,
  marketStore,
  type HlMetaUniverseItem,
} from "../hyperliquid/market-data";
import { encodeMsgpack } from "../hyperliquid/msgpack";

const AGENT_STORAGE_KEY = "godcandle_hl_agent_key";
const SESSION_CONFIRMED_KEY = "godcandle_hl_session_confirmed";

export interface AgentWalletState {
  address: `0x${string}`;
  privateKey: `0x${string}`;
  isApproved: boolean;
  masterAddress?: string | undefined;
}

export class HyperliquidEngine implements TradingEngine {
  public mode: TradingMode = "perps";
  private agentAccount: ReturnType<typeof privateKeyToAccount> | null = null;
  private agentPrivateKey: `0x${string}` | null = null;
  private isAgentApproved: boolean = false;
  private connectedWallet: string | null = null;
  private metaUniverse: HlMetaUniverseItem[] = [];

  constructor() {
    this.initAgent();
    this.refreshMeta();
  }

  public setConnectedWallet(address: string | null) {
    this.connectedWallet = address;
  }

  public getConnectedWallet(): string | null {
    return this.connectedWallet;
  }

  private initAgent() {
    if (typeof window === "undefined") return;
    try {
      let key = sessionStorage.getItem(AGENT_STORAGE_KEY) as `0x${string}` | null;
      if (!key) {
        key = generatePrivateKey();
        sessionStorage.setItem(AGENT_STORAGE_KEY, key);
      }
      this.agentPrivateKey = key;
      this.agentAccount = privateKeyToAccount(key);

      const approvedMaster = sessionStorage.getItem(`${AGENT_STORAGE_KEY}_approved_master`);
      if (approvedMaster) {
        this.isAgentApproved = true;
      }
    } catch {}
  }

  public getAgentState(): AgentWalletState | null {
    if (!this.agentAccount || !this.agentPrivateKey) return null;
    return {
      address: this.agentAccount.address,
      privateKey: this.agentPrivateKey,
      isApproved: this.isAgentApproved,
      masterAddress: this.connectedWallet ?? undefined,
    };
  }

  public markAgentApproved(masterAddress: string) {
    this.isAgentApproved = true;
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`${AGENT_STORAGE_KEY}_approved_master`, masterAddress.toLowerCase());
    }
  }

  public async checkIsAgentApproved(masterAddress: string): Promise<boolean> {
    if (!this.agentAccount) return false;
    try {
      const res = await fetch(`${getHlHttpUrl()}/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "extraAgents",
          user: masterAddress,
        }),
      });
      if (!res.ok) return this.isAgentApproved;
      const agents = await res.json();
      if (Array.isArray(agents)) {
        const myAgent = this.agentAccount.address.toLowerCase();
        const found = agents.some((a: any) => a.address?.toLowerCase() === myAgent);
        if (found) {
          this.markAgentApproved(masterAddress);
          return true;
        }
      }
    } catch {}
    return this.isAgentApproved;
  }

  public createApproveAgentPayload(nonce: number) {
    if (!this.agentAccount) throw new Error("Agent account not ready");
    const isTestnet = getNetwork() === "testnet";
    return {
      domain: {
        name: "HyperliquidSignTransaction",
        version: "1",
        chainId: isTestnet ? 421614 : 42161,
        verifyingContract: "0x0000000000000000000000000000000000000000" as `0x${string}`,
      },
      types: {
        "HyperliquidTransaction:ApproveAgent": [
          { name: "hyperliquidChain", type: "string" },
          { name: "agentAddress", type: "address" },
          { name: "agentName", type: "string" },
          { name: "nonce", type: "uint64" },
        ],
      },
      primaryType: "HyperliquidTransaction:ApproveAgent" as const,
      message: {
        hyperliquidChain: isTestnet ? "Testnet" : "Mainnet",
        agentAddress: this.agentAccount.address,
        agentName: "godcandle",
        nonce: BigInt(nonce),
      },
    };
  }

  public async submitApprovedAgent(
    masterAddress: string,
    sigHex: string,
    nonce: number
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.agentAccount) return { success: false, error: "Agent not initialized" };
    const isTestnet = getNetwork() === "testnet";

    const r = sigHex.slice(0, 66);
    const s = "0x" + sigHex.slice(66, 130);
    const v = parseInt(sigHex.slice(130, 132), 16);

    try {
      const res = await fetch(`${getHlHttpUrl()}/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: {
            type: "approveAgent",
            signatureChainId: isTestnet ? "0x66eee" : "0xa4b1",
            hyperliquidChain: isTestnet ? "Testnet" : "Mainnet",
            agentAddress: this.agentAccount.address,
            agentName: "godcandle",
            nonce,
          },
          nonce,
          signature: { r, s, v },
        }),
      });

      const data = await res.json();
      if (data && data.status === "err") {
        return { success: false, error: data.response || "Order rejected by Hyperliquid" };
      }

      this.markAgentApproved(masterAddress);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to submit agent approval" };
    }
  }

  public hasConfirmedFirstOrder(): boolean {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(SESSION_CONFIRMED_KEY) === "true";
  }

  public confirmFirstOrder() {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SESSION_CONFIRMED_KEY, "true");
    }
  }

  public async refreshMeta(): Promise<HlMetaUniverseItem[]> {
    const meta = await fetchHlMeta();
    this.metaUniverse = meta.universe;
    return this.metaUniverse;
  }

  public getMarkets(): EngineMarket[] {
    if (this.metaUniverse.length === 0) {
      // Return safe defaults while loading
      return [
        { symbol: "BTC-USD", name: "Bitcoin", index: 0, maxLeverage: 50, szDecimals: 5, corridorBps: 1.5, defaultPrice: 68420.5 },
        { symbol: "ETH-USD", name: "Ethereum", index: 1, maxLeverage: 50, szDecimals: 4, corridorBps: 1.5, defaultPrice: 2540.2 },
        { symbol: "SOL-USD", name: "Solana", index: 2, maxLeverage: 20, szDecimals: 2, corridorBps: 1.5, defaultPrice: 182.4 },
        { symbol: "HYPE-USD", name: "Hyperliquid", index: 3, maxLeverage: 10, szDecimals: 2, corridorBps: 3.0, defaultPrice: 42.8 },
        { symbol: "DOGE-USD", name: "Dogecoin", index: 4, maxLeverage: 10, szDecimals: 0, corridorBps: 3.0, defaultPrice: 0.164 },
      ];
    }

    return this.metaUniverse.map((item, index) => ({
      symbol: `${item.name}-USD`,
      name: item.name,
      index,
      maxLeverage: item.maxLeverage,
      szDecimals: item.szDecimals,
      corridorBps: 1.5,
      defaultPrice: item.name === "BTC" ? 68420.5 : 2500,
      onlyIsolated: item.onlyIsolated ?? false,
    }));
  }

  public getMaxLeverage(asset: string): number {
    const raw = asset.replace("-USD", "");
    const found = this.metaUniverse.find((u) => u.name === raw);
    return found ? found.maxLeverage : 50;
  }

  public getSzDecimals(asset: string): number {
    const raw = asset.replace("-USD", "");
    const found = this.metaUniverse.find((u) => u.name === raw);
    return found ? found.szDecimals : 4;
  }

  public getAssetIndex(asset: string): number {
    const raw = asset.replace("-USD", "");
    const idx = this.metaUniverse.findIndex((u) => u.name === raw);
    return idx >= 0 ? idx : 0;
  }

  public quote(order: OrderParams, currentPrice: number): QuoteResult {
    const rawAsset = order.asset.replace("-USD", "");
    const maxAllowedLev = this.getMaxLeverage(rawAsset);
    const szDecimals = this.getSzDecimals(rawAsset);
    const leverage = Math.min(order.leverage, maxAllowedLev);

    const notional = order.margin * leverage;
    const execPrice = currentPrice;

    // Hyperliquid liquidation price approximation for isolated margin
    const initialMarginRate = 1 / leverage;
    const mmr = 0.005; // 0.5% default HL maintenance margin rate
    const longBustPrice = execPrice * (1 - initialMarginRate + mmr);
    const shortBustPrice = execPrice * (1 + initialMarginRate - mmr);

    const estBustDistancePct = Math.max(0.01, (initialMarginRate - mmr) * 100);
    const estBustDistanceBps = estBustDistancePct * 100;

    // Optional builder fee
    const builderAddress = typeof process !== "undefined" ? process.env?.["NEXT_PUBLIC_HL_BUILDER_ADDRESS"] : null;
    const builderFeeBps = typeof process !== "undefined" ? parseFloat(process.env?.["NEXT_PUBLIC_HL_BUILDER_FEE_BPS"] || "0") : 0;
    const builderFeeUsd = builderAddress && builderFeeBps > 0 ? (notional * builderFeeBps) / 10000 : 0;

    const estimatedFeeUsd = (notional * 0.00035) + builderFeeUsd; // ~3.5 bps taker fee + builder

    let error: string | null = null;
    if (notional < 10) {
      error = "Order value too small: minimum $10 notional required by Hyperliquid";
    }

    return {
      asset: order.asset,
      side: order.side,
      margin: order.margin,
      leverage,
      notional,
      execPrice,
      isClamped: false,
      estBustDistanceBps,
      estBustDistancePct,
      longBustPrice,
      shortBustPrice,
      estimatedFeeUsd,
      builderFeeUsd,
      minNotional: 10,
      error,
    };
  }

  /**
   * Place a real order on Hyperliquid via phantom agent signing.
   */
  public async placeOrder(order: OrderParams, currentPrice: number): Promise<OrderResult> {
    if (!this.connectedWallet) {
      return { success: false, error: "Wallet not connected. Connect your wallet to trade real perps." };
    }
    if (!this.agentAccount || !this.agentPrivateKey) {
      return { success: false, error: "API Agent key not initialized." };
    }
    if (!this.isAgentApproved) {
      return { success: false, error: "1-Click Agent not approved. Please approve the session key first." };
    }

    const rawAsset = order.asset.replace("-USD", "");
    const assetIdx = this.getAssetIndex(rawAsset);
    const maxLev = this.getMaxLeverage(rawAsset);
    const szDecimals = this.getSzDecimals(rawAsset);
    const leverage = Math.min(order.leverage, maxLev);

    const notional = order.margin * leverage;
    if (notional < 10) {
      return { success: false, error: "Minimum order value is $10 notional on Hyperliquid." };
    }

    // Step 1: Update leverage on Hyperliquid
    try {
      await this.updateLeverage(rawAsset, leverage);
    } catch (err: any) {
      console.warn("Leverage update warning:", err?.message);
    }

    // Step 2: Compute rounded order size
    const rawSize = notional / currentPrice;
    const roundedSize = Math.floor(rawSize * Math.pow(10, szDecimals)) / Math.pow(10, szDecimals);
    if (roundedSize <= 0) {
      return { success: false, error: `Calculated size too small for ${rawAsset} (${szDecimals} decimals).` };
    }

    // Determine limit price (aggressive market crossing: +0.5% for buy, -0.5% for sell)
    const isBuy = order.side === "long";
    const aggressivePrice = isBuy ? currentPrice * 1.005 : currentPrice * 0.995;
    const limitPriceStr = aggressivePrice.toFixed(2);
    const szStr = roundedSize.toString();

    const builderAddress = typeof process !== "undefined" ? process.env?.["NEXT_PUBLIC_HL_BUILDER_ADDRESS"] : null;
    const builderFeeBps = typeof process !== "undefined" ? parseInt(process.env?.["NEXT_PUBLIC_HL_BUILDER_FEE_BPS"] || "0", 10) : 0;

    const nonce = Date.now();
    const action: Record<string, any> = {
      type: "order",
      orders: [
        {
          a: assetIdx,
          b: isBuy,
          p: limitPriceStr,
          s: szStr,
          r: order.reduceOnly ?? false,
          t: { limit: { tif: "Ioc" } },
        },
      ],
      grouping: "na",
    };

    if (builderAddress && builderFeeBps > 0) {
      action["builder"] = { b: builderAddress, f: builderFeeBps };
    }

    try {
      const sig = await this.signL1Action(action, nonce);
      const res = await fetch(`${getHlHttpUrl()}/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          nonce,
          signature: sig,
          vaultAddress: null,
        }),
      });

      const data = await res.json();
      if (data && data.status === "err") {
        return { success: false, error: data.response || "Order rejected by Hyperliquid" };
      }

      this.confirmFirstOrder();
      return { success: true, message: "Order placed on Hyperliquid L1" };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to submit order to Hyperliquid" };
    }
  }

  public async updateLeverage(asset: string, leverage: number): Promise<{ success: boolean; error?: string }> {
    if (!this.agentAccount) return { success: false, error: "Agent not ready" };
    const raw = asset.replace("-USD", "");
    const assetIdx = this.getAssetIndex(raw);
    const nonce = Date.now();

    const action = {
      type: "updateLeverage",
      asset: assetIdx,
      isCross: false, // Isolated margin default
      leverage,
    };

    try {
      const sig = await this.signL1Action(action, nonce);
      const res = await fetch(`${getHlHttpUrl()}/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          nonce,
          signature: sig,
          vaultAddress: null,
        }),
      });
      const data = await res.json();
      if (data?.status === "err") {
        return { success: false, error: data.response };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  public async closePosition(id: string, currentPrice?: number): Promise<CloseResult> {
    const positions = await this.getPositions();
    const pos = positions.find((p) => p.id === id);
    if (!pos) return { success: false, error: "Position not found" };

    const rawAsset = pos.market.replace("-USD", "");
    const closeSide = pos.side === "long" ? "short" : "long";

    const res = await this.placeOrder(
      {
        asset: rawAsset,
        side: closeSide,
        margin: pos.stake,
        leverage: pos.leverage,
        reduceOnly: true,
      },
      currentPrice ?? pos.entry
    );

    return { success: res.success, error: res.error };
  }

  public async getPositions(): Promise<EnginePosition[]> {
    if (!this.connectedWallet) return [];
    try {
      const res = await fetch(`${getHlHttpUrl()}/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "clearinghouseState",
          user: this.connectedWallet,
        }),
      });
      if (!res.ok) return [];
      const data = await res.json();
      if (!data || !Array.isArray(data.assetPositions)) return [];

      const positions: EnginePosition[] = [];
      for (const item of data.assetPositions) {
        const p = item.position;
        if (!p || parseFloat(p.szi) === 0) continue;

        const size = Math.abs(parseFloat(p.szi));
        const side = parseFloat(p.szi) > 0 ? "long" : "short";
        const entry = parseFloat(p.entryPx);
        const lev = p.leverage?.value ?? 20;
        const margin = (size * entry) / lev;

        positions.push({
          id: `hl-${p.coin}`,
          market: p.coin,
          side,
          stake: margin,
          leverage: lev,
          entry,
          size,
          openedAt: Date.now(),
          liqPrice: p.liquidationPx ? parseFloat(p.liquidationPx) : undefined,
          liquidationPrice: p.liquidationPx ? parseFloat(p.liquidationPx) : undefined,
        });
      }
      return positions;
    } catch {
      return [];
    }
  }

  public async getHistory(): Promise<EngineClosedTrade[]> {
    if (!this.connectedWallet) return [];
    try {
      const res = await fetch(`${getHlHttpUrl()}/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "userFills",
          user: this.connectedWallet,
        }),
      });
      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data)) return [];

      return data.slice(0, 30).map((f: any, i: number) => {
        const px = parseFloat(f.px);
        const sz = parseFloat(f.sz);
        const closedPnl = f.closedPnl ? parseFloat(f.closedPnl) : 0;
        const side = f.side === "B" ? "long" : "short";
        const margin = (px * sz) / 20; // default estimated margin

        return {
          id: `fill-${f.tid || i}`,
          market: f.coin,
          side,
          stake: margin,
          leverage: 20,
          entry: px,
          exit: px,
          pnl: closedPnl,
          roiPct: margin > 0 ? (closedPnl / margin) * 100 : 0,
          durationMs: 0,
          liquidated: f.liquidation ?? false,
          closedAt: f.time ?? Date.now(),
          openedAt: (f.time ?? Date.now()) - 60000,
        };
      });
    } catch {
      return [];
    }
  }

  public async getBalance(): Promise<EngineBalance> {
    if (!this.connectedWallet) {
      return { balance: 0, available: 0, marginUsed: 0 };
    }
    try {
      const res = await fetch(`${getHlHttpUrl()}/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "clearinghouseState",
          user: this.connectedWallet,
        }),
      });
      if (!res.ok) return { balance: 0, available: 0, marginUsed: 0 };
      const data = await res.json();
      const marginSummary = data.marginSummary || data.crossMarginSummary || {};
      const accountValue = parseFloat(marginSummary.accountValue || "0");
      const totalMarginUsed = parseFloat(marginSummary.totalMarginUsed || "0");
      const withdrawable = parseFloat(data.withdrawable || marginSummary.withdrawable || "0");

      return {
        balance: accountValue,
        available: withdrawable,
        marginUsed: totalMarginUsed,
      };
    } catch {
      return { balance: 0, available: 0, marginUsed: 0 };
    }
  }

  public subscribePrices(asset: string, cb: (price: number) => void): () => void {
    const raw = asset.replace("-USD", "");
    return marketStore.subscribeAsset(raw, (data) => {
      if (data.midPx) cb(data.midPx);
    });
  }

  /**
   * Sign L1 Action using phantom agent EIP-712 standard
   */
  private async signL1Action(action: unknown, nonce: number): Promise<{ r: string; s: string; v: number }> {
    if (!this.agentAccount) throw new Error("Agent account not ready");

    // 1. Msgpack encode action
    const actionBytes = encodeMsgpack(action);

    // 2. Append nonce (8-byte big-endian uint64)
    const nonceBuf = new Uint8Array(8);
    new DataView(nonceBuf.buffer).setBigUint64(0, BigInt(nonce), false);

    // 3. Append vault marker (0x00 for standard account)
    const vaultBuf = new Uint8Array([0x00]);

    const combined = new Uint8Array(actionBytes.length + 8 + 1);
    combined.set(actionBytes, 0);
    combined.set(nonceBuf, actionBytes.length);
    combined.set(vaultBuf, actionBytes.length + 8);

    // 4. Keccak-256 hash -> connectionId
    const connectionId = keccak256(combined);

    // 5. Sign EIP-712 phantom agent message
    const isTestnet = getNetwork() === "testnet";
    const sigHex = await this.agentAccount.signTypedData({
      domain: {
        name: "Exchange",
        version: "1",
        chainId: 1337,
        verifyingContract: "0x0000000000000000000000000000000000000000",
      },
      types: {
        Agent: [
          { name: "source", type: "string" },
          { name: "connectionId", type: "bytes32" },
        ],
      },
      primaryType: "Agent",
      message: {
        source: isTestnet ? "b" : "a",
        connectionId,
      },
    });

    const r = sigHex.slice(0, 66);
    const s = "0x" + sigHex.slice(66, 130);
    const v = parseInt(sigHex.slice(130, 132), 16);

    return { r, s, v };
  }
}

export const hyperliquidEngineInstance = new HyperliquidEngine();
