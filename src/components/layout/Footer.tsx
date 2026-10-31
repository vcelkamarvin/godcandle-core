import React from 'react';
import { Link } from '@tanstack/react-router';
import { ShieldCheck, ExternalLink, Database, Activity, Lock } from 'lucide-react';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';

export function Footer() {
  return (
    <footer className="border-t border-border bg-white text-foreground font-sans text-xs mt-8 sm:mt-10 relative">
      {/* Delicate Rainbow Accent Bar */}
      <div className="h-[1px] w-full rainbow-bar opacity-70" />
      <div className="max-w-7xl mx-auto px-6 py-5 sm:py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-border">
          {/* Col 1: Protocol Overview */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm">
              <span className="text-base font-normal tracking-tight font-sans text-foreground">godcandle</span>
              <span className="rounded-full bg-gradient-to-r from-[#CDC3F0]/40 via-[#FFDAC8]/40 to-[#A0D4CA]/40 px-2 py-0.5 text-[9px] font-semibold uppercase text-foreground border border-border">
                HyperEVM
              </span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              High-leverage synthetic derivative exchange and gamified trading arena deployed natively on HyperEVM. Pure FIFO settlement against the on-chain House Pool.
            </p>
            <div className="text-[10px] text-[#06964A] flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Contractual Solvency Guarantee
            </div>
          </div>

          {/* Col 2: Proof of Reserves */}
          <div className="space-y-2.5">
            <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider block">
              Proof of Reserves
            </span>
            <div className="p-3 bg-[#F6F6F4] border border-border rounded-xl space-y-1.5 text-[11px]">
              <div className="flex justify-between text-muted-foreground">
                <span>House Pool</span>
                <span className="text-foreground font-semibold tabular">$14,850,240 USDC</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>FIFO Debt Depth</span>
                <span className="text-[#06964A] font-semibold tabular">$0.00</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Solvency Ratio</span>
                <span className="text-[#06964A] font-semibold tabular">342%</span>
              </div>
            </div>
          </div>

          {/* Col 3: Smart Contracts on HyperEVM */}
          <div className="space-y-2.5">
            <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider block">
              HyperEVM Contracts
            </span>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <a
                  href={`https://hyperscan.xyz/address/${CONTRACT_ADDRESSES.HousePool}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <span>HousePool.sol</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href={`https://hyperscan.xyz/address/${CONTRACT_ADDRESSES.L1Read}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <span>L1Read.sol (0x0806/0x080e)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href={`https://hyperscan.xyz/address/${CONTRACT_ADDRESSES.CandleToken}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <span>CandleToken.sol</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform Navigation */}
          <div className="space-y-2.5">
            <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider block">
              Documentation & Specs
            </span>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link to="/cup" className="text-foreground font-semibold hover:underline transition-colors flex items-center gap-1">
                  <span>The Candle Cup ($53.5k Live)</span>
                </Link>
              </li>
              <li>
                <Link to="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
                  Documentation Overview
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
                <Link to="/docs/token" className="text-muted-foreground hover:text-foreground transition-colors">
                  CANDLE Tokenomics & Waterfall
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-wrap items-center justify-between text-muted-foreground text-[10px] gap-2">
          <div>
            godcandle protocol © 2026 · Non-Custodial Trading Desk
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#06964A]" />
              Execution Engine: Active
            </span>
            <span>Zero Slippage · Zero Entry Fee</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
