import React, { useEffect, useRef, useState } from 'react';
import type { MarketSymbol } from '@/config/markets';

// Map godcandle markets to TradingView symbols
const TRADINGVIEW_SYMBOLS: Record<string, string> = {
  BTC: 'BINANCE:BTCUSDT',
  ETH: 'BINANCE:ETHUSDT',
  SOL: 'BINANCE:SOLUSDT',
  HYPE: 'BYBIT:HYPEUSDT',
  DOGE: 'BINANCE:DOGEUSDT',
  AVAX: 'BINANCE:AVAXUSDT',
  BNB: 'BINANCE:BNBUSDT',
  SPX: 'FOREXCOM:SPXUSD',
};

export type TVInterval = '1' | '5' | '15' | '60' | '240' | 'D' | 'W';

interface TradingViewWidgetProps {
  market: MarketSymbol;
  interval?: TVInterval;
  className?: string;
  height?: number | string;
}

export function TradingViewWidget({
  market,
  interval = '15',
  className = '',
  height = '100%',
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);
  const symbol = TRADINGVIEW_SYMBOLS[market] || 'BINANCE:BTCUSDT';

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous widget
    container.innerHTML = '';
    setHasError(false);

    // Create wrapper div for the widget
    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    container.appendChild(widgetDiv);

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;

    // Clean light theme configuration matching godcandle design
    const widgetConfig = {
      autosize: true,
      symbol: symbol,
      interval: interval,
      timezone: 'Etc/UTC',
      theme: 'light',
      style: '1', // Candlestick
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: false,
      calendar: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      hide_volume: false,
      backgroundColor: '#FFFFFF',
      gridColor: '#F0F0EE',
      support_host: 'https://www.tradingview.com',
    };

    script.innerHTML = JSON.stringify(widgetConfig);

    script.onerror = () => {
      setHasError(true);
    };

    container.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [symbol, interval]);

  if (hasError) {
    // Fallback to iframe if external embed script has issues
    const iframeUrl = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${encodeURIComponent(
      symbol
    )}&interval=${interval}&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=f6f6f4&studies=%5B%5D&theme=light&style=1&timezone=Etc%2FUTC&locale=en`;

    return (
      <div className={`relative w-full overflow-hidden bg-white ${className}`} style={{ height }}>
        <iframe
          title={`TradingView ${market}`}
          src={iframeUrl}
          className="w-full h-full border-0"
          allowTransparency
          scrolling="no"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`tradingview-widget-container relative w-full overflow-hidden bg-white ${className}`}
      style={{ height, minHeight: '340px' }}
    />
  );
}
