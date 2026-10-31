import React from 'react';
import { createFileRoute, Outlet, Link } from '@tanstack/react-router';
import { BookOpen, Shield, Layers, Coins } from 'lucide-react';

export const Route = createFileRoute('/docs')({
  component: DocsLayout,
});

const DOCS_NAV = [
  { href: '/docs', label: 'Overview', icon: BookOpen },
  { href: '/docs/rules', label: 'Trading Rules & Mark-Clamp', icon: Shield },
  { href: '/docs/pool', label: 'House Pool & FIFO Queue', icon: Layers },
  { href: '/docs/token', label: 'CANDLE Tokenomics', icon: Coins },
];

function DocsLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans text-xs">
      <aside className="w-full md:w-64 border-r border-border p-6 shrink-0 bg-surface">
        <div className="text-[11px] tracking-wider uppercase text-subtle mb-6 font-bold flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-accent" />
          Documentation
        </div>
        <nav className="flex flex-col space-y-2">
          {DOCS_NAV.map((item) => (
            <Link
              key={item.href}
              to={item.href as any}
              activeOptions={{ exact: item.href === '/docs' }}
              activeProps={{
                className: 'bg-surface-elevated text-accent border border-accent font-semibold',
              }}
              inactiveProps={{
                className: 'text-subtle hover:text-accent hover:bg-background border border-transparent',
              }}
              className="px-3 py-2 rounded transition-all flex items-center gap-2"
            >
              <item.icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-12 p-3 bg-background border border-border text-[11px] space-y-1">
          <div className="text-subtle">Network: <span className="text-accent">HyperEVM</span></div>
          <div className="text-subtle">Chain ID: <span className="text-accent">999</span></div>
          <div className="text-subtle">Status: <span className="text-bull font-bold">Mainnet Alpha</span></div>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-12 max-w-4xl mx-auto space-y-8">
        <Outlet />
      </main>
    </div>
  );
}
