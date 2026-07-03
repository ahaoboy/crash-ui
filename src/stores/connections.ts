import { create } from "zustand";
import type { Connection, ConnectionRawMessage, WsMsg } from "@/types";
import { CONNECTIONS_TABLE_MAX_CLOSED_ROWS } from "@/constants";
import { db, type DataUsageLog } from "@/utils/db";
import { useGlobalStore } from "./global";
import { useConfigStore } from "./config";
import { useEndpointStore } from "./endpoint";

export interface ConnectionsStoreState {
  allConnections: Connection[];
  activeConnections: Connection[];
  closedConnections: Connection[];
  latestConnectionMsg: WsMsg;
  paused: boolean;
  updateFromWsMsg: (msg: WsMsg) => void;
  clearDataUsage: () => Promise<void>;
  restructRawMsgToConnection: (conns: ConnectionRawMessage[], prev: Connection[]) => Connection[];
  setPaused: (p: boolean) => void;
}

const logBuffer = new Map<string, DataUsageLog>();
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
let lastUploadTotal = 0;
let lastDownloadTotal = 0;
const connectionLastData = new Map<string, { upload: number; download: number }>();

function keyFor(log: DataUsageLog): string {
  return `${log.timestamp}\x1F${log.sourceIP}\x1F${log.host}\x1F${log.outbound}\x1F${log.process}\x1F${log.inboundUser}`;
}

async function flushLogs(): Promise<void> {
  if (logBuffer.size === 0) return;
  const logs = Array.from(logBuffer.values());
  logBuffer.clear();
  try {
    await db.addLogs(logs);
  } catch (e) {
    console.error("[Data Usage] flush failed", e);
  }
}

function scheduleFlush(): void {
  if (flushTimeout) return;
  flushTimeout = setTimeout(
    async () => {
      await flushLogs();
      flushTimeout = null;
      if (logBuffer.size > 0) scheduleFlush();
    },
    30000 - (Date.now() % 30000) || 30000,
  );
}

export const useConnectionsStore = create<ConnectionsStoreState>((set, get) => {
  function restructConns(raw: ConnectionRawMessage[], prev: Connection[]): Connection[] {
    const prevMap = new Map<string, Connection>();
    for (const c of prev) prevMap.set(c.id, c);
    return raw.map((c) => {
      const existed = prevMap.get(c.id);
      if (!existed || typeof existed.download !== "number" || typeof existed.upload !== "number") {
        return { ...c, downloadSpeed: 0, uploadSpeed: 0 };
      }
      return {
        ...c,
        downloadSpeed: c.download - existed.download,
        uploadSpeed: c.upload - existed.upload,
      };
    });
  }

  function mergeAll(active: Connection[]): Connection[] {
    const seen = new Set<string>();
    const merged: Connection[] = [];
    for (const c of active)
      if (!seen.has(c.id)) {
        seen.add(c.id);
        merged.push(c);
      }
    for (const c of get().allConnections)
      if (!seen.has(c.id)) {
        seen.add(c.id);
        merged.push(c);
      }
    const limit = active.length + CONNECTIONS_TABLE_MAX_CLOSED_ROWS;
    return limit > 0 && merged.length > limit ? merged.slice(-limit) : merged;
  }

  function resetTracking(): void {
    connectionLastData.clear();
  }

  async function clearDataUsage(): Promise<void> {
    logBuffer.clear();
    connectionLastData.clear();
    try {
      await db.clearAll();
    } catch (e) {
      console.error("[Data Usage] clearAll failed", e);
    }
  }

  function updateFromMsg(msg: WsMsg): void {
    set({ latestConnectionMsg: msg });
    const rawConns = msg?.connections;
    const curUp = msg?.uploadTotal ?? 0;
    const curDown = msg?.downloadTotal ?? 0;
    if (curUp < lastUploadTotal || curDown < lastDownloadTotal) {
      resetTracking();
      void clearDataUsage();
      useGlobalStore.getState().clearChartHistory();
    }
    lastUploadTotal = curUp;
    lastDownloadTotal = curDown;
    if (!rawConns || rawConns.length === 0) return;

    const active = restructConns(rawConns, get().activeConnections);
    const activeIds = new Set(active.map((c) => c.id));

    if (useConfigStore.getState().enableDataUsageTracking) {
      const now = Date.now();
      const minuteStart = Math.floor(now / 60000) * 60000;
      let hasDeltas = false;
      for (const c of active) {
        const curUpByte = c.upload || 0;
        const curDownByte = c.download || 0;
        let upDelta = 0,
          downDelta = 0;
        const last = connectionLastData.get(c.id);
        if (last) {
          upDelta = Math.max(0, curUpByte - last.upload);
          downDelta = Math.max(0, curDownByte - last.download);
        } else {
          upDelta = curUpByte;
          downDelta = curDownByte;
        }
        connectionLastData.set(c.id, { upload: curUpByte, download: curDownByte });
        if (upDelta === 0 && downDelta === 0) continue;
        hasDeltas = true;
        const entry: DataUsageLog = {
          timestamp: minuteStart,
          sourceIP: c.metadata.sourceIP || "Inner",
          host: c.metadata.host || c.metadata.destinationIP,
          process: c.metadata.process || "Unknown",
          outbound: c.chains[0] ?? "DIRECT",
          inboundUser:
            c.metadata.inboundUser ||
            c.metadata.inboundIP ||
            c.metadata.inboundName ||
            c.metadata.type ||
            "Unknown",
          upload: upDelta,
          download: downDelta,
        };
        const k = keyFor(entry);
        const existing = logBuffer.get(k);
        if (existing) {
          existing.upload += upDelta;
          existing.download += downDelta;
        } else {
          logBuffer.set(k, entry);
        }
      }
      if (hasDeltas) scheduleFlush();
    }

    // cleanup inactive tracking entries
    connectionLastData.forEach((_, id) => {
      if (!activeIds.has(id)) connectionLastData.delete(id);
    });

    const all = mergeAll(active);
    if (!get().paused) {
      const closed = all.filter((c) => !activeIds.has(c.id));
      set({
        allConnections: all,
        activeConnections: active,
        closedConnections: closed.slice(-CONNECTIONS_TABLE_MAX_CLOSED_ROWS),
      });
    } else {
      set({ allConnections: all });
    }
  }

  return {
    allConnections: [],
    activeConnections: [],
    closedConnections: [],
    latestConnectionMsg: null,
    paused: false,
    updateFromWsMsg: updateFromMsg,
    clearDataUsage,
    restructRawMsgToConnection: restructConns,
    setPaused: (p) => set({ paused: p }),
  };
});

// Reset restart baselines on endpoint switch (web SPA navigation case).
let lastEndpoint = useEndpointStore.getState().selectedEndpoint;
useEndpointStore.subscribe((s) => {
  if (s.selectedEndpoint !== lastEndpoint) {
    lastEndpoint = s.selectedEndpoint;
    lastUploadTotal = 0;
    lastDownloadTotal = 0;
    connectionLastData.clear();
  }
});
