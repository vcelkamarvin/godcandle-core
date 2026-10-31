import React from 'react';
import { Link } from '@tanstack/react-router';
import { ShieldCheck, ExternalLink, Activity } from 'lucide-react';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';

export function Footer() {
  return (
    <footer className="border-t border-border bg-white text-muted-foreground font-sans text-xs relative">
      {/* Signature subtle rainbow / iridescent accent line */}
      <div className="h-[2px] w-full rainbow-bar" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-border">
          {/* Col 1: Protocol Overview */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm">
              <span className="text-base font-bold tracking-tight text-foreground font-sans">godcandle</span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-semibold uppercase text-foreground border border-border font-mono">
                HyperEVM 999
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Streamlined derivatives trading client routing directly to Hyperliquid L1 order books. Native Builder Code: <span className="text-[#2563EB] font-semibold">GODCANDLE</span>.
            </p>
            <div className="text-[10px] text-[#06964A] flex items-center gap-1.5 font-semibold font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Direct L1 Consensus · Zero Added Latency</span>
            </div>
          </div>

          {/* Col 2: The Masterplan Roadmap Status */}
          <div className="space-y-2.5">
            <span className="font-semibold text-foreground text-[10px] uppercase tracking-wider block font-mono">
              The Masterplan Status
            </span>
            <div className="p-3.5 bg-secondary/40 border border-border/80 rounded-xl space-y-2 text-[11px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Phase 0: L1 Client</span>
                <span className="text-[#06964A] font-bold text-[10px]">● LIVE (1x–50x)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Phase 1: House Pool</span>
                <span className="text-[#D97706] font-bold text-[10px]">IN DEV ($10k-$25k)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Phase 2: Candle Cup</span>
                <span className="text-[#2563EB] font-bold text-[10px]">UPCOMING</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Phase 3: Hardware</span>
                <span className="text-[#7C3AED] font-bold text-[10px]">FUTURE</span>
              </div>
            </div>
          </div>

          {/* Col 3: Smart Contracts on HyperEVM */}
          <div className="space-y-2.5">
            <span className="font-semibold text-foreground text-[10px] uppercase tracking-wider block font-mono">
              HyperEVM Contracts
            </span>
            <ul className="space-y-1.5 text-[11px] font-mono">
              <li>
                <a
                  href={`https://hyperscan.xyz/address/${CONTRACT_ADDRESSES.HousePool}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <span>HousePool.sol</span>
                  <span className="text-[9px] text-[#D97706] border border-[#D97706]/30 bg-[#FFFBEA] rounded px-1">IN DEV</span>
                  <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground/60" />
                </a>
              </li>
              <li>
                <a
                  href={`https://hyperscan.xyz/address/${CONTRACT_ADDRESSES.L1Read}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <span>L1Read.sol</span>
                  <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground/60" />
                </a>
              </li>
              <li>
                <a
                  href={`https://hyperscan.xyz/address/${CONTRACT_ADDRESSES.CandleToken}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <span>CandleToken.sol</span>
                  <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground/60" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform Navigation & Socials */}
          <div className="space-y-2.5">
            <span className="font-semibold text-foreground text-[10px] uppercase tracking-wider block font-mono">
              Documentation & Socials
            </span>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link to="/cup" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                  <span>The Candle Cup</span>
                  <span className="text-[9px] text-[#2563EB] border border-[#2563EB]/30 bg-[#EFF6FF] rounded px-1 font-mono">PHASE 2</span>
                </Link>
              </li>
              <li>
                <Link to="/docs" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <span>Documentation Overview</span>
                </Link>
              </li>
              <li>
                <Link to="/docs/rules" className="text-muted-foreground hover:text-foreground transition-colors">
                  Protocol Rules & Mark Clamping
                </Link>
              </li>
              <li>
                <Link to="/docs/pool" className="text-muted-foreground hover:text-foreground transition-colors">
                  House Pool & FIFO Settlement
                </Link>
              </li>
              <li>
                <Link to="/goal" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                  <span>Price Target Goal</span>
                </Link>
              </li>
              <li>
                <Link to="/boost" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                  <span>Boost Multiplier</span>
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/vcelkamarvin/godcandle-core"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground/60" />
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/godcandle_app"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <span>X (Twitter) @godcandle_app</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground/60" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Leverage Trading Risk Disclaimer */}
        <div className="py-4 border-b border-border text-[10px] text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">RISK DISCLAIMER:</strong> Trading perpetual futures and leveraged financial instruments involves a high degree of risk and can result in the loss of your entire investment. Leverage can magnify both gains and losses. godcandle currently operates as a non-custodial interface routing standard 1x–50x trades directly to Hyperliquid L1 order books via native Builder Code (GODCANDLE). Synthetic 1000x House Pool, Candle Cup automated rewards, and physical hardware are under active development. Ensure you fully understand the risks before trading.
          </p>
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-between text-muted-foreground text-[10px] gap-2 font-mono">
          <div>
            godcandle protocol © 2026 · Non-Custodial Trading Desk · Builder Code: <span className="text-[#2563EB] font-semibold">GODCANDLE</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#06964A]" />
              <span>Execution Engine: Active (Hyperliquid L1 Consensus)</span>
            </span>
            <span>Zero Protocol Surcharge</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
