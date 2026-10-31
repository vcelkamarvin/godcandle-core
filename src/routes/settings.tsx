import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { SettingsView } from '@/components/settings/SettingsView';

export const Route = createFileRoute('/settings')({
  head: () => ({
    meta: [
      { title: 'godcandle — Settings & Network Diagnostics' },
      {
        name: 'description',
        content: 'Institutional trading preferences, 1-click session keys, and HyperEVM RPC network telemetry.',
      },
      { property: 'og:title', content: 'godcandle — Settings & Network Diagnostics' },
      {
        property: 'og:description',
        content: 'Trading preferences, session keys, and HyperEVM network diagnostics.',
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <main className="min-h-[calc(100vh-130px)] bg-[#080B0F] text-[#E6EDF3] py-5 px-3 sm:px-6 font-mono">
      <div className="max-w-6xl mx-auto">
        <SettingsView />
      </div>
    </main>
  );
}
