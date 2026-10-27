import { useEffect, useRef } from "react";
import { getSnap, getTicks } from "@/lib/price-feed";
import { fmtUsd, distanceToLiquidation, liquidation, type Position } from "@/lib/trade";

import { Button } from "@/components/ui/button";
import { getMarket, type MarketSymbol } from "@/config/markets";

const WINDOW_MS = 30000;
const AXIS_W = 84;
const TIME_H = 28;

interface Props {
  market: MarketSymbol;
  position: Position | null;
  pnlLabel: string;
  pnlPositive: boolean;
  onClose: () => void;
}

export function PriceChart({ market, position, pnlLabel, pnlPositive, onClose }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const posRef = useRef(position);
  posRef.current = position;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const decimals = getMarket(market).decimals;
    const css = getComputedStyle(document.documentElement);
    const C = {
      ink: css.getPropertyValue("--foreground").trim(),
      muted: css.getPropertyValue("--muted-foreground").trim(),
      line: css.getPropertyValue("--border").trim(),
      gain: css.getPropertyValue("--gain").trim(),
      loss: css.getPropertyValue("--loss").trim(),
      bg: css.getPropertyValue("--background").trim(),
    };
    const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';
    let W = 0,
      H = 0,
      dpr = 1;
    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      W = wrap.clientWidth;
      H = wrap.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let lo = 0,
      hi = 0,
      last = performance.now(),
      raf = 0,
      flashUntil = 0,
      flashDir = 0,
      seenTick = 0;

    const pillTag = (x: number, y: number, text: string, fill: string, color: string, stroke?: string) => {
      ctx.font = `500 11px ${FONT}`;
      const w = ctx.measureText(text).width + 16;
      const h = 20;
      ctx.beginPath();
      ctx.roundRect(x, y - h / 2, w, h, h / 2);
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.fillStyle = color;
      ctx.textBaseline = "middle";
      ctx.fillText(text, x + 8, y + 0.5);
      return w;
    };

    const draw = (nowPerf: number) => {
      const dt = nowPerf - last;
      last = nowPerf;
      const snap = getSnap(market);
      const ticks = getTicks(market);
      const now = Date.now();
      const pos = posRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const plotW = W - AXIS_W;
      const plotH = H - TIME_H;
      const headX = plotW * 0.78;
      const xOf = (t: number) => headX - ((now - t) / WINDOW_MS) * headX;

      const vis = ticks.filter((k) => k.t > now - WINDOW_MS - 1000);
      let mn = Infinity,
        mx = -Infinity;
      for (const k of vis) {
        mn = Math.min(mn, k.p);
        mx = Math.max(mx, k.p);
      }
      let liq = 0;
      if (pos) {
        liq = liquidation(pos);
        mn = Math.min(mn, pos.entry, liq);
        mx = Math.max(mx, pos.entry, liq);
      }
      if (!Number.isFinite(mn)) { mn = snap.price; mx = snap.price; }
      const minSpan = snap.price * 0.0004;
      if (mx - mn < minSpan) {
        const c = (mx + mn) / 2;
        mn = c - minSpan / 2;
        mx = c + minSpan / 2;
      }
      const pad = (mx - mn) * 0.18;
      const tLo = mn - pad,
        tHi = mx + pad;
      if (!lo) {
        lo = tLo;
        hi = tHi;
      }
      const k = 1 - Math.exp(-dt / 140); // ~600 ms ease-out
      lo += (tLo - lo) * k;
      hi += (tHi - hi) * k;
      const yOf = (p: number) => plotH - ((p - lo) / (hi - lo)) * plotH;

      // grid + price labels
      ctx.lineWidth = 1;
      ctx.strokeStyle = C.line;
      ctx.fillStyle = C.muted;
      ctx.font = `400 11px ${FONT}`;
      ctx.textBaseline = "middle";
      const rows = 5;
      for (let i = 0; i <= rows; i++) {
        const p = lo + ((hi - lo) * i) / rows;
        const y = Math.round(yOf(p)) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(plotW, y);
        ctx.stroke();
        if (y > 10 && y < plotH - 6) ctx.fillText("$" + fmtUsd(p, decimals), plotW + 12, y);
      }
      // time grid every 5s
      const first = Math.ceil((now - WINDOW_MS * 1.3) / 5000) * 5000;
      ctx.textBaseline = "alphabetic";
      for (let t = first; t <= now + WINDOW_MS; t += 5000) {
        const x = Math.round(xOf(t)) + 0.5;
        if (x < 0 || x > plotW) continue;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, plotH);
        ctx.stroke();
        const d = new Date(t);
        const lbl = d.toTimeString().slice(0, 8);
        ctx.fillText(lbl, x - ctx.measureText(lbl).width / 2, H - 9);
      }
      ctx.beginPath();
      ctx.moveTo(0, plotH + 0.5);
      ctx.lineTo(plotW, plotH + 0.5);
      ctx.strokeStyle = C.ink;
      ctx.stroke();

      const yP = Math.max(12, Math.min(plotH - 12, yOf(snap.price)));

      // liquidation zone
      if (pos) {
        const yL = yOf(liq);
        ctx.globalAlpha = 0.07;
        ctx.fillStyle = C.loss;
        ctx.fillRect(0, Math.min(yP, yL), plotW, Math.abs(yL - yP));
        ctx.globalAlpha = 1;
      }

      // stepped line path
      const firstTick = vis[0];
      if (vis.length > 1 && firstTick) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, plotW, plotH);
        ctx.clip();
        const path = new Path2D();
        path.moveTo(xOf(firstTick.t), yOf(firstTick.p));
        for (let i = 1; i < vis.length; i++) {
          const tick = vis[i]; const prev = vis[i - 1];
          if (!tick || !prev) continue;
          const x = xOf(tick.t);
          path.lineTo(x, yOf(prev.p));
          path.lineTo(x, yOf(tick.p));
        }
        path.lineTo(headX, yP);
        const fill = new Path2D(path);
        fill.lineTo(headX, plotH);
        fill.lineTo(xOf(firstTick.t), plotH);
        fill.closePath();
        ctx.globalAlpha = 0.045;
        ctx.fillStyle = C.ink;
        ctx.fill(fill);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 1.5;
        ctx.lineJoin = "miter";
        ctx.stroke(path);
        ctx.restore();
      }

      // entry + liq lines
      if (pos) {
        const yE = Math.round(yOf(pos.entry)) + 0.5;
        const yL = Math.round(yOf(liq)) + 0.5;
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = C.muted;
        ctx.beginPath();
        ctx.moveTo(0, yE);
        ctx.lineTo(plotW, yE);
        ctx.stroke();
        ctx.strokeStyle = C.loss;
        ctx.beginPath();
        ctx.moveTo(0, yL);
        ctx.lineTo(plotW, yL);
        ctx.stroke();
        ctx.setLineDash([]);
        const sep = Math.abs(yE - yL) < 24 ? (yL > yE ? 12 : -12) : 0;
        pillTag(12, yE - sep, `ENTRY $${fmtUsd(pos.entry, decimals)}`, C.bg, C.ink, C.muted);
        pillTag(12, yL + sep, `LIQ $${fmtUsd(liq, decimals)} (${distanceToLiquidation(pos, snap.price).toFixed(2)}%)`, C.bg, C.loss, C.loss);
      }

      // current price dashed line
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(headX, Math.round(yP) + 0.5);
      ctx.lineTo(plotW, Math.round(yP) + 0.5);
      ctx.stroke();
      ctx.setLineDash([]);

      // head dot + ring
      if (snap.lastTick !== seenTick) {
        if (seenTick) {
          flashUntil = now + 350;
          flashDir = Math.sign(snap.price - snap.prev);
        }
        seenTick = snap.lastTick;
      }
      const age = (now - snap.lastTick) / 700;
      if (age < 1) {
        ctx.beginPath();
        ctx.arc(headX, yP, 4 + age * 14, 0, Math.PI * 2);
        ctx.globalAlpha = 0.25 * (1 - age);
        ctx.fillStyle = C.ink;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.beginPath();
      ctx.arc(headX, yP, 4, 0, Math.PI * 2);
      ctx.fillStyle = C.ink;
      ctx.fill();

      // axis price tag
      const flashing = now < flashUntil && flashDir !== 0;
      const tagColor = flashing ? (flashDir > 0 ? C.gain : C.loss) : C.bg;
      pillTag(plotW + 4, yP, "$" + fmtUsd(snap.price, decimals), C.ink, tagColor);

      if (pillRef.current) {
        const pillWidth = pillRef.current.offsetWidth;
        const pillX = Math.max(4, Math.min(headX + 14, plotW - pillWidth - 4));
        pillRef.current.style.transform = `translate(${pillX}px, ${Math.max(4, yP - 34)}px)`;
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [market]);

  return (
    <div ref={wrapRef} key={market} className="chart-enter relative h-full w-full">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {position && (
        <Button variant="ghost"
          ref={pillRef}
          onClick={onClose}
          className={`pill pill-ink tabular absolute left-0 top-0 h-7 px-3 text-xs`}
        >
          <span className={pnlPositive ? "text-gain" : "text-loss"}>{pnlLabel}</span>
          <span className="text-primary-foreground">· Close</span>
        </Button>
      )}
    </div>
  );
}
