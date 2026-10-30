import React, { useState } from 'react';
import { Key, ShieldAlert, CheckCircle2, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SessionKeyPrompt() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggle = () => {
    setLoading(true);
    setTimeout(() => {
      setIsEnabled((prev) => !prev);
      setLoading(false);
    }, 400);
  };

  return (
    <div className="border border-border bg-surface p-3 font-mono text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className={`w-4 h-4 ${isEnabled ? 'text-bull' : 'text-subtle'}`} />
          <div>
            <span className="font-semibold text-accent block">
              1-Click Execution Delegate
            </span>
            <span className="text-[10px] text-subtle block">
              {isEnabled
                ? 'Active · Sub-millisecond signing enabled for 1000x Perps'
                : 'Disabled · Approve once for zero-signature 1000x trades'}
            </span>
          </div>
        </div>

        <Button
          size="sm"
          variant={isEnabled ? 'outline' : 'default'}
          className={`h-7 px-3 text-[11px] font-mono ${
            isEnabled
              ? 'border-border text-subtle hover:text-accent'
              : 'bg-accent text-background hover:bg-white'
          }`}
          onClick={handleToggle}
          disabled={loading}
        >
          {loading ? 'Configuring…' : isEnabled ? 'Revoke Key' : 'Enable 1-Click'}
        </Button>
      </div>

      {isEnabled && (
        <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-between text-[10px] text-subtle">
          <span className="flex items-center gap-1 text-bull">
            <CheckCircle2 className="w-3 h-3" />
            Session Key: 0x7c2…9e1
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Expires in: 23h 58m
          </span>
        </div>
      )}
    </div>
  );
}
