import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SettingsView } from './SettingsView';
import { Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';

interface SettingsModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerButton?: boolean;
  triggerClassName?: string;
}

export function SettingsModal({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  triggerButton = false,
  triggerClassName = '',
}: SettingsModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setOpen = (val: boolean) => {
    if (isControlled && controlledOnOpenChange) {
      controlledOnOpenChange(val);
    } else {
      setInternalOpen(val);
    }
  };

  // Keyboard shortcut: Cmd+, or Ctrl+, opens Settings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setOpen(!isOpen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {triggerButton && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={
            triggerClassName ||
            'flex size-8 items-center justify-center rounded-lg border border-[#30363D] bg-[#161B22] text-[#8B949E] hover:text-white hover:bg-[#21262D] transition-colors cursor-pointer'
          }
          title="Settings (Cmd+,)"
          aria-label="Settings"
        >
          <SettingsIcon className="size-4" />
        </button>
      )}

      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-4xl border border-[#21262D] bg-[#080B0F] p-5 text-[#E6EDF3] font-mono shadow-2xl overflow-y-auto max-h-[90vh] rounded-xl"
          hideClose
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#21262D] text-xs text-[#8B949E]">
            <DialogTitle className="flex items-center gap-1.5 font-semibold text-white text-xs">
              <SettingsIcon className="size-3.5 text-[#00D964]" />
              QUICK SETTINGS DRAWER · DIALOG
            </DialogTitle>
            <div className="flex items-center gap-3">
              <Link
                to="/settings"
                onClick={() => setOpen(false)}
                className="text-[10px] text-[#58A6FF] hover:underline flex items-center gap-1"
              >
                Open Full Page ↗
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-white hover:text-[#FF3B30] text-sm px-1 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="mt-2">
            <SettingsView isModal onClose={() => setOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
