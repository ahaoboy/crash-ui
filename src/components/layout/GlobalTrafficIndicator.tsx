import { useEffect, useState } from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import { IconArrowUp, IconArrowDown, IconGripVertical, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/shallow";
import { formatBytes } from "@/utils/format";
import { useGlobalStore } from "@/stores/global";
import { useConnectionsStore } from "@/stores/connections";

// Floating traffic readout — a small always-on widget pinned to the bottom-right
// showing live up/down speeds + memory + active connection count. Collapses to
// a compact pill when clicked and can be hidden. The original Vue version was a
// draggable Highcharts sparkline; this React port keeps the same affordances
// with a much smaller Recharts-free readout to honor the bundle budget.
export default function GlobalTrafficIndicator(): React.ReactElement | null {
  const { t } = useTranslation();
  const latestTraffic = useGlobalStore(useShallow((s) => s.latestTraffic));
  const latestMemory = useGlobalStore(useShallow((s) => s.latestMemory));
  const activeCount = useConnectionsStore((s) => s.latestConnectionMsg?.connections?.length ?? 0);

  const [collapsed, setCollapsed] = useState(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (localStorage.getItem("gti.visible") === "false") setVisible(false);
  }, []);

  useEffect(() => {
    localStorage.setItem("gti.visible", String(visible));
  }, [visible]);

  if (!latestTraffic) {
    if (!visible) {
      return (
        <IconButton
          size="small"
          onClick={() => setVisible(true)}
          sx={{
            position: "fixed",
            right: 16,
            bottom: 16,
            zIndex: 1100,
            backgroundColor: "primary.main",
            color: "primary.contrastText",
            boxShadow: 4,
          }}
          aria-label={t("showTrafficIndicator")}
        >
          <IconArrowUp size={16} />
        </IconButton>
      );
    }
    return null;
  }

  const down = latestTraffic.down || 0;
  const up = latestTraffic.up || 0;
  const mem = latestMemory?.inuse ?? 0;

  if (!visible) {
    return (
      <IconButton
        onClick={() => setVisible(true)}
        sx={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 1100,
          backgroundColor: "primary.main",
          color: "primary.contrastText",
          boxShadow: 4,
          "&:hover": { transform: "scale(1.1)" },
        }}
        aria-label={t("showTrafficIndicator")}
      >
        <IconArrowUp size={18} />
      </IconButton>
    );
  }

  return (
    <Box
      sx={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 1100,
        minWidth: collapsed ? 180 : 240,
        maxWidth: collapsed ? 200 : 280,
        backgroundColor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: 1.5,
        boxShadow: 4,
        userSelect: "none",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: collapsed ? 0 : 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}>
          <IconGripVertical size={14} />
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>
            {t("traffic")}
          </span>
        </Box>
        <Box sx={{ display: "flex" }}>
          <Tooltip title={collapsed ? "Expand" : "Collapse"}>
            <IconButton size="small" onClick={() => setCollapsed((v) => !v)} sx={{ p: 0.25 }}>
              <span style={{ fontSize: 14 }}>{collapsed ? "+" : "−"}</span>
            </IconButton>
          </Tooltip>
          <Tooltip title={t("hideTrafficIndicator")}>
            <IconButton size="small" onClick={() => setVisible(false)} sx={{ p: 0.25 }}>
              <IconX size={12} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconArrowDown size={12} fontSize="small" color="success" />
        <span style={{ fontSize: 12, fontFamily: "monospace" }}>{formatBytes(down)}/s</span>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25 }}>
        <IconArrowUp size={12} color="info" />
        <span style={{ fontSize: 12, fontFamily: "monospace" }}>{formatBytes(up)}/s</span>
      </Box>
      {!collapsed ? (
        <Box
          sx={{
            mt: 0.5,
            color: "text.secondary",
            fontSize: 12,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 0.5,
          }}
        >
          <div>
            {t("memory")}: <span style={{ fontFamily: "monospace" }}>{formatBytes(mem)}</span>
          </div>
          <div>
            {t("connections")}: <span style={{ fontFamily: "monospace" }}>{activeCount}</span>
          </div>
        </Box>
      ) : null}
    </Box>
  );
}
