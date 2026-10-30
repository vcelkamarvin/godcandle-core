import React from 'react';
import { Link } from '@tanstack/react-router';
import { ShieldCheck, ExternalLink, Database, Activity, Lock } from 'lucide-react';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface text-accent font-mono text-xs mt-12">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-border">
          {/* Col 1: Protocol Overview */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm">
              <div className="size-5 bg-accent text-background flex items-center justify-center font-bold text-[10px]">
                G
              </div>
              <span>godcandle</span>
            </div>
            <p className="text-subtle text-[11px] leading-relaxed">
              High-leverage synthetic derivative exchange and gamified trading arena deployed natively on HyperEVM. Pure FIFO settlement against the on-chain House Pool.
            </p>
            <div className="text-[10px] text-bull flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Contractual Solvency Guarantee
            </div>
          </div>

          {/* Col 2: Proof of Reserves */}
          <div className="space-y-2.5">
            <span className="font-semibold text-subtle text-[10px] uppercase tracking-wider block">
              Proof of Reserves
            </span>
            <div className="p-3 bg-background border border-border space-y-1.5 text-[11px]">
              <div className="flex justify-between text-subtle">
                <span>House Pool</span>
                <span className="text-accent font-semibold tabular">$14,850,240 USDC</span>
              </div>
              <div className="flex justify-between text-subtle">
                <span>FIFO Debt Depth</span>
                <span className="text-bull font-semibold tabular">$0.00</span>
              </div>
              <div className="flex justify-between text-subtle">
                <span>Solvency Ratio</span>
                <span className="text-bull font-semibold tabular">342%</span>
              </div>
            </div>
          </div>

          {/* Col 3: Smart Contracts on HyperEVM */}
          <div className="space-y-2.5">
            <span className="font-semibold text-subtle text-[10px] uppercase tracking-wider block">
              HyperEVM Contracts
            </span>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <a
                  href={`https://hyperscan.xyz/address/${CONTRACT_ADDRESSES.HousePool}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-subtle hover:text-accent flex items-center gap-1 transition-colors"
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
                  className="text-subtle hover:text-accent flex items-center gap-1 transition-colors"
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
                  className="text-subtle hover:text-accent flex items-center gap-1 transition-colors"
                >
                  <span>CandleToken.sol</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform Navigation */}
          <div className="space-y-2.5">
            <span className="font-semibold text-subtle text-[10px] uppercase tracking-wider block">
              Documentation & Specs
            </span>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link to="/docs" className="text-subtle hover:text-accent transition-colors">
                  Documentation Overview
                </Link>
              </li>
              <li>
                <Link to="/docs/rules" className="text-subtle hover:text-accent transition-colors">
                  Protocol Rules & Mark Clamping
                </Link>
              </li>
              <li>
                <Link to="/docs/pool" className="text-subtle hover:text-accent transition-colors">
                  House Pool & FIFO Settlement
                </Link>
              </li>
              <li>
                <Link to="/docs/token" className="text-subtle hover:text-accent transition-colors">
                  CANDLE Tokenomics & Waterfall
                </Link>
              </li>
              <li>
                <Link to="/hardware" className="text-subtle hover:text-accent transition-colors">
                  Physical Terminal Specs
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-wrap items-center justify-between text-subtle text-[10px] gap-2">
          <div>
            godcandle protocol © 2026 · HyperEVM Chain ID 999 · Mainnet Alpha
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-bull" />
              Precompile Sync: 48ms
            </span>
            <span>Zero Slippage · Zero Entry Fee</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
