// Deploy-time + runtime configuration. Mirrors metacubexd's __METACUBEXD_CONFIG__
// injected via public/config.js, plus optional desktop bridge shape.

export interface MetacubexdBridge {
  isDesktop?: boolean;
  endpoint?: { url: string; secret: string };
  control?: { base: string; token?: string };
}

interface MetacubexdConfig {
  defaultBackendURL?: string;
  controlToken?: string;
}

declare global {
  interface Window {
    __METACUBEXD_CONFIG__?: MetacubexdConfig;
    metacubexd?: MetacubexdBridge;
  }
}

export function getRuntimeConfig(): MetacubexdConfig {
  return (typeof window !== "undefined" && window.__METACUBEXD_CONFIG__) || {};
}

export function getDefaultBackendURL(): string {
  return getRuntimeConfig().defaultBackendURL || "";
}

export function getDesktopBridge(): MetacubexdBridge {
  return (typeof window !== "undefined" && window.metacubexd) || {};
}

export function isMockMode(): boolean {
  // Exposed via Vite env for the mock demo build (npm run dev:mock).
  return import.meta.env.VITE_MOCK_MODE === "true";
}

export const APP_VERSION = "1.0.0";
