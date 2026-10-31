import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAccount, useDisconnect, useConnect } from 'wagmi';
import {
  X,
  Search,
  Wallet,
  ArrowLeft,
  Check,
  AlertCircle,
  ShieldCheck,
  Mail,
  ExternalLink,
  Sparkles,
  Zap,
  Key,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

type ModalFlowState = 'default' | 'wallets' | 'email' | 'email-verify' | 'connecting';

interface WalletOption {
  id: string;
  name: string;
  desc: string;
  badge?: string;
  recommended?: boolean;
}

const WALLET_OPTIONS: WalletOption[] = [
  { id: 'metamask', name: 'MetaMask', desc: 'Popular EVM browser extension', badge: 'Detected' },
  { id: 'rabby', name: 'Rabby Wallet', desc: 'Fastest EVM execution', recommended: true },
  { id: 'rainbow', name: 'Rainbow', desc: 'Optimized for HyperEVM', recommended: true },
  { id: 'coinbase', name: 'Coinbase Wallet', desc: 'Smart wallet & mobile QR' },
  { id: 'walletconnect', name: 'WalletConnect', desc: 'Connect 400+ mobile wallets' },
  { id: 'phantom', name: 'Phantom', desc: 'Multi-chain EVM support' },
  { id: 'session', name: 'HyperEVM Session Key', desc: '1-click gasless trading delegate', badge: 'Gasless' },
  { id: 'demo', name: 'Demo Trader Account', desc: 'Instant funded testnet wallet ($1,000)', badge: 'Instant' },
];

// 6-Dot Rotating Ring Loader (Zero spinner line, crisp rotating dots matching quantyn)
function DotRingLoader({ className = '' }: { className?: string }) {
  const dots = [0, 60, 120, 180, 240, 300];
  const radius = 22;
  const center = 32;

  return (
    <div
      className={`relative size-16 flex items-center justify-center animate-spin [animation-duration:1.4s] ${className}`}
    >
      <svg viewBox="0 0 64 64" className="size-full">
        {dots.map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const cx = center + radius * Math.cos(rad);
          const cy = center + radius * Math.sin(rad);
          const opacity = (i + 1) / dots.length;
          return <circle key={i} cx={cx} cy={cy} r={3.2} fill="#FFFFFF" fillOpacity={opacity} />;
        })}
      </svg>
    </div>
  );
}

// Custom Vector Logos for EVM Providers and Socials
function WalletIcon({ id }: { id: string }) {
  switch (id) {
    case 'metamask':
      return (
        <div className="flex size-9 items-center justify-center rounded-xl bg-[#E2761B]/15 border border-[#E2761B]/30 text-[#E2761B] shrink-0">
          <svg viewBox="0 0 32 32" className="size-5 fill-current">
            <path d="M28.3 4.2L17.7 12l2-4.6 8.6-3.2zM3.7 4.2l10.6 7.8-2-4.6-8.6-3.2zM24.7 21.8l-2.7 4.2 5.6 1.5 1.6-5.5-4.5-.2zM7.3 21.8l2.7 4.2-5.6 1.5-1.6-5.5 4.5-.2z" />
            <path d="M11.6 14.3l-2.4 3.7 4.5.2-.2-4.3-1.9.4zm8.8 0l2.4 3.7-4.5.2.2-4.3 1.9.4zM12.4 27.5l3.6 2.3 3.6-2.3-1.3-4.1h-4.6l-1.3 4.1z" />
          </svg>
        </div>
      );
    case 'rabby':
      return (
        <div className="flex size-9 items-center justify-center rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#A78BFA] shrink-0">
          <svg viewBox="0 0 32 32" className="size-5 fill-current">
            <path d="M16 4C9.37 4 4 9.37 4 16c0 4.2 2.16 7.9 5.46 10.05.42.27.97.16 1.25-.26.27-.42.16-.97-.26-1.25A10.3 10.3 0 0 1 5.8 16c0-5.63 4.57-10.2 10.2-10.2 5.63 0 10.2 4.57 10.2 10.2 0 3.2-1.48 6.07-3.8 7.96-.39.31-.46.88-.14 1.27.31.39.88.46 1.27.14C26.54 23.03 28.2 19.7 28.2 16c0-6.63-5.37-12-12-12z" />
            <circle cx="16" cy="16" r="4.5" />
          </svg>
        </div>
      );
    case 'rainbow':
      return (
        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#CDC3F0]/20 via-[#FFDAC8]/20 to-[#A0D4CA]/20 border border-white/20 text-white shrink-0">
          <Zap className="size-5 text-[#FFD60A]" />
        </div>
      );
    case 'coinbase':
      return (
        <div className="flex size-9 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white shrink-0">
          <svg viewBox="0 0 32 32" className="size-5 fill-current">
            <rect x="6" y="6" width="20" height="20" rx="4" />
            <rect x="12" y="12" width="8" height="8" rx="2" fill="#0E0E10" />
          </svg>
        </div>
      );
    case 'walletconnect':
      return (
        <div className="flex size-9 items-center justify-center rounded-xl bg-[#3B99FC]/15 border border-[#3B99FC]/30 text-[#3B99FC] shrink-0">
          <svg viewBox="0 0 32 32" className="size-5 fill-none stroke-current" strokeWidth="2.5">
            <path d="M6 14a14 14 0 0120 0M10 18a8 8 0 0112 0m-8 4a2 2 0 014 0" />
          </svg>
        </div>
      );
    case 'phantom':
      return (
        <div className="flex size-9 items-center justify-center rounded-xl bg-[#AB9FF2]/15 border border-[#AB9FF2]/30 text-[#AB9FF2] shrink-0">
          <svg viewBox="0 0 128 128" className="size-5 fill-current">
            <path
              d="M110.5 64c0 25.7-20.8 46.5-46.5 46.5-12.8 0-24.4-5.2-32.9-13.6L14.7 80.5c-2.4-2.4-2.4-6.3 0-8.7l16.4-16.4C39.6 47 51.2 41.8 64 41.8c25.7 0 46.5 20.8 46.5 46.5z"
              opacity="0.3"
            />
            <path d="M110.5 48.5c0-25.7-20.8-46.5-46.5-46.5-12.8 0-24.4 5.2-32.9 13.6L14.7 32c-2.4 2.4-2.4 6.3 0 8.7l16.4 16.4C39.6 65.5 51.2 70.7 64 70.7c25.7 0 46.5-20.8 46.5-46.5z" />
          </svg>
        </div>
      );
    case 'session':
      return (
        <div className="flex size-9 items-center justify-center rounded-xl bg-[#00D964]/15 border border-[#00D964]/30 text-[#00D964] shrink-0">
          <Key className="size-4.5" />
        </div>
      );
    case 'demo':
    default:
      return (
        <div className="flex size-9 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white shrink-0">
          <Sparkles className="size-4.5 text-[#FFD60A]" />
        </div>
      );
  }
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-4.5 shrink-0">
      <path
        fill="#EA4335"
        d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 8.9 5 12 5z"
      />
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
      />
      <path
        fill="#FBBC05"
        d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
      />
      <path
        fill="#34A853"
        d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.5-2.2-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
      />
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-4.5 fill-current shrink-0">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 1.01-2.88-.93.04-2.07.62-2.73 1.38-.58.67-1.1 1.74-1.01 2.8.96.08 2.03-.54 2.73-1.3" />
    </svg>
  );
}

export function ConnectModal() {
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { connectors, connect: wagmiConnect } = useConnect();

  // Simulated local wallet session for instant demo / email / social fallback
  const [localAddress, setLocalAddress] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [flowState, setFlowState] = useState<ModalFlowState>('default');
  const [selectedWallet, setSelectedWallet] = useState<WalletOption | null>(null);
  const [search, setSearch] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Restore simulated session from localStorage
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('godcandle_wallet_address');
    if (saved) {
      setLocalAddress(saved);
    }
  }, []);

  const activeAddress = wagmiAddress || localAddress;
  const isConnected = wagmiConnected || !!localAddress;

  const handleOpenLogin = () => {
    setFlowState('default');
    setIsModalOpen(true);
  };

  const handleCloseLogin = () => {
    setIsModalOpen(false);
    setFlowState('default');
  };

  const handleDisconnect = () => {
    if (wagmiConnected) {
      wagmiDisconnect();
    }
    setLocalAddress(null);
    localStorage.removeItem('godcandle_wallet_address');
    setDetailsOpen(false);
    toast.info('Wallet Disconnected', {
      description: 'You are now in read-only observation mode.',
    });
  };

  const handleSelectWallet = (wallet: WalletOption) => {
    setSelectedWallet(wallet);
    setFlowState('connecting');

    // Simulate authentic EVM handshake & connection
    setTimeout(() => {
      // Generate deterministic or randomized HyperEVM address for the provider
      const mockAddr =
        wallet.id === 'demo'
          ? '0x9c97Fa21b9E48b724C12EAcC48259A42'
          : wallet.id === 'session'
          ? '0xDE69e6E161C2C9797A24976a4FA2901a'
          : `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

      setLocalAddress(mockAddr);
      localStorage.setItem('godcandle_wallet_address', mockAddr);
      setIsModalOpen(false);
      setFlowState('default');

      toast.success(`${wallet.name} Connected`, {
        description: `Active on HyperEVM (Chain ID 999) · Instant FIFO Liquid Settlement.`,
      });
    }, 1200);
  };

  const handleSocialLogin = (provider: string) => {
    setFlowState('connecting');
    setSelectedWallet({ id: 'privy', name: `${provider} Account`, desc: 'Privy Embedded Wallet' });

    setTimeout(() => {
      const mockAddr = '0x71C80e921820bE9804C88A83726Fa3988A24bA41';
      setLocalAddress(mockAddr);
      localStorage.setItem('godcandle_wallet_address', mockAddr);
      setIsModalOpen(false);
      setFlowState('default');

      toast.success(`Logged in with ${provider}`, {
        description: 'Privy embedded HyperEVM wallet active.',
      });
    }, 1000);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Invalid Email', { description: 'Please enter a valid email address.' });
      return;
    }
    setFlowState('email-verify');
    toast.info('Verification Code Sent', {
      description: `We sent a 6-digit passcode to ${email}.`,
    });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      toast.error('Invalid Code', { description: 'Please enter the 6-digit code.' });
      return;
    }
    setFlowState('connecting');
    setSelectedWallet({ id: 'privy', name: email, desc: 'Privy Embedded Wallet' });

    setTimeout(() => {
      const mockAddr = '0x88219Db718eAcF65901Abb344Fa20988A72491a1';
      setLocalAddress(mockAddr);
      localStorage.setItem('godcandle_wallet_address', mockAddr);
      setIsModalOpen(false);
      setFlowState('default');

      toast.success('Email Verified & Connected', {
        description: `Welcome! Embedded HyperEVM wallet ready.`,
      });
    }, 900);
  };

  const copyAddress = () => {
    if (activeAddress) {
      navigator.clipboard.writeText(activeAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Address Copied');
    }
  };

  const filteredWallets = useMemo(() => {
    return WALLET_OPTIONS.filter((w) =>
      `${w.name} ${w.desc}`.toLowerCase().includes(search.trim().toLowerCase())
    );
  }, [search]);

  if (!mounted) {
    return (
      <button
        type="button"
        className="px-3.5 py-1.5 text-xs font-sans font-semibold rounded-full bg-foreground text-background hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
      >
        <Zap className="w-3.5 h-3.5 text-[#00D964]" />
        <span>Connect Wallet</span>
      </button>
    );
  }

  return (
    <>
      {/* ============================================================== */}
      {/* 1. HEADER TRIGGER BUTTON */}
      {/* ============================================================== */}
      {!isConnected ? (
        <button
          onClick={handleOpenLogin}
          type="button"
          className="pill pill-ink h-8 px-3.5 text-xs font-sans font-semibold gap-2 hover:opacity-90 transition-all shadow-xs cursor-pointer"
        >
          <Zap className="size-3.5 text-[#00D964]" />
          <span>Connect Wallet</span>
        </button>
      ) : (
        <button
          onClick={() => setDetailsOpen(true)}
          type="button"
          className="h-8 px-3 rounded-full bg-secondary border border-border hover:border-foreground/40 transition-all flex items-center gap-2 text-xs font-sans cursor-pointer"
        >
          <span className="size-2 rounded-full bg-[#00D964] animate-pulse" />
          <span className="font-mono font-semibold text-foreground">
            {activeAddress?.slice(0, 6)}…{activeAddress?.slice(-4)}
          </span>
          <span className="rounded bg-white px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground border border-border/60">
            999
          </span>
        </button>
      )}

      {/* ============================================================== */}
      {/* 2. MAIN SPLIT MODAL (INSPIRED BY QUANTYN WITH CLAUDE MONET ART) */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          {/* Obsidian Backdrop with deep blur */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-md animate-in fade-in-0 duration-200"
            onClick={handleCloseLogin}
            aria-hidden="true"
          />

          {/* Modal Container: 960x600 Two-Column Split (50% left, 50% right) */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-modal-title"
            className="relative z-10 w-full sm:max-w-[960px] h-[92vh] sm:h-[600px] overflow-hidden rounded-[28px] border border-white/[0.12] bg-[#111113] text-[#F5F5F6] shadow-[0_24px_80px_rgba(0,0,0,0.95)] flex flex-col sm:flex-row animate-in zoom-in-95 fade-in-0 duration-200"
          >
            {/* Top Close Button (Desktop & Mobile) */}
            <button
              type="button"
              onClick={handleCloseLogin}
              className="absolute top-5 right-5 sm:left-[calc(50%-48px)] sm:right-auto z-30 size-8 flex items-center justify-center rounded-full bg-[#1E1E22] hover:bg-[#2A2A30] border border-white/10 text-[#8A8A96] hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="size-4" />
            </button>

            {/* ============================================================== */}
            {/* LEFT HALF (AUTH & WALLET OPTIONS, 50% on desktop)             */}
            {/* ============================================================== */}
            <div className="relative flex-1 sm:w-1/2 h-full bg-[#111113] p-6 sm:p-10 flex flex-col justify-between overflow-y-auto no-scrollbar z-10">
              <div className="flex-1 flex flex-col justify-center animate-in fade-in-0 duration-150">
                {/* --- 1. DEFAULT FLOW: CONNECT WALLET / EMAIL / SOCIAL --- */}
                {flowState === 'default' && (
                  <div className="space-y-5 my-auto max-w-[360px] mx-auto w-full">
                    {/* Brand Logo & Headline */}
                    <div className="text-center space-y-2">
                      <div className="size-12 mx-auto rounded-2xl bg-gradient-to-tr from-[#CDC3F0]/20 via-[#FFDAC8]/20 to-[#A0D4CA]/20 border border-white/10 flex items-center justify-center shadow-lg">
                        <Zap className="size-6 text-[#00D964]" />
                      </div>
                      <h2
                        id="login-modal-title"
                        className="font-sans text-[26px] sm:text-[28px] font-bold tracking-tight text-[#F5F5F6]"
                      >
                        Log in to godcandle
                      </h2>
                      <p className="text-xs text-[#8A8A96]">
                        HyperEVM 1000x Synthetic Derivatives Exchange
                      </p>
                    </div>

                    {/* Primary Button: Connect Wallet (Height 56, pill, electric blue) */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setFlowState('wallets')}
                        className="w-full h-14 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[15px] shadow-[0_8px_28px_-10px_rgba(37,99,235,0.7)] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                      >
                        <Wallet className="size-5 text-white" />
                        <span>Connect Wallet</span>
                      </button>
                    </div>

                    {/* "or" Divider */}
                    <div className="flex items-center gap-3">
                      <div className="h-[1px] flex-1 bg-white/[0.08]" />
                      <span className="text-[11px] font-medium uppercase tracking-wider text-[#8A8A96]">
                        or
                      </span>
                      <div className="h-[1px] flex-1 bg-white/[0.08]" />
                    </div>

                    {/* Secondary Button: Log in with Email */}
                    <button
                      type="button"
                      onClick={() => setFlowState('email')}
                      className="w-full h-[50px] rounded-full bg-[#1E1E22] hover:bg-[#26262B] border border-white/[0.08] hover:border-white/20 text-[#F5F5F6] text-[14px] font-medium transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                    >
                      <Mail className="size-4.5 text-[#A8A8B3]" />
                      <span>Log in with Email</span>
                    </button>

                    {/* Social Login Buttons: Google & Apple */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSocialLogin('Google')}
                        className="flex-1 h-[50px] rounded-full bg-[#1E1E22] hover:bg-[#26262B] border border-white/[0.08] hover:border-white/20 text-[#F5F5F6] text-[14px] font-medium transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
                      >
                        <GoogleLogo />
                        <span>Google</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSocialLogin('Apple')}
                        className="flex-1 h-[50px] rounded-full bg-[#1E1E22] hover:bg-[#26262B] border border-white/[0.08] hover:border-white/20 text-[#F5F5F6] text-[14px] font-medium transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
                      >
                        <AppleLogo />
                        <span>Apple</span>
                      </button>
                    </div>

                    {/* Trust Microcopy & Read-Only Explorer Link */}
                    <div className="text-center space-y-2 pt-1">
                      <p className="text-[11px] text-[#8A8A96] flex items-center justify-center gap-1.5">
                        <ShieldCheck className="size-3.5 text-[#00D964]" />
                        <span>Protected by Privy embedded wallets &amp; HyperEVM AA</span>
                      </p>
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsModalOpen(false);
                            toast.info('Read-Only Mode Active', {
                              description: 'You can inspect live charts, order books, and Candle Cup.',
                            });
                          }}
                          className="text-[12px] text-[#A8A8B3] hover:text-[#F5F5F6] underline decoration-white/20 hover:decoration-white/60 transition-colors cursor-pointer"
                        >
                          Explore without connecting (read-only mode)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- 2. WALLET SELECTION LIST FLOW --- */}
                {flowState === 'wallets' && (
                  <div className="space-y-4 my-auto max-w-[380px] mx-auto w-full">
                    {/* Header with Back button */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setFlowState('default')}
                        className="flex size-8 items-center justify-center rounded-full bg-[#1E1E22] hover:bg-[#26262B] border border-white/[0.08] text-[#A8A8B3] hover:text-[#F5F5F6] transition-colors cursor-pointer"
                        aria-label="Back"
                      >
                        <ArrowLeft className="size-4" />
                      </button>
                      <div>
                        <h3 className="font-sans text-[18px] font-semibold text-[#F5F5F6]">
                          Select EVM Wallet
                        </h3>
                        <p className="text-[11px] text-[#8A8A96]">HyperEVM Mainnet (Chain ID 999)</p>
                      </div>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search MetaMask, Rabby, Coinbase..."
                        className="h-10 w-full rounded-full border border-white/[0.08] bg-[#1E1E22] pl-10 pr-4 text-[13px] text-[#F5F5F6] placeholder:text-[#8A8A96] focus:border-[#2563EB]/60 focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Scrollable Wallet List */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                      {filteredWallets.map((wallet) => (
                        <button
                          key={wallet.id}
                          type="button"
                          onClick={() => handleSelectWallet(wallet)}
                          className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#1E1E22]/80 hover:bg-[#26262B] border border-white/[0.06] hover:border-white/20 transition-all cursor-pointer group text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <WalletIcon id={wallet.id} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-sans font-semibold text-[13px] text-[#F5F5F6]">
                                  {wallet.name}
                                </span>
                                {wallet.badge && (
                                  <span className="rounded bg-[#00D964]/15 px-1.5 py-0.2 text-[9px] font-semibold text-[#00D964] border border-[#00D964]/30">
                                    {wallet.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#8A8A96] truncate">
                                {wallet.desc}
                              </p>
                            </div>
                          </div>
                          <span className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all text-xs font-mono">
                            →
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- 3. EMAIL INPUT FLOW --- */}
                {flowState === 'email' && (
                  <div className="space-y-4 my-auto max-w-[360px] mx-auto w-full">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setFlowState('default')}
                        className="flex size-8 items-center justify-center rounded-full bg-[#1E1E22] hover:bg-[#26262B] border border-white/[0.08] text-[#A8A8B3] hover:text-[#F5F5F6] transition-colors cursor-pointer"
                        aria-label="Back"
                      >
                        <ArrowLeft className="size-4" />
                      </button>
                      <h3 className="font-sans text-[18px] font-semibold text-[#F5F5F6]">
                        Log in with Email
                      </h3>
                    </div>

                    <form onSubmit={handleEmailSubmit} className="space-y-3 pt-2">
                      <div>
                        <label className="block text-[11px] text-[#8A8A96] mb-1 font-medium">
                          Email address
                        </label>
                        <input
                          autoFocus
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="trader@hyperliquid.xyz"
                          className="h-12 w-full rounded-2xl border border-white/[0.1] bg-[#1E1E22] px-4 text-sm text-[#F5F5F6] placeholder:text-[#8A8A96] focus:border-[#2563EB] focus:outline-none transition-colors"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full h-12 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm transition-all shadow-md cursor-pointer"
                      >
                        Continue
                      </button>
                    </form>
                  </div>
                )}

                {/* --- 4. EMAIL OTP VERIFY FLOW --- */}
                {flowState === 'email-verify' && (
                  <div className="space-y-4 my-auto max-w-[360px] mx-auto w-full text-center">
                    <h3 className="font-sans text-[18px] font-semibold text-[#F5F5F6]">
                      Check your email
                    </h3>
                    <p className="text-xs text-[#8A8A96]">
                      We sent a verification passcode to <strong className="text-white">{email}</strong>.
                    </p>

                    <form onSubmit={handleVerifyOtp} className="space-y-3 pt-2">
                      <input
                        autoFocus
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="123456"
                        className="h-12 w-full text-center font-mono tracking-widest text-lg rounded-2xl border border-white/[0.1] bg-[#1E1E22] text-[#F5F5F6] focus:border-[#2563EB] focus:outline-none"
                      />

                      <button
                        type="submit"
                        className="w-full h-12 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm transition-all shadow-md cursor-pointer"
                      >
                        Verify &amp; Log In
                      </button>
                    </form>
                  </div>
                )}

                {/* --- 5. CONNECTING HANDSHAKE STATE --- */}
                {flowState === 'connecting' && (
                  <div className="text-center space-y-4 my-auto">
                    <div className="flex justify-center">
                      <DotRingLoader />
                    </div>
                    <div>
                      <h3 className="font-sans text-[18px] font-semibold text-[#F5F5F6]">
                        Connecting to {selectedWallet?.name || 'Wallet'}...
                      </h3>
                      <p className="text-[12px] text-[#8A8A96] mt-1">
                        Performing HyperEVM (999) node handshake &amp; delegation.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFlowState('default')}
                      className="px-5 py-2 rounded-full bg-[#1E1E22] hover:bg-[#26262B] border border-white/[0.08] text-[12px] text-[#A8A8B3] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Terms Notice */}
              <div className="pt-4 border-t border-white/[0.06] text-center shrink-0">
                <p className="text-[11px] leading-relaxed text-[#8A8A96]">
                  By continuing, you agree to our{' '}
                  <span className="underline hover:text-white cursor-pointer">Terms of Service</span>{' '}
                  &amp;{' '}
                  <span className="underline hover:text-white cursor-pointer">Privacy Policy</span>.
                </p>
              </div>
            </div>

            {/* ============================================================== */}
            {/* RIGHT HALF: CLAUDE MONET'S "IMPRESSION, SUNRISE" (1872) ART PANEL */}
            {/* ============================================================== */}
            <div className="relative hidden sm:block sm:w-1/2 h-full overflow-hidden select-none bg-black">
              {/* Monet's Impression, Sunrise Painting as Background */}
              <img
                src="/images/monet-sunrise.jpg"
                alt="Claude Monet - Impression, Sunrise (1872)"
                className="absolute inset-0 w-full h-full object-cover object-center filter saturate-[1.1] brightness-[0.88]"
              />

              {/* Atmospheric Vignette Overlay for Text Legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/60 pointer-events-none" />

              {/* Foreground Overlay Content */}
              <div className="relative z-10 h-full w-full p-8 sm:p-10 flex flex-col justify-between">
                {/* Brand Wordmark Top-Right */}
                <div className="flex justify-end items-center gap-2">
                  <span className="font-sans font-bold text-[15px] tracking-wider uppercase text-white drop-shadow-md">
                    godcandle
                  </span>
                  <span className="size-2 rounded-full bg-[#00D964] shadow-[0_0_10px_#00D964]" />
                </div>

                {/* Connecting Handshake Overlay */}
                {flowState === 'connecting' && (
                  <div className="my-auto flex flex-col items-center justify-center">
                    <DotRingLoader className="scale-125" />
                    <span className="text-[12px] font-mono font-medium text-white/90 drop-shadow-md mt-4 tracking-wider uppercase">
                      HyperEVM Desk Handshake
                    </span>
                  </div>
                )}

                {/* Tagline Bottom-Left */}
                <div className="max-w-[320px]">
                  <p className="font-sans text-[22px] font-bold leading-tight text-white drop-shadow-lg">
                    Perps. Options. Up to 1000x.
                  </p>
                  <p className="text-[13px] font-medium text-white/90 mt-1.5 drop-shadow-md">
                    One terminal. Powered by HyperEVM liquidity.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-[10px] text-white/70 font-mono">
                    <span className="rounded bg-black/40 backdrop-blur-sm px-2 py-0.5 border border-white/20">
                      Claude Monet, 1872
                    </span>
                    <span>Impression, Sunrise</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. CONNECTED ACCOUNT DETAILS MODAL */}
      {/* ============================================================== */}
      {detailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDetailsOpen(false)}
          />

          <div className="relative z-10 w-full max-w-md rounded-3xl border border-border bg-white p-6 shadow-2xl text-foreground font-sans">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2 font-bold text-base">
                <ShieldCheck className="size-4 text-[#06964A]" />
                <span>Connected Account</span>
              </div>
              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                className="size-7 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              {/* Address with Copy Button */}
              <div className="p-3 bg-secondary/70 border border-border rounded-2xl flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-foreground truncate max-w-[280px]">
                  {activeAddress}
                </span>
                <button
                  type="button"
                  onClick={copyAddress}
                  className="p-1.5 hover:bg-white rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Copy Address"
                >
                  {copied ? (
                    <CheckCircle2 className="size-4 text-[#06964A]" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </button>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-secondary/50 border border-border/60 rounded-xl">
                  <span className="text-muted-foreground text-[10px] uppercase font-mono block">
                    Network
                  </span>
                  <span className="font-semibold text-foreground">HyperEVM (999)</span>
                </div>
                <div className="p-3 bg-secondary/50 border border-border/60 rounded-xl">
                  <span className="text-muted-foreground text-[10px] uppercase font-mono block">
                    Settlement
                  </span>
                  <span className="font-semibold text-[#06964A]">Pure FIFO Liquid</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <a
                  href={`https://hyperscan.xyz/address/${activeAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <span>View on Hyperscan</span>
                  <ExternalLink className="size-3.5" />
                </a>

                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-4 py-1.5 rounded-full bg-[#FFECEA] text-[#FF3B30] hover:bg-[#FFD7D4] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
