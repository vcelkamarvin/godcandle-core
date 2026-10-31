import { useEffect, useRef } from "react";

export function ChartCanvas({
  kind = "line",
  values = [],
  height = 240,
}: {
  kind?: "line" | "heatmap" | "bars" | "curve";
  values?: number[];
  height?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const css = getComputedStyle(document.documentElement);
    const color = (name: string) => css.getPropertyValue(name).trim();
    const ink = color("--foreground") || "#0A0A0A";
    const grid = color("--border") || "#E6E6E3";
    const gain = color("--trade-gain") || "#00D964";
    const loss = color("--loss") || "#FF3B30";

    function draw() {
      if (!canvas || !ctx) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const pad = 16;
      const padRight = 55;
      const plotW = w - pad - padRight;
      const plotH = h - 28;

      if (kind === "heatmap") {
        // High-density technical orderbook liquidity depth heatmap
        const rows = 36;
        const cols = 48;
        const cellW = plotW / cols;
        const cellH = plotH / rows;
        const midRow = Math.floor(rows / 2);

        // Draw depth grid cells
        for (let r = 0; r < rows; r++) {
          const isAsk = r < midRow; // Above mid = asks
          const distFromMid = Math.abs(r - midRow) / midRow;

          for (let c = 0; c < cols; c++) {
            // Compute realistic liquidity cluster intensity
            const wave1 = Math.sin(c * 0.35 + r * 0.25);
            const wave2 = Math.cos(c * 0.15 - r * 0.4);
            const noise = ((c * 13 + r * 7) % 19) / 19;
            const intensity = Math.max(0, Math.min(1, 0.35 + wave1 * 0.25 + wave2 * 0.2 + noise * 0.2));

            // Concentrated wall clusters
            const isWall = (r === 6 || r === 12 || r === 24 || r === 30) && (c % 8 < 5);

            if (isWall) {
              ctx.fillStyle = isAsk ? "#FFDAC8" : "#A0D4CA";
              ctx.globalAlpha = 0.85;
            } else if (isAsk) {
              // Asks: warm tones (peach to soft rose)
              const alpha = (1 - distFromMid * 0.6) * intensity * 0.65;
              ctx.fillStyle = "#FFDAC8";
              ctx.globalAlpha = Math.max(0.08, alpha);
            } else {
              // Bids: cool tones (sage to emerald)
              const alpha = (1 - distFromMid * 0.6) * intensity * 0.65;
              ctx.fillStyle = "#A0D4CA";
              ctx.globalAlpha = Math.max(0.08, alpha);
            }

            ctx.fillRect(pad + c * cellW, r * cellH, cellW - 0.5, cellH - 0.5);
          }
        }
        ctx.globalAlpha = 1;

        // Draw Mid Market line
        const midY = midRow * cellH;
        ctx.beginPath();
        ctx.moveTo(pad, midY);
        ctx.lineTo(pad + plotW, midY);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Depth boundary dashed lines
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad, midY - cellH * 2);
        ctx.lineTo(pad + plotW, midY - cellH * 2);
        ctx.moveTo(pad, midY + cellH * 2);
        ctx.lineTo(pad + plotW, midY + cellH * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Right axis labels
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = loss;
        ctx.fillText("Asks", pad + plotW + 6, midY - cellH * 2 + 3);
        ctx.fillStyle = ink;
        ctx.fillText("Mid", pad + plotW + 6, midY + 3);
        ctx.fillStyle = gain;
        ctx.fillText("Bids", pad + plotW + 6, midY + cellH * 2 + 3);

        return;
      }

      // Hairline grid for line/bars
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      for (let i = 1; i < 4; i++) {
        const y = (i * plotH) / 4;
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(w - pad, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      const data = values.length
        ? values
        : Array.from({ length: 60 }, (_, i) => 30 + i * 0.5 + Math.sin(i * 0.32) * 6 + Math.sin(i * 1.2) * 3);

      const min = Math.min(...data);
      const max = Math.max(...data);
      const range = max - min || 1;

      if (kind === "bars") {
        const absMax = Math.max(1, ...data.map(Math.abs));
        const hasNegative = data.some((n) => n < 0);
        const baseline = hasNegative ? plotH * 0.55 : plotH - 5;
        const barW = Math.max(3, plotW / data.length - 2);

        data.forEach((v, i) => {
          ctx.fillStyle = v < 0 ? loss : gain;
          const bh = (Math.abs(v) / absMax) * (plotH * 0.5);
          const x = pad + (i / data.length) * plotW;
          const y = v < 0 ? baseline : baseline - bh;
          ctx.beginPath();
          ctx.roundRect(x, y, barW, Math.max(2, bh), 2);
          ctx.fill();
        });
      } else {
        // Line & Curve with godcandle rainbow pastel gradient fill
        const points = data.map((v, i) => {
          const x = pad + (i / (data.length - 1)) * (plotW - 10);
          const y = plotH - 8 - ((v - min) / range) * (plotH - 20);
          return { x, y };
        });

        // Area fill
        ctx.beginPath();
        points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        const firstPt = points[0];
        const lastPt = points[points.length - 1];
        if (firstPt && lastPt) {
          ctx.lineTo(lastPt.x, plotH);
          ctx.lineTo(firstPt.x, plotH);
        }
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, 0, 0, plotH);
        grad.addColorStop(0, "rgba(205, 195, 240, 0.45)"); // #CDC3F0
        grad.addColorStop(0.6, "rgba(255, 218, 200, 0.2)"); // #FFDAC8
        grad.addColorStop(1, "rgba(160, 212, 202, 0.0)"); // #A0D4CA
        ctx.fillStyle = grad;
        ctx.fill();

        // Stroke line
        ctx.beginPath();
        points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Last dot indicator
        const last = points[points.length - 1];
        if (last) {
          ctx.beginPath();
          ctx.arc(last.x, last.y, 7, 0, Math.PI * 2);
          ctx.fillStyle = "#CDC3F0";
          ctx.globalAlpha = 0.5;
          ctx.fill();
          ctx.globalAlpha = 1;

          ctx.beginPath();
          ctx.arc(last.x, last.y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = ink;
          ctx.fill();
        }
      }

      // Time axis bottom marks
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = color("--muted-foreground") || "#8A8A86";
      const times = ["-24h", "-18h", "-12h", "-6h", "-1h", "NOW"];
      for (let i = 0; i < times.length; i++) {
        const x = pad + (i / (times.length - 1)) * (plotW - 20);
        const label = times[i];
        if (label) ctx.fillText(label, x, h - 6);
      }
    }

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [kind, values, height]);

  return (
    <canvas
      aria-label={`${kind} chart`}
      ref={ref}
      className={`chart-surface w-full ${
        height > 300 ? "h-[380px]" : height < 180 ? "h-[130px]" : "h-[240px]"
      }`}
    />
  );
}