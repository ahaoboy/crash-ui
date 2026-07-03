export interface IPSBResponse {
  ip: string;
  country?: string;
  city?: string;
  asn?: number;
  asn_organization?: string;
}

export interface IPInfo {
  ip: string;
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
  asn?: number;
  org?: string;
  isp?: string;
  isProxy?: boolean;
  isVPN?: boolean;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export type IPProvider = "ip.sb" | "ipwho.is" | "ipapi.is";

export interface LatencyResult {
  url: string;
  latency: number | null;
  status: "success" | "error" | "pending";
  timestamp: number;
}

export interface TopologyNode {
  id: string;
  name: string;
  type: "client" | "proxy" | "rule" | "destination";
  x?: number;
  y?: number;
}

export interface TopologyEdge {
  source: string;
  target: string;
  traffic?: number;
  connections?: number;
}
