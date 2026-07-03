import { create } from "zustand";
import type { ChartDataPoint, MemoryData, TrafficData } from "@/types";
import { CHART_MAX_XAXIS } from "@/constants";

export interface GlobalStoreState {
  rootElement: HTMLElement | null;
  latestTraffic: TrafficData | null;
  latestMemory: MemoryData | null;
  trafficChartHistory: { download: ChartDataPoint[]; upload: ChartDataPoint[] };
  memoryChartHistory: ChartDataPoint[];
  connectionCountHistory: ChartDataPoint[];
  setRootElement: (el: HTMLElement | null) => void;
  setLatestTraffic: (data: TrafficData | null) => void;
  setLatestMemory: (data: MemoryData | null) => void;
  addTrafficDataPoint: (time: number, download: number, upload: number) => void;
  addMemoryDataPoint: (time: number, value: number) => void;
  addConnectionCountDataPoint: (time: number, count: number) => void;
  clearChartHistory: () => void;
}

export const useGlobalStore = create<GlobalStoreState>((set, get) => ({
  rootElement: null,
  latestTraffic: null,
  latestMemory: null,
  // Non-reactive buckets — charts snapshot on mount and update imperatively.
  trafficChartHistory: { download: [], upload: [] },
  memoryChartHistory: [],
  connectionCountHistory: [],
  setRootElement: (el) => set({ rootElement: el }),
  setLatestTraffic: (data) => set({ latestTraffic: data }),
  setLatestMemory: (data) => set({ latestMemory: data }),
  addTrafficDataPoint: (time, download, upload) => {
    const h = get().trafficChartHistory;
    h.download.push([time, download]);
    h.upload.push([time, upload]);
    if (h.download.length > CHART_MAX_XAXIS) h.download.shift();
    if (h.upload.length > CHART_MAX_XAXIS) h.upload.shift();
  },
  addMemoryDataPoint: (time, value) => {
    const h = get().memoryChartHistory;
    h.push([time, value]);
    if (h.length > CHART_MAX_XAXIS) h.shift();
  },
  addConnectionCountDataPoint: (time, count) => {
    const h = get().connectionCountHistory;
    h.push([time, count]);
    if (h.length > CHART_MAX_XAXIS) h.shift();
  },
  clearChartHistory: () => {
    const h = get().trafficChartHistory;
    h.download.length = 0;
    h.upload.length = 0;
    get().memoryChartHistory.length = 0;
    get().connectionCountHistory.length = 0;
  },
}));
