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
    <div className="min-h-[80vh] bg-background text-foreground flex flex-col md:flex-row font-sans text-xs">
      <aside className="w-full md:w-60 border-r border-border p-4 shrink-0 bg-white">
        <div className="text-[11px] tracking-wider uppercase text-muted-foreground mb-4 font-bold flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-foreground" />
          Documentation
        </div>
        <nav className="flex flex-col space-y-1.5">
          {DOCS_NAV.map((item) => (
            <Link
              key={item.href}
              to={item.href as any}
              activeOptions={{ exact: item.href === '/docs' }}
              activeProps={{
                className: 'bg-secondary text-foreground border border-border font-semibold',
              }}
              inactiveProps={{
                className: 'text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-transparent',
              }}
              className="px-3 py-1.5 rounded-xl transition-all flex items-center gap-2"
            >
              <item.icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-8 p-3 bg-secondary/50 rounded-xl border border-border text-[11px] space-y-1">
          <div className="text-muted-foreground">Network: <span className="font-semibold text-foreground">HyperEVM</span></div>
          <div className="text-muted-foreground">Chain ID: <span className="font-semibold text-foreground">999</span></div>
          <div className="text-muted-foreground">Status: <span className="text-[#06964A] font-bold">Mainnet Alpha</span></div>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-5">
        <Outlet />
      </main>
    </div>
  );
}
