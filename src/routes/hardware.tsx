import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Cpu, Box, Radio, Zap, Shield, ArrowRight } from 'lucide-react';

export const Route = createFileRoute('/hardware')({
  head: () => ({
    meta: [
      { title: 'godcandle — Hardware Terminal' },
      { name: 'description', content: 'Tactile desktop trading terminal with CNC aluminum chassis, optical encoder dial, and mechanical switches.' },
    ],
  }),
  component: HardwarePage,
});

const HARDWARE_SPECS = [
  { label: 'Chassis', value: 'CNC 6061-T6 Anodized Aluminum', note: 'godcandle_ram.stl (54.1MB)' },
  { label: 'Front Bezel', value: 'Bead-blasted Anodized Plate', note: 'godcandle_v2_plat_predni.stl' },
  { label: 'Rotary Dial', value: 'Continuous Optical Encoder with Magnetic Detents', note: 'godcandle_v2_tlacitka_a_dial.stl' },
  { label: 'Execution Switches', value: 'Kailh Choc V2 Low Profile Mechanical', note: 'Direct Long / Short actuation' },
  { label: 'Display Interface', value: '4.3" High-Contrast Monochrome OLED', note: '60Hz mark-clamped BBO ticker' },
  { label: 'Connectivity', value: 'USB-C with Secure Element & Hardware Wallet Enclave', note: 'Direct HyperEVM RPC bridge' },
];

function HardwarePage() {
  return (
    <div className="py-8 px-4 md:px-8 max-w-5xl mx-auto font-mono text-xs text-accent space-y-8">
      {/* Header Banner */}
      <div className="border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 text-bull mb-1">
              <Cpu className="w-5 h-5 text-accent" />
              <span className="font-bold text-sm tracking-wider uppercase text-accent">
                PHYSICAL TRADING TERMINAL — GODCANDLE V2
              </span>
            </div>
            <p className="text-subtle text-xs">
              Zero-latency physical desk controller designed for 1000x execution and tactile position management.
            </p>
          </div>
          <span className="px-2.5 py-1 text-[10px] bg-bull/10 border border-bull text-bull rounded font-bold">
            PROTOTYPE V2 READY
          </span>
        </div>

        {/* Visual Showcase Box */}
        <div className="mt-6 p-8 bg-background border border-border text-center space-y-4">
          <div className="size-24 mx-auto rounded-full border-2 border-accent/40 flex items-center justify-center relative bg-surface">
            <div className="size-16 rounded-full border border-bull/60 flex items-center justify-center">
              <Radio className="w-8 h-8 text-accent animate-pulse" />
            </div>
            <div className="absolute top-1 right-2 size-2.5 rounded-full bg-bull" />
          </div>

          <div>
            <h3 className="text-base font-bold text-accent">Continuous Precision Encoder Knob</h3>
            <p className="text-subtle text-xs max-w-md mx-auto mt-1">
              Tactile detents at discrete leverage steps: 1x, 10x, 50x, 100x, 250x, 500x, 1000x with haptic micro-feedback.
            </p>
          </div>
        </div>
      </div>

      {/* Engineering Specs */}
      <div className="bg-surface border border-border p-6 space-y-4">
        <h2 className="text-sm font-bold text-accent tracking-wider uppercase flex items-center gap-2">
          <Box className="w-4 h-4 text-bull" />
          Technical Specifications & CAD Architecture
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {HARDWARE_SPECS.map((spec) => (
            <div key={spec.label} className="p-3 bg-background border border-border space-y-1">
              <span className="text-[10px] text-subtle block uppercase">{spec.label}</span>
              <span className="text-accent font-bold text-xs block">{spec.value}</span>
              <span className="text-[10px] text-bull block tabular">{spec.note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trophy Integration */}
      <div className="p-5 border border-border bg-surface flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-bull font-bold text-xs block">WEEKLY CANDLE CUP TROPHY ALLOCATION</span>
          <p className="text-subtle text-xs mt-1">
            Every weekly Candle Cup champion is awarded a serialized, custom-engraved physical Godcandle Terminal.
          </p>
        </div>

        <a
          href="/cup"
          className="px-4 py-2 bg-accent text-background font-bold text-xs hover:bg-white transition-all flex items-center gap-2"
        >
          <span>View Current Standings</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
