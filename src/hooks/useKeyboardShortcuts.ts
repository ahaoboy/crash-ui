import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useShortcutsStore } from "@/stores/shortcuts";
import { ROUTES } from "@/constants";
import type { ShortcutAction } from "@/constants/shortcuts";

const NAV_KEYS: Record<string, ShortcutAction> = {
  o: "goToOverview",
  p: "goToProxies",
  c: "goToConnections",
  r: "goToRules",
  l: "goToLogs",
  s: "goToConfig",
};

const ROUTE_MAP: Record<ShortcutAction, string> = {
  goToOverview: ROUTES.Overview,
  goToProxies: ROUTES.Proxies,
  goToConnections: ROUTES.Conns,
  goToRules: ROUTES.Rules,
  goToLogs: ROUTES.Log,
  goToConfig: ROUTES.Config,
  refresh: "",
  closeModal: "",
  showHelp: "",
};

export function useKeyboardShortcuts(): void {
  const navigate = useNavigate();
  const { isOnboardingOpen, isHelpModalOpen, closeHelpModal, toggleHelpModal } =
    useShortcutsStore();

  useEffect(() => {
    let gPrefixActive = false;
    let gPrefixTimer: ReturnType<typeof setTimeout> | null = null;

    function clearGPrefix(): void {
      gPrefixActive = false;
      if (gPrefixTimer) {
        clearTimeout(gPrefixTimer);
        gPrefixTimer = null;
      }
    }
    function setGPrefix(): void {
      gPrefixActive = true;
      if (gPrefixTimer) clearTimeout(gPrefixTimer);
      gPrefixTimer = setTimeout(clearGPrefix, 1500);
    }

    function execute(action: ShortcutAction): void {
      if (action === "refresh") {
        window.location.reload();
        return;
      }
      if (action === "closeModal") {
        if (isHelpModalOpen) closeHelpModal();
        window.dispatchEvent(new CustomEvent("shortcut:close-modal"));
        return;
      }
      if (action === "showHelp") {
        toggleHelpModal();
        return;
      }
      const route = ROUTE_MAP[action];
      if (route) navigate(route);
    }

    function onKey(e: KeyboardEvent): void {
      const el = document.activeElement;
      if (el) {
        const tag = el.tagName.toLowerCase();
        if (
          tag === "input" ||
          tag === "textarea" ||
          tag === "select" ||
          el.getAttribute("contenteditable") === "true"
        )
          return;
      }
      if (isOnboardingOpen) return;
      const key = e.key.toLowerCase();
      if (key === "escape") {
        execute("closeModal");
        return;
      }
      if (e.shiftKey && (key === "/" || key === "?")) {
        e.preventDefault();
        execute("showHelp");
        return;
      }
      if (key === "g" && !gPrefixActive) {
        setGPrefix();
        return;
      }
      if (gPrefixActive) {
        if (e.metaKey || e.ctrlKey) {
          clearGPrefix();
          return;
        }
        const a = NAV_KEYS[key];
        if (a) {
          e.preventDefault();
          execute(a);
          clearGPrefix();
          return;
        }
        clearGPrefix();
        return;
      }
      if (key === "r" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        execute("refresh");
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearGPrefix();
    };
  }, [navigate, isOnboardingOpen, isHelpModalOpen, closeHelpModal, toggleHelpModal]);
}
