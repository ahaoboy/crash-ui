import type { Proxy, Rule } from "@/types";
import {
  PROXIES_ORDERING_TYPE,
  RULES_ORDERING_TYPE,
  LATENCY_QUALITY_MAP_HTTP,
  LATENCY_QUALITY_MAP_HTTPS,
} from "@/constants";
import { calculateNodeScore } from "./nodeScoring";
import type { NodePerformanceData } from "@/stores/nodeRecommendation";

export interface LatencyQualityMap {
  NOT_CONNECTED: number;
  MEDIUM: number;
  HIGH: number;
}

export type LatencyBand = "good" | "medium" | "slow" | "not-connected";

export const DEFAULT_LATENCY_QUALITY_HTTP: LatencyQualityMap = {
  NOT_CONNECTED: LATENCY_QUALITY_MAP_HTTP.NOT_CONNECTED,
  MEDIUM: LATENCY_QUALITY_MAP_HTTP.MEDIUM,
  HIGH: LATENCY_QUALITY_MAP_HTTP.HIGH,
};

export const DEFAULT_LATENCY_QUALITY_HTTPS: LatencyQualityMap = {
  NOT_CONNECTED: LATENCY_QUALITY_MAP_HTTPS.NOT_CONNECTED,
  MEDIUM: LATENCY_QUALITY_MAP_HTTPS.MEDIUM,
  HIGH: LATENCY_QUALITY_MAP_HTTPS.HIGH,
};

export function classifyLatency(latency: number, m: LatencyQualityMap): LatencyBand {
  if (latency > m.HIGH) return "slow";
  if (latency > m.MEDIUM) return "medium";
  if (latency === m.NOT_CONNECTED) return "not-connected";
  return "good";
}

export function formatProxyType(type = "", t: (k: string) => string): string {
  const lt = type.toLowerCase();
  const map: Record<string, string> = {
    shadowsocks: "SS",
    shadowsocksr: "SSR",
    hysteria: "HY",
    hysteria2: "HY2",
    wireguard: "WG",
    selector: t("selector"),
    urltest: t("urltest"),
    smart: t("smart"),
    fallback: t("fallback"),
    loadbalance: t("loadbalance"),
    direct: t("direct"),
    reject: t("reject"),
    rejectdrop: t("rejectdrop"),
    relay: t("relay"),
    pass: t("pass"),
  };
  return map[lt] ?? lt;
}

export function filterSpecialProxyType(type = ""): boolean {
  const skip = ["selector", "direct", "reject", "urltest", "loadbalance", "fallback", "relay"];
  return !skip.includes(type.toLowerCase());
}

export function sortProxiesByOrderingType(args: {
  proxyNames: string[];
  orderingType: PROXIES_ORDERING_TYPE;
  testUrl: string | null;
  getLatencyByName: (name: string, testUrl: string | null) => number;
  isProxyGroup?: (name: string) => boolean;
  latencyQualityMap: LatencyQualityMap;
  urlForLatencyTest: string;
  performanceData?: Map<string, NodePerformanceData>;
}): string[] {
  const {
    proxyNames,
    orderingType,
    testUrl,
    getLatencyByName,
    isProxyGroup,
    latencyQualityMap,
    urlForLatencyTest,
    performanceData,
  } = args;
  if (orderingType === PROXIES_ORDERING_TYPE.NATURAL) return proxyNames;
  const finalTestUrl = testUrl || urlForLatencyTest;
  return [...proxyNames].sort((a, b) => {
    const prevLatency = getLatencyByName(a, finalTestUrl);
    const nextLatency = getLatencyByName(b, finalTestUrl);
    const prevIsGroup = isProxyGroup?.(a) ?? false;
    const nextIsGroup = isProxyGroup?.(b) ?? false;
    const groupPriority = Number(nextIsGroup) - Number(prevIsGroup);
    if (groupPriority !== 0) return groupPriority;
    switch (orderingType) {
      case PROXIES_ORDERING_TYPE.LATENCY_ASC:
      case PROXIES_ORDERING_TYPE.LATENCY_DESC: {
        if (prevLatency === latencyQualityMap.NOT_CONNECTED) return 1;
        if (nextLatency === latencyQualityMap.NOT_CONNECTED) return -1;
        return orderingType === PROXIES_ORDERING_TYPE.LATENCY_ASC
          ? prevLatency - nextLatency
          : nextLatency - prevLatency;
      }
      case PROXIES_ORDERING_TYPE.NAME_ASC:
        return a.localeCompare(b);
      case PROXIES_ORDERING_TYPE.NAME_DESC:
        return b.localeCompare(a);
      case PROXIES_ORDERING_TYPE.QUALITY_ASC:
      case PROXIES_ORDERING_TYPE.QUALITY_DESC: {
        if (prevLatency === latencyQualityMap.NOT_CONNECTED) return 1;
        if (nextLatency === latencyQualityMap.NOT_CONNECTED) return -1;
        const ps = performanceData?.get(a) ? calculateNodeScore(performanceData.get(a)!) : 0;
        const ns = performanceData?.get(b) ? calculateNodeScore(performanceData.get(b)!) : 0;
        if (ps === 0 && ns > 0) return 1;
        if (ns === 0 && ps > 0) return -1;
        return orderingType === PROXIES_ORDERING_TYPE.QUALITY_ASC ? ps - ns : ns - ps;
      }
      default:
        return 0;
    }
  });
}

export function filterProxiesByName(proxyNames: string[], keyword: string): string[] {
  const trimmed = keyword.trim().toLowerCase();
  if (!trimmed) return proxyNames;
  return proxyNames.filter((n) => n.toLowerCase().includes(trimmed));
}

// ---------------- Rule helpers ----------------

export interface RuleFacet {
  value: string;
  count: number;
}

export function getRuleFacets(rules: Rule[], key: "type" | "proxy"): RuleFacet[] {
  const counts = new Map<string, number>();
  for (const r of rules) {
    const v = r[key];
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

export function filterRules(
  rules: Rule[],
  {
    types,
    policies,
    status,
  }: {
    types: string[];
    policies: string[];
    status: "all" | "enabled" | "disabled";
  },
): Rule[] {
  if (types.length === 0 && policies.length === 0 && status === "all") return rules;
  const typeSet = new Set(types);
  const policySet = new Set(policies);
  return rules.filter((r) => {
    if (typeSet.size > 0 && !typeSet.has(r.type)) return false;
    if (policySet.size > 0 && !policySet.has(r.proxy)) return false;
    if (status !== "all") {
      const isDisabled = r.extra?.disabled === true;
      if (status === "enabled" && isDisabled) return false;
      if (status === "disabled" && !isDisabled) return false;
    }
    return true;
  });
}

export function sortRulesByOrderingType(rules: Rule[], t: RULES_ORDERING_TYPE): Rule[] {
  if (t === RULES_ORDERING_TYPE.NATURAL) return rules;
  const byIndex = (a: Rule, b: Rule) => a.index - b.index;
  const nameKey = (r: Rule) => r.payload || r.type;
  return [...rules].sort((a, b) => {
    switch (t) {
      case RULES_ORDERING_TYPE.TYPE_ASC:
        return a.type.localeCompare(b.type) || byIndex(a, b);
      case RULES_ORDERING_TYPE.TYPE_DESC:
        return b.type.localeCompare(a.type) || byIndex(a, b);
      case RULES_ORDERING_TYPE.NAME_ASC:
        return nameKey(a).localeCompare(nameKey(b)) || byIndex(a, b);
      case RULES_ORDERING_TYPE.NAME_DESC:
        return nameKey(b).localeCompare(nameKey(a)) || byIndex(a, b);
      case RULES_ORDERING_TYPE.HIT_COUNT_DESC:
        return (b.extra?.hitCount ?? 0) - (a.extra?.hitCount ?? 0) || byIndex(a, b);
      case RULES_ORDERING_TYPE.HIT_COUNT_ASC:
        return (a.extra?.hitCount ?? 0) - (b.extra?.hitCount ?? 0) || byIndex(a, b);
      case RULES_ORDERING_TYPE.HIT_AT_DESC: {
        const at = a.extra?.hitAt;
        const bt = b.extra?.hitAt;
        if (!at && !bt) return byIndex(a, b);
        if (!at) return 1;
        if (!bt) return -1;
        return new Date(bt).getTime() - new Date(at).getTime() || byIndex(a, b);
      }
      default:
        return 0;
    }
  });
}

export function resolveActiveGroup(groupNames: string[], current: string | null): string | null {
  if (current && groupNames.includes(current)) return current;
  return groupNames[0] ?? null;
}

// Faster getLatencyFromProxy (unused by stores but kept for parity / tests).
export function getLatencyFromProxy(
  proxy: Pick<Proxy, "extra" | "history" | "testUrl">,
  defaultMap: LatencyQualityMap,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [testUrl, data] of Object.entries(proxy.extra || {})) {
    result[testUrl] = data?.history?.at(-1)?.delay ?? defaultMap.NOT_CONNECTED;
  }
  if (proxy.history?.length) {
    const defaultUrl = proxy.testUrl || "default";
    if (!(defaultUrl in result))
      result[defaultUrl] = proxy.history.at(-1)?.delay ?? defaultMap.NOT_CONNECTED;
  }
  return result;
}
