import React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { ShieldCheck, ExternalLink, Activity } from 'lucide-react';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';

export function Footer() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLanding = pathname === '/main';

  return (
    <footer
      className={`border-t font-mono text-xs relative ${
        isLanding
          ? 'bg-[#080B0F] border-[#21262D] text-[#8B949E]'
          : 'bg-[#0D1117] border-[#21262D] text-[#8B949E]'
      }`}
    >
      {/* Subtle iridescent accent line */}
      <div className="h-[1px] w-full bg-gradient-to-r from-[#00D964]/40 via-[#58A6FF]/40 to-[#A371F7]/40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-[#21262D]">
          {/* Col 1: Protocol Overview */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm">
              <span className="text-base font-bold tracking-tight text-white">godcandle</span>
              <span className="rounded-full bg-[#161B22] px-2 py-0.5 text-[9px] font-semibold uppercase text-[#58A6FF] border border-[#30363D]">
                HyperEVM 999
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#8B949E]">
              Streamlined derivatives trading client routing directly to Hyperliquid L1 order books. Native Builder Code: <span className="text-[#58A6FF] font-semibold">GODCANDLE</span>.
            </p>
            <div className="text-[10px] text-[#00D964] flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Direct L1 Consensus · Zero Added Latency</span>
            </div>
          </div>

          {/* Col 2: The Masterplan Roadmap Status */}
          <div className="space-y-2.5">
            <span className="font-semibold text-white text-[10px] uppercase tracking-wider block">
              The Masterplan Status
            </span>
            <div className="p-3 bg-[#161B22] border border-[#21262D] rounded-xl space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-[#8B949E]">Phase 0: L1 Client</span>
                <span className="text-[#00D964] font-bold text-[10px]">● LIVE (1x–50x)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8B949E]">Phase 1: House Pool</span>
                <span className="text-[#E3B341] font-bold text-[10px]">IN DEV ($10k-$25k)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8B949E]">Phase 2: Candle Cup</span>
                <span className="text-[#58A6FF] font-bold text-[10px]">UPCOMING</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8B949E]">Phase 3: Hardware</span>
                <span className="text-[#A371F7] font-bold text-[10px]">FUTURE (0DTE)</span>
              </div>
            </div>
          </div>

          {/* Col 3: Smart Contracts on HyperEVM */}
          <div className="space-y-2.5">
            <span className="font-semibold text-white text-[10px] uppercase tracking-wider block">
              HyperEVM Contracts
            </span>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <a
                  href={`https://hyperscan.xyz/address/${CONTRACT_ADDRESSES.HousePool}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#8B949E] hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <span>HousePool.sol</span>
                  <span className="text-[9px] text-[#E3B341] border border-[#E3B341]/30 rounded px-1">IN DEV</span>
                  <ExternalLink className="w-3 h-3 ml-auto text-[#484F58]" />
                </a>
              </li>
              <li>
                <a
                  href={`https://hyperscan.xyz/address/${CONTRACT_ADDRESSES.L1Read}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#8B949E] hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <span>L1Read.sol</span>
                  <ExternalLink className="w-3 h-3 ml-auto text-[#484F58]" />
                </a>
              </li>
              <li>
                <a
                  href={`https://hyperscan.xyz/address/${CONTRACT_ADDRESSES.CandleToken}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#8B949E] hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <span>CandleToken.sol</span>
                  <ExternalLink className="w-3 h-3 ml-auto text-[#484F58]" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform Navigation & Socials */}
          <div className="space-y-2.5">
            <span className="font-semibold text-white text-[10px] uppercase tracking-wider block">
              Documentation & Socials
            </span>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link to="/cup" className="text-[#8B949E] hover:text-white transition-colors flex items-center gap-1.5">
                  <span>The Candle Cup</span>
                  <span className="text-[9px] text-[#58A6FF] border border-[#58A6FF]/30 rounded px-1">PHASE 2</span>
                </Link>
              </li>
              <li>
                <Link to="/docs" className="text-[#8B949E] hover:text-white transition-colors flex items-center gap-1">
                  <span>Documentation Overview</span>
                </Link>
              </li>
              <li>
                <Link to="/docs/rules" className="text-[#8B949E] hover:text-white transition-colors">
                  Protocol Rules & Mark Clamping
                </Link>
              </li>
              <li>
                <Link to="/docs/pool" className="text-[#8B949E] hover:text-white transition-colors">
                  House Pool & FIFO Settlement
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/vcelkamarvin/godcandle-core"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#8B949E] hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3 h-3 text-[#484F58]" />
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/godcandle_app"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#8B949E] hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <span>X (Twitter) @godcandle_app</span>
                  <ExternalLink className="w-3 h-3 text-[#484F58]" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Leverage Trading Risk Disclaimer */}
        <div className="py-4 border-b border-[#21262D] text-[10px] text-[#8B949E] leading-relaxed">
          <p>
            <strong className="text-white">RISK DISCLAIMER:</strong> Trading perpetual futures and leveraged financial instruments involves a high degree of risk and can result in the loss of your entire investment. Leverage can magnify both gains and losses. godcandle currently operates as a non-custodial interface routing standard 1x–50x trades directly to Hyperliquid L1 order books via native Builder Code (GODCANDLE). Synthetic 1000x House Pool, Candle Cup automated rewards, and physical hardware are under active development. Ensure you fully understand the risks before trading.
          </p>
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-between text-[#8B949E] text-[10px] gap-2">
          <div>
            godcandle protocol © 2026 · Non-Custodial Trading Desk · Builder Code: <span className="text-[#58A6FF] font-semibold">GODCANDLE</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#00D964]" />
              <span>Execution Engine: Active (Hyperliquid L1 Consensus)</span>
            </span>
            <span>Zero Protocol Surcharge</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
