export interface LatencyTrend {
  points: { x: number; y: number }[];
  min: number;
  max: number;
  avg: number;
  jitter: number;
  successRate: number;
  totalTests: number;
  successTests: number;
}

import type { Proxy } from "@/types";

// Sparkline geometry + summary stats for a node's latency history.
// Successful measurements only (delay === 0 means failed). Returns null when
// there are fewer than two successful readings.
export function computeLatencyTrend(history: Proxy["history"]): LatencyTrend | null {
  if (history.length === 0) return null;

  const latencies = history.filter((h) => h.delay > 0).map((h) => h.delay);
  if (latencies.length < 2) return null;

  const min = Math.min(...latencies);
  const max = Math.max(...latencies);
  const range = max - min || 1;
  const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);

  const variance = latencies.reduce((sum, lat) => sum + (lat - avg) ** 2, 0) / latencies.length;
  const jitter = Math.round(Math.sqrt(variance));

  const totalTests = history.length;
  const successTests = latencies.length;
  const successRate = Math.round((successTests / totalTests) * 100);

  const points = latencies.map((lat, i) => ({
    x: (i / (latencies.length - 1)) * 100,
    y: 50 - ((lat - min) / range) * 40 - 5,
  }));

  return { points, min, max, avg, jitter, successRate, totalTests, successTests };
}

export function svgPathFromPoints(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}
