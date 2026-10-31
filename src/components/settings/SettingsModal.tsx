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
            'flex size-8 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer'
          }
          title="Settings (Cmd+,)"
          aria-label="Settings"
        >
          <SettingsIcon className="size-4" />
        </button>
      )}

      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-4xl border border-border bg-white p-5 text-foreground font-sans shadow-2xl overflow-y-auto max-h-[90vh] rounded-2xl"
          hideClose
        >
          <div className="flex items-center justify-between pb-2 border-b border-border text-xs text-muted-foreground">
            <DialogTitle className="flex items-center gap-1.5 font-semibold text-foreground text-xs font-mono">
              <SettingsIcon className="size-3.5 text-[#06964A]" />
              QUICK SETTINGS DRAWER · DIALOG
            </DialogTitle>
            <div className="flex items-center gap-3">
              <Link
                to="/settings"
                onClick={() => setOpen(false)}
                className="text-[10px] text-[#2563EB] hover:underline flex items-center gap-1 font-mono font-medium"
              >
                Open Full Page ↗
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm px-1 font-bold cursor-pointer"
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
