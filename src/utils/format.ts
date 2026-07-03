// Version + time + formatting helpers. Decoupled from Vue — typed pure TS.

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import duration from "dayjs/plugin/duration";
import byteSize from "byte-size";

dayjs.extend(relativeTime);
dayjs.extend(duration);

const VERSION_PREFIX_RE = /^v/;
const VERSION_BUILDMETA_RE = /\+.*$/;
const PRERELEASE_NUMERIC_RE = /^\d+$/;

function comparePrerelease(a: string, b: string): number {
  const aIds = a.split(".");
  const bIds = b.split(".");
  const len = Math.max(aIds.length, bIds.length);
  for (let i = 0; i < len; i++) {
    const aId = aIds[i];
    const bId = bIds[i];
    if (aId === undefined) return -1;
    if (bId === undefined) return 1;
    const aIsNum = PRERELEASE_NUMERIC_RE.test(aId);
    const bIsNum = PRERELEASE_NUMERIC_RE.test(bId);
    if (aIsNum && bIsNum) {
      const diff = Number(aId) - Number(bId);
      if (diff !== 0) return diff > 0 ? 1 : -1;
    } else if (aIsNum !== bIsNum) {
      return aIsNum ? -1 : 1;
    } else {
      const cmp = aId.localeCompare(bId);
      if (cmp !== 0) return cmp > 0 ? 1 : -1;
    }
  }
  return 0;
}

export function compareVersions(v1: string, v2: string): number {
  const parse = (v: string) => {
    const cleaned = v.replace(VERSION_PREFIX_RE, "").replace(VERSION_BUILDMETA_RE, "");
    const dashIndex = cleaned.indexOf("-");
    const main = dashIndex === -1 ? cleaned : cleaned.slice(0, dashIndex);
    const prerelease = dashIndex === -1 ? null : cleaned.slice(dashIndex + 1);
    return { parts: main.split(".").map((n) => Number.parseInt(n, 10) || 0), prerelease };
  };
  const a = parse(v1);
  const b = parse(v2);
  const len = Math.max(a.parts.length, b.parts.length);
  for (let i = 0; i < len; i++) {
    const p1 = a.parts[i] || 0;
    const p2 = b.parts[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  if (!a.prerelease && b.prerelease) return 1;
  if (a.prerelease && !b.prerelease) return -1;
  if (a.prerelease && b.prerelease) return comparePrerelease(a.prerelease, b.prerelease);
  return 0;
}

export function isSingBoxVersion(version: string | undefined | null): boolean {
  return !!version && version.toLowerCase().includes("sing-box");
}

export function formatBytes(bytes: number): string {
  return byteSize(bytes).toString();
}

// URL helpers
const URL_PROTOCOL_RE = /^https?:\/\//;

export function transformEndpointURL(url: string): string {
  return URL_PROTOCOL_RE.test(url)
    ? url
    : `${typeof window !== "undefined" ? window.location.protocol : "http:"}//${url}`;
}

// crypto.randomUUID is unavailable over plain-HTTP LAN; build a v4 from
// getRandomValues() as a fallback.
export function randomUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const IPV6_RE = /:.*:/;
const IPV4_RE = /\./;

export function formatIPv6(ip: string): string {
  return IPV6_RE.test(ip) && !IPV4_RE.test(ip) ? `[${ip}]` : ip;
}

export function formatTimeFromNow(time: number | string, locale = "en"): string {
  const dayjsLocale = locale === "zh" ? "zh-cn" : locale === "ru" ? "ru" : "en";
  return dayjs(time).locale(dayjsLocale).fromNow();
}

export function formatDuration(startTime: number, endTime: number): string {
  const diff = Math.max(0, endTime - startTime);
  const d = dayjs.duration(diff);
  const days = Math.floor(d.asDays());
  const hours = d.hours();
  const minutes = d.minutes();
  const seconds = d.seconds();
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 && days === 0) parts.push(`${seconds}s`);
  return parts.length > 0 ? parts.join(" ") : "0s";
}

export function formatDateRange(startTime: number, endTime: number, locale = "en"): string {
  const dayjsLocale = locale === "zh" ? "zh-cn" : locale === "ru" ? "ru" : "en";
  const start = dayjs(startTime);
  const end = dayjs(endTime);
  if (start.isSame(end, "day")) {
    return `${start.locale(dayjsLocale).format("MMM D, YYYY HH:mm")} - ${end.locale(dayjsLocale).format("HH:mm")}`;
  }
  return `${start.locale(dayjsLocale).format("MMM D, HH:mm")} - ${end.locale(dayjsLocale).format("MMM D, HH:mm")}`;
}
