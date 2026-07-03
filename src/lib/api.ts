import ky from "ky";
import type { BackendVersion, Config, Proxy, ProxyProvider, Rule, RuleProvider } from "@/types";
import { useEndpointStore } from "@/stores/endpoint";
import { compareVersions, isSingBoxVersion } from "@/utils/format";
import { useControlInfo } from "@/lib/controlInfo";
import { debug, logError } from "@/utils/debug";

const MIHOMO_REPO = "repos/MetaCubeX/mihomo";
const VERNESONG_REPO = "repos/vernesong/mihomo";
const BACKEND_VERSION_RE = /\b(alpha|beta|meta)-?(\S+)/i;
const VERNESONG_RE = /-smart-/i;

interface ReleaseAPIResponse {
  tag_name: string;
  body: string;
  assets: { name: string }[];
  published_at: string;
}

type BackendReleaseChannel = "alpha" | "beta" | "meta" | "stable";

function resolveBackendReleaseTarget(currentVersion: string) {
  const match = BACKEND_VERSION_RE.exec(currentVersion);
  const channel = match?.[1]?.toLowerCase() as BackendReleaseChannel | undefined;
  return {
    channel: channel ?? "stable",
    repositoryURL: VERNESONG_RE.test(currentVersion) ? VERNESONG_REPO : MIHOMO_REPO,
    versionSuffix: match?.[2] ?? "",
  };
}

export interface RequestClient {
  get: (url: string, opts?: Record<string, unknown>) => { json: <T>() => Promise<T> };
  post: (url: string, opts?: Record<string, unknown>) => { json: <T>() => Promise<T> };
  put: (url: string, opts?: Record<string, unknown>) => { json: <T>() => Promise<T> };
  patch: (url: string, opts?: Record<string, unknown>) => { json: <T>() => Promise<T> };
  delete: (url: string, opts?: Record<string, unknown>) => { json: <T>() => Promise<T> };
}

export function getRequest(): RequestClient {
  const endpoint = useEndpointStore.getState().currentEndpoint();
  if (!endpoint) {
    debug.api.log("getRequest: no endpoint configured, requests will have no prefix");
    return ky.create({}) as unknown as RequestClient;
  }
  debug.api.log("getRequest: using endpoint", endpoint.url);
  const headers = new Headers();
  if (endpoint.secret) headers.set("Authorization", `Bearer ${endpoint.secret}`);
  return ky.create({ prefix: endpoint.url, headers, timeout: 5000 }) as unknown as RequestClient;
}

function githubAPI() {
  const headers = new Headers();
  if (import.meta.env.VITE_APP_GH_TOKEN) {
    headers.set("Authorization", `Bearer ${import.meta.env.VITE_APP_GH_TOKEN}`);
  }
  return ky.create({ prefix: "https://api.github.com", headers });
}

export type EndpointCheckError = "mixed_content" | "auth_error" | "network_error" | null;

export function checkEndpointAPI(url: string, secret: string): Promise<EndpointCheckError> {
  return ky
    .get(url.endsWith("/") ? `${url}version` : `${url}/version`, {
      headers: secret ? { Authorization: `Bearer ${secret}` } : {},
      timeout: 5000,
    })
    .then(() => null)
    .catch((err) => {
      console.error(err);
      const status = err?.response?.status;
      if (status === 401 || status === 403) return "auth_error";
      if (
        typeof window !== "undefined" &&
        window.location.protocol === "https:" &&
        url.startsWith("http://")
      ) {
        return "mixed_content";
      }
      return "network_error";
    });
}

export function closeAllConnectionsAPI() {
  debug.api.log("DELETE connections (all)");
  return getRequest().delete("connections");
}

export function closeSingleConnectionAPI(id: string) {
  debug.api.log(`DELETE connections/${id}`);
  return getRequest().delete(`connections/${id}`);
}

export function fetchBackendConfigAPI(): Promise<Config> {
  return getRequest().get("configs").json<Config>();
}

export async function updateBackendConfigAPI(
  key: keyof Config,
  value: Partial<Config[keyof Config]>,
): Promise<void> {
  await getRequest()
    .patch("configs", { json: { [key]: value } })
    .json<Config>();
}

export async function fetchBackendVersionAPI(): Promise<string> {
  const { version } = await getRequest().get("version").json<BackendVersion>();
  return version;
}

export function fetchProxyProvidersAPI(): Promise<{ providers: Record<string, ProxyProvider> }> {
  return getRequest().get("providers/proxies").json();
}

export function fetchProxiesAPI(): Promise<{ proxies: Record<string, Proxy> }> {
  return getRequest().get("proxies").json();
}

export function updateProxyProviderAPI(providerName: string) {
  return getRequest().put(`providers/proxies/${encodeURIComponent(providerName)}`);
}

export function proxyProviderHealthCheckAPI(providerName: string) {
  return getRequest().get(`providers/proxies/${encodeURIComponent(providerName)}/healthcheck`, {
    timeout: 20 * 1000,
  });
}

export function selectProxyInGroupAPI(groupName: string, proxyName: string) {
  debug.api.log(`PUT proxies/${groupName}`, { name: proxyName });
  return getRequest().put(`proxies/${encodeURIComponent(groupName)}`, {
    json: { name: proxyName },
  });
}

export function unfixProxyInGroupAPI(groupName: string) {
  debug.api.log(`DELETE proxies/${groupName}`);
  return getRequest().delete(`proxies/${encodeURIComponent(groupName)}`);
}

export function proxyLatencyTestAPI(
  proxyName: string,
  provider: string,
  url: string,
  timeout: number,
): Promise<{ delay: number }> {
  const path = provider
    ? `providers/proxies/${encodeURIComponent(provider)}/${encodeURIComponent(proxyName)}/healthcheck`
    : `proxies/${encodeURIComponent(proxyName)}/delay`;
  return getRequest()
    .get(path, { searchParams: { url, timeout }, timeout: Math.max(20_000, timeout + 10_000) })
    .json<{ delay: number }>();
}

export function proxyGroupLatencyTestAPI(
  groupName: string,
  url: string,
  timeout: number,
): Promise<Record<string, number>> {
  return getRequest()
    .get(`group/${encodeURIComponent(groupName)}/delay`, {
      searchParams: { url, timeout },
      timeout: Math.max(30_000, timeout * 2 + 10_000),
    })
    .json<Record<string, number>>();
}

export function fetchRulesAPI(): Promise<{ rules: Record<string, Rule> }> {
  return getRequest().get("rules").json();
}

export function fetchRuleProvidersAPI(): Promise<{ providers: Record<string, RuleProvider> }> {
  return getRequest().get("providers/rules").json();
}

export function updateRuleProviderAPI(providerName: string) {
  return getRequest().put(`providers/rules/${encodeURIComponent(providerName)}`);
}

export function toggleRuleDisabledAPI(index: number, disabled: boolean) {
  return getRequest().patch("rules/disable", { json: { [index]: disabled } });
}

export async function fetchRemoteConfigAPI(url: string): Promise<void> {
  try {
    if (useControlInfo.getState().hasFeature("profiles")) {
      const { getControlApi } = await import("./controlApi");
      const meta = await getControlApi().importProfile(url);
      await getControlApi().activateProfile(meta.id);
      return;
    }
    const response = await ky.get(url);
    const payload = await response.text();
    await getRequest().put("configs", {
      searchParams: { force: true },
      json: { path: "", payload },
    });
  } catch (e) {
    console.error("Failed to fetch remote config:", e);
    throw e;
  }
}

// ---- kernel-side actions ----
export async function reloadConfigFileAPI(): Promise<boolean> {
  debug.api.log("PUT configs (reload)");
  try {
    await getRequest().put("configs", {
      searchParams: { force: true },
      json: { path: "", payload: "" },
    });
    return true;
  } catch (err) {
    logError("api", "reloadConfigFileAPI failed", err);
    return false;
  }
}

export async function restartBackendAPI(): Promise<boolean> {
  debug.api.log("POST restart");
  try {
    await getRequest().post("restart");
    return true;
  } catch (err) {
    logError("api", "restartBackendAPI failed", err);
    return false;
  }
}

export async function flushFakeIPAPI(): Promise<void> {
  debug.api.log("POST cache/fakeip/flush");
  try {
    await getRequest().post("cache/fakeip/flush");
  } catch (err) {
    logError("api", "flushFakeIPAPI failed", err);
  }
}

export async function flushDNSCacheAPI(): Promise<void> {
  debug.api.log("POST cache/dns/flush");
  try {
    await getRequest().post("cache/dns/flush");
  } catch (err) {
    logError("api", "flushDNSCacheAPI failed", err);
  }
}

export async function updateGEODatabasesAPI(): Promise<void> {
  debug.api.log("POST configs/geo");
  try {
    await getRequest().post("configs/geo");
  } catch (err) {
    logError("api", "updateGEODatabasesAPI failed", err);
  }
}

// ---- releases ----
export async function frontendReleaseAPI(currentVersion: string) {
  const { tag_name, body } = await githubAPI()
    .get("repos/crash-ui/crash-ui/releases/latest")
    .json<ReleaseAPIResponse>();
  return { isUpdateAvailable: compareVersions(tag_name, currentVersion) > 0, changelog: body };
}

export async function backendReleaseAPI(
  currentVersion: string,
): Promise<{ isUpdateAvailable: boolean; changelog?: string }> {
  if (isSingBoxVersion(currentVersion)) return { isUpdateAvailable: false };
  const { channel, repositoryURL, versionSuffix } = resolveBackendReleaseTarget(currentVersion);
  if (channel !== "stable") {
    if (channel === "meta") {
      const { assets, body } = await githubAPI()
        .get(`${repositoryURL}/releases/latest`)
        .json<ReleaseAPIResponse>();
      return {
        isUpdateAvailable: !assets.some((a) => a.name.includes(versionSuffix)),
        changelog: body,
      };
    }
    if (channel === "alpha") {
      const { assets, body } = await githubAPI()
        .get(`${repositoryURL}/releases/tags/Prerelease-Alpha`)
        .json<ReleaseAPIResponse>();
      return {
        isUpdateAvailable: !assets.some((a) => a.name.includes(versionSuffix)),
        changelog: body,
      };
    }
    return { isUpdateAvailable: false };
  }
  const { tag_name, body } = await githubAPI()
    .get(`${repositoryURL}/releases/latest`)
    .json<ReleaseAPIResponse>();
  return { isUpdateAvailable: compareVersions(tag_name, currentVersion) > 0, changelog: body };
}
