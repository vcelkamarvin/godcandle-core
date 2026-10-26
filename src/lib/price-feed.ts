import { useSyncExternalStore } from "react";

export interface Tick {
  t: number;
  p: number;
}
export interface FeedSnap {
  price: number;
  prev: number;
  open24: number;
  highVol: boolean;
  lastTick: number;
}

const START = 64300;
export const ticks: Tick[] = [];
let snap: FeedSnap = { price: START, prev: START, open24: 63720, highVol: false, lastTick: 0 };
const listeners = new Set<() => void>();
let started = false;

const gauss = () => {
  const u = Math.random() || 1e-9;
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

function nextPrice(p: number) {
  const sigma = snap.highVol ? 0.00012 : 0.000028;
  let r = gauss() * sigma;
  if (Math.random() < 0.04) r += (Math.random() < 0.5 ? -1 : 1) * sigma * 4;
  return Math.round(p * (1 + r) * 100) / 100;
}

function step() {
  const p = nextPrice(snap.price);
  const t = Date.now();
  ticks.push({ t, p });
  if (ticks.length > 800) ticks.splice(0, ticks.length - 800);
  snap = { ...snap, prev: snap.price, price: p, lastTick: t };
  listeners.forEach((l) => l());
  setTimeout(step, 150 + Math.random() * 100);
}

export function startFeed() {
  if (started) return;
  started = true;
  // Backfill ~45 s so the chart is full on load.
  const now = Date.now();
  let p = START;
  const back: Tick[] = [];
  for (let t = now; t > now - 45000; t -= 200) {
    back.unshift({ t, p });
    p = nextPrice(p);
  }
  ticks.push(...back);
  snap = { ...snap, price: ticks[ticks.length - 1].p, prev: ticks[ticks.length - 2].p, lastTick: now };
  step();
}

export function toggleHighVol() {
  snap = { ...snap, highVol: !snap.highVol };
  listeners.forEach((l) => l());
  return snap.highVol;
}

export const getSnap = () => snap;
const serverSnap = snap;

export function useFeed() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => snap,
    () => serverSnap,
  );
}
