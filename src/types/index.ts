import type {
  CONNECTIONS_TABLE_ACCESSOR_KEY,
  LOG_LEVEL,
  PROXIES_CARD_SIZE,
  PROXIES_DISPLAY_MODE,
  PROXIES_ORDERING_TYPE,
  PROXIES_PREVIEW_TYPE,
  RULES_ORDERING_TYPE,
  TAILWINDCSS_SIZE,
} from "@/constants";

export interface Proxy {
  name: string;
  type: string;
  all?: string[];
  icon?: string;
  extra: Record<string, { history?: { time: string; delay: number }[] }>;
  history: { time: string; delay: number }[];
  hidden: boolean;
  udp: boolean;
  xudp: boolean;
  tfo: boolean;
  now: string;
  fixed?: string;
  testUrl?: string;
  timeout?: number;
}

export interface ProxyNode {
  alive: boolean;
  type: string;
  name: string;
  tfo: boolean;
  udp: boolean;
  xudp: boolean;
  now: string;
  id: string;
  extra: Record<string, unknown>;
  history: { time: string; delay: number }[];
}

export interface SubscriptionInfo {
  Download?: number;
  Upload?: number;
  Total?: number;
  Expire?: number;
}

export interface ProxyProvider {
  subscriptionInfo?: SubscriptionInfo;
  name: string;
  proxies: ProxyNode[];
  testUrl: string;
  timeout?: number;
  updatedAt: string;
  vehicleType: string;
}

export interface RuleExtra {
  disabled?: boolean;
  hitCount?: number;
  hitAt?: string;
  missCount?: number;
  missAt?: string;
}

export interface Rule {
  index: number;
  type: string;
  payload: string;
  proxy: string;
  size: number;
  extra?: RuleExtra;
}

export interface RuleProvider {
  behavior: string;
  format: string;
  name: string;
  ruleCount: number;
  type: string;
  updatedAt: string;
  vehicleType: string;
}

export interface ConnectionRawMessage {
  id: string;
  download: number;
  upload: number;
  chains: string[];
  rule: string;
  rulePayload: string;
  start: string;
  metadata: {
    network: string;
    type: string;
    destinationIP: string;
    destinationPort: string;
    dnsMode: string;
    host: string;
    inboundIP: string;
    inboundName: string;
    inboundPort: string;
    inboundUser: string;
    process: string;
    processPath: string;
    remoteDestination: string;
    sniffHost: string;
    sourceIP: string;
    sourcePort: string;
    specialProxy: string;
    specialRules: string;
    uid: number;
  };
}

export type Connection = ConnectionRawMessage & {
  downloadSpeed: number;
  uploadSpeed: number;
};

export interface Log {
  type: LOG_LEVEL;
  payload: string;
}

export type LogWithSeq = Log & { seq: number };

export interface Config {
  mode: string;
  "mode-list"?: string[];
  modes?: string[];
  port: number;
  "socks-port": number;
  "redir-port": number;
  "tproxy-port": number;
  "mixed-port": number;
  tun: {
    enable: boolean;
    device: string;
    stack: string;
    "dns-hijack": null;
    "auto-route": boolean;
    "auto-detect-interface": boolean;
    "file-descriptor": number;
  };
  dns?: {
    enable: boolean;
    "enhanced-mode": string;
    nameserver: string[];
    fallback: string[];
    "fake-ip-range": string;
    "use-hosts": boolean;
  };
  "tuic-server": {
    enable: boolean;
    listen: string;
    certificate: string;
    "private-key": string;
  };
  "ss-config": string;
  "vmess-config": string;
  authentication: null;
  "allow-lan": boolean;
  "bind-address": string;
  "inbound-tfo": boolean;
  "unified-delay"?: boolean;
  UnifiedDelay?: boolean;
  "log-level": string;
  ipv6: boolean;
  "interface-name": string;
  "geodata-mode": boolean;
  "geodata-loader": string;
  "tcp-concurrent": boolean;
  "find-process-mode": string;
  sniffing: boolean;
  "global-client-fingerprint": boolean;
}

export interface BackendVersion {
  meta: boolean;
  version: string;
}

export type ConnectionsTableColumnVisibility = Partial<
  Record<CONNECTIONS_TABLE_ACCESSOR_KEY, boolean>
>;
export type ConnectionsTableColumnOrder = CONNECTIONS_TABLE_ACCESSOR_KEY[];

export type DataUsageType = "sourceIP" | "host" | "process" | "outbound" | "inboundUser";

export interface DataUsageEntry {
  type: DataUsageType;
  label: string;
  upload: number;
  download: number;
  total: number;
  firstSeen: number;
  lastSeen: number;
}

export interface TrafficData {
  up: number;
  down: number;
}

export interface MemoryData {
  inuse: number;
}

export type WsMsg = {
  connections?: ConnectionRawMessage[];
  uploadTotal: number;
  downloadTotal: number;
} | null;

export type ChartDataPoint = [number, number];

export interface Endpoint {
  id: string;
  url: string;
  secret: string;
  label?: string;
}

export type ProxyWithProvider = Proxy & { provider?: string };
export type ProxyNodeWithProvider = ProxyNode & { provider?: string };

export interface ReleaseInfo {
  version: string;
  changelog: string;
  publishedAt: string;
  isCurrent: boolean;
}

// Helpful re-export of the option enums so callers can `import { LogLevel } from '@/types'`.
export type {
  CONNECTIONS_TABLE_ACCESSOR_KEY,
  LOG_LEVEL,
  PROXIES_CARD_SIZE,
  PROXIES_DISPLAY_MODE,
  PROXIES_ORDERING_TYPE,
  PROXIES_PREVIEW_TYPE,
  RULES_ORDERING_TYPE,
  TAILWINDCSS_SIZE,
};
