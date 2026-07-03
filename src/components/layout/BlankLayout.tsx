import { useEffect, useRef, type ReactNode } from "react";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useConfigStore } from "@/stores/config";
import { useGlobalStore } from "@/stores/global";

export default function BlankLayout(): ReactNode {
  const ref = useRef<HTMLElement | null>(null);
  const setRoot = useGlobalStore((s) => s.setRootElement);
  const curTheme = useConfigStore((s) => s.curTheme);
  const autoSwitch = useConfigStore((s) => s.autoSwitchTheme);
  const favDay = useConfigStore((s) => s.favDayTheme);
  const favNight = useConfigStore((s) => s.favNightTheme);

  useEffect(() => {
    if (ref.current) setRoot(ref.current);
  }, [setRoot]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", curTheme);
  }, [curTheme]);

  useEffect(() => {
    if (!autoSwitch) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => useConfigStore.setState({ curTheme: mql.matches ? favNight : favDay });
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, [autoSwitch, favDay, favNight]);

  return (
    <Box
      ref={ref}
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "background.default",
        color: "text.primary",
      }}
      data-theme={curTheme}
    >
      <Outlet />
    </Box>
  );
}
