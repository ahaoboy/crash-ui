import type { NodePerformanceData, ScoringWeights } from "@/stores/nodeRecommendation";

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  latency: 50,
  stability: 30,
  successRate: 20,
};

export const SCORE_THRESHOLDS = {
  good: 80,
  medium: 50,
};

export function calculateLatencyScore(latencies: (number | null)[]): number {
  const valid = latencies.filter((l): l is number => l !== null && l > 0);
  if (valid.length === 0) return 0;
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  if (avg <= 50) return 100;
  if (avg >= 5000) return 0;
  const minLog = Math.log(50);
  const maxLog = Math.log(5000);
  const cur = Math.log(avg);
  return Math.round(100 * (1 - (cur - minLog) / (maxLog - minLog)));
}

export function calculateStabilityScore(latencies: (number | null)[]): number {
  const valid = latencies.filter((l): l is number => l !== null && l > 0);
  if (valid.length === 0) return 0;
  if (valid.length < 2) return 50;
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
  const variance = valid.map((l) => (l - mean) ** 2).reduce((a, b) => a + b, 0) / valid.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;
  if (cv <= 0.1) return 100;
  if (cv >= 0.5) return 0;
  return Math.round(100 * (1 - (cv - 0.1) / 0.4));
}

export function calculateSuccessRateScore(history: { success: boolean }[]): number {
  if (history.length === 0) return 0;
  return Math.round((history.filter((h) => h.success).length / history.length) * 100);
}

export function calculateNodeScore(
  data: NodePerformanceData,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
): number {
  if (data.history.length === 0) return 0;
  const latencies = data.history.map((h) => h.latency);
  const total = weights.latency + weights.stability + weights.successRate;
  if (total === 0) return 0;
  const score =
    calculateLatencyScore(latencies) * (weights.latency / total) +
    calculateStabilityScore(latencies) * (weights.stability / total) +
    calculateSuccessRateScore(data.history) * (weights.successRate / total);
  return Math.round(score);
}

export function findRecommendedNode(
  nodeNames: string[],
  performanceData: Map<string, NodePerformanceData>,
  excludedNodes: string[],
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
): string | null {
  let best: string | null = null;
  let bestScore = -1;
  for (const name of nodeNames) {
    if (excludedNodes.includes(name)) continue;
    const data = performanceData.get(name);
    if (!data || data.history.length === 0) continue;
    const score = calculateNodeScore(data, weights);
    if (score > bestScore) {
      bestScore = score;
      best = name;
    }
  }
  return best;
}
