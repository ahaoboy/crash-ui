import type {
  Config,
  BackendVersion,
  Proxy,
  ProxyProvider,
  Rule,
  RuleProvider,
  ConnectionRawMessage,
  Log,
} from "@/types";
import { LOG_LEVEL } from "@/constants";

export const mockVersion: BackendVersion = { meta: true, version: "v1.18.0" };

export const mockConfig: Config = {
  port: 7890,
  "socks-port": 7891,
  "redir-port": 0,
  "tproxy-port": 0,
  "mixed-port": 7893,
  mode: "rule",
  "mode-list": ["rule", "direct", "global"],
  "log-level": "info",
  "allow-lan": false,
  "unified-delay": false,
  ipv6: false,
  tun: {
    enable: false,
    device: "utun",
    stack: "system",
    "dns-hijack": null,
    "auto-route": true,
    "auto-detect-interface": true,
    "file-descriptor": 0,
  },
} as unknown as Config;

function meta(host: string, ip: string, process = "", inboundUser = "") {
  return {
    network: "tcp",
    type: "HTTP Connect",
    destinationIP: ip,
    destinationPort: "443",
    dnsMode: "normal",
    host,
    inboundIP: "127.0.0.1",
    inboundName: "mixed-in",
    inboundPort: "7893",
    inboundUser,
    process,
    processPath: process ? `/Applications/${process}.app` : "",
    remoteDestination: "",
    sniffHost: host,
    sourceIP: "192.168.1.100",
    sourcePort: "52341",
    specialProxy: "",
    specialRules: "",
    uid: 501,
  };
}

function proxy(name: string, type: string, delay?: number, all?: string[], now?: string): Proxy {
  return {
    name,
    type,
    all: all ?? [],
    history: delay ? [{ delay, time: new Date().toISOString() }] : [],
    udp: true,
    xudp: type === "Hysteria2" || type === "VLESS",
    tfo: false,
    extra: {},
    hidden: false,
    now: now ?? "",
  };
}

export const mockProxies: Record<string, Proxy> = {
  DIRECT: proxy("DIRECT", "Direct"),
  REJECT: proxy("REJECT", "Reject"),
  "Hong Kong": proxy("Hong Kong", "Shadowsocks", 85),
  Japan: proxy("Japan", "Vmess", 120),
  Singapore: proxy("Singapore", "Trojan", 65),
  "United States": proxy("United States", "Hysteria2", 180),
  Taiwan: proxy("Taiwan", "VLESS", 95),
  "Auto Select": proxy(
    "Auto Select",
    "URLTest",
    undefined,
    ["Hong Kong", "Japan", "Singapore", "United States", "Taiwan"],
    "Singapore",
  ),
  Proxy: proxy(
    "Proxy",
    "Selector",
    undefined,
    ["Auto Select", "Hong Kong", "Japan", "Singapore", "United States", "Taiwan", "DIRECT"],
    "Auto Select",
  ),
  Streaming: proxy(
    "Streaming",
    "Selector",
    undefined,
    ["Proxy", "Hong Kong", "Japan", "Singapore", "Taiwan", "DIRECT"],
    "Japan",
  ),
  "AI Services": proxy(
    "AI Services",
    "Selector",
    undefined,
    ["Proxy", "United States", "Japan", "Singapore"],
    "United States",
  ),
};

export const mockProxyProviders: Record<string, ProxyProvider> = {
  "Provider A": {
    name: "Provider A",
    testUrl: "https://www.gstatic.com/generate_204",
    vehicleType: "HTTP",
    updatedAt: new Date().toISOString(),
    proxies: [],
  },
};

const mockRules: Rule[] = [
  { index: 0, type: "DOMAIN-SUFFIX", payload: "google.com", proxy: "Proxy", size: 156 },
  { index: 1, type: "DOMAIN-SUFFIX", payload: "github.com", proxy: "Proxy", size: 178 },
  { index: 2, type: "DOMAIN-SUFFIX", payload: "openai.com", proxy: "AI Services", size: 67 },
  { index: 3, type: "DOMAIN-SUFFIX", payload: "youtube.com", proxy: "Streaming", size: 789 },
  { index: 4, type: "GEOIP", payload: "CN", proxy: "DIRECT", size: 8945 },
  { index: 5, type: "MATCH", payload: "", proxy: "Proxy", size: 1 },
];

export const mockRuleProviders: Record<string, RuleProvider> = {
  reject: {
    name: "reject",
    type: "Rule",
    behavior: "domain",
    ruleCount: 1234,
    updatedAt: new Date().toISOString(),
    vehicleType: "HTTP",
    format: "yaml",
  },
};

export function mockConnections(): ConnectionRawMessage[] {
  return [
    "www.google.com|142.250.185.14|Proxy|DOMAIN-SUFFIX|google.com",
    "github.com|140.82.121.4|Proxy|DOMAIN-SUFFIX|github.com",
    "api.openai.com|104.18.12.191|AI Services|DOMAIN-SUFFIX|openai.com",
    "www.youtube.com|172.217.14.110|Streaming|DOMAIN-SUFFIX|youtube.com",
    "www.baidu.com|110.242.68.66|DIRECT|GEOIP|CN",
  ].map((line, i) => {
    const [host, ip, proxyName, rule, rulePayload] = line.split("|");
    return {
      id: `conn-${i + 1}`,
      download: Math.floor(Math.random() * 1024 * 1024 * 10),
      upload: Math.floor(Math.random() * 1024 * 1024),
      downloadSpeed: Math.floor(Math.random() * 1024 * 500),
      uploadSpeed: Math.floor(Math.random() * 1024 * 100),
      chains: [proxyName!, "Singapore"],
      rule: rule!,
      rulePayload: rulePayload!,
      start: new Date(Date.now() - Math.floor(Math.random() * 600000)).toISOString(),
      metadata: meta(host!, ip!, "Chrome"),
    } as ConnectionRawMessage;
  });
}

const mockLogs: Log[] = [
  { type: LOG_LEVEL.Info, payload: "[DNS] resolve www.google.com to 142.250.185.14" },
  { type: LOG_LEVEL.Info, payload: "[TCP] 192.168.1.100:52341 --> www.google.com:443 using Proxy" },
  { type: LOG_LEVEL.Debug, payload: "[Proxy] Singapore latency: 65ms" },
];

export const mockTrafficStats = { up: 125_000_000, down: 850_000_000 };
export const mockMemory = { inuse: 45 * 1024 * 1024 };

const providers = { providers: mockProxyProviders };

let mockIdx = 0;

export function mockDataResolver(url: string): unknown {
  const path = url.startsWith("/") ? url.slice(1) : url;
  if (path === "version") return mockVersion;
  if (path === "configs") return mockConfig;
  if (path === "proxies") return { proxies: mockProxies };
  if (path === "providers/proxies") return providers;
  if (path === "rules") {
    return { rules: Object.fromEntries(mockRules.map((r) => [String(r.index), r])) };
  }
  if (path === "providers/rules") return { providers: mockRuleProviders };
  if (path === "rules/disable") return {};
  if (path === "connections") {
    return {
      connections: mockConnections(),
      downloadTotal: mockTrafficStats.down,
      uploadTotal: mockTrafficStats.up,
    };
  }
  if (path.startsWith("proxies/") && path.endsWith("/delay")) {
    return { delay: 50 + Math.floor(Math.random() * 250) };
  }
  if (path.startsWith("group/") && path.endsWith("/delay")) {
    return { "Hong Kong": 85, Japan: 120, Singapore: 65 + (mockIdx++ % 30) };
  }
  if (path.startsWith("providers/proxies/") && path.endsWith("/healthcheck")) {
    return { delay: 80 };
  }
  if (path.startsWith("proxies/")) return {};
  if (path.startsWith("providers/proxies/")) return {};
  return {};
}

export const mockLogsList = mockLogs;
