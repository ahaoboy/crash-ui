import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CONNECTIONS_TABLE_ACCESSOR_KEY,
  ConnectionsTableColumnOrder,
  ConnectionsTableColumnVisibility,
  LOG_LEVEL,
  PROXIES_CARD_SIZE,
  PROXIES_DISPLAY_MODE,
  PROXIES_ORDERING_TYPE,
  PROXIES_PREVIEW_TYPE,
  RULES_ORDERING_TYPE,
  TableSize,
} from "@/types";
import type { IPProvider } from "@/types/network";
import {
  CONNECTIONS_TABLE_INITIAL_COLUMN_ORDER,
  CONNECTIONS_TABLE_INITIAL_COLUMN_VISIBILITY,
  DEFAULT_LOGS_TABLE_MAX_ROWS,
  LATENCY_QUALITY_MAP_HTTP,
  LATENCY_QUALITY_MAP_HTTPS,
  LOG_LEVEL as LOG_LEVEL_ENUM,
  PROXIES_CARD_SIZE as CARD_SIZE,
  PROXIES_DISPLAY_MODE as DISPLAY_MODE,
  PROXIES_ORDERING_TYPE as ORDERING,
  PROXIES_PREVIEW_TYPE as PREVIEW,
  RULES_ORDERING_TYPE as RULES_ORDER,
  TableSize as SIZE,
} from "@/constants";
import type { ThemeMode } from "@/theme/theme";

export interface LatencyQualityMap {
  NOT_CONNECTED: number;
  MEDIUM: number;
  HIGH: number;
}

export interface ConfigStoreState {
  // Theme
  themeMode: ThemeMode;

  // Proxies
  proxiesPreviewType: PROXIES_PREVIEW_TYPE;
  proxiesPreviewAutoThreshold: number;
  proxiesOrderingType: PROXIES_ORDERING_TYPE;
  proxiesDisplayMode: PROXIES_DISPLAY_MODE;
  proxiesCardSize: PROXIES_CARD_SIZE;
  stickyGroupHeader: boolean;
  hideUnAvailableProxies: boolean;
  urlForLatencyTest: string;
  latencyTestUrlSource: "core" | "dashboard";
  autoCloseConns: boolean;
  latencyTestTimeoutDuration: number;
  latencyMediumThreshold: number;
  latencyHighThreshold: number;
  iconHeight: number;
  iconMarginRight: number;
  proxiesGroupNameFilter: string;

  // Sidebar / mobile
  sidebarExpanded: boolean;
  useMobileBottomNav: boolean;
  defaultPage: string;

  // Connections
  connectionsTableSize: TableSize;
  connectionsTableColumnVisibility: ConnectionsTableColumnVisibility;
  connectionsTableColumnOrder: ConnectionsTableColumnOrder;
  quickFilterRegex: string;

  // Logs
  logsTableSize: TableSize;
  logLevel: LOG_LEVEL;
  logMaxRows: number;

  // Rules
  rulesOrderingType: RULES_ORDERING_TYPE;
  rulesTypeFilter: string[];
  rulesPolicyFilter: string[];
  rulesStatusFilter: "all" | "enabled" | "disabled";

  // Misc
  enableDataUsageTracking: boolean;
  showConnectionGeoIP: boolean;
  connectionGeoIPProvider: IPProvider;
  setThemeMode: (mode: ThemeMode) => void;
  resetProxiesSettings: () => void;
  resetRulesFilters: () => void;
  resetAppConfig: () => void;
  resolveLatencyTestUrl: (groupTestUrl?: string | null) => string;
  isLatencyTestHttps: () => boolean;
  latencyQualityMap: () => LatencyQualityMap;
}

const DEFAULT_PROXIES_PREVIEW = PREVIEW.Auto as PROXIES_PREVIEW_TYPE;
const DEFAULT_ORDERING = ORDERING.QUALITY_DESC as PROXIES_ORDERING_TYPE;
const DEFAULT_DISPLAY = DISPLAY_MODE.CARD as PROXIES_DISPLAY_MODE;
const DEFAULT_CARD = CARD_SIZE.COMFORTABLE as PROXIES_CARD_SIZE;
const DEFAULT_RULES = RULES_ORDER.NATURAL as RULES_ORDERING_TYPE;
const DEFAULT_LOG_LEVEL = LOG_LEVEL_ENUM.Info as LOG_LEVEL;
const DEFAULT_TABLE_SIZE = SIZE.XS as TableSize;

export const useConfigStore = create<ConfigStoreState>()(
  persist(
    (set, get) => ({
      themeMode: "dark",

      proxiesPreviewType: DEFAULT_PROXIES_PREVIEW,
      proxiesPreviewAutoThreshold: 10,
      proxiesOrderingType: DEFAULT_ORDERING,
      proxiesDisplayMode: DEFAULT_DISPLAY,
      proxiesCardSize: DEFAULT_CARD,
      stickyGroupHeader: false,
      hideUnAvailableProxies: false,
      urlForLatencyTest: "https://www.gstatic.com/generate_204",
      latencyTestUrlSource: "core",
      autoCloseConns: true,
      latencyTestTimeoutDuration: 5000,
      latencyMediumThreshold: 0,
      latencyHighThreshold: 0,
      iconHeight: 24,
      iconMarginRight: 8,
      proxiesGroupNameFilter: "",

      sidebarExpanded: false,
      useMobileBottomNav: true,
      defaultPage: "overview",

      connectionsTableSize: DEFAULT_TABLE_SIZE,
      connectionsTableColumnVisibility: { ...CONNECTIONS_TABLE_INITIAL_COLUMN_VISIBILITY },
      connectionsTableColumnOrder: [
        ...CONNECTIONS_TABLE_INITIAL_COLUMN_ORDER,
      ] as ConnectionsTableColumnOrder,
      quickFilterRegex: "DIRECT|direct|dns-out",

      logsTableSize: DEFAULT_TABLE_SIZE,
      logLevel: DEFAULT_LOG_LEVEL,
      logMaxRows: DEFAULT_LOGS_TABLE_MAX_ROWS,

      rulesOrderingType: DEFAULT_RULES,
      rulesTypeFilter: [],
      rulesPolicyFilter: [],
      rulesStatusFilter: "all",

      enableDataUsageTracking: true,
      showConnectionGeoIP: false,
      connectionGeoIPProvider: "ipwho.is",

      setThemeMode: (mode) => set({ themeMode: mode }),
      resetProxiesSettings: () =>
        set({
          proxiesPreviewType: DEFAULT_PROXIES_PREVIEW,
          proxiesOrderingType: DEFAULT_ORDERING,
          proxiesDisplayMode: DEFAULT_DISPLAY,
          proxiesCardSize: DEFAULT_CARD,
          stickyGroupHeader: false,
          hideUnAvailableProxies: false,
          urlForLatencyTest: "https://www.gstatic.com/generate_204",
          latencyTestUrlSource: "core",
          autoCloseConns: true,
          latencyTestTimeoutDuration: 5000,
          latencyMediumThreshold: 0,
          latencyHighThreshold: 0,
          iconHeight: 24,
          iconMarginRight: 8,
          proxiesGroupNameFilter: "",
        }),
      resetRulesFilters: () =>
        set({ rulesTypeFilter: [], rulesPolicyFilter: [], rulesStatusFilter: "all" }),
      resetAppConfig: () =>
        set({
          themeMode: "dark",
          useMobileBottomNav: true,
          defaultPage: "overview",
          enableDataUsageTracking: true,
        }),
      resolveLatencyTestUrl: (groupTestUrl) => {
        const s = get();
        return s.latencyTestUrlSource === "dashboard"
          ? s.urlForLatencyTest
          : groupTestUrl || s.urlForLatencyTest;
      },
      isLatencyTestHttps: () => get().urlForLatencyTest.startsWith("https"),
      latencyQualityMap: () => {
        const s = get();
        const defaults = s.isLatencyTestHttps()
          ? {
              NOT_CONNECTED: LATENCY_QUALITY_MAP_HTTPS.NOT_CONNECTED,
              MEDIUM: LATENCY_QUALITY_MAP_HTTPS.MEDIUM,
              HIGH: LATENCY_QUALITY_MAP_HTTPS.HIGH,
            }
          : {
              NOT_CONNECTED: LATENCY_QUALITY_MAP_HTTP.NOT_CONNECTED,
              MEDIUM: LATENCY_QUALITY_MAP_HTTP.MEDIUM,
              HIGH: LATENCY_QUALITY_MAP_HTTP.HIGH,
            };
        return {
          NOT_CONNECTED: defaults.NOT_CONNECTED,
          MEDIUM: s.latencyMediumThreshold > 0 ? s.latencyMediumThreshold : defaults.MEDIUM,
          HIGH: s.latencyHighThreshold > 0 ? s.latencyHighThreshold : defaults.HIGH,
        };
      },
    }),
    {
      name: "crash-config",
      partialize: (s) => ({
        themeMode: s.themeMode,
        proxiesPreviewType: s.proxiesPreviewType,
        proxiesPreviewAutoThreshold: s.proxiesPreviewAutoThreshold,
        proxiesOrderingType: s.proxiesOrderingType,
        proxiesDisplayMode: s.proxiesDisplayMode,
        proxiesCardSize: s.proxiesCardSize,
        stickyGroupHeader: s.stickyGroupHeader,
        hideUnAvailableProxies: s.hideUnAvailableProxies,
        urlForLatencyTest: s.urlForLatencyTest,
        latencyTestUrlSource: s.latencyTestUrlSource,
        autoCloseConns: s.autoCloseConns,
        latencyTestTimeoutDuration: s.latencyTestTimeoutDuration,
        latencyMediumThreshold: s.latencyMediumThreshold,
        latencyHighThreshold: s.latencyHighThreshold,
        iconHeight: s.iconHeight,
        iconMarginRight: s.iconMarginRight,
        proxiesGroupNameFilter: s.proxiesGroupNameFilter,
        sidebarExpanded: s.sidebarExpanded,
        useMobileBottomNav: s.useMobileBottomNav,
        defaultPage: s.defaultPage,
        connectionsTableSize: s.connectionsTableSize,
        connectionsTableColumnVisibility: s.connectionsTableColumnVisibility,
        connectionsTableColumnOrder: s.connectionsTableColumnOrder,
        quickFilterRegex: s.quickFilterRegex,
        logsTableSize: s.logsTableSize,
        logLevel: s.logLevel,
        logMaxRows: s.logMaxRows,
        rulesOrderingType: s.rulesOrderingType,
        rulesTypeFilter: s.rulesTypeFilter,
        rulesPolicyFilter: s.rulesPolicyFilter,
        rulesStatusFilter: s.rulesStatusFilter,
        enableDataUsageTracking: s.enableDataUsageTracking,
        showConnectionGeoIP: s.showConnectionGeoIP,
        connectionGeoIPProvider: s.connectionGeoIPProvider,
      }),
    },
  ),
);

// Re-export the table column key type at module level + a fixed ordering
export type ColumnKey = CONNECTIONS_TABLE_ACCESSOR_KEY;
