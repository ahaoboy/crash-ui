import { Box, IconButton } from "@mui/material";
import { IconMinus, IconSquare, IconX, IconCopy } from "@tabler/icons-react";
import { getDesktopBridge } from "@/config/global";

// Custom 32px draggable window title bar — desktop (Electron) shell only. The
// web build skips rendering this. Mirrors metacubexd's TitleBar but bound to a
// minimal desktop bridge (window.metacubexd).
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
        if (!isMac && windowMetacubexdWindow?.toggleMaximize)
          windowMetacubexdWindow.toggleMaximize();
      }}
    >
      <Box sx={{ flex: 1 }} />
      {!isMac && windowMetacubexdWindow ? (
        <Box sx={{ display: "flex", WebkitAppRegion: "no-drag" as never, height: "100%" }}>
          <IconButton
            size="small"
            onClick={() => windowMetacubexdWindow?.minimize?.()}
            aria-label="minimize"
            sx={{ borderRadius: 0, height: 30, width: 44 }}
          >
            <IconMinus size={14} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => windowMetacubexdWindow?.toggleMaximize?.()}
            aria-label="maximize"
            sx={{ borderRadius: 0, height: 30, width: 44 }}
          >
            {windowMetacubexdWindow.isMaximized?.() ? (
              <IconCopy size={14} />
            ) : (
              <IconSquare size={14} />
            )}
          </IconButton>
          <IconButton
            size="small"
            onClick={() => windowMetacubexdWindow?.close?.()}
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

// Minimal desktop bridge shape; the renderer code declares it via a cast so no
// global type assertion is needed at every call site.
interface WindowBridge {
  isMaximized?: () => boolean;
  minimize?: () => void;
  toggleMaximize?: () => void;
  close?: () => void;
}
const windowMetacubexdWindow =
  typeof window !== "undefined"
    ? (window as { metacubexdWindow?: WindowBridge }).metacubexdWindow
    : undefined;
