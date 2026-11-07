import { useSyncExternalStore } from "react";

export type WalletChain = "solana" | "ethereum" | "arbitrum" | "polygon" | "base";

export type WalletProviderId =
  | "phantom"
  | "metamask"
  | "rabby"
  | "coinbase"
  | "solflare"
  | "backpack"
  | "okx"
  | "walletconnect"
  | "privy"
  | "demo";

export interface WalletProviderInfo {
  id: WalletProviderId;
  name: string;
  category: "solana" | "evm" | "multi";
  chains: WalletChain[];
  icon: string; // Identifier for icon renderer
  description: string;
  downloadUrl: string;
  recommended?: boolean;
}

export interface ProductVaultBalances {
  options: number;
  perps: number;
  turbo: number;
  spot: number;
}

export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  isReadOnly: boolean;
  termsAccepted: boolean;
  isTermsModalOpen: boolean;
  authEmail: string | null;
  providerId: WalletProviderId | null;
  providerName: string | null;
  address: string | null;
  chain: WalletChain;
  networkName: string;
  balanceUsd: number;
  balanceCrypto: string;
  vaultBalances: ProductVaultBalances;
  isModalOpen: boolean;
  lastConnected: number | null;
}

export interface InjectedSolanaProvider {
  isPhantom?: boolean;
  isSolflare?: boolean;
  isBackpack?: boolean;
  publicKey?: { toString(): string; toBase58?(): string };
  connect?: () => Promise<{ publicKey?: { toString(): string; toBase58?(): string } }>;
}

export interface InjectedEthereumProvider {
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  providers?: InjectedEthereumProvider[];
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

export interface InjectedWindow {
  phantom?: { solana?: InjectedSolanaProvider };
  solana?: InjectedSolanaProvider;
  ethereum?: InjectedEthereumProvider;
  rabby?: InjectedEthereumProvider;
  coinbaseWalletExtension?: InjectedEthereumProvider;
  solflare?: InjectedSolanaProvider;
  backpack?: InjectedSolanaProvider;
  xnft?: { solana?: InjectedSolanaProvider };
  okxwallet?: InjectedEthereumProvider & { solana?: InjectedSolanaProvider };
}

export const SUPPORTED_PROVIDERS: WalletProviderInfo[] = [
  {
    id: "phantom",
    name: "Phantom",
    category: "solana",
    chains: ["solana", "ethereum", "polygon"],
    icon: "phantom",
    description: "Leading multi-chain wallet for Solana & EVM",
    downloadUrl: "https://phantom.app/download",
    recommended: true,
  },
  {
    id: "metamask",
    name: "MetaMask",
    category: "evm",
    chains: ["ethereum", "arbitrum", "base", "polygon"],
    icon: "metamask",
    description: "The most widely used self-custody EVM wallet",
    downloadUrl: "https://metamask.io/download/",
    recommended: true,
  },
  {
    id: "rabby",
    name: "Rabby",
    category: "evm",
    chains: ["ethereum", "arbitrum", "base", "polygon"],
    icon: "rabby",
    description: "The game-changing Web3 wallet for DeFi & EVM",
    downloadUrl: "https://rabby.io",
    recommended: true,
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    category: "multi",
    chains: ["ethereum", "arbitrum", "base", "solana"],
    icon: "coinbase",
    description: "Secure self-custody wallet by Coinbase",
    downloadUrl: "https://www.coinbase.com/wallet",
  },
  {
    id: "solflare",
    name: "Solflare",
    category: "solana",
    chains: ["solana"],
    icon: "solflare",
    description: "Popular native Solana browser & mobile wallet",
    downloadUrl: "https://solflare.com/",
  },
  {
    id: "backpack",
    name: "Backpack",
    category: "multi",
    chains: ["solana", "ethereum"],
    icon: "backpack",
    description: "xNFT & next-gen multi-chain trading wallet",
    downloadUrl: "https://backpack.app/",
  },
  {
    id: "okx",
    name: "OKX Wallet",
    category: "multi",
    chains: ["ethereum", "arbitrum", "solana", "base"],
    icon: "okx",
    description: "Institutional cross-chain Web3 portal",
    downloadUrl: "https://www.okx.com/web3",
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    category: "multi",
    chains: ["ethereum", "arbitrum", "solana", "base"],
    icon: "walletconnect",
    description: "Scan with Rainbow, Trust, or 300+ mobile wallets",
    downloadUrl: "https://walletconnect.network/",
  },
  {
    id: "demo",
    name: "Quantin Desk Demo",
    category: "multi",
    chains: ["solana", "arbitrum"],
    icon: "demo",
    description: "Instant simulated treasury ($4,823 USDC + 4.20 ETH)",
    downloadUrl: "#",
  },
];

export const CHAIN_NAMES: Record<WalletChain, string> = {
  solana: "Solana Mainnet",
  ethereum: "Ethereum Mainnet",
  arbitrum: "Arbitrum One",
  polygon: "Polygon PoS",
  base: "Base Mainnet",
};

export const STORAGE_KEY = "quantin_wallet_session_v1";

export const INITIAL_STATE: WalletState = {
  isConnected: false,
  isConnecting: false,
  isReadOnly: false,
  termsAccepted: false,
  isTermsModalOpen: false,
  authEmail: null,
  providerId: null,
  providerName: null,
  address: null,
  chain: "arbitrum",
  networkName: "Arbitrum One",
  balanceUsd: 4823,
  balanceCrypto: "4.20 ETH",
  vaultBalances: {
    options: 19292,
    perps: 28938,
    turbo: 9646,
    spot: 33761,
  },
  isModalOpen: false,
  lastConnected: null,
};

export const TERMS_STORAGE_KEY = "quantin_terms_accepted_v1";

let state: WalletState = { ...INITIAL_STATE };
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    try {
      listener();
    } catch (err) {
      console.error("walletStore listener error:", err);
    }
  }
}

function getInjectedWindow(): InjectedWindow | null {
  if (typeof window === "undefined") return null;
  return window as unknown as InjectedWindow;
}

/** Check if a specific browser wallet extension is injected in window */
export function isProviderInstalled(providerId: WalletProviderId): boolean {
  const win = getInjectedWindow();
  if (!win) return false;

  switch (providerId) {
    case "phantom":
      return Boolean(win.phantom?.solana || win.solana?.isPhantom);
    case "metamask":
      return Boolean(
        win.ethereum?.isMetaMask ||
        (Array.isArray(win.ethereum?.providers) &&
          win.ethereum.providers.some((p) => p.isMetaMask)),
      );
    case "rabby":
      return Boolean(
        win.rabby ||
        (win.ethereum as unknown as { isRabby?: boolean })?.isRabby ||
        (Array.isArray(win.ethereum?.providers) &&
          win.ethereum.providers.some((p: unknown) => (p as { isRabby?: boolean })?.isRabby)),
      );
    case "coinbase":
      return Boolean(
        win.coinbaseWalletExtension ||
        win.ethereum?.isCoinbaseWallet ||
        (Array.isArray(win.ethereum?.providers) &&
          win.ethereum.providers.some((p) => p.isCoinbaseWallet)),
      );
    case "solflare":
      return Boolean(win.solflare?.isSolflare || win.solflare);
    case "backpack":
      return Boolean(win.backpack || win.xnft?.solana || win.solana?.isBackpack);
    case "okx":
      return Boolean(win.okxwallet);
    case "walletconnect":
    case "privy":
    case "demo":
      return true;
    default:
      return false;
  }
}

export function formatTruncatedAddress(address: string | null): string {
  if (!address) return "";
  if (address.length <= 11) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function getExplorerUrl(chain: WalletChain, address: string | null): string {
  if (!address) return "#";
  switch (chain) {
    case "solana":
      return `https://solscan.io/account/${address}`;
    case "arbitrum":
      return `https://arbiscan.io/address/${address}`;
    case "base":
      return `https://basescan.org/address/${address}`;
    case "polygon":
      return `https://polygonscan.com/address/${address}`;
    case "ethereum":
    default:
      return `https://etherscan.io/address/${address}`;
  }
}

// Generate realistic mock addresses
export function generateDemoAddress(chain: WalletChain): string {
  if (chain === "solana") {
    return "8xBtW7kG3pC9yqL2vZaJ6FmE1oRsT4uK";
  }
  return "0x71C54a9dF9F1a6b0E47814bFc75D1c2A478F4F9A";
}

export const VAULT_STORAGE_KEY = "quantin_vault_balances_v1";

function saveSession(stateToSave: WalletState) {
  if (typeof window === "undefined") return;
  try {
    if (stateToSave.isConnected && stateToSave.address && stateToSave.providerId) {
      const payload = {
        providerId: stateToSave.providerId,
        providerName: stateToSave.providerName,
        address: stateToSave.address,
        chain: stateToSave.chain,
        networkName: stateToSave.networkName,
        balanceUsd: stateToSave.balanceUsd,
        balanceCrypto: stateToSave.balanceCrypto,
        lastConnected: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    localStorage.setItem(
      VAULT_STORAGE_KEY,
      JSON.stringify({
        balanceUsd: stateToSave.balanceUsd,
        vaultBalances: stateToSave.vaultBalances,
      }),
    );
  } catch {
    // ignore localStorage errors
  }
}

function loadVaultAllocations(): {
  balanceUsd?: number;
  vaultBalances?: ProductVaultBalances;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadSession(): Partial<WalletState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.address && parsed.providerId) {
      return {
        isConnected: true,
        providerId: parsed.providerId,
        providerName: parsed.providerName,
        address: parsed.address,
        chain: parsed.chain || "solana",
        networkName:
          parsed.networkName || CHAIN_NAMES[parsed.chain as WalletChain] || "Solana Mainnet",
        balanceUsd: parsed.balanceUsd ?? 42180,
        balanceCrypto: parsed.balanceCrypto ?? "14.5 SOL",
        lastConnected: parsed.lastConnected ?? Date.now(),
      };
    }
  } catch {
    // ignore
  }
  return null;
}

// Auto-restore on client load
if (typeof window !== "undefined") {
  const restored = loadSession();
  if (restored) {
    state = { ...state, ...restored };
  }
  const vaultAlloc = loadVaultAllocations();
  if (vaultAlloc) {
    if (typeof vaultAlloc.balanceUsd === "number") {
      state.balanceUsd = vaultAlloc.balanceUsd;
    }
    if (vaultAlloc.vaultBalances) {
      state.vaultBalances = { ...state.vaultBalances, ...vaultAlloc.vaultBalances };
    }
  }
}

export const walletStore = {
  getState(): WalletState {
    return state;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  setModalOpen(isOpen: boolean) {
    state = { ...state, isModalOpen: isOpen };
    notify();
  },

  openModal() {
    state = { ...state, isModalOpen: true };
    notify();
  },

  closeModal() {
    state = { ...state, isModalOpen: false };
    notify();
  },

  setReadOnly(isReadOnly: boolean) {
    state = { ...state, isReadOnly, isModalOpen: false };
    notify();
  },

  isTermsAccepted(): boolean {
    if (state.termsAccepted) return true;
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem(TERMS_STORAGE_KEY) === "true";
      } catch {
        return false;
      }
    }
    return false;
  },

  acceptTerms() {
    state = { ...state, termsAccepted: true, isTermsModalOpen: false };
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(TERMS_STORAGE_KEY, "true");
      } catch {
        // ignore
      }
    }
    notify();
  },

  openTermsModal() {
    state = { ...state, isTermsModalOpen: true };
    notify();
  },

  closeTermsModal() {
    state = { ...state, isTermsModalOpen: false };
    notify();
  },

  async loginWithEmail(email: string): Promise<boolean> {
    state = { ...state, isConnecting: true };
    notify();

    // Deterministic simulated EVM address provisioning (Privy embedded wallet)
    await new Promise((resolve) => setTimeout(resolve, 350));
    const cleanEmail = email.toLowerCase().trim();
    let hash = 0;
    for (let i = 0; i < cleanEmail.length; i++) {
      hash = (hash * 31 + cleanEmail.charCodeAt(i)) >>> 0;
    }
    const hexSuffix = hash.toString(16).padStart(8, "0").repeat(5).slice(0, 36);
    const evmAddr = `0x7a${hexSuffix}`;

    state = {
      ...state,
      isConnected: true,
      isConnecting: false,
      isReadOnly: false,
      authEmail: cleanEmail,
      providerId: "privy",
      providerName: `Privy (${cleanEmail})`,
      address: evmAddr,
      chain: "arbitrum",
      networkName: CHAIN_NAMES.arbitrum,
      balanceUsd: state.balanceUsd ?? 4823,
      balanceCrypto: "4.20 ETH",
      isModalOpen: false,
      lastConnected: Date.now(),
    };
    saveSession(state);
    notify();
    return true;
  },

  async loginWithSocial(provider: "google" | "apple"): Promise<boolean> {
    state = { ...state, isConnecting: true };
    notify();

    await new Promise((resolve) => setTimeout(resolve, 350));
    const providerTitle = provider === "google" ? "Google" : "Apple";
    const evmAddr = "0x71C54a9dF9F1a6b0E47814bFc75D1c2A478F4F9A";

    state = {
      ...state,
      isConnected: true,
      isConnecting: false,
      isReadOnly: false,
      authEmail: `trader@${provider}.privy.io`,
      providerId: "privy",
      providerName: `${providerTitle} (Privy Embedded)`,
      address: evmAddr,
      chain: "arbitrum",
      networkName: CHAIN_NAMES.arbitrum,
      balanceUsd: state.balanceUsd ?? 4823,
      balanceCrypto: "4.20 ETH",
      isModalOpen: false,
      lastConnected: Date.now(),
    };
    saveSession(state);
    notify();
    return true;
  },

  switchChain(newChain: WalletChain) {
    const isSol = newChain === "solana";
    const newAddress = isSol
      ? "8xBtW7kG3pC9yqL2vZaJ6FmE1oRsT4uK"
      : "0x71C54a9dF9F1a6b0E47814bFc75D1c2A478F4F9A";
    const newBalance = isSol ? "14.5 SOL" : "3.85 ETH";

    state = {
      ...state,
      chain: newChain,
      networkName: CHAIN_NAMES[newChain],
      address: state.isConnected ? newAddress : null,
      balanceCrypto: newBalance,
    };
    saveSession(state);
    notify();
  },

  async connect(providerId: WalletProviderId, options?: { forceDemo?: boolean }): Promise<boolean> {
    const win = getInjectedWindow();
    const providerInfo = SUPPORTED_PROVIDERS.find((p) => p.id === providerId);
    const providerName = providerInfo?.name ?? providerId;

    state = { ...state, isConnecting: true };
    notify();

    try {
      let resolvedAddress: string | null = null;
      let resolvedChain: WalletChain = providerInfo?.chains[0] ?? "solana";
      let resolvedCrypto = resolvedChain === "solana" ? "14.5 SOL" : "3.85 ETH";

      // 1. Phantom connection logic (Solana / Multi-chain)
      if (providerId === "phantom") {
        const phantom = win?.phantom?.solana || (win?.solana?.isPhantom ? win.solana : null);
        if (!options?.forceDemo && phantom && typeof phantom.connect === "function") {
          try {
            const resp = await phantom.connect();
            const pubKey = resp?.publicKey || phantom.publicKey;
            resolvedAddress =
              typeof pubKey?.toBase58 === "function"
                ? pubKey.toBase58()
                : pubKey?.toString() || null;
            resolvedChain = "solana";
            resolvedCrypto = "18.25 SOL";
          } catch (err: unknown) {
            // User rejected or canceled
            if (
              typeof err === "object" &&
              err !== null &&
              "code" in err &&
              (err as { code: number }).code === 4001
            ) {
              state = { ...state, isConnecting: false };
              notify();
              return false;
            }
            resolvedAddress = generateDemoAddress("solana");
          }
        } else {
          resolvedAddress = generateDemoAddress("solana");
        }
      }
      // 2. MetaMask connection logic (EVM)
      else if (providerId === "metamask") {
        let mm = win?.ethereum;
        if (Array.isArray(win?.ethereum?.providers)) {
          mm = win.ethereum.providers.find((p) => p.isMetaMask) || win.ethereum;
        }
        if (!options?.forceDemo && mm && typeof mm.request === "function") {
          try {
            const accounts = (await mm.request({
              method: "eth_requestAccounts",
            })) as string[];
            if (accounts && accounts[0]) {
              resolvedAddress = accounts[0];
              resolvedChain = "arbitrum";
              resolvedCrypto = "4.20 ETH";
            }
          } catch (err: unknown) {
            if (
              typeof err === "object" &&
              err !== null &&
              "code" in err &&
              (err as { code: number }).code === 4001
            ) {
              state = { ...state, isConnecting: false };
              notify();
              return false;
            }
            resolvedAddress = generateDemoAddress("arbitrum");
          }
        } else {
          resolvedAddress = generateDemoAddress("arbitrum");
          resolvedChain = "arbitrum";
        }
      }
      // Rabby connection logic (EVM)
      else if (providerId === "rabby") {
        let rb = (win as unknown as { rabby?: InjectedEthereumProvider })?.rabby;
        if (!rb && (win?.ethereum as unknown as { isRabby?: boolean })?.isRabby) {
          rb = win?.ethereum;
        }
        if (!options?.forceDemo && rb && typeof rb.request === "function") {
          try {
            const accounts = (await rb.request({
              method: "eth_requestAccounts",
            })) as string[];
            if (accounts && accounts[0]) {
              resolvedAddress = accounts[0];
              resolvedChain = "arbitrum";
              resolvedCrypto = "4.20 ETH";
            }
          } catch (err: unknown) {
            if (
              typeof err === "object" &&
              err !== null &&
              "code" in err &&
              (err as { code: number }).code === 4001
            ) {
              state = { ...state, isConnecting: false };
              notify();
              return false;
            }
            resolvedAddress = generateDemoAddress("arbitrum");
          }
        } else {
          resolvedAddress = generateDemoAddress("arbitrum");
          resolvedChain = "arbitrum";
          resolvedCrypto = "4.20 ETH";
        }
      }
      // 3. Coinbase Wallet (EVM / Solana)
      else if (providerId === "coinbase") {
        let cb = win?.coinbaseWalletExtension;
        if (!cb && Array.isArray(win?.ethereum?.providers)) {
          cb = win.ethereum.providers.find((p) => p.isCoinbaseWallet);
        }
        if (!cb && win?.ethereum?.isCoinbaseWallet) {
          cb = win.ethereum;
        }
        if (!options?.forceDemo && cb && typeof cb.request === "function") {
          try {
            const accounts = (await cb.request({ method: "eth_requestAccounts" })) as string[];
            if (accounts && accounts[0]) {
              resolvedAddress = accounts[0];
              resolvedChain = "base";
              resolvedCrypto = "5.50 ETH";
            }
          } catch {
            resolvedAddress = generateDemoAddress("base");
          }
        } else {
          resolvedAddress = generateDemoAddress("base");
          resolvedChain = "base";
        }
      }
      // 4. Solflare (Solana)
      else if (providerId === "solflare") {
        const solflare = win?.solflare;
        if (!options?.forceDemo && solflare && typeof solflare.connect === "function") {
          try {
            await solflare.connect();
            const pubKey = solflare.publicKey;
            resolvedAddress =
              typeof pubKey?.toBase58 === "function"
                ? pubKey.toBase58()
                : pubKey?.toString() || generateDemoAddress("solana");
            resolvedChain = "solana";
          } catch {
            resolvedAddress = generateDemoAddress("solana");
          }
        } else {
          resolvedAddress = generateDemoAddress("solana");
          resolvedChain = "solana";
        }
      }
      // 5. Backpack (Solana / Multi-chain)
      else if (providerId === "backpack") {
        const bp =
          win?.backpack || win?.xnft?.solana || (win?.solana?.isBackpack ? win.solana : null);
        if (!options?.forceDemo && bp && typeof bp.connect === "function") {
          try {
            await bp.connect();
            const pubKey = bp.publicKey;
            resolvedAddress =
              typeof pubKey?.toBase58 === "function"
                ? pubKey.toBase58()
                : pubKey?.toString() || generateDemoAddress("solana");
            resolvedChain = "solana";
          } catch {
            resolvedAddress = generateDemoAddress("solana");
          }
        } else {
          resolvedAddress = generateDemoAddress("solana");
          resolvedChain = "solana";
        }
      }
      // 6. OKX Wallet (Cross-chain)
      else if (providerId === "okx") {
        const okx = win?.okxwallet;
        if (!options?.forceDemo && okx && typeof okx.request === "function") {
          try {
            const accounts = (await okx.request({ method: "eth_requestAccounts" })) as string[];
            resolvedAddress = accounts?.[0] || generateDemoAddress("arbitrum");
            resolvedChain = "arbitrum";
          } catch {
            resolvedAddress = generateDemoAddress("arbitrum");
          }
        } else {
          resolvedAddress = generateDemoAddress("arbitrum");
          resolvedChain = "arbitrum";
        }
      }
      // 7. WalletConnect & Demo Desk (EVM-only focus)
      else if (providerId === "walletconnect") {
        resolvedAddress = generateDemoAddress("arbitrum");
        resolvedChain = "arbitrum";
        resolvedCrypto = "4.20 ETH";
      } else {
        resolvedAddress = generateDemoAddress("arbitrum");
        resolvedChain = "arbitrum";
        resolvedCrypto = "4.20 ETH";
      }

      if (!resolvedAddress) {
        resolvedAddress = generateDemoAddress(resolvedChain);
      }

      state = {
        ...state,
        isConnected: true,
        isConnecting: false,
        providerId,
        providerName,
        address: resolvedAddress,
        chain: resolvedChain,
        networkName: CHAIN_NAMES[resolvedChain] || "Solana Mainnet",
        balanceUsd: state.balanceUsd ?? 4823,
        balanceCrypto: resolvedCrypto,
        isModalOpen: false,
        lastConnected: Date.now(),
      };

      saveSession(state);
      notify();
      return true;
    } catch (err) {
      console.error("Wallet connection error:", err);
      state = { ...state, isConnecting: false };
      notify();
      return false;
    }
  },

  disconnect() {
    state = {
      ...INITIAL_STATE,
      isModalOpen: false,
    };
    saveSession(state);
    notify();
  },

  deposit(amountUsd: number, destination: string = "wallet") {
    const dest = destination || "wallet";
    const currentVaults = state.vaultBalances || {
      options: 19292,
      perps: 28938,
      turbo: 9646,
      spot: 33761,
    };
    const updatedVaults = { ...currentVaults };
    let newBalanceUsd = state.balanceUsd || 0;

    if (dest === "options") {
      updatedVaults.options += amountUsd;
    } else if (dest === "perps") {
      updatedVaults.perps += amountUsd;
    } else if (dest === "spot") {
      updatedVaults.spot += amountUsd;
    } else if (dest === "turbo" || dest === "1000x") {
      updatedVaults.turbo += amountUsd;
    } else {
      newBalanceUsd += amountUsd;
    }

    state = {
      ...state,
      balanceUsd: newBalanceUsd,
      vaultBalances: updatedVaults,
    };
    saveSession(state);
    notify();
  },

  transfer(amountUsd: number, from: string = "wallet", to: string = "perps"): boolean {
    if (amountUsd <= 0) return false;
    const currentVaults = state.vaultBalances || {
      options: 19292,
      perps: 28938,
      turbo: 9646,
      spot: 33761,
    };
    const updatedVaults = { ...currentVaults };
    let newBalanceUsd = state.balanceUsd || 0;

    // Deduct from source
    if (from === "options") {
      updatedVaults.options = Math.max(0, updatedVaults.options - amountUsd);
    } else if (from === "perps") {
      updatedVaults.perps = Math.max(0, updatedVaults.perps - amountUsd);
    } else if (from === "spot") {
      updatedVaults.spot = Math.max(0, updatedVaults.spot - amountUsd);
    } else if (from === "turbo" || from === "1000x") {
      updatedVaults.turbo = Math.max(0, updatedVaults.turbo - amountUsd);
    } else {
      newBalanceUsd = Math.max(0, newBalanceUsd - amountUsd);
    }

    // Add to destination
    if (to === "options") {
      updatedVaults.options += amountUsd;
    } else if (to === "perps") {
      updatedVaults.perps += amountUsd;
    } else if (to === "spot") {
      updatedVaults.spot += amountUsd;
    } else if (to === "turbo" || to === "1000x") {
      updatedVaults.turbo += amountUsd;
    } else {
      newBalanceUsd += amountUsd;
    }

    state = {
      ...state,
      balanceUsd: newBalanceUsd,
      vaultBalances: updatedVaults,
    };
    saveSession(state);
    notify();
    return true;
  },

  withdraw(amountUsd: number, from: string = "wallet", _toAddress?: string): boolean {
    if (amountUsd <= 0) return false;
    const currentVaults = state.vaultBalances || {
      options: 19292,
      perps: 28938,
      turbo: 9646,
      spot: 33761,
    };
    const updatedVaults = { ...currentVaults };
    let newBalanceUsd = state.balanceUsd || 0;

    if (from === "options") {
      updatedVaults.options = Math.max(0, currentVaults.options - amountUsd);
    } else if (from === "perps") {
      updatedVaults.perps = Math.max(0, currentVaults.perps - amountUsd);
    } else if (from === "spot") {
      updatedVaults.spot = Math.max(0, currentVaults.spot - amountUsd);
    } else if (from === "turbo" || from === "1000x") {
      updatedVaults.turbo = Math.max(0, currentVaults.turbo - amountUsd);
    } else {
      newBalanceUsd = Math.max(0, newBalanceUsd - amountUsd);
    }

    state = {
      ...state,
      balanceUsd: newBalanceUsd,
      vaultBalances: updatedVaults,
    };
    saveSession(state);
    notify();
    return true;
  },

  resetForTesting() {
    state = {
      ...INITIAL_STATE,
      vaultBalances: { ...INITIAL_STATE.vaultBalances },
    };
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(VAULT_STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    notify();
  },
};

const getServerSnapshot = () => INITIAL_STATE;

export function useWallet() {
  return useSyncExternalStore(walletStore.subscribe, walletStore.getState, getServerSnapshot);
}
