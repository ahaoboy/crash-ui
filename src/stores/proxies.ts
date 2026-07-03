import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Proxy, ProxyNodeWithProvider, ProxyProvider, ProxyWithProvider } from "@/types";
import {
  closeAllConnectionsAPI,
  closeSingleConnectionAPI,
  fetchProxiesAPI,
  fetchProxyProvidersAPI,
  proxyGroupLatencyTestAPI,
  proxyLatencyTestAPI,
  selectProxyInGroupAPI,
  unfixProxyInGroupAPI,
  updateProxyProviderAPI,
} from "@/lib/api";
import { useConfigStore } from "./config";
import { useConnectionsStore } from "./connections";
import { useNodeRecommendationStore } from "./nodeRecommendation";

export interface ProxyNodeView {
  name: string;
  type: string;
  udp: boolean;
  xudp: boolean;
  tfo: boolean;
  alive?: boolean;
  provider: string;
  selectedNodeName?: string;
}

interface ProxyInfo {
  name: string;
  alive?: boolean;
  udp: boolean;
  tfo: boolean;
  xudp: boolean;
  type: string;
  provider: string;
  latency: string;
  latencyTestHistory: Record<string, Proxy["history"] | undefined>;
}

const LATENCY_HISTORY_MAX = 10;

export interface ProxiesStoreState {
  proxies: ProxyWithProvider[];
  proxyProviders: (ProxyProvider & { proxies: ProxyNodeWithProvider[] })[];
  proxiesLoaded: boolean;
  proxyLatencyTestingMap: Record<string, boolean>;
  proxyGroupLatencyTestingMap: Record<string, boolean>;
  proxyProviderLatencyTestingMap: Record<string, boolean>;
  updatingMap: Record<string, boolean>;
  isAllProviderUpdating: boolean;
  collapsedMap: Record<string, boolean>;
  fetchProxies: () => Promise<void>;
  selectProxyInGroup: (proxy: ProxyWithProvider, proxyName: string) => Promise<void>;
  unfixProxyInGroup: (groupName: string) => Promise<void>;
  getNowProxyNodeName: (name: string) => string;
  getNode: (name: string) => ProxyNodeView | undefined;
  getLatencyByName: (name: string, testUrl: string | null) => number;
  getLatencyHistoryByName: (name: string, testUrl: string | null) => Proxy["history"];
  isProxyGroup: (name: string) => boolean;
  isTesting: (name: string, opts?: { providerName?: string; groupName?: string }) => boolean;
  proxyLatencyTest: (
    name: string,
    provider: string,
    testUrl: string | null,
    timeout: number | null,
  ) => Promise<void>;
  proxyGroupLatencyTest: (groupName: string) => Promise<void>;
  updateProviderByProviderName: (name: string) => Promise<void>;
  updateAllProvider: () => Promise<void>;
  proxyProviderLatencyTest: (name: string) => Promise<void>;
  closeAllConnections: () => Promise<void>;
}

// module-private non-reactive maps that mirror the Vue store's `latencyMap` and
// `proxyNodeMap`. Kept separate so they don't trigger a re-render until the
// derived `getNode` view/accessor is called by the consumer.
const latencyMap: Record<string, Record<string, number> | undefined> = {};
const proxyNodeMap: Record<string, ProxyInfo> = {};

function findPositiveLatency(m: Record<string, number> | undefined): number | undefined {
  if (!m) return undefined;
  for (const v of Object.values(m)) if (v > 0) return v;
  return undefined;
}

function pickLatencyHistory(
  histories: Record<string, Proxy["history"] | undefined>,
  finalTestUrl: string,
): Proxy["history"] | undefined {
  const exact = histories[finalTestUrl];
  if (exact?.length) return exact;
  for (const series of Object.values(histories)) {
    if (series?.length) return series;
  }
  return undefined;
}

function getLatencyFromProxy(
  proxy: Pick<Proxy, "extra" | "history" | "testUrl">,
  fallbackDefault = true,
): {
  allTestUrlLatency: Record<string, number>;
  allTestUrlLatencyHistory: Record<string, Proxy["history"] | undefined>;
} {
  const allTestUrlLatency: Record<string, number> = {};
  const allTestUrlLatencyHistory: Record<string, Proxy["history"] | undefined> = {};
  const cfg = useConfigStore.getState();
  const nc = cfg.latencyQualityMap().NOT_CONNECTED;
  for (const [testUrl, data] of Object.entries(proxy.extra || {})) {
    allTestUrlLatency[testUrl] = data?.history?.at(-1)?.delay ?? nc;
    allTestUrlLatencyHistory[testUrl] = data?.history;
  }
  if (fallbackDefault) {
    const defaultTestUrl = cfg.resolveLatencyTestUrl(proxy.testUrl);
    if (!(defaultTestUrl in allTestUrlLatency)) {
      allTestUrlLatency[defaultTestUrl] = proxy.history?.at(-1)?.delay ?? nc;
      allTestUrlLatencyHistory[defaultTestUrl] = proxy.history;
    }
  }
  return { allTestUrlLatency, allTestUrlLatencyHistory };
}

export const useProxiesStore = create<ProxiesStoreState>()(
  persist(
    (set, get) => {
      function replaceNodeLatency(name: string, finalTestUrl: string, delay: number): void {
        latencyMap[name] = { ...latencyMap[name], [finalTestUrl]: delay };
      }

      function appendHistoryEntry(name: string, finalTestUrl: string, delay: number): void {
        const existing = proxyNodeMap[name];
        const prevHistories = existing?.latencyTestHistory ?? {};
        const prevEntries = prevHistories[finalTestUrl] ?? [];
        const entry = { time: new Date().toISOString(), delay };
        const nextEntries = [...prevEntries, entry].slice(-LATENCY_HISTORY_MAX);
        proxyNodeMap[name] = existing
          ? { ...existing, latencyTestHistory: { ...prevHistories, [finalTestUrl]: nextEntries } }
          : {
              name,
              alive: undefined,
              udp: false,
              xudp: false,
              tfo: false,
              type: "",
              latency: "",
              provider: "",
              latencyTestHistory: { [finalTestUrl]: nextEntries },
            };
      }

      function recordLatencyTestResult(name: string, testUrl: string | null, delay: number): void {
        const cfg = useConfigStore.getState();
        const resolved = getNowProxyNodeNameCore(name);
        const finalTestUrl = cfg.resolveLatencyTestUrl(testUrl);
        const resultDelay = Number.isFinite(delay) ? delay : cfg.latencyQualityMap().NOT_CONNECTED;
        replaceNodeLatency(resolved, finalTestUrl, resultDelay);
      }

      function recordLatencyTestResults(
        results: Record<string, number>,
        testUrl: string | null,
      ): void {
        for (const [name, delay] of Object.entries(results)) {
          recordLatencyTestResult(name, testUrl, delay);
        }
      }

      function getNowProxyNodeNameCore(name: string): string {
        let node: ProxyInfo | undefined = proxyNodeMap[name];
        if (!name || !node) return name;
        const visited = new Set<string>();
        while (node && node.latency && node.latency !== node.name) {
          if (visited.has(node.name)) return node.name;
          visited.add(node.name);
          const next: ProxyInfo | undefined = proxyNodeMap[node.latency];
          if (!next) return node.name;
          node = next;
        }
        return node?.name ?? name;
      }

      function setProxiesInfo(list: (ProxyWithProvider | ProxyNodeWithProvider)[]): void {
        for (const proxy of list) {
          const { allTestUrlLatency, allTestUrlLatencyHistory } = getLatencyFromProxy(
            proxy as never,
          );
          const { udp, xudp, type, now, name, tfo, provider = "" } = proxy;
          const alive = "alive" in proxy ? (proxy as { alive?: boolean }).alive : undefined;
          proxyNodeMap[name] = {
            alive,
            udp,
            xudp,
            type,
            latency: now,
            latencyTestHistory: allTestUrlLatencyHistory,
            name,
            tfo,
            provider,
          };
          latencyMap[name] = allTestUrlLatency;
        }
      }

      async function closeConnectionsThroughGroup(groupName: string): Promise<void> {
        const cfg = useConfigStore.getState();
        if (!cfg.autoCloseConns) return;
        const conns = useConnectionsStore
          .getState()
          .restructRawMsgToConnection(
            useConnectionsStore.getState().latestConnectionMsg?.connections ?? [],
            [],
          );
        if (conns.length === 0) return;
        await Promise.allSettled(
          conns
            .filter((c) => c.chains.includes(groupName))
            .map((c) => closeSingleConnectionAPI(c.id)),
        );
      }

      return {
        proxies: [],
        proxyProviders: [],
        proxiesLoaded: false,
        proxyLatencyTestingMap: {},
        proxyGroupLatencyTestingMap: {},
        proxyProviderLatencyTestingMap: {},
        updatingMap: {},
        isAllProviderUpdating: false,
        collapsedMap: {},

        fetchProxies: async () => {
          try {
            const [{ providers }, { proxies: proxiesData }] = await Promise.all([
              fetchProxyProvidersAPI(),
              fetchProxiesAPI(),
            ]);
            const proxiesWithTestUrl = Object.values(proxiesData).map((proxy) => {
              if (!proxy.all?.length) return proxy;
              const all = [...new Set(proxy.all)];
              if (!proxy.testUrl) {
                const { testUrl, timeout } = providers?.[proxy.name] ?? {};
                return { ...proxy, all, testUrl, timeout };
              }
              return { ...proxy, all };
            });
            const sortIndex = [...(proxiesData.GLOBAL?.all ?? []), "GLOBAL"];
            const sortedProxies = Object.values(proxiesWithTestUrl)
              .filter((p) => p.all?.length)
              .sort((a, b) => sortIndex.indexOf(a.name) - sortIndex.indexOf(b.name));
            const sortedProviders = Object.values(providers).filter(
              (p) => p.name !== "default" && p.vehicleType !== "Compatible",
            );
            const allProxies: (ProxyWithProvider | ProxyNodeWithProvider)[] = [
              ...proxiesWithTestUrl,
              ...sortedProviders.flatMap((p) =>
                p.proxies
                  .filter((n) => !(n.name in proxiesData))
                  .map((n) => ({ ...n, provider: p.name })),
              ),
            ];
            set({
              proxies: sortedProxies,
              proxyProviders: sortedProviders as never,
            });
            setProxiesInfo(allProxies);
          } finally {
            set({ proxiesLoaded: true });
          }
        },

        selectProxyInGroup: async (proxy, proxyName) => {
          await selectProxyInGroupAPI(proxy.name, proxyName);
          await get().fetchProxies();
          await closeConnectionsThroughGroup(proxy.name);
        },

        unfixProxyInGroup: async (groupName) => {
          await unfixProxyInGroupAPI(groupName);
          await get().fetchProxies();
          await closeConnectionsThroughGroup(groupName);
        },

        getNowProxyNodeName: getNowProxyNodeNameCore,
        getNode: (name) => {
          const info = proxyNodeMap[name];
          if (!info) return undefined;
          const selectedNodeName =
            info.latency && info.latency !== info.name ? info.latency : undefined;
          return {
            name: info.name,
            type: info.type,
            udp: info.udp,
            xudp: info.xudp,
            tfo: info.tfo,
            alive: info.alive,
            provider: info.provider,
            selectedNodeName,
          };
        },

        getLatencyByName: (name, testUrl) => {
          const cfg = useConfigStore.getState();
          const finalTestUrl = cfg.resolveLatencyTestUrl(testUrl);
          const nowName = getNowProxyNodeNameCore(name);
          const nodeLat = latencyMap[nowName];
          const grpLat = latencyMap[name];
          const direct = nodeLat?.[finalTestUrl];
          if (direct) return direct;
          const grpDirect = grpLat?.[finalTestUrl];
          if (grpDirect) return grpDirect;
          const reused = findPositiveLatency(nodeLat) ?? findPositiveLatency(grpLat);
          if (reused !== null && reused !== undefined) return reused;
          return direct ?? grpDirect ?? cfg.latencyQualityMap().NOT_CONNECTED;
        },

        getLatencyHistoryByName: (name, testUrl) => {
          const cfg = useConfigStore.getState();
          const finalTestUrl = cfg.resolveLatencyTestUrl(testUrl);
          const nowName = getNowProxyNodeNameCore(name);
          const nowHist = proxyNodeMap[nowName]?.latencyTestHistory || {};
          const proxyHist = proxyNodeMap[name]?.latencyTestHistory || {};
          return (
            pickLatencyHistory(nowHist, finalTestUrl) ??
            pickLatencyHistory(proxyHist, finalTestUrl) ??
            []
          );
        },

        isProxyGroup: (name) => {
          const node = proxyNodeMap[name];
          if (!node) return false;
          return (
            ["direct", "reject", "loadbalance"].includes(node.type.toLowerCase()) || !!node.latency
          );
        },

        isTesting: (name, opts = {}) =>
          get().proxyLatencyTestingMap[name] ||
          (opts.providerName
            ? get().proxyProviderLatencyTestingMap[opts.providerName] || false
            : false) ||
          (opts.groupName ? get().proxyGroupLatencyTestingMap[opts.groupName] || false : false),

        proxyLatencyTest: async (name, provider, testUrl, timeout) => {
          const cfg = useConfigStore.getState();
          const nodeName = getNowProxyNodeNameCore(name);
          const finalTestUrl = cfg.resolveLatencyTestUrl(testUrl);
          const rec = useNodeRecommendationStore.getState();
          set((s) => ({
            proxyLatencyTestingMap: { ...s.proxyLatencyTestingMap, [nodeName]: true },
          }));
          try {
            const { delay } = await proxyLatencyTestAPI(
              nodeName,
              provider,
              finalTestUrl,
              timeout ?? cfg.latencyTestTimeoutDuration,
            );
            recordLatencyTestResult(nodeName, finalTestUrl, delay);
            appendHistoryEntry(nodeName, finalTestUrl, delay);
            rec.recordTestResult(nodeName, delay > 0 ? delay : null, delay > 0);
          } catch {
            appendHistoryEntry(nodeName, finalTestUrl, cfg.latencyQualityMap().NOT_CONNECTED);
            rec.recordTestResult(nodeName, null, false);
          } finally {
            set((s) => ({
              proxyLatencyTestingMap: { ...s.proxyLatencyTestingMap, [nodeName]: false },
            }));
          }
        },

        proxyGroupLatencyTest: async (groupName) => {
          const cfg = useConfigStore.getState();
          const rec = useNodeRecommendationStore.getState();
          const group = get().proxies.find((p) => p.name === groupName);
          const finalTestUrl = cfg.resolveLatencyTestUrl(group?.testUrl);
          const members = group?.all ?? [groupName];
          set((s) => ({
            proxyGroupLatencyTestingMap: { ...s.proxyGroupLatencyTestingMap, [groupName]: true },
          }));
          try {
            const results = await proxyGroupLatencyTestAPI(
              groupName,
              finalTestUrl,
              group?.timeout ?? cfg.latencyTestTimeoutDuration,
            );
            await get().fetchProxies();
            recordLatencyTestResults(results, finalTestUrl);
            rec.recordBatchResults(results);
          } catch {
            const failed = cfg.latencyQualityMap().NOT_CONNECTED;
            const failedResults: Record<string, number> = {};
            for (const m of members) {
              const resolved = getNowProxyNodeNameCore(m);
              if (!resolved) continue;
              failedResults[resolved] = failed;
              appendHistoryEntry(resolved, finalTestUrl, failed);
            }
            rec.recordBatchResults(failedResults);
          } finally {
            set((s) => ({
              proxyGroupLatencyTestingMap: { ...s.proxyGroupLatencyTestingMap, [groupName]: false },
            }));
          }
        },

        updateProviderByProviderName: async (name) => {
          set((s) => ({ updatingMap: { ...s.updatingMap, [name]: true } }));
          try {
            await updateProxyProviderAPI(name);
          } finally {
            try {
              await get().fetchProxies();
            } finally {
              set((s) => ({ updatingMap: { ...s.updatingMap, [name]: false } }));
            }
          }
        },

        updateAllProvider: async () => {
          set({ isAllProviderUpdating: true });
          try {
            await Promise.allSettled(
              get().proxyProviders.map((p) => updateProxyProviderAPI(p.name)),
            );
            await get().fetchProxies();
          } finally {
            set({ isAllProviderUpdating: false });
          }
        },

        proxyProviderLatencyTest: async (providerName) => {
          const cfg = useConfigStore.getState();
          const rec = useNodeRecommendationStore.getState();
          const provider = get().proxyProviders.find((p) => p.name === providerName);
          const finalTestUrl = cfg.resolveLatencyTestUrl(provider?.testUrl);
          const timeout = provider?.timeout ?? cfg.latencyTestTimeoutDuration;
          const members = provider?.proxies.map((p) => p.name) ?? [];
          set((s) => ({
            proxyProviderLatencyTestingMap: {
              ...s.proxyProviderLatencyTestingMap,
              [providerName]: true,
            },
          }));
          try {
            for (let i = 0; i < members.length; i += 10) {
              const batch = members.slice(i, i + 10);
              await Promise.all(
                batch.map(async (memberName) => {
                  const nodeName = getNowProxyNodeNameCore(memberName);
                  try {
                    const { delay } = await proxyLatencyTestAPI(
                      nodeName,
                      providerName,
                      finalTestUrl,
                      timeout,
                    );
                    recordLatencyTestResult(nodeName, finalTestUrl, delay);
                    appendHistoryEntry(nodeName, finalTestUrl, delay);
                    rec.recordTestResult(nodeName, delay > 0 ? delay : null, delay > 0);
                  } catch {
                    const nc = cfg.latencyQualityMap().NOT_CONNECTED;
                    appendHistoryEntry(nodeName, finalTestUrl, nc);
                    rec.recordTestResult(nodeName, null, false);
                  }
                }),
              );
            }
            try {
              await get().fetchProxies();
            } catch {
              /* ignore */
            }
          } finally {
            set((s) => ({
              proxyProviderLatencyTestingMap: {
                ...s.proxyProviderLatencyTestingMap,
                [providerName]: false,
              },
            }));
          }
        },

        closeAllConnections: async () => {
          if (!useConfigStore.getState().autoCloseConns) return;
          await closeAllConnectionsAPI();
        },
      };
    },
    {
      name: "proxies-storage",
      partialize: (s) => ({ collapsedMap: s.collapsedMap }),
    },
  ),
);
