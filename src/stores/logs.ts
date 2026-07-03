import { create } from "zustand";
import type { Log, LogWithSeq } from "@/types";
import { useConfigStore } from "./config";

const FLUSH_INTERVAL = 250;

export interface LogsStoreState {
  logs: LogWithSeq[];
  paused: boolean;
  addLog: (log: Log) => void;
  clearLogs: () => void;
  togglePaused: () => void;
}

let pending: LogWithSeq[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let seq = 1;

export const useLogsStore = create<LogsStoreState>((set, get) => {
  function flush(): void {
    flushTimer = null;
    if (pending.length === 0) return;
    pending.reverse();
    const maxRows = useConfigStore.getState().logMaxRows;
    set({ logs: [...pending, ...get().logs].slice(0, maxRows) });
    pending = [];
  }
  function schedule(): void {
    if (flushTimer) return;
    flushTimer = setTimeout(flush, FLUSH_INTERVAL);
  }
  return {
    logs: [],
    paused: false,
    addLog: (log) => {
      if (get().paused) return;
      pending.push({ ...log, seq: seq++ });
      schedule();
    },
    clearLogs: () => {
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
      pending = [];
      set({ logs: [] });
      seq = 1;
    },
    togglePaused: () => set((s) => ({ paused: !s.paused })),
  };
});
