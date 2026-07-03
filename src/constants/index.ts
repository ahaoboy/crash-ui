export const THEMES = ["light", "dark"] as const;
export type ThemeName = (typeof THEMES)[number];

export const FALLBACK_BACKEND_URL = "http://127.0.0.1:9090";

export const ROUTES = {
  Overview: "/overview",
  Proxies: "/proxies",
  Rules: "/rules",
  Conns: "/connections",
  Log: "/logs",
  Config: "/config",
  Setup: "/setup",
  Profiles: "/profiles",
  Traffic: "/traffic",
  Control: "/control",
} as const;

export const CHART_MAX_XAXIS = 30;

export enum LATENCY_QUALITY_MAP_HTTP {
  NOT_CONNECTED = 0,
  MEDIUM = 200,
  HIGH = 500,
}

export enum LATENCY_QUALITY_MAP_HTTPS {
  NOT_CONNECTED = 0,
  MEDIUM = 800,
  HIGH = 1500,
}

export enum PROXIES_PREVIEW_TYPE {
  OFF = "off",
  DOTS = "dots",
  BAR = "bar",
  Auto = "auto",
}

export enum PROXIES_ORDERING_TYPE {
  NATURAL = "orderNatural",
  LATENCY_ASC = "orderLatency_asc",
  LATENCY_DESC = "orderLatency_desc",
  NAME_ASC = "orderName_asc",
  NAME_DESC = "orderName_desc",
  QUALITY_ASC = "orderQuality_asc",
  QUALITY_DESC = "orderQuality_desc",
}

export const PROXIES_ORDERING_TYPE_ORDER: PROXIES_ORDERING_TYPE[] = [
  PROXIES_ORDERING_TYPE.NATURAL,
  PROXIES_ORDERING_TYPE.LATENCY_ASC,
  PROXIES_ORDERING_TYPE.LATENCY_DESC,
  PROXIES_ORDERING_TYPE.QUALITY_ASC,
  PROXIES_ORDERING_TYPE.QUALITY_DESC,
  PROXIES_ORDERING_TYPE.NAME_ASC,
  PROXIES_ORDERING_TYPE.NAME_DESC,
];

export enum RULES_ORDERING_TYPE {
  NATURAL = "orderNatural",
  TYPE_ASC = "orderRuleType_asc",
  TYPE_DESC = "orderRuleType_desc",
  NAME_ASC = "orderName_asc",
  NAME_DESC = "orderName_desc",
  HIT_COUNT_DESC = "orderHitCount_desc",
  HIT_COUNT_ASC = "orderHitCount_asc",
  HIT_AT_DESC = "orderHitAt_desc",
}

export const RULES_ORDERING_TYPE_ORDER: RULES_ORDERING_TYPE[] = [
  RULES_ORDERING_TYPE.NATURAL,
  RULES_ORDERING_TYPE.TYPE_ASC,
  RULES_ORDERING_TYPE.TYPE_DESC,
  RULES_ORDERING_TYPE.NAME_ASC,
  RULES_ORDERING_TYPE.NAME_DESC,
  RULES_ORDERING_TYPE.HIT_COUNT_DESC,
  RULES_ORDERING_TYPE.HIT_COUNT_ASC,
  RULES_ORDERING_TYPE.HIT_AT_DESC,
];

export enum PROXIES_DISPLAY_MODE {
  CARD = "cardMode",
  LIST = "listMode",
  TABLE = "tableMode",
  CHIPS = "chipsMode",
  MASTER = "masterDetailMode",
}

export const PROXIES_DISPLAY_MODE_ORDER: PROXIES_DISPLAY_MODE[] = [
  PROXIES_DISPLAY_MODE.CARD,
  PROXIES_DISPLAY_MODE.LIST,
  PROXIES_DISPLAY_MODE.TABLE,
  PROXIES_DISPLAY_MODE.CHIPS,
  PROXIES_DISPLAY_MODE.MASTER,
];

export enum PROXIES_CARD_SIZE {
  COMFORTABLE = "comfortable",
  COMPACT = "compact",
  TIGHT = "tight",
}

export const PROXIES_CARD_SIZE_MIN_WIDTH: Record<PROXIES_CARD_SIZE, number> = {
  [PROXIES_CARD_SIZE.COMFORTABLE]: 180,
  [PROXIES_CARD_SIZE.COMPACT]: 132,
  [PROXIES_CARD_SIZE.TIGHT]: 104,
};

export const PROXIES_CARD_SIZE_GAP: Record<PROXIES_CARD_SIZE, number> = {
  [PROXIES_CARD_SIZE.COMFORTABLE]: 8,
  [PROXIES_CARD_SIZE.COMPACT]: 6,
  [PROXIES_CARD_SIZE.TIGHT]: 4,
};

export enum CONNECTIONS_TABLE_ACCESSOR_KEY {
  Details = "details",
  Close = "close",
  ID = "ID",
  Type = "type",
  Process = "process",
  Host = "host",
  SniffHost = "sniffHost",
  Rule = "rule",
  Chains = "chains",
  DlSpeed = "dlSpeed",
  UlSpeed = "ulSpeed",
  Download = "dl",
  Upload = "ul",
  ConnectTime = "connectTime",
  SourceIP = "sourceIP",
  SourcePort = "sourcePort",
  Destination = "destination",
  InboundUser = "inboundUser",
  HostProcess = "hostProcess",
  RuleChains = "ruleChains",
  Traffic = "traffic",
  Flow = "flow",
}

export const CONNECTIONS_TABLE_MAX_CLOSED_ROWS = 200;

export const CONNECTIONS_TABLE_INITIAL_COLUMN_ORDER = Object.values(CONNECTIONS_TABLE_ACCESSOR_KEY);

export const CONNECTIONS_TABLE_INITIAL_COLUMN_VISIBILITY = {
  ...Object.fromEntries(CONNECTIONS_TABLE_INITIAL_COLUMN_ORDER.map((i) => [i, false])),
  [CONNECTIONS_TABLE_ACCESSOR_KEY.Details]: true,
  [CONNECTIONS_TABLE_ACCESSOR_KEY.Close]: true,
  [CONNECTIONS_TABLE_ACCESSOR_KEY.HostProcess]: true,
  [CONNECTIONS_TABLE_ACCESSOR_KEY.RuleChains]: true,
  [CONNECTIONS_TABLE_ACCESSOR_KEY.Traffic]: true,
  [CONNECTIONS_TABLE_ACCESSOR_KEY.Flow]: true,
  [CONNECTIONS_TABLE_ACCESSOR_KEY.ConnectTime]: true,
} as unknown as Record<CONNECTIONS_TABLE_ACCESSOR_KEY, boolean>;

export enum TableSize {
  XS = "xs",
  SM = "sm",
  MD = "md",
  LG = "lg",
}

export enum LOG_LEVEL {
  Info = "info",
  Error = "error",
  Warning = "warning",
  Debug = "debug",
  Silent = "silent",
}

export const LOGS_TABLE_MAX_ROWS_LIST = [200, 300, 500, 800, 1000];
export const DEFAULT_LOGS_TABLE_MAX_ROWS = LOGS_TABLE_MAX_ROWS_LIST[0];
