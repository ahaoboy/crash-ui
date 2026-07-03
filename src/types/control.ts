export type KernelStatus = "stopped" | "starting" | "running" | "stopping" | "errored";

export interface KernelState {
  status: KernelStatus;
  pid?: number;
  startedAt?: number;
  version?: string;
  externalController: string;
  secret: string;
  lastExitCode?: number | null;
  lastError?: string;
}

export type ProfileType = "local" | "remote" | "merge" | "script";

export interface ProfileSubscriptionInfo {
  upload: number;
  download: number;
  total: number;
  expire: number;
}

export interface ProfileMeta {
  id: string;
  name: string;
  type: ProfileType;
  enabled?: boolean;
  url?: string;
  userAgent?: string;
  updatedAt: number;
  subscriptionInfo?: ProfileSubscriptionInfo;
}

export type ControlFeature =
  | "profiles"
  | "logs-sse"
  | "kernel-control"
  | "system-proxy"
  | "kernel-version"
  | "geo-assets"
  | "webdav-backup"
  | "runtime-config"
  | "config-sections"
  | "tun";

export interface ControlInfo {
  hasAgent: boolean;
  version: string;
  platform: { os: string; arch: string };
  kernel: { bundled: boolean; path: string; version?: string };
  features: ControlFeature[];
}

export type ControlLogEvent =
  | { type: "log"; stream: "stdout" | "stderr"; line: string; ts: number }
  | ({ type: "state" } & KernelState);

export interface ProfileDetail {
  meta: ProfileMeta;
  content: string;
}

export interface ValidateResult {
  valid: boolean;
  message: string;
}

export interface SystemProxyState {
  enabled: boolean;
  port: number;
  bypass: string[];
}

export interface KernelVersions {
  versions: string[];
  current?: string;
  bundled: string;
}

export interface GeoUpdateResult {
  ok: boolean;
  files: string[];
}

export interface WebdavCredentials {
  url: string;
  username: string;
  password: string;
  dir?: string;
}

export interface WebdavBackupResult {
  ok: boolean;
  path: string;
}

export interface WebdavRestoreResult {
  ok: boolean;
  restored: number;
  uiSettings?: unknown;
}

export interface TunStatus {
  enabled: boolean;
  mode: "sidecar" | "tun";
  stack?: string;
}
