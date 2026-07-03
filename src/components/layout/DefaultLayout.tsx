import { useEffect, useRef, type ReactNode } from "react";
import { Box, useMediaQuery } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { Outlet, useLocation } from "react-router-dom";
import { useConfigStore } from "@/stores/config";
import { useGlobalStore } from "@/stores/global";
import { useControlInfo } from "@/lib/controlInfo";
import { useKernelStore } from "@/stores/kernel";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { getDesktopBridge } from "@/config/global";
import Sidebar from "@/components/layout/Sidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import TitleBar from "@/components/layout/TitleBar";
import ProtectedResources from "@/components/layout/ProtectedResources";
import ConnectionErrorBanner from "@/components/layout/ConnectionErrorBanner";
import GlobalTrafficIndicator from "@/components/layout/GlobalTrafficIndicator";
import ShortcutsHelpModal from "@/components/layout/ShortcutsHelpModal";

// Default shell: title bar (desktop), sidebar, mobile bottom nav, and the
// protected resources + traffic indicator overlays. Skips the chrome on the
// /setup and / (landing) routes which render through the BlankLayout.
export default function DefaultLayout(): ReactNode {
  const location = useLocation();
  const rootRef = useRef<HTMLElement | null>(null);
  const rootElement = useGlobalStore((s) => s.setRootElement);
  const curTheme = useConfigStore((s) => s.curTheme);
  const autoSwitch = useConfigStore((s) => s.autoSwitchTheme);
  const favDay = useConfigStore((s) => s.favDayTheme);
  const favNight = useConfigStore((s) => s.favNightTheme);
  const useBottomNav = useConfigStore((s) => s.useMobileBottomNav);
  const probe = useControlInfo((s) => s.probe);
  const ready = useControlInfo((s) => s.ready);
  const hasKernelControl = useControlInfo((s) => s.hasFeature("kernel-control"));

  const prefersDark = useMediaQuery<Theme>((t) =>
    t.palette.mode === "dark" ? "(prefers-color-scheme: dark)" : "(min-width: 0)",
  );

  // Theme auto-switch: react to system dark/light preferences.
  useEffect(() => {
    if (!autoSwitch) return;
    useConfigStore.setState({ curTheme: prefersDark ? favNight : favDay });
  }, [autoSwitch, prefersDark, favNight, favDay]);

  // Mirror curTheme onto :data-theme so CSS can react (e.g. legacy CSS).
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", curTheme);
    }
  }, [curTheme]);

  // Probe /api/control/info exactly once.
  useEffect(() => {
    probe();
  }, [probe]);

  // On desktop with managed kernel, seed the kernel store on probe-ready.
  useEffect(() => {
    if (ready && hasKernelControl) {
      void controlApiGetKernelStatus().catch((e) => console.error("kernel status failed", e));
    }
  }, [ready, hasKernelControl]);

  useKeyboardShortcuts();

  const isDesktop = !!getDesktopBridge().isDesktop;
  const isSetup = location.pathname === "/setup";

  useEffect(() => {
    if (rootRef.current) rootElement(rootRef.current);
  }, [rootElement]);

  return (
    <Box
      ref={rootRef}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overscrollBehaviorY: "none",
        color: "text.primary",
        backgroundColor: "background.default",
      }}
      data-theme={curTheme}
    >
      {isDesktop ? <TitleBar /> : null}
      <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
        {!isSetup ? <Sidebar /> : null}
        <Box
          component="main"
          sx={{
            flex: 1,
            minWidth: 0,
            p: { xs: 1, sm: 2 },
            pb: isSetup ? 2 : { xs: 10, lg: 2 },
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            mt: { xs: 7, lg: 0 },
          }}
        >
          <Outlet />
        </Box>
      </Box>
      {!isSetup && useBottomNav ? <MobileBottomNav /> : null}
      <ProtectedResources />
      <ConnectionErrorBanner />
      <GlobalTrafficIndicator />
      <ShortcutsHelpModal />
    </Box>
  );
}

// Pull the kernel status through the lazy-loaded controlApi at runtime.
async function controlApiGetKernelStatus() {
  const { getControlApi } = await import("@/lib/controlApi");
  try {
    const state = await getControlApi().getKernelStatus();
    useKernelStore.getState().setState(state);
  } catch {
    // ignore — desktop shell with no kernel control host
  }
}
