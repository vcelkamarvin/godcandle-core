import React, { useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Key, Zap, CheckCircle2, Copy, ExternalLink } from 'lucide-react';

export function ConnectModal() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <ConnectButton.Custom>
        {({ account, chain, openConnectModal, mounted }) => {
          const ready = mounted;
          const connected = ready && account && chain;

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                style: {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className="px-3.5 py-1.5 text-xs font-mono font-medium rounded-full bg-foreground text-background hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5 text-bull" />
                      <span>Connect Wallet</span>
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className="px-3 py-1.5 text-xs font-mono rounded-full bg-bear/20 text-bear border border-bear/40 hover:bg-bear/30 transition-all"
                    >
                      Switch to HyperEVM (999)
                    </button>
                  );
                }

                return (
                  <button
                    onClick={() => setDetailsOpen(true)}
                    type="button"
                    className="px-3 py-1.5 text-xs font-mono rounded-full bg-surface border border-border hover:border-accent transition-all flex items-center gap-2"
                  >
                    <span className="size-2 rounded-full bg-bull animate-pulse" />
                    <span className="text-accent">{account.displayName}</span>
                    <span className="text-subtle text-[10px]">HyperEVM</span>
                  </button>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md bg-surface border-border text-accent font-mono">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-bull" />
              Connected Account
            </DialogTitle>
            <DialogDescription className="text-xs text-subtle">
              Operating on HyperEVM Mainnet (Chain ID 999)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="p-3 bg-background border border-border rounded flex items-center justify-between">
              <span className="text-xs text-subtle truncate max-w-[280px]">{address}</span>
              <button
                onClick={copyAddress}
                className="p-1.5 hover:bg-surface rounded text-subtle hover:text-accent transition-colors"
                title="Copy Address"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-bull" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-background border border-border rounded">
                <span className="text-subtle text-[10px] block">NETWORK</span>
                <span className="font-semibold text-accent">HyperEVM (999)</span>
              </div>
              <div className="p-3 bg-background border border-border rounded">
                <span className="text-subtle text-[10px] block">SETTLEMENT</span>
                <span className="font-semibold text-bull">Pure FIFO Liquid</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href={`https://hyperscan.xyz/address/${address}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-subtle hover:text-accent flex items-center gap-1.5 transition-colors"
              >
                <span>View on Hyperscan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <Button
                variant="destructive"
                size="sm"
                className="font-mono text-xs"
                onClick={() => {
                  disconnect();
                  setDetailsOpen(false);
                }}
              >
                Disconnect
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
