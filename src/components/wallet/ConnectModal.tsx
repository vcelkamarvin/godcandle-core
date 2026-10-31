import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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

type ModalFlowState = 'default' | 'email' | 'email-verify' | 'connecting';

interface WalletOption {
  id: string;
  name: string;
  desc: string;
  badge?: string;
  recommended?: boolean;
}

const WALLET_OPTIONS: WalletOption[] = [
  { id: 'metamask', name: 'MetaMask', desc: 'Browser Extension', badge: 'Detected' },
  { id: 'rabby', name: 'Rabby Wallet', desc: 'Fast EVM execution', recommended: true },
  { id: 'rainbow', name: 'Rainbow', desc: 'Optimized for HyperEVM', recommended: true },
  { id: 'coinbase', name: 'Coinbase Wallet', desc: 'Mobile & Extension' },
  { id: 'walletconnect', name: 'WalletConnect', desc: 'Connect 400+ wallets' },
  { id: 'phantom', name: 'Phantom', desc: 'Multi-chain EVM' },
];

// 6-Dot Rotating Ring Loader
function DotRingLoader({ className = '', dotColor = '#0A0A0A' }: { className?: string; dotColor?: string }) {
  const dots = [0, 60, 120, 180, 240, 300];
  const radius = 22;
  const center = 32;

  return (
    <div
      className={`relative size-14 flex items-center justify-center animate-spin [animation-duration:1.4s] ${className}`}
    >
      <svg viewBox="0 0 64 64" className="size-full">
        {dots.map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const cx = center + radius * Math.cos(rad);
          const cy = center + radius * Math.sin(rad);
          const opacity = (i + 1) / dots.length;
          return <circle key={i} cx={cx} cy={cy} r={3.2} fill={dotColor} fillOpacity={opacity} />;
        })}
      </svg>
    </div>
  );
}

// Custom Vector Logos for EVM Providers
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
        <div className="flex size-9 items-center justify-center rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#7C3AED] shrink-0">
          <svg viewBox="0 0 32 32" className="size-5 fill-current">
            <path d="M16 4C9.37 4 4 9.37 4 16c0 4.2 2.16 7.9 5.46 10.05.42.27.97.16 1.25-.26.27-.42.16-.97-.26-1.25A10.3 10.3 0 0 1 5.8 16c0-5.63 4.57-10.2 10.2-10.2 5.63 0 10.2 4.57 10.2 10.2 0 3.2-1.48 6.07-3.8 7.96-.39.31-.46.88-.14 1.27.31.39.88.46 1.27.14C26.54 23.03 28.2 19.7 28.2 16c0-6.63-5.37-12-12-12z" />
            <circle cx="16" cy="16" r="4.5" />
          </svg>
        </div>
      );
    case 'rainbow':
      return (
        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#CDC3F0]/40 via-[#FFDAC8]/40 to-[#A0D4CA]/40 border border-[#CDC3F0] text-[#0A0A0A] shrink-0">
          <Zap className="size-4.5 text-[#0A0A0A]" />
        </div>
      );
    case 'coinbase':
      return (
        <div className="flex size-9 items-center justify-center rounded-xl bg-[#0052FF]/15 border border-[#0052FF]/30 text-[#0052FF] shrink-0">
          <svg viewBox="0 0 32 32" className="size-5 fill-current">
            <rect x="6" y="6" width="20" height="20" rx="4" />
            <rect x="12" y="12" width="8" height="8" rx="2" fill="white" />
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
        <div className="flex size-9 items-center justify-center rounded-xl bg-[#AB9FF2]/20 border border-[#AB9FF2]/40 text-[#7962E8] shrink-0">
          <svg viewBox="0 0 128 128" className="size-5 fill-current">
            <path
              d="M110.5 64c0 25.7-20.8 46.5-46.5 46.5-12.8 0-24.4-5.2-32.9-13.6L14.7 80.5c-2.4-2.4-2.4-6.3 0-8.7l16.4-16.4C39.6 47 51.2 41.8 64 41.8c25.7 0 46.5 20.8 46.5 46.5z"
              opacity="0.3"
            />
            <path d="M110.5 48.5c0-25.7-20.8-46.5-46.5-46.5-12.8 0-24.4 5.2-32.9 13.6L14.7 32c-2.4 2.4-2.4 6.3 0 8.7l16.4 16.4C39.6 65.5 51.2 70.7 64 70.7c25.7 0 46.5-20.8 46.5-46.5z" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="flex size-9 items-center justify-center rounded-xl bg-secondary border border-border text-foreground shrink-0">
          <Sparkles className="size-4.5 text-[#FFD60A]" />
        </div>
      );
  }
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0">
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
    <svg viewBox="0 0 24 24" className="size-4 fill-current shrink-0">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 1.01-2.88-.93.04-2.07.62-2.73 1.38-.58.67-1.1 1.74-1.01 2.8.96.08 2.03-.54 2.73-1.3" />
    </svg>
  );
}

export function ConnectModal() {
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();

  const [localAddress, setLocalAddress] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [flowState, setFlowState] = useState<ModalFlowState>('default');
  const [selectedWallet, setSelectedWallet] = useState<WalletOption | null>(null);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

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

    setTimeout(() => {
      const mockAddr =
        wallet.id === 'demo'
          ? '0x9c97Fa21b9E48b724C12EAcC48259A42'
          : `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

      setLocalAddress(mockAddr);
      localStorage.setItem('godcandle_wallet_address', mockAddr);
      setIsModalOpen(false);
      setFlowState('default');

      toast.success(`${wallet.name} Connected`, {
        description: `Active on HyperEVM (Chain ID 999) · Instant FIFO Liquid Settlement.`,
      });
    }, 1100);
  };

  const handleDemoLogin = () => {
    setSelectedWallet({ id: 'demo', name: 'Demo Trader Account', desc: 'Instant funded testnet wallet' });
    setFlowState('connecting');

    setTimeout(() => {
      const mockAddr = '0x9c97Fa21b9E48b724C12EAcC48259A42';
      setLocalAddress(mockAddr);
      localStorage.setItem('godcandle_wallet_address', mockAddr);
      setIsModalOpen(false);
      setFlowState('default');

      toast.success('Demo Trader Connected', {
        description: 'Funded with $1,000 testnet balance on HyperEVM.',
      });
    }, 800);
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
    }, 900);
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
    }, 800);
  };

  const copyAddress = () => {
    if (activeAddress) {
      navigator.clipboard.writeText(activeAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Address Copied');
    }
  };

  if (!mounted) {
    return (
      <button
        type="button"
        className="pill pill-ink h-8 px-3.5 text-xs font-sans font-semibold gap-2 opacity-80"
      >
        <Zap className="w-3.5 h-3.5 text-[#00D964]" />
        <span>Connect Wallet</span>
      </button>
    );
  }

  return (
    <>
      {/* 1. HEADER TRIGGER BUTTON */}
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

      {/* 2. MAIN SPLIT MODAL (LIGHT MODE, MONET SUNRISE ART, CENTERED VIA PORTAL) */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/45 backdrop-blur-sm animate-in fade-in-0 duration-200"
              onClick={handleCloseLogin}
              aria-hidden="true"
            />

            {/* Modal Card with delicate rainbow gradient border */}
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="login-modal-title"
              className="relative z-10 w-full sm:max-w-[880px] lg:max-w-[920px] max-h-[92vh] sm:h-[580px] rounded-[28px] p-[1.5px] bg-gradient-to-tr from-[#CDC3F0] via-[#FFDAC8] to-[#A0D4CA] shadow-[0_24px_80px_rgba(0,0,0,0.28)] flex overflow-hidden animate-in zoom-in-95 fade-in-0 duration-200"
            >
              <div className="w-full h-full bg-white rounded-[26.5px] flex flex-col sm:flex-row overflow-hidden relative">
                {/* Close Button */}
                <button
                  type="button"
                  onClick={handleCloseLogin}
                  className="absolute top-4 right-4 sm:top-4 sm:right-auto sm:left-[calc(50%-44px)] z-30 size-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-[#0A0A0A] shadow-md border border-border hover:border-foreground/30 transition-all cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="size-4" />
                </button>

                {/* LEFT HALF (LIGHT MODE: Web3 Wallets & Auth) */}
                <div className="relative flex-1 sm:w-1/2 h-full bg-white p-5 sm:p-7 flex flex-col justify-between overflow-y-auto no-scrollbar z-10 text-[#0A0A0A]">
                  <div className="flex-1 flex flex-col justify-center animate-in fade-in-0 duration-150">
                    {/* --- A. DEFAULT: WEB3 WALLETS DIRECTLY VISIBLE --- */}
                    {flowState === 'default' && (
                      <div className="space-y-4 my-auto w-full">
                        {/* Header */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="flex size-7 items-center justify-center rounded-xl bg-gradient-to-tr from-[#CDC3F0]/50 via-[#FFDAC8]/50 to-[#A0D4CA]/50 border border-border">
                              <Zap className="size-4 text-[#06964A]" />
                            </span>
                            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                              HyperEVM (Chain 999)
                            </span>
                          </div>
                          <h2
                            id="login-modal-title"
                            className="font-sans text-xl sm:text-[22px] font-bold tracking-tight text-[#0A0A0A]"
                          >
                            Connect Web3 Wallet
                          </h2>
                          <p className="text-xs text-[#737373]">
                            Connect directly with your EVM wallet or continue with email.
                          </p>
                        </div>

                        {/* Prominent Web3 Wallets (2 columns on sm, 1 col on xs) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {WALLET_OPTIONS.map((wallet) => (
                            <button
                              key={wallet.id}
                              type="button"
                              onClick={() => handleSelectWallet(wallet)}
                              className="flex items-center justify-between p-2.5 rounded-2xl bg-[#F8F8F7] hover:bg-[#F0F0EE] border border-[#E8E8E6] hover:border-[#D0D0CE] transition-all cursor-pointer group text-left"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <WalletIcon id={wallet.id} />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-sans font-semibold text-xs text-[#0A0A0A] truncate">
                                      {wallet.name}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-[#737373] truncate">
                                    {wallet.badge || (wallet.recommended ? 'Recommended' : wallet.desc)}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[#A3A3A3] group-hover:text-[#0A0A0A] group-hover:translate-x-0.5 transition-all text-xs font-mono shrink-0 ml-1">
                                →
                              </span>
                            </button>
                          ))}
                        </div>

                        {/* Demo Trader Account 1-Click Option */}
                        <button
                          type="button"
                          onClick={handleDemoLogin}
                          className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-[#CDC3F0]/25 via-[#FFDAC8]/25 to-[#A0D4CA]/25 hover:from-[#CDC3F0]/40 hover:via-[#FFDAC8]/40 hover:to-[#A0D4CA]/40 border border-[#CDC3F0]/70 flex items-center justify-between transition-all cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-8 items-center justify-center rounded-xl bg-white border border-border shadow-xs text-[#0A0A0A]">
                              <Sparkles className="size-4 text-[#FFD60A]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-sans font-semibold text-xs text-[#0A0A0A]">
                                  Demo Trader Account
                                </span>
                                <span className="rounded bg-[#E3F8EC] px-1.5 py-0.2 text-[9px] font-bold text-[#06964A]">
                                  $1,000 Instant
                                </span>
                              </div>
                              <p className="text-[10px] text-[#737373]">
                                Testnet practice with zero financial commitment
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-semibold text-[#0A0A0A]">
                            Try →
                          </span>
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-3 pt-0.5">
                          <div className="h-[1px] flex-1 bg-border" />
                          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                            or continue with
                          </span>
                          <div className="h-[1px] flex-1 bg-border" />
                        </div>

                        {/* Email & Social fallback */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setFlowState('email')}
                            className="flex-1 h-9 rounded-full bg-[#F5F5F4] hover:bg-[#EAEAEA] border border-[#E5E5E5] text-[#0A0A0A] text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Mail className="size-3.5 text-[#737373]" />
                            <span>Email Passcode</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSocialLogin('Google')}
                            className="h-9 px-3 rounded-full bg-[#F5F5F4] hover:bg-[#EAEAEA] border border-[#E5E5E5] transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs font-medium text-[#0A0A0A]"
                            title="Log in with Google"
                          >
                            <GoogleLogo />
                            <span className="hidden sm:inline">Google</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSocialLogin('Apple')}
                            className="h-9 px-3 rounded-full bg-[#F5F5F4] hover:bg-[#EAEAEA] border border-[#E5E5E5] transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs font-medium text-[#0A0A0A]"
                            title="Log in with Apple"
                          >
                            <AppleLogo />
                            <span className="hidden sm:inline">Apple</span>
                          </button>
                        </div>

                        {/* Read-only Explorer link */}
                        <div className="text-center pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setIsModalOpen(false);
                              toast.info('Read-Only Mode Active', {
                                description: 'You can inspect live charts, order books, and Candle Cup.',
                              });
                            }}
                            className="text-[11px] text-[#737373] hover:text-[#0A0A0A] underline decoration-border hover:decoration-foreground transition-colors cursor-pointer"
                          >
                            Explore without connecting (read-only mode)
                          </button>
                        </div>
                      </div>
                    )}

                    {/* --- B. EMAIL INPUT FLOW --- */}
                    {flowState === 'email' && (
                      <div className="space-y-4 my-auto max-w-[340px] mx-auto w-full">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setFlowState('default')}
                            className="flex size-8 items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors cursor-pointer"
                            aria-label="Back"
                          >
                            <ArrowLeft className="size-4" />
                          </button>
                          <div>
                            <h3 className="font-sans text-lg font-semibold text-[#0A0A0A]">
                              Log in with Email
                            </h3>
                            <p className="text-[11px] text-muted-foreground">
                              We will send a 6-digit passcode.
                            </p>
                          </div>
                        </div>

                        <form onSubmit={handleEmailSubmit} className="space-y-3 pt-2">
                          <div>
                            <label className="block text-[11px] font-mono text-muted-foreground mb-1">
                              EMAIL ADDRESS
                            </label>
                            <input
                              autoFocus
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="trader@hyperliquid.xyz"
                              className="h-11 w-full rounded-2xl border border-border bg-[#F8F8F7] px-4 text-xs text-[#0A0A0A] placeholder:text-[#A3A3A3] focus:border-[#0A0A0A] focus:outline-none transition-colors"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full h-11 rounded-full pill pill-ink text-xs font-semibold shadow-xs cursor-pointer"
                          >
                            Send Verification Code
                          </button>
                        </form>
                      </div>
                    )}

                    {/* --- C. EMAIL OTP VERIFY FLOW --- */}
                    {flowState === 'email-verify' && (
                      <div className="space-y-4 my-auto max-w-[340px] mx-auto w-full text-center">
                        <h3 className="font-sans text-lg font-semibold text-[#0A0A0A]">
                          Check your inbox
                        </h3>
                        <p className="text-xs text-[#737373]">
                          We sent a verification passcode to <strong className="text-[#0A0A0A]">{email}</strong>.
                        </p>

                        <form onSubmit={handleVerifyOtp} className="space-y-3 pt-2">
                          <input
                            autoFocus
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="123456"
                            className="h-12 w-full text-center font-mono tracking-widest text-lg rounded-2xl border border-border bg-[#F8F8F7] text-[#0A0A0A] focus:border-[#0A0A0A] focus:outline-none"
                          />

                          <button
                            type="submit"
                            className="w-full h-11 rounded-full pill pill-ink text-xs font-semibold shadow-xs cursor-pointer"
                          >
                            Verify &amp; Log In
                          </button>
                        </form>
                      </div>
                    )}

                    {/* --- D. CONNECTING HANDSHAKE STATE --- */}
                    {flowState === 'connecting' && (
                      <div className="text-center space-y-4 my-auto">
                        <div className="flex justify-center">
                          <DotRingLoader dotColor="#0A0A0A" />
                        </div>
                        <div>
                          <h3 className="font-sans text-lg font-semibold text-[#0A0A0A]">
                            Connecting to {selectedWallet?.name || 'Wallet'}...
                          </h3>
                          <p className="text-xs text-[#737373] mt-1">
                            Performing HyperEVM (999) node handshake &amp; session key delegation.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFlowState('default')}
                          className="px-4 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 border border-border text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Micro Footer Notice */}
                  <div className="pt-3 border-t border-border text-center shrink-0">
                    <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1.5">
                      <ShieldCheck className="size-3 text-[#06964A]" />
                      <span>Non-custodial · HyperEVM Chain 999 · Instant FIFO Settlement</span>
                    </p>
                  </div>
                </div>

                {/* RIGHT HALF: CLAUDE MONET'S "IMPRESSION, SUNRISE" (1872) ART PANEL */}
                <div className="relative hidden sm:block sm:w-1/2 h-full overflow-hidden select-none bg-[#1E293B]">
                  <img
                    src="/images/monet-sunrise.jpg"
                    alt="Claude Monet - Impression, Sunrise (1872)"
                    className="absolute inset-0 w-full h-full object-cover object-center filter saturate-[1.1] contrast-[1.03]"
                  />

                  {/* Atmospheric overlay with subtle rainbow sheen */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/55 pointer-events-none" />

                  {/* Content overlay */}
                  <div className="relative z-10 h-full w-full p-6 sm:p-8 flex flex-col justify-between text-white">
                    <div className="flex justify-end items-center gap-2">
                      <div className="rounded-full bg-black/40 backdrop-blur-md border border-white/25 px-2.5 py-1 flex items-center gap-1.5 text-[10px] font-mono">
                        <span className="size-1.5 rounded-full bg-[#00D964] animate-pulse" />
                        <span>HyperEVM 999</span>
                      </div>
                    </div>

                    {flowState === 'connecting' && (
                      <div className="my-auto flex flex-col items-center justify-center">
                        <DotRingLoader dotColor="#FFFFFF" className="scale-125" />
                        <span className="text-[11px] font-mono font-medium text-white/90 drop-shadow-md mt-4 tracking-wider uppercase">
                          HyperEVM Desk Handshake
                        </span>
                      </div>
                    )}

                    <div className="max-w-[320px]">
                      <p className="font-sans text-xl sm:text-2xl font-bold leading-tight drop-shadow-lg">
                        Perps. Options. Up to 1000x.
                      </p>
                      <p className="text-xs font-medium text-white/90 mt-1 drop-shadow-md">
                        One terminal. Powered by HyperEVM liquidity.
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-[10px] text-white/80 font-mono">
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
          </div>,
          document.body
        )}

      {/* 3. CONNECTED ACCOUNT DETAILS MODAL */}
      {detailsOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-150"
              onClick={() => setDetailsOpen(false)}
            />

            <div className="relative z-10 w-full max-w-md rounded-3xl border border-border bg-white p-5 sm:p-6 shadow-2xl text-[#0A0A0A] font-sans animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2 font-bold text-sm">
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

              <div className="space-y-3.5 pt-3.5">
                {/* Address with Copy */}
                <div className="p-3 bg-[#F8F8F7] border border-border rounded-2xl flex items-center justify-between">
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
                <div className="flex items-center justify-between pt-1">
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
          </div>,
          document.body
        )}
    </>
  );
}
