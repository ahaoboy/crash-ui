import type { Log, MemoryData, TrafficData, WsMsg } from "@/types";
import { useEndpointStore } from "@/stores/endpoint";
import { useConnectionsStore } from "@/stores/connections";
import { useGlobalStore } from "@/stores/global";
import { useLogsStore } from "@/stores/logs";
import { useConfigStore } from "@/stores/config";

const RECONNECT_DELAY = 3000;

interface Sockets {
  connections: WebSocket | null;
  traffic: WebSocket | null;
  memory: WebSocket | null;
  logs: WebSocket | null;
}

let sockets: Sockets = { connections: null, traffic: null, memory: null, logs: null };
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function closeWs(ws: WebSocket | null): void {
  if (!ws) return;
  ws.onclose = null;
  ws.onerror = null;
  ws.onmessage = null;
  if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
    ws.close();
  }
}

export interface BackendWebSocket {
  connect: () => void;
  disconnect: () => void;
  reconnectLogs: () => void;
}

export function useBackendWebSocket(): BackendWebSocket {
  function scheduleReconnect(): void {
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
    closeWs(sockets.connections);
    closeWs(sockets.traffic);
    closeWs(sockets.memory);
    closeWs(sockets.logs);
    sockets = { connections: null, traffic: null, memory: null, logs: null };
  }

  function reconnectLogs(): void {
    closeWs(sockets.logs);
    sockets.logs = createLogsWs();
  }

  return { connect, disconnect, reconnectLogs };
}
