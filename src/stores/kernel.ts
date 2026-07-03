import { create } from "zustand";
import type { KernelState } from "@/types/control";

export interface KernelLogLine {
  stream: "stdout" | "stderr";
  line: string;
  ts: number;
}

const LOG_CAP = 1000;

export interface KernelStoreState {
  state: KernelState | null;
  logs: KernelLogLine[];
  connected: boolean;
  pushLog: (l: KernelLogLine) => void;
  clearLogs: () => void;
  setState: (s: KernelState | null) => void;
  setConnected: (b: boolean) => void;
  connectLogs: (url: () => string) => () => void;
}

export const useKernelStore = create<KernelStoreState>((set, get) => ({
  state: null,
  logs: [],
  connected: false,
  pushLog: (l) => {
    const logs = [...get().logs, l];
    if (logs.length > LOG_CAP) logs.splice(0, logs.length - LOG_CAP);
    set({ logs });
  },
  clearLogs: () => set({ logs: [] }),
  setState: (s) => set({ state: s }),
  setConnected: (b) => set({ connected: b }),
  connectLogs: (url) => {
    const es = new EventSource(url());
    set({ connected: true });
    es.onmessage = (ev) => {
      let frame: unknown;
      try {
        frame = JSON.parse(ev.data);
      } catch {
        return;
      }
      const f = frame as
        | { type: "log"; stream: "stdout" | "stderr"; line: string; ts: number }
        | ({ type: "state" } & KernelState);
      if (f.type === "log") get().pushLog({ stream: f.stream, line: f.line, ts: f.ts });
      else {
        const { type: _t, ...s } = f;
        void _t;
        get().setState(s as KernelState);
      }
    };
    es.onerror = () => set({ connected: false });
    return () => {
      es.close();
      set({ connected: false });
    };
  },
}));
