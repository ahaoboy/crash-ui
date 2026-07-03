import ky from "ky";
import type {
  ControlInfo,
  GeoUpdateResult,
  KernelState,
  KernelVersions,
  ProfileDetail,
  ProfileMeta,
  SystemProxyState,
  TunStatus,
  ValidateResult,
  WebdavBackupResult,
  WebdavCredentials,
  WebdavRestoreResult,
} from "@/types/control";
import { getDesktopBridge, getRuntimeConfig } from "@/config/global";
import { debug, logError } from "@/utils/debug";

export interface ControlConfig {
  base: string;
  token?: string;
}

export function resolveControlConfig(): ControlConfig {
  const bridge = getDesktopBridge().control;
  if (bridge?.base) {
    return { base: stripTrailingSlash(bridge.base), token: bridge.token };
  }
  const origin =
    typeof window !== "undefined" && window.location?.origin ? window.location.origin : "";
  const token = getRuntimeConfig().controlToken || undefined;
  return { base: `${stripTrailingSlash(origin)}/api/control`, token };
}

function stripTrailingSlash(s: string): string {
  return s.replace(/\/$/, "");
}

export interface ControlApi {
  getInfo: () => Promise<ControlInfo>;
  getKernelStatus: () => Promise<KernelState>;
  startKernel: () => Promise<KernelState>;
  stopKernel: () => Promise<KernelState>;
  restartKernel: () => Promise<KernelState>;
  logsUrl: () => string;
  listProfiles: () => Promise<ProfileMeta[]>;
  createProfile: (body: {
    name: string;
    content?: string;
    type?: "local" | "merge" | "script";
  }) => Promise<ProfileMeta>;
  getProfile: (id: string) => Promise<ProfileDetail>;
  updateProfile: (
    id: string,
    body: { name?: string; content?: string; enabled?: boolean },
  ) => Promise<ProfileMeta>;
  deleteProfile: (id: string) => Promise<void>;
  importProfile: (url: string, name?: string) => Promise<ProfileMeta>;
  activateProfile: (id: string) => Promise<KernelState>;
  refreshProfile: (id: string) => Promise<ProfileMeta>;
  validateProfile: (id: string) => Promise<ValidateResult>;
  getSysProxy: () => Promise<SystemProxyState>;
  setSysProxy: (body: { enabled: boolean; bypass?: string[] }) => Promise<SystemProxyState>;
  getKernelVersions: () => Promise<KernelVersions>;
  switchKernel: (version: string) => Promise<{ ok: true }>;
  updateGeoAssets: () => Promise<GeoUpdateResult>;
  getRuntimeConfig: () => Promise<string>;
  getConfigSection: <T = unknown>(key: string) => Promise<T>;
  setConfigSection: (body: {
    key: string;
    value: unknown;
    restart?: boolean;
  }) => Promise<KernelState>;
  webdavBackup: (body: {
    webdav: WebdavCredentials;
    uiSettings?: unknown;
  }) => Promise<WebdavBackupResult>;
  webdavRestore: (body: { webdav: WebdavCredentials }) => Promise<WebdavRestoreResult>;
  getTun: () => Promise<TunStatus>;
  setTun: (body: { enabled: boolean; stack?: string }) => Promise<TunStatus>;
  uninstallTun: () => Promise<TunStatus>;
}

let cachedApi: ControlApi | null = null;

export function getControlApi(): ControlApi {
  if (cachedApi) return cachedApi;
  const { base, token } = resolveControlConfig();
  debug.ctrl.log(`getControlApi: base=${base}, hasToken=${!!token}`);
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const client = ky.create({ prefix: base, headers, timeout: 15000 });
  cachedApi = {
    getInfo: () => client.get("info").json<ControlInfo>(),
    getKernelStatus: () =>
      client
        .get("kernel/status")
        .json<KernelState>()
        .then((r) => {
          debug.ctrl.log(`getKernelStatus: status=${r.status}`);
          return r;
        }),
    startKernel: () =>
      client
        .post("kernel/start")
        .json<KernelState>()
        .then((r) => {
          debug.ctrl.log(`startKernel: result status=${r.status}`);
          return r;
        })
        .catch((err) => {
          logError("ctrl", "startKernel failed", err);
          throw err;
        }),
    stopKernel: () =>
      client
        .post("kernel/stop")
        .json<KernelState>()
        .then((r) => {
          debug.ctrl.log(`stopKernel: result status=${r.status}`);
          return r;
        })
        .catch((err) => {
          logError("ctrl", "stopKernel failed", err);
          throw err;
        }),
    restartKernel: () =>
      client
        .post("kernel/restart")
        .json<KernelState>()
        .then((r) => {
          debug.ctrl.log(`restartKernel: result status=${r.status}`);
          return r;
        })
        .catch((err) => {
          logError("ctrl", "restartKernel failed", err);
          throw err;
        }),
    logsUrl: () => (token ? `${base}/kernel/logs?token=${token}` : `${base}/kernel/logs`),
    listProfiles: () => client.get("profiles").json<ProfileMeta[]>(),
    createProfile: (body) => client.post("profiles", { json: body }).json<ProfileMeta>(),
    getProfile: (id) => client.get(`profiles/${id}`).json<ProfileDetail>(),
    updateProfile: (id, body) => client.put(`profiles/${id}`, { json: body }).json<ProfileMeta>(),
    deleteProfile: (id) => client.delete(`profiles/${id}`).json<void>(),
    importProfile: (url, name) =>
      client.post("profiles/import", { json: { url, name } }).json<ProfileMeta>(),
    activateProfile: (id) => client.post(`profiles/${id}/activate`).json<KernelState>(),
    refreshProfile: (id) => client.post(`profiles/${id}/refresh`).json<ProfileMeta>(),
    validateProfile: (id) => client.post(`profiles/${id}/validate`).json<ValidateResult>(),
    getSysProxy: () => client.get("sysproxy").json<SystemProxyState>(),
    setSysProxy: (body) => client.post("sysproxy", { json: body }).json<SystemProxyState>(),
    getKernelVersions: () => client.get("kernel/versions").json<KernelVersions>(),
    switchKernel: (version) =>
      client.post("kernel/switch", { json: { version } }).json<{ ok: true }>(),
    updateGeoAssets: () => client.post("geo/update").json<GeoUpdateResult>(),
    getRuntimeConfig: () => client.get("config/runtime").text(),
    getConfigSection: <T = unknown>(key: string) =>
      client.get("config/section", { searchParams: { key } }).json<T>(),
    setConfigSection: (body) => client.put("config/section", { json: body }).json<KernelState>(),
    webdavBackup: (body) => client.post("backup", { json: body }).json<WebdavBackupResult>(),
    webdavRestore: (body) => client.post("restore", { json: body }).json<WebdavRestoreResult>(),
    getTun: () => client.get("tun").json<TunStatus>(),
    setTun: (body) => client.post("tun", { json: body }).json<TunStatus>(),
    uninstallTun: () => client.post("tun/uninstall").json<TunStatus>(),
  };
  return cachedApi;
}
