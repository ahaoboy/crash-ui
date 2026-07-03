import type { Connection } from "@/types";
import { formatBytes } from "./format";

export interface ConnectionCellPair {
  primary: string;
  aux: string | null;
  primaryTitle?: string;
  auxTitle?: string;
}

export function hostProcessCell(c: Connection): ConnectionCellPair {
  return {
    primary: c.metadata.host || c.metadata.destinationIP || c.metadata.sniffHost || "—",
    aux: c.metadata.process || null,
    primaryTitle: c.metadata.host,
    auxTitle: c.metadata.processPath,
  };
}

export function ruleChainsCell(c: Connection): ConnectionCellPair {
  return {
    primary: c.rule ? `${c.rule}${c.rulePayload ? `(${c.rulePayload})` : ""}` : "—",
    aux: c.chains.length ? c.chains.join(" → ") : null,
  };
}

export function trafficCell(c: Connection): ConnectionCellPair {
  return {
    primary: `${formatBytes(c.downloadSpeed)}/s ↓  ${formatBytes(c.uploadSpeed)}/s ↑`,
    aux: `${formatBytes(c.download)} / ${formatBytes(c.upload)}`,
  };
}

export function flowCell(c: Connection): ConnectionCellPair {
  return {
    primary: c.metadata.network.toUpperCase(),
    aux: `${c.metadata.sourceIP}:${c.metadata.sourcePort} → ${
      c.metadata.host || c.metadata.destinationIP
    }:${c.metadata.destinationPort}`,
  };
}

export function connectTimeCell(c: Connection): ConnectionCellPair {
  const start = new Date(c.start).getTime();
  const ago = Date.now() - start;
  return {
    primary: `${Math.floor(ago / 1000)}s`,
    aux: new Date(c.start).toLocaleTimeString(),
  };
}
