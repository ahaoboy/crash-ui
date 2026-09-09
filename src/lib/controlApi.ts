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
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

// Profile validation can trigger Mihomo's first-run GEO database download.
// Keep ordinary control requests on the client's 15s default. These finite
// budgets outlive the agent's validator, kernel lifecycle, and (for
// refresh+apply) a bounded subscription fetch.
const PROFILE_SUBSCRIPTION_TIMEOUT = 45_000;
const PROFILE_VALIDATE_TIMEOUT = 330_000;
const PROFILE_ACTIVATE_TIMEOUT = 360_000;
const PROFILE_REFRESH_AND_ACTIVATE_TIMEOUT = 390_000;

export interface ControlApi {
  getInfo: () => Promise<ControlInfo>;
  getKernelStatus: () => Promise<KernelState>;
  startKernel: () => Promise<KernelState>;
  stopKernel: () => Promise<KernelState>;
  restartKernel: () => Promise<KernelState>;
  /** Restore the last-known-good active config (.bak from the previous
   *  activate) and restart — escape hatch for a config that bricks the kernel.
   *  404s when no backup exists. */
  rollbackKernel: () => Promise<KernelState>;
  /** Reset to a minimal (header-only) config + restart on mihomo defaults.
   *  Last-resort recovery when even the backup is bad. */
  recoverKernel: () => Promise<KernelState>;
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
    body: {
      name?: string;
      content?: string;
      enabled?: boolean;
      /** minutes; remote-only. 0 disables auto-update. */
      updateInterval?: number;
    },
  ) => Promise<ProfileMeta>;
  /** DELETE returns 204 No Content — there is no body to parse. Chaining
   *  .json() on an empty 204 throws "Unexpected end of JSON input" and makes a
   *  successful delete look like a failure. */
  deleteProfile: (id: string) => Promise<void>;
  importProfile: (url: string, name?: string) => Promise<ProfileMeta>;
  activateProfile: (id: string) => Promise<KernelState>;
  refreshProfile: (id: string) => Promise<ProfileMeta>;
  /** Combined refresh + apply: re-fetch, compose into active.yaml, validate,
   *  and restart. Returns the refreshed meta and the resulting state. */
  refreshAndActivateProfile: (id: string) => Promise<{ meta: ProfileMeta; kernel: KernelState }>;
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
    rollbackKernel: () =>
      client
        .post("kernel/rollback")
        .json<KernelState>()
        .then((r) => {
          debug.ctrl.log(`rollbackKernel: result status=${r.status}`);
          return r;
        })
        .catch((err) => {
          logError("ctrl", "rollbackKernel failed", err);
          throw err;
        }),
    recoverKernel: () =>
      client
        .post("kernel/recover")
        .json<KernelState>()
        .then((r) => {
          debug.ctrl.log(`recoverKernel: result status=${r.status}`);
          return r;
        })
        .catch((err) => {
          logError("ctrl", "recoverKernel failed", err);
          throw err;
        }),
    listProfiles: () => client.get("profiles").json<ProfileMeta[]>(),
    createProfile: (body) => client.post("profiles", { json: body }).json<ProfileMeta>(),
    getProfile: (id) => client.get(`profiles/${id}`).json<ProfileDetail>(),
    updateProfile: (id, body) => client.put(`profiles/${id}`, { json: body }).json<ProfileMeta>(),
    deleteProfile: async (id) => {
      await client.delete(`profiles/${id}`);
    },
    importProfile: (url, name) =>
      client
        .post("profiles/import", { json: { url, name }, timeout: PROFILE_SUBSCRIPTION_TIMEOUT })
        .json<ProfileMeta>(),
    activateProfile: (id) =>
      client
        .post(`profiles/${id}/activate`, { timeout: PROFILE_ACTIVATE_TIMEOUT })
        .json<KernelState>(),
    refreshProfile: (id) =>
      client
        .post(`profiles/${id}/refresh`, { timeout: PROFILE_SUBSCRIPTION_TIMEOUT })
        .json<ProfileMeta>(),
    refreshAndActivateProfile: (id) =>
      client
        .post(`profiles/${id}/refresh-and-activate`, {
          timeout: PROFILE_REFRESH_AND_ACTIVATE_TIMEOUT,
        })
        .json<{ meta: ProfileMeta; kernel: KernelState }>(),
    validateProfile: (id) =>
      client
        .post(`profiles/${id}/validate`, { timeout: PROFILE_VALIDATE_TIMEOUT })
        .json<ValidateResult>(),
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
