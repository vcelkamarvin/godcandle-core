import { defineChain } from 'viem';

export const hyperEVM = defineChain({
  id: 999,
  name: 'HyperEVM Mainnet',
  nativeCurrency: {
    name: 'HYPE',
    symbol: 'HYPE',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.hyperliquid.xyz/evm'],
    },
  },
  blockExplorers: {
    default: {
      name: 'HyperEVM Explorer',
      url: 'https://hyperscan.xyz',
    },
  },
});
