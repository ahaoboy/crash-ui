// Deploy-time + runtime configuration.

export interface DesktopBridge {
  isDesktop?: boolean;
  endpoint?: { url: string; secret: string };
  control?: { base: string; token?: string };
}

interface AppConfig {
  defaultBackendURL?: string;
  controlToken?: string;
}

declare global {
  interface Window {
    __CRASH_CONFIG__?: AppConfig;
    crashDesktop?: DesktopBridge;
  }
}

export function getRuntimeConfig(): AppConfig {
  return (typeof window !== "undefined" && window.__CRASH_CONFIG__) || {};
}

export function getDefaultBackendURL(): string {
  return getRuntimeConfig().defaultBackendURL || "";
}

export function getDesktopBridge(): DesktopBridge {
  return (typeof window !== "undefined" && window.crashDesktop) || {};
}

export const APP_VERSION = "1.0.0";
