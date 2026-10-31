import React, { useEffect, useState } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { hyperEVM } from '@/lib/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'godcandle',
  projectId: (typeof process !== 'undefined' && process.env?.['NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID']) || '3fcc6bba00d440409a6358c2b719be2f',
  chains: [hyperEVM],
  ssr: true,
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <RainbowKitProvider
        theme={darkTheme({
          accentColor: '#FFFFFF',
          accentColorForeground: '#000000',
          borderRadius: 'small',
          fontStack: 'system',
        })}
      >
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
