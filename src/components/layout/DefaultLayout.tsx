import { useEffect, useRef, type ReactNode } from "react";
import { Box, useMediaQuery } from "@mui/material";
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

export default function DefaultLayout(): ReactNode {
  const location = useLocation();
  const rootRef = useRef<HTMLElement | null>(null);
  const rootElement = useGlobalStore((s) => s.setRootElement);
  const useBottomNav = useConfigStore((s) => s.useMobileBottomNav);
  const probe = useControlInfo((s) => s.probe);
  const ready = useControlInfo((s) => s.ready);
  const hasKernelControl = useControlInfo((s) => s.hasFeature("kernel-control"));

  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

  // Auto-switch theme based on system preference.
  useEffect(() => {
    useConfigStore.setState({ themeMode: prefersDark ? "dark" : "light" });
  }, [prefersDark]);

  // Probe /api/control/info exactly once (desktop-only).
  useEffect(() => {
    if (getDesktopBridge().isDesktop) probe();
    else useControlInfo.setState({ ready: true });
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
    >
      {isDesktop ? <TitleBar /> : null}
      <Box sx={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
        {!isSetup ? <Sidebar /> : null}
        <Box
          component="main"
          sx={{
            flex: 1,
            minWidth: 0,
            p: { xs: 1, sm: 2 },
            pb: isSetup ? 2 : { xs: 10, lg: 2 },
            overflowY: "auto",
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

async function controlApiGetKernelStatus() {
  const { getControlApi } = await import("@/lib/controlApi");
  try {
    const state = await getControlApi().getKernelStatus();
    useKernelStore.getState().setState(state);
  } catch {
    // ignore
  }
}
