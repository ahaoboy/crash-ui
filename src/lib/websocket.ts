import type { Log, MemoryData, TrafficData, WsMsg } from "@/types";
import { useEndpointStore } from "@/stores/endpoint";
import { useConnectionsStore } from "@/stores/connections";
import { useGlobalStore } from "@/stores/global";
import { useLogsStore } from "@/stores/logs";
import { useConfigStore } from "@/stores/config";
import { isMockMode } from "@/config/global";
import { mockConnections, mockTrafficStats, mockMemory, mockLogsList } from "./mockData";

const RECONNECT_DELAY = 3000;

interface Sockets {
  connections: WebSocket | null;
  traffic: WebSocket | null;
  memory: WebSocket | null;
  logs: WebSocket | null;
}

let sockets: Sockets = { connections: null, traffic: null, memory: null, logs: null };
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let mockInterval: ReturnType<typeof setInterval> | null = null;

function closeWs(ws: WebSocket | null): void {
  if (!ws) return;
  ws.onclose = null;
  ws.onerror = null;
  ws.onmessage = null;
  ws.close();
}

export interface BackendWebSocket {
  connect: () => void;
  disconnect: () => void;
  reconnectLogs: () => void;
}

export function useBackendWebSocket(): BackendWebSocket {
  function scheduleReconnect(): void {
    if (isMockMode()) return;
    if (reconnectTimer) return;
    const { currentEndpoint } = useEndpointStore.getState();
    if (!currentEndpoint) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, RECONNECT_DELAY);
  }

  function createWs(path: string, onMessage: (data: unknown) => void): WebSocket | null {
    const endpoint = useEndpointStore.getState().currentEndpoint();
    if (!endpoint) return null;
    const wsUrl = useEndpointStore.getState().wsEndpointURL();
    const params = new URLSearchParams();
    if (endpoint.secret) params.set("token", endpoint.secret);
    const ws = new WebSocket(`${wsUrl}/${path}?${params.toString()}`);
    ws.onmessage = (event) => {
      try {
        onMessage(JSON.parse(event.data));
      } catch {
        // ignore parse errors
      }
    };
    ws.onerror = (e) => console.error(`WebSocket error for ${path}:`, e);
    ws.onclose = () => scheduleReconnect();
    return ws;
  }

  function connect(): void {
    disconnect();
    if (isMockMode()) {
      const g = useGlobalStore.getState();
      const logs = useLogsStore.getState();
      useConnectionsStore.getState().updateFromWsMsg({
        connections: mockConnections(),
        uploadTotal: mockTrafficStats.up,
        downloadTotal: mockTrafficStats.down,
      } as WsMsg);
      g.setLatestTraffic(mockTrafficStats as TrafficData);
      g.setLatestMemory(mockMemory as MemoryData);
      const now = Date.now();
      const base = mockConnections().length;
      for (let i = 30; i >= 0; i--) {
        const t = now - i * 1000;
        g.addTrafficDataPoint(
          t,
          mockTrafficStats.down + Math.floor(Math.random() * 100000) - 50000,
          mockTrafficStats.up + Math.floor(Math.random() * 20000) - 10000,
        );
        g.addMemoryDataPoint(
          t,
          mockMemory.inuse + Math.floor(Math.random() * 5_000_000) - 2_500_000,
        );
        g.addConnectionCountDataPoint(t, base + Math.floor(Math.random() * 10) - 5);
      }
      for (const l of mockLogsList) logs.addLog(l as Log);
      mockInterval = setInterval(() => {
        const t = Date.now();
        const up = mockTrafficStats.up + Math.floor(Math.random() * 10000);
        const down = mockTrafficStats.down + Math.floor(Math.random() * 50000);
        useGlobalStore.getState().setLatestTraffic({ up, down });
        useGlobalStore.getState().addTrafficDataPoint(t, down, up);
        useGlobalStore
          .getState()
          .addMemoryDataPoint(
            t,
            mockMemory.inuse + Math.floor(Math.random() * 5_000_000) - 2_500_000,
          );
        useGlobalStore
          .getState()
          .addConnectionCountDataPoint(t, base + Math.floor(Math.random() * 10) - 5);
      }, 1000);
      return;
    }

    sockets.connections = createWs("connections", (data) => {
      const msg = data as WsMsg;
      useConnectionsStore.getState().updateFromWsMsg(msg);
      if (msg) {
        const count = msg.connections?.length ?? 0;
        useGlobalStore.getState().addConnectionCountDataPoint(Date.now(), count);
      }
    });
    sockets.traffic = createWs("traffic", (data) => {
      const t = data as TrafficData;
      useGlobalStore.getState().setLatestTraffic(t);
      useGlobalStore.getState().addTrafficDataPoint(Date.now(), t.down, t.up);
    });
    sockets.memory = createWs("memory", (data) => {
      const m = data as MemoryData;
      useGlobalStore.getState().setLatestMemory(m);
      useGlobalStore.getState().addMemoryDataPoint(Date.now(), m.inuse);
    });
    sockets.logs = createLogsWs();
  }

  function createLogsWs(): WebSocket | null {
    const endpoint = useEndpointStore.getState().currentEndpoint();
    if (!endpoint) return null;
    const wsUrl = useEndpointStore.getState().wsEndpointURL();
    const params = new URLSearchParams();
    if (endpoint.secret) params.set("token", endpoint.secret);
    params.set("level", useConfigStore.getState().logLevel);
    const ws = new WebSocket(`${wsUrl}/logs?${params.toString()}`);
    ws.onmessage = (event) => {
      try {
        useLogsStore.getState().addLog(JSON.parse(event.data) as Log);
      } catch {
        // ignore
      }
    };
    ws.onerror = (e) => console.error("WebSocket error for logs:", e);
    ws.onclose = () => scheduleReconnect();
    return ws;
  }

  function disconnect(): void {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (mockInterval) {
      clearInterval(mockInterval);
      mockInterval = null;
    }
    closeWs(sockets.connections);
    closeWs(sockets.traffic);
    closeWs(sockets.memory);
    closeWs(sockets.logs);
    sockets = { connections: null, traffic: null, memory: null, logs: null };
  }

  function reconnectLogs(): void {
    closeWs(sockets.logs);
    sockets.logs = isMockMode() ? null : createLogsWs();
  }

  return { connect, disconnect, reconnectLogs };
}
