import { Box, IconButton } from "@mui/material";
import { IconMinus, IconSquare, IconX, IconCopy } from "@tabler/icons-react";
import { getDesktopBridge } from "@/config/global";

// Custom draggable window title bar for desktop (Electron) shell.
export default function TitleBar(): React.ReactElement | null {
  const bridge = getDesktopBridge();
  if (!bridge.isDesktop) return null;
  const isMac = navigator.platform.toLowerCase().includes("mac");

  return (
    <Box
      sx={{
        height: 30,
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
        flexShrink: 0,
        px: 1,
        WebkitAppRegion: "drag" as never,
      }}
      onDoubleClick={() => {
        if (!isMac && desktopWindow?.toggleMaximize) desktopWindow.toggleMaximize();
      }}
    >
      <Box sx={{ flex: 1 }} />
      {!isMac && desktopWindow ? (
        <Box sx={{ display: "flex", WebkitAppRegion: "no-drag" as never, height: "100%" }}>
          <IconButton
            size="small"
            onClick={() => desktopWindow?.minimize?.()}
            aria-label="minimize"
            sx={{ borderRadius: 0, height: 30, width: 44 }}
          >
            <IconMinus size={14} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => desktopWindow?.toggleMaximize?.()}
            aria-label="maximize"
            sx={{ borderRadius: 0, height: 30, width: 44 }}
          >
            {desktopWindow.isMaximized?.() ? <IconCopy size={14} /> : <IconSquare size={14} />}
          </IconButton>
          <IconButton
            size="small"
            onClick={() => desktopWindow?.close?.()}
            aria-label="close"
            sx={{
              borderRadius: 0,
              height: 30,
              width: 44,
              "&:hover": {
                backgroundColor: (t) => t.palette.error.main,
                color: (t) => t.palette.error.contrastText,
              },
            }}
          >
            <IconX size={14} />
          </IconButton>
        </Box>
      ) : null}
    </Box>
  );
}

interface WindowBridge {
  isMaximized?: () => boolean;
  minimize?: () => void;
  toggleMaximize?: () => void;
  close?: () => void;
}
const desktopWindow =
  typeof window !== "undefined"
    ? (window as { crashWindow?: WindowBridge }).crashWindow
    : undefined;
