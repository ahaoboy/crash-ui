export type ShortcutAction =
  | "goToOverview"
  | "goToProxies"
  | "goToConnections"
  | "goToRules"
  | "goToLogs"
  | "goToConfig"
  | "refresh"
  | "closeModal"
  | "showHelp";

export type ShortcutConfig = Record<ShortcutAction, string>;

export const DEFAULT_SHORTCUTS: ShortcutConfig = {
  goToOverview: "g+o",
  goToProxies: "g+p",
  goToConnections: "g+c",
  goToRules: "g+r",
  goToLogs: "g+l",
  goToConfig: "g+s",
  refresh: "r",
  closeModal: "Escape",
  showHelp: "?",
};

export interface ShortcutCategory {
  id: string;
  labelKey: string;
  shortcuts: ShortcutAction[];
}

export const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    id: "navigation",
    labelKey: "shortcuts.category.navigation",
    shortcuts: [
      "goToOverview",
      "goToProxies",
      "goToConnections",
      "goToRules",
      "goToLogs",
      "goToConfig",
    ],
  },
  {
    id: "actions",
    labelKey: "shortcuts.category.actions",
    shortcuts: ["refresh", "closeModal", "showHelp"],
  },
];

export const SHORTCUT_LABELS: Record<ShortcutAction, string> = {
  goToOverview: "shortcuts.goToOverview",
  goToProxies: "shortcuts.goToProxies",
  goToConnections: "shortcuts.goToConnections",
  goToRules: "shortcuts.goToRules",
  goToLogs: "shortcuts.goToLogs",
  goToConfig: "shortcuts.goToConfig",
  refresh: "shortcuts.refresh",
  closeModal: "shortcuts.closeModal",
  showHelp: "shortcuts.showHelp",
};

export const formatShortcutKey = (key: string): string => {
  if (key.includes("+")) {
    return key
      .split("+")
      .map((p) => p.toUpperCase())
      .join(" then ");
  }
  if (key === "Escape") return "Esc";
  if (key === "?") return "?";
  return key.toUpperCase();
};
