import { useEffect, useRef, type ReactNode } from "react";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useGlobalStore } from "@/stores/global";

export default function BlankLayout(): ReactNode {
  const ref = useRef<HTMLElement | null>(null);
  const setRoot = useGlobalStore((s) => s.setRootElement);

  useEffect(() => {
    if (ref.current) setRoot(ref.current);
  }, [setRoot]);

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
    >
      <Outlet />
    </Box>
  );
}
