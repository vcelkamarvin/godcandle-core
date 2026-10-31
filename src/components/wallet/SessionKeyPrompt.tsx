import React, { useState } from 'react';
import { Key, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTrading } from '@/components/godcandle/TradingProvider';
import { hyperliquidEngineInstance } from '@/lib/engine/hyperliquid';

export function SessionKeyPrompt() {
  const t = useTrading();
  const [loading, setLoading] = useState(false);
  const agentState = hyperliquidEngineInstance.getAgentState();
  const isEnabled = t.isAgentApproved || agentState?.isApproved;

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (!isEnabled) {
        await t.approveAgent();
      } else {
        // revoke
        t.revokeSessionKeys();
      }
    } finally {
      setLoading(false);
    }
  };

  const agentAddr = agentState?.address;
  const shortAddr = agentAddr ? `${agentAddr.slice(0, 6)}…${agentAddr.slice(-4)}` : '0x7c2…9e1';

  return (
    <div className="border border-border bg-surface p-3 font-mono text-xs rounded-xl shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className={`w-4 h-4 ${isEnabled ? 'text-[#06964A]' : 'text-muted-foreground'}`} />
          <div>
            <span className="font-semibold text-foreground block">
              1-Click Hyperliquid Agent Key
            </span>
            <span className="text-[10px] text-muted-foreground block">
              {isEnabled
                ? 'Active · Sub-millisecond EIP-712 signing enabled for live perps'
                : 'Disabled · Approve once for non-custodial zero-popup trades'}
            </span>
          </div>
        </div>

        <Button
          size="sm"
          variant={isEnabled ? 'outline' : 'default'}
          className={`h-7 px-3 text-[11px] font-mono ${
            isEnabled
              ? 'border-border text-muted-foreground hover:text-foreground'
              : 'bg-foreground text-background hover:opacity-90'
          }`}
          onClick={handleToggle}
          disabled={loading}
        >
          {loading ? 'Configuring…' : isEnabled ? 'Revoke Key' : 'Approve Agent'}
        </Button>
      </div>

      {isEnabled && (
        <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1 text-[#06964A]">
            <CheckCircle2 className="w-3 h-3" />
            Agent Address: {shortAddr}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Session Nonce: Ready
          </span>
        </div>
      )}
    </div>
  );
}
