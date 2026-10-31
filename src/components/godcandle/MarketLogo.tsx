import React from "react";

export type SupportedCryptoSymbol =
  | "BTC"
  | "ETH"
  | "SOL"
  | "HYPE"
  | "SPX"
  | "DOGE"
  | "AVAX"
  | "BNB"
  | string;

interface MarketLogoProps {
  symbol: SupportedCryptoSymbol;
  size?: number | string;
  className?: string;
}

export function MarketLogo({ symbol, size = 20, className = "" }: MarketLogoProps) {
  const sym = (symbol || "").toUpperCase().replace(/-USD$/, "").replace(/\/USDC$/, "");

  const sizeStyle = typeof size === "number" ? { width: `${size}px`, height: `${size}px` } : {};
  const sizeClass = typeof size === "string" ? size : "";

  switch (sym) {
    case "BTC":
      return (
        <span
          style={sizeStyle}
          className={`inline-flex shrink-0 items-center justify-center rounded-full shadow-2xs overflow-hidden ${sizeClass} ${className}`}
          title="Bitcoin (BTC)"
        >
          <svg viewBox="0 0 32 32" className="size-full">
            <circle cx="16" cy="16" r="16" fill="#F7931A" />
            <path
              fill="#FFFFFF"
              fillRule="evenodd"
              d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783-1.728-.431-.709 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.535 2.15-4.152.988-5.325.696l.95-3.813c1.174.293 4.938.872 4.375 3.117zm.536-5.57c-.488 1.954-3.502.962-4.48.718l.862-3.456c.977.244 4.134.7 3.618 2.738z"
            />
          </svg>
        </span>
      );

    case "ETH":
      return (
        <span
          style={sizeStyle}
          className={`inline-flex shrink-0 items-center justify-center rounded-full shadow-2xs overflow-hidden ${sizeClass} ${className}`}
          title="Ethereum (ETH)"
        >
          <svg viewBox="0 0 32 32" className="size-full">
            <circle cx="16" cy="16" r="16" fill="#627EEA" />
            <g fill="#FFFFFF" fillRule="evenodd">
              <path fillOpacity="0.45" d="M16 4v8.87l7.44 3.3z" />
              <path fillOpacity="0.9" d="M16 4L8.56 16.17l7.44-3.3z" />
              <path fillOpacity="0.45" d="M16 21.87v6.12l7.45-10.28z" />
              <path fillOpacity="0.9" d="M16 27.99v-6.12L8.56 17.71z" />
              <path fillOpacity="0.25" d="M16 20.57l7.44-4.4L16 12.87z" />
              <path fillOpacity="0.7" d="M8.56 16.17l7.44 4.4v-7.7z" />
            </g>
          </svg>
        </span>
      );

    case "SOL":
      return (
        <span
          style={sizeStyle}
          className={`inline-flex shrink-0 items-center justify-center rounded-full shadow-2xs overflow-hidden ${sizeClass} ${className}`}
          title="Solana (SOL)"
        >
          <svg viewBox="0 0 32 32" className="size-full">
            <circle cx="16" cy="16" r="16" fill="#0D0D12" />
            <defs>
              <linearGradient id="sol-vec-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00FFA3" />
                <stop offset="100%" stopColor="#DC1FFF" />
              </linearGradient>
            </defs>
            <path
              fill="url(#sol-vec-grad)"
              d="M9.5 8.2a1 1 0 0 1 .7-.3h12.6a.6.6 0 0 1 .4 1l-2.4 2.4a1 1 0 0 1-.7.3H7.5a.6.6 0 0 1-.4-1l2.4-2.4zm13 6.4a1 1 0 0 1-.7.3H9.2a.6.6 0 0 1-.4-1l2.4-2.4a1 1 0 0 1 .7-.3h12.6a.6.6 0 0 1 .4 1l-2.4 2.4zM9.5 21a1 1 0 0 1 .7-.3h12.6a.6.6 0 0 1 .4 1l-2.4 2.4a1 1 0 0 1-.7.3H7.5a.6.6 0 0 1-.4-1l2.4-2.4z"
            />
          </svg>
        </span>
      );

    case "HYPE":
      return (
        <span
          style={sizeStyle}
          className={`inline-flex shrink-0 items-center justify-center rounded-full shadow-2xs overflow-hidden ${sizeClass} ${className}`}
          title="Hyperliquid (HYPE)"
        >
          <svg viewBox="0 0 32 32" className="size-full">
            <defs>
              <linearGradient id="hype-vec-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00E599" />
                <stop offset="100%" stopColor="#009951" />
              </linearGradient>
            </defs>
            <circle cx="16" cy="16" r="16" fill="url(#hype-vec-grad)" />
            <path
              fill="#FFFFFF"
              fillRule="evenodd"
              d="M10.5 7.5a1.5 1.5 0 0 1 1.5 1.5v4.5c.9-.8 2.2-1.3 3.5-1.3s2.6.5 3.5 1.3V9a1.5 1.5 0 1 1 3 0v14a1.5 1.5 0 1 1-3 0v-4.5c-.9.8-2.2 1.3-3.5 1.3s-2.6-.5-3.5-1.3V23a1.5 1.5 0 1 1-3 0V9a1.5 1.5 0 0 1 1.5-1.5z"
            />
          </svg>
        </span>
      );

    case "SPX":
      return (
        <span
          style={sizeStyle}
          className={`inline-flex shrink-0 items-center justify-center rounded-full shadow-2xs overflow-hidden ${sizeClass} ${className}`}
          title="S&P 500 Index (SPX)"
        >
          <svg viewBox="0 0 32 32" className="size-full">
            <circle cx="16" cy="16" r="16" fill="#0F172A" />
            <path
              fill="#38BDF8"
              d="M7 19.5l5.5-5.5 3.5 3.5 8-8 1.5 1.5-9.5 9.5-3.5-3.5-4 4L7 19.5z"
            />
            <text
              x="16"
              y="26"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="7"
              fontWeight="900"
              fontFamily="system-ui, sans-serif"
              letterSpacing="0.4"
            >
              SPX
            </text>
          </svg>
        </span>
      );

    case "DOGE":
      return (
        <span
          style={sizeStyle}
          className={`inline-flex shrink-0 items-center justify-center rounded-full shadow-2xs overflow-hidden ${sizeClass} ${className}`}
          title="Dogecoin (DOGE)"
        >
          <svg viewBox="0 0 32 32" className="size-full">
            <circle cx="16" cy="16" r="16" fill="#C2A633" />
            <path
              fill="#FFFFFF"
              fillRule="evenodd"
              d="M10 8h6.8c3.8 0 7.2 3.1 7.2 7.5s-3.4 7.5-7.2 7.5H10V8zm3 3v3.5h4v2h-4v4.5h3.8c2.4 0 4.2-2 4.2-4.5s-1.8-4.5-4.2-4.5H13zM7.5 14.5h5.5v2H7.5v-2z"
            />
          </svg>
        </span>
      );

    case "AVAX":
      return (
        <span
          style={sizeStyle}
          className={`inline-flex shrink-0 items-center justify-center rounded-full shadow-2xs overflow-hidden ${sizeClass} ${className}`}
          title="Avalanche (AVAX)"
        >
          <svg viewBox="0 0 32 32" className="size-full">
            <circle cx="16" cy="16" r="16" fill="#E84142" />
            <path
              fill="#FFFFFF"
              d="M20.67 7.7a1.67 1.67 0 0 1 2.89 0l4.3 7.45c.64 1.1-.15 2.5-1.44 2.5h-8.6c-1.3 0-2.09-1.4-1.45-2.5l4.3-7.45zM11.33 7.7a1.67 1.67 0 0 1 2.9 0l11.4 19.74c.64 1.1-.15 2.5-1.45 2.5H4.82c-1.3 0-2.09-1.4-1.45-2.5l7.96-19.74z"
            />
          </svg>
        </span>
      );

    case "BNB":
      return (
        <span
          style={sizeStyle}
          className={`inline-flex shrink-0 items-center justify-center rounded-full shadow-2xs overflow-hidden ${sizeClass} ${className}`}
          title="BNB"
        >
          <svg viewBox="0 0 32 32" className="size-full">
            <circle cx="16" cy="16" r="16" fill="#F3BA2F" />
            <path
              fill="#FFFFFF"
              d="M16 8l3.18 3.18-3.18 3.19-3.18-3.19L16 8zm-5.3 5.3l3.18 3.19-3.18 3.18-3.19-3.18 3.19-3.19zm10.6 0l3.19 3.19-3.19 3.18-3.18-3.18 3.18-3.19zM16 18.57l3.18 3.18L16 24.94l-3.18-3.19 3.18-3.18zm-2.08-2.08l2.08-2.08 2.08 2.08-2.08 2.08-2.08-2.08z"
            />
          </svg>
        </span>
      );

    default:
      return (
        <span
          style={sizeStyle}
          className={`inline-flex shrink-0 items-center justify-center rounded-full bg-secondary border border-border text-[9px] font-mono font-bold text-foreground ${sizeClass} ${className}`}
        >
          {sym.slice(0, 3)}
        </span>
      );
  }
}
