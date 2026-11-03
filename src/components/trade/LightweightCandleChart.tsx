import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  AreaSeries,
  HistogramSeries,
  LineSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  type IPriceLine,
} from 'lightweight-charts';
import { fetchCandleSnapshot, marketStore, type HlCandle, type HlTrade } from '@/lib/hyperliquid/market-data';
import { getTicks, getSnap, subscribePriceFeed } from '@/lib/price-feed';
import { fmtUsd } from '@/lib/engine';

export interface PriceLineTarget {
  id: string;
  price: number;
  label: string;
  color: string;
  style?: LineStyle;
}

interface LightweightCandleChartProps {
  coin: string; // e.g. "BTC"
  interval: string; // "1m" | "5m" | "15m" | "1h" | "4h" | "1D" | "Tick"
  entryPrice?: number | null | undefined;
  liquidationPrice?: number | null | undefined;
  takeProfitPrice?: number | null | undefined;
  stopLossPrice?: number | null | undefined;
  openOrders?: Array<{ id: string; price: number; side: 'buy' | 'sell'; sz: number }> | undefined;
  height?: string | number | undefined;
  showIndicators?: boolean | undefined;
}

export function LightweightCandleChart({
  coin,
  interval,
  entryPrice,
  liquidationPrice,
  takeProfitPrice,
  stopLossPrice,
  openOrders = [],
  height = '100%',
  showIndicators = false,
}: LightweightCandleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const lastTickSecRef = useRef<number>(0);

  const isTick = interval === 'Tick';

  // Crosshair OHLC state
  const [ohlc, setOhlc] = useState<{
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
    time: string;
  } | null>(null);
  const [latestPrice, setLatestPrice] = useState<number | null>(null);

  // Initialize and maintain chart instance
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#FFFFFF' },
        textColor: '#71717A',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#F4F4F5' },
        horzLines: { color: '#F4F4F5' },
      },
      crosshair: {
        vertLine: {
          color: '#A1A1AA',
          width: 1,
          style: LineStyle.Dotted,
          labelBackgroundColor: '#18181B',
        },
        horzLine: {
          color: '#A1A1AA',
          width: 1,
          style: LineStyle.Dotted,
          labelBackgroundColor: '#18181B',
        },
      },
      rightPriceScale: {
        borderColor: '#E4E4E7',
        scaleMargins: {
          top: 0.1,
          bottom: 0.22, // leave room for volume pane
        },
      },
      timeScale: {
        borderColor: '#E4E4E7',
        timeVisible: true,
        secondsVisible: interval === '1m' || isTick,
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    if (isTick) {
      // Area series for live Tick feed
      const areaSeries = chart.addSeries(AreaSeries, {
        topColor: 'rgba(0, 217, 100, 0.28)',
        bottomColor: 'rgba(0, 217, 100, 0.00)',
        lineColor: '#00D964',
        lineWidth: 2,
        priceLineVisible: true,
        lastValueVisible: true,
      });
      areaSeriesRef.current = areaSeries;
      candleSeriesRef.current = null;
    } else {
      // Candlestick series
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#00D964',
        downColor: '#FF3B30',
        borderUpColor: '#00D964',
        borderDownColor: '#FF3B30',
        wickUpColor: '#00D964',
        wickDownColor: '#FF3B30',
      });
      candleSeriesRef.current = candleSeries;
      areaSeriesRef.current = null;

      if (showIndicators) {
        const smaSeries = chart.addSeries(LineSeries, {
          color: '#2563EB',
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          title: 'SMA 20',
        });
        smaSeriesRef.current = smaSeries;
      } else {
        smaSeriesRef.current = null;
      }
    }

    // Add Volume series in lower pane
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.82,
        bottom: 0,
      },
    });
    volumeSeriesRef.current = volumeSeries;

    // Crosshair move listener for OHLC header readout
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData) {
        return;
      }
      const volData = param.seriesData.get(volumeSeries) as any;
      const timeStr = typeof param.time === 'number'
        ? new Date(param.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : '';

      if (isTick && areaSeriesRef.current) {
        const areaData = param.seriesData.get(areaSeriesRef.current) as any;
        if (areaData) {
          const val = areaData.value;
          setOhlc({
            o: val,
            h: val,
            l: val,
            c: val,
            v: volData?.value ?? 0,
            time: timeStr,
          });
        }
      } else if (candleSeriesRef.current) {
        const data = param.seriesData.get(candleSeriesRef.current) as any;
        if (data) {
          setOhlc({
            o: data.open,
            h: data.high,
            l: data.low,
            c: data.close,
            v: volData?.value ?? 0,
            time: timeStr,
          });
        }
      }
    });

    // Resize observer
    const handleResize = () => {
      if (container && chart) {
        chart.applyOptions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      areaSeriesRef.current = null;
      volumeSeriesRef.current = null;
      smaSeriesRef.current = null;
    };
  }, [interval, isTick, showIndicators]);

  // Load snapshot candles and subscribe to live updates
  useEffect(() => {
    let isCancelled = false;
    const rawCoin = coin.replace('-USD', '');

    if (isTick) {
      // 1. Tick Mode: seed from recent 1m candles then pipe live trades and mids
      async function loadTickBaseline() {
        const startTime = Date.now() - 2 * 60 * 60 * 1000;
        let candles: HlCandle[] = [];
        try {
          candles = await fetchCandleSnapshot(rawCoin, '1m', startTime);
        } catch {}

        if (isCancelled || !areaSeriesRef.current || !volumeSeriesRef.current) return;

        const tickData: any[] = [];
        const volumeData: any[] = [];
        let maxT = 0;

        if (candles && candles.length > 0) {
          candles.sort((a, b) => a.t - b.t);
          for (const c of candles) {
            const timeSec = Math.floor(c.t / 1000) as UTCTimestamp;
            if (timeSec <= maxT) continue;
            maxT = timeSec;
            tickData.push({ time: timeSec, value: c.c });
            volumeData.push({
              time: timeSec,
              value: c.v || 0.1,
              color: c.c >= c.o ? 'rgba(0, 217, 100, 0.35)' : 'rgba(255, 59, 48, 0.35)',
            });
          }
        }

        // If no candles returned, check stored buffer ticks from price feed
        if (tickData.length === 0) {
          const feedTicks = getTicks(rawCoin);
          if (feedTicks.length > 0) {
            for (const t of feedTicks) {
              const timeSec = Math.floor(t.t / 1000) as UTCTimestamp;
              if (timeSec <= maxT) continue;
              maxT = timeSec;
              tickData.push({ time: timeSec, value: t.p });
              volumeData.push({
                time: timeSec,
                value: 1,
                color: 'rgba(0, 217, 100, 0.35)',
              });
            }
          }
        }

        // If still empty (e.g. freshly initialized testnet pair), synthesize clean baseline
        if (tickData.length === 0) {
          const snap = getSnap(rawCoin);
          const basePx = marketStore.getMid(rawCoin) ?? snap?.price ?? 100;
          const nowSec = Math.floor(Date.now() / 1000);
          for (let i = 25; i >= 0; i--) {
            const tSec = (nowSec - i * 2) as UTCTimestamp;
            maxT = tSec;
            tickData.push({ time: tSec, value: basePx });
            volumeData.push({ time: tSec, value: 0.1, color: 'rgba(0, 217, 100, 0.35)' });
          }
        }

        if (tickData.length > 0) {
          areaSeriesRef.current.setData(tickData);
          volumeSeriesRef.current.setData(volumeData);
          lastTickSecRef.current = Math.max(lastTickSecRef.current, maxT);
          const last = tickData[tickData.length - 1];
          if (last) {
            setLatestPrice(last.value);
            setOhlc({
              o: last.value,
              h: last.value,
              l: last.value,
              c: last.value,
              v: volumeData[volumeData.length - 1]?.value ?? 0,
              time: new Date(last.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            });
          }
          chartRef.current?.timeScale().fitContent();
        }
      }

      loadTickBaseline();

      function handleLiveTick(px: number, sz: number, isBuy: boolean, timeMs: number) {
        if (isCancelled || !areaSeriesRef.current || !volumeSeriesRef.current || !px || px <= 0) return;
        let timeSec = Math.floor(timeMs / 1000) as UTCTimestamp;
        if (timeSec < lastTickSecRef.current) {
          timeSec = lastTickSecRef.current as UTCTimestamp;
        }
        lastTickSecRef.current = timeSec;

        try {
          areaSeriesRef.current.update({
            time: timeSec,
            value: px,
          });
          volumeSeriesRef.current.update({
            time: timeSec,
            value: sz,
            color: isBuy ? 'rgba(0, 217, 100, 0.35)' : 'rgba(255, 59, 48, 0.35)',
          });
        } catch {
          // Guard against internal time-order assertions
        }

        setLatestPrice(px);
        setOhlc({
          o: px,
          h: px,
          l: px,
          c: px,
          v: sz,
          time: new Date(timeSec * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        });
      }

      const unsubTrades = marketStore.subscribeTrades(rawCoin, (trades: HlTrade[]) => {
        if (Array.isArray(trades)) {
          trades.forEach((trade) => {
            handleLiveTick(trade.px, trade.sz, trade.side === 'buy', trade.time);
          });
        }
      });

      const unsubMids = marketStore.subscribeMids((mids: Record<string, number>) => {
        const px = mids[rawCoin];
        if (px && px > 0) {
          handleLiveTick(px, 1, true, Date.now());
        }
      });

      const unsubFeed = subscribePriceFeed(() => {
        const snap = getSnap(rawCoin);
        if (snap && snap.price > 0) {
          handleLiveTick(snap.price, 1, snap.price >= snap.prev, snap.lastTick || Date.now());
        }
      });

      return () => {
        isCancelled = true;
        unsubTrades();
        unsubMids();
        unsubFeed();
      };
    }

    // 2. Regular Candlestick interval mode
    async function loadData() {
      // 1 day for short TFs, 7-30 days for longer
      const days = interval === '1m' ? 1 : interval === '5m' ? 2 : interval === '15m' ? 5 : 30;
      const startTime = Date.now() - days * 24 * 60 * 60 * 1000;
      const candles = await fetchCandleSnapshot(rawCoin, interval, startTime);

      if (isCancelled || !candleSeriesRef.current || !volumeSeriesRef.current) return;

      if (candles.length > 0) {
        // Sort strictly ascending by time and deduplicate
        candles.sort((a, b) => a.t - b.t);
        const candleData: any[] = [];
        const volumeData: any[] = [];

        let lastT = 0;
        for (const c of candles) {
          const timeSec = Math.floor(c.t / 1000) as UTCTimestamp;
          if (timeSec <= lastT) continue;
          lastT = timeSec;

          candleData.push({
            time: timeSec,
            open: c.o,
            high: c.h,
            low: c.l,
            close: c.c,
          });

          const isUp = c.c >= c.o;
          volumeData.push({
            time: timeSec,
            value: c.v,
            color: isUp ? 'rgba(0, 217, 100, 0.35)' : 'rgba(255, 59, 48, 0.35)',
          });
        }

        candleSeriesRef.current.setData(candleData);
        volumeSeriesRef.current.setData(volumeData);

        if (smaSeriesRef.current && candleData.length >= 20) {
          const period = 20;
          const smaData: any[] = [];
          for (let i = period - 1; i < candleData.length; i++) {
            let sum = 0;
            for (let j = 0; j < period; j++) {
              sum += candleData[i - j].close;
            }
            smaData.push({
              time: candleData[i].time,
              value: sum / period,
            });
          }
          smaSeriesRef.current.setData(smaData);
        }

        const last = candles[candles.length - 1];
        if (last) {
          setLatestPrice(last.c);
          setOhlc({
            o: last.o,
            h: last.h,
            l: last.l,
            c: last.c,
            v: last.v,
            time: new Date(last.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        }

        chartRef.current?.timeScale().fitContent();
      }
    }

    loadData();

    // Subscribe to live WebSocket candle updates
    const unsubscribe = marketStore.subscribeCandles(rawCoin, interval, (candle: HlCandle) => {
      if (isCancelled || !candleSeriesRef.current || !volumeSeriesRef.current) return;
      const timeSec = Math.floor(candle.t / 1000) as UTCTimestamp;

      candleSeriesRef.current.update({
        time: timeSec,
        open: candle.o,
        high: candle.h,
        low: candle.l,
        close: candle.c,
      });

      const isUp = candle.c >= candle.o;
      volumeSeriesRef.current.update({
        time: timeSec,
        value: candle.v,
        color: isUp ? 'rgba(0, 217, 100, 0.35)' : 'rgba(255, 59, 48, 0.35)',
      });

      setLatestPrice(candle.c);
      setOhlc({
        o: candle.o,
        h: candle.h,
        l: candle.l,
        c: candle.c,
        v: candle.v,
        time: new Date(candle.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    });

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, [coin, interval, isTick, showIndicators]);

  // Update dynamic horizontal price lines: Entry, Liquidation, TP, SL, and Limit orders
  useEffect(() => {
    const series: any = isTick ? areaSeriesRef.current : candleSeriesRef.current;
    if (!series) return;

    // Clear old lines
    for (const pl of priceLinesRef.current) {
      try {
        series.removePriceLine(pl);
      } catch {}
    }
    priceLinesRef.current = [];

    // 1. Entry price line
    if (entryPrice && entryPrice > 0) {
      const pl = series.createPriceLine({
        price: entryPrice,
        color: '#0A0A0A',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'ENTRY',
      });
      priceLinesRef.current.push(pl);
    }

    // 2. Liquidation price line
    if (liquidationPrice && liquidationPrice > 0) {
      const pl = series.createPriceLine({
        price: liquidationPrice,
        color: '#FF3B30',
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: 'LIQ',
      });
      priceLinesRef.current.push(pl);
    }

    // 3. Take Profit line
    if (takeProfitPrice && takeProfitPrice > 0) {
      const pl = series.createPriceLine({
        price: takeProfitPrice,
        color: '#00D964',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: 'TP',
      });
      priceLinesRef.current.push(pl);
    }

    // 4. Stop Loss line
    if (stopLossPrice && stopLossPrice > 0) {
      const pl = series.createPriceLine({
        price: stopLossPrice,
        color: '#FF9500',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: 'SL',
      });
      priceLinesRef.current.push(pl);
    }

    // 5. Open Limit Orders
    for (const order of openOrders) {
      if (order.price > 0) {
        const pl = series.createPriceLine({
          price: order.price,
          color: order.side === 'buy' ? '#00D964' : '#FF3B30',
          lineWidth: 1,
          lineStyle: LineStyle.LargeDashed,
          axisLabelVisible: true,
          title: `LIMIT ${order.side.toUpperCase()}`,
        });
        priceLinesRef.current.push(pl);
      }
    }
  }, [entryPrice, liquidationPrice, takeProfitPrice, stopLossPrice, openOrders, isTick]);

  return (
    <div className="relative w-full h-full min-h-[460px] flex flex-col bg-white select-none">
      {/* Top Crosshair OHLC / Tick readout */}
      <div className="absolute top-2 left-3 z-20 flex flex-wrap items-center gap-2.5 text-[10px] font-mono pointer-events-none bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded-lg border border-border/40 shadow-2xs">
        <span className="font-bold text-foreground">{coin}-USD</span>
        {isTick ? (
          <>
            <span>
              Tick: <span className="font-bold text-[#06964A]">${fmtUsd(latestPrice ?? ohlc?.c ?? 0, 2)}</span>
            </span>
            {ohlc?.v ? (
              <span className="hidden sm:inline text-muted-foreground">
                Sz: {ohlc.v.toLocaleString()}
              </span>
            ) : null}
            {ohlc?.time && (
              <span className="hidden sm:inline text-muted-foreground">
                {ohlc.time}
              </span>
            )}
          </>
        ) : ohlc ? (
          <>
            <span>
              O: <span className="font-semibold text-foreground">${fmtUsd(ohlc.o, 2)}</span>
            </span>
            <span>
              H: <span className="font-semibold text-foreground">${fmtUsd(ohlc.h, 2)}</span>
            </span>
            <span>
              L: <span className="font-semibold text-foreground">${fmtUsd(ohlc.l, 2)}</span>
            </span>
            <span>
              C:{' '}
              <span
                className={`font-bold ${
                  ohlc.c >= ohlc.o ? 'text-[#06964A]' : 'text-[#FF3B30]'
                }`}
              >
                ${fmtUsd(ohlc.c, 2)}
              </span>
            </span>
            {ohlc.v > 0 && (
              <span className="hidden sm:inline text-muted-foreground">
                Vol: {ohlc.v.toLocaleString()}
              </span>
            )}
          </>
        ) : (
          <span className="text-muted-foreground">Loading chart telemetry...</span>
        )}
      </div>

      {/* Chart container */}
      <div ref={containerRef} className="w-full flex-1 min-h-[460px]" />
    </div>
  );
}
