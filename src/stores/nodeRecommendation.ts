import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface NodePerformanceEntry {
  timestamp: number;
  latency: number | null; // null means test failed
  success: boolean;
}

export interface NodePerformanceData {
  nodeName: string;
  history: NodePerformanceEntry[];
  lastTestTime: number;
  score: number | null;
}

export interface ScoringWeights {
  latency: number;
  stability: number;
  successRate: number;
}

const MAX_HISTORY_ENTRIES = 20;
const STORAGE_KEY = "nodePerformanceHistory";

export interface NodeRecommendationState {
  performanceData: Map<string, NodePerformanceData>;
  scoringWeights: ScoringWeights;
  excludedNodes: string[];
  autoSwitchEnabled: boolean;
  recordTestResult: (name: string, latency: number | null, success: boolean) => void;
  recordBatchResults: (results: Record<string, number>) => void;
  getNodePerformance: (name: string) => NodePerformanceData | undefined;
}

function loadFromStorage(): Map<string, NodePerformanceData> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return new Map(Object.entries(JSON.parse(stored)));
    }
  } catch {
    // ignore
  }
  return new Map();
}

function saveToStore(data: Map<string, NodePerformanceData>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(data)));
  } catch {
    // ignore
  }
}

export const useNodeRecommendationStore = create<NodeRecommendationState>()(
  persist(
    (set, get) => ({
      performanceData: loadFromStorage(),
      scoringWeights: { latency: 50, stability: 30, successRate: 20 },
      excludedNodes: [],
      autoSwitchEnabled: false,
      recordTestResult: (name, latency, success) => {
        const data = get().performanceData;
        const existing = data.get(name);
        const entry: NodePerformanceEntry = { timestamp: Date.now(), latency, success };
        if (existing) {
          existing.history = [entry, ...existing.history].slice(0, MAX_HISTORY_ENTRIES);
          existing.lastTestTime = entry.timestamp;
          existing.score = null;
        } else {
          data.set(name, {
            nodeName: name,
            history: [entry],
            lastTestTime: entry.timestamp,
            score: null,
          });
        }
        saveToStore(data);
        set({ performanceData: new Map(data) });
      },
      recordBatchResults: (results) => {
        const data = get().performanceData;
        const now = Date.now();
        for (const [name, latency] of Object.entries(results)) {
          const success = latency > 0;
          const entry: NodePerformanceEntry = {
            timestamp: now,
            latency: success ? latency : null,
            success,
          };
          const existing = data.get(name);
          if (existing) {
            existing.history = [entry, ...existing.history].slice(0, MAX_HISTORY_ENTRIES);
            existing.lastTestTime = now;
            existing.score = null;
          } else {
            data.set(name, { nodeName: name, history: [entry], lastTestTime: now, score: null });
          }
        }
        saveToStore(data);
        set({ performanceData: new Map(data) });
      },
      getNodePerformance: (name) => get().performanceData.get(name),
    }),
    {
      name: "node-recommendation",
      partialize: (s) => ({
        scoringWeights: s.scoringWeights,
        excludedNodes: s.excludedNodes,
        autoSwitchEnabled: s.autoSwitchEnabled,
      }),
    },
  ),
);
