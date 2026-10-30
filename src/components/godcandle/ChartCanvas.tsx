import { useEffect, useRef } from "react";
export function ChartCanvas({ kind = "line", values = [], height = 240 }: { kind?: "line" | "heatmap" | "bars" | "curve"; values?: number[]; height?: number }) {
 const ref = useRef<HTMLCanvasElement>(null);
 useEffect(() => {
  const canvas = ref.current; if (!canvas) return;
  const ctx = canvas.getContext("2d"); if (!ctx) return;
  const css = getComputedStyle(document.documentElement);
  const color = (name: string) => css.getPropertyValue(name).trim();
  const ink = color("--foreground"), grid = color("--border"), gain = color("--trade-gain"), loss = color("--loss");
  const palette = [color("--chart-lavender"), color("--chart-peach"), color("--chart-sage"), color("--secondary")];
  function draw() {
   if (!canvas || !ctx) return;
   const w = canvas.clientWidth, h = canvas.clientHeight, dpr = window.devicePixelRatio || 1;
   canvas.width = w*dpr; canvas.height = h*dpr; ctx.scale(dpr,dpr); ctx.clearRect(0,0,w,h);
   const pad = 18, plot = h-32;
   if (kind === "heatmap") {
    const rows = 38, cols = 32;
    for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) { ctx.fillStyle = (r===8 || r===28) ? ((c*7+r)%11<3 ? color("--chart-yellow") : gain) : (palette[(r*13+c*7)%palette.length] ?? grid); ctx.globalAlpha = .7 + ((r+c)%3)*.1; ctx.fillRect(c*(w-40)/cols,r*plot/rows,(w-40)/cols,plot/rows-1); }
    ctx.globalAlpha=1;
   } else {
    ctx.strokeStyle=grid; ctx.setLineDash([2,4]); for(let i=1;i<5;i++){ctx.beginPath();ctx.moveTo(pad,i*plot/5);ctx.lineTo(w-pad,i*plot/5);ctx.stroke();}ctx.setLineDash([]);
   }
   const data = values.length ? values : Array.from({length:80},(_,i)=>30+i*.5+Math.sin(i*.32)*5+Math.sin(i*1.3)*2);
   const min = Math.min(...data)-2, max = Math.max(...data)+2;
   if(kind === "bars") {
    const abs = Math.max(1,...data.map(Math.abs)); const baseline=data.some(n=>n<0)?plot*.6:plot;
    data.forEach((v,i)=>{ctx.fillStyle=v<0?loss:gain;const bh=Math.abs(v)/abs*plot*.55;ctx.beginPath();ctx.roundRect(pad+i*(w-pad*2)/data.length, v<0?baseline:baseline-bh, Math.max(2,(w-pad*2)/data.length-4),bh,3);ctx.fill();});
   } else {
    ctx.beginPath(); data.forEach((v,i)=>{const x=pad+i/(data.length-1)*(w-pad*2-20);const y=plot-12-(v-min)/(max-min)*(plot-28);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});
    if(kind!=="heatmap"){ctx.lineTo(w-pad-20,plot);ctx.lineTo(pad,plot);ctx.closePath();const g=ctx.createLinearGradient(0,0,0,plot);g.addColorStop(0,color("--chart-lavender"));g.addColorStop(1,color("--background"));ctx.fillStyle=g;ctx.globalAlpha=.55;ctx.fill();ctx.globalAlpha=1;}
    ctx.beginPath();data.forEach((v,i)=>{const x=pad+i/(data.length-1)*(w-pad*2-20);const y=plot-12-(v-min)/(max-min)*(plot-28);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.stroke();
    const last=data.at(-1)??0;const y=plot-12-(last-min)/(max-min)*(plot-28);ctx.beginPath();ctx.arc(w-pad-20,y,9,0,Math.PI*2);ctx.fillStyle=gain;ctx.globalAlpha=.25;ctx.fill();ctx.globalAlpha=1;ctx.beginPath();ctx.arc(w-pad-20,y,3,0,Math.PI*2);ctx.fillStyle=ink;ctx.fill();
   }
   ctx.font='10px "JetBrains Mono", monospace';ctx.fillStyle=color("--muted-foreground");for(let i=0;i<6;i++)ctx.fillText(["09:00","10:00","11:00","12:00","13:00","14:00"][i]??"",pad+i*(w-90)/5,h-8);
  }
  draw(); const observer=new ResizeObserver(draw);observer.observe(canvas);return()=>observer.disconnect();
 },[kind,values,height]);
 return <canvas aria-label={`${kind} chart`} ref={ref} className={`chart-surface ${height>300?"h-[440px]":height<180?"h-[120px]":"h-[240px]"}`}/>;
}