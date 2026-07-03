import {
  Box,
  Button as MuiButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/shallow";
import { useLogsStore } from "@/stores/logs";
import { useConfigStore } from "@/stores/config";
import { LOG_LEVEL, LOGS_TABLE_MAX_ROWS_LIST } from "@/constants";

const LEVEL_COLORS: Record<string, string> = {
  info: "#74C0E1",
  warning: "#E8B577",
  error: "#E85C4D",
  debug: "#888",
  silent: "#444",
};

// Live log stream bound to the `/logs` WebSocket. Rows stream through the
// logs store's batched flush loop (250ms cadence) — no pagination; capped at
// `configStore.logMaxRows` rows newest-first.
export default function LogsPage(): React.ReactElement {
  const { t } = useTranslation();
  const logs = useLogsStore(useShallow((s) => s.logs));
  const paused = useLogsStore((s) => s.paused);
  const togglePaused = useLogsStore((s) => s.togglePaused);
  const clearLogs = useLogsStore((s) => s.clearLogs);
  const logLevel = useConfigStore((s) => s.logLevel);
  const maxRows = useConfigStore((s) => s.logMaxRows);

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{ mb: 2, flexWrap: "wrap" }}
        useFlexGap
      >
        <Typography variant="h5" sx={{ fontWeight: 700, flexGrow: 1 }}>
          {t("logs")}
        </Typography>
        <TextField
          select
          size="small"
          value={logLevel}
          label="level"
          onChange={(e) => useConfigStore.setState({ logLevel: e.target.value as LOG_LEVEL })}
          sx={{ minWidth: 120 }}
        >
          {Object.values(LOG_LEVEL).map((l) => (
            <MenuItem key={l} value={l}>
              {l}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          value={maxRows}
          label="rows"
          onChange={(e) => useConfigStore.setState({ logMaxRows: Number(e.target.value) })}
          sx={{ minWidth: 100 }}
        >
          {LOGS_TABLE_MAX_ROWS_LIST.map((n) => (
            <MenuItem key={n} value={n}>
              {n}
            </MenuItem>
          ))}
        </TextField>
        <MuiButton size="small" variant="outlined" onClick={togglePaused}>
          {paused ? t("resume") : t("pause")}
        </MuiButton>
        <MuiButton size="small" variant="outlined" onClick={clearLogs}>
          {t("reset")}
        </MuiButton>
      </Stack>
      <Paper
        variant="outlined"
        sx={{ flex: 1, overflowY: "auto", fontFamily: "monospace", fontSize: 12, p: 1 }}
      >
        {logs.length === 0 ? (
          <Typography variant="caption" color="text.secondary">
            —
          </Typography>
        ) : (
          logs.map((l) => (
            <Box
              key={l.seq}
              sx={{
                display: "flex",
                gap: 1,
                borderBottom: "1px dashed",
                borderColor: "divider",
                py: 0.25,
              }}
            >
              <Box
                component="span"
                sx={{
                  flexShrink: 0,
                  color: LEVEL_COLORS[l.type] ?? "#888",
                  width: 60,
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                {l.type}
              </Box>
              <Box component="span" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                {l.payload}
              </Box>
            </Box>
          ))
        )}
      </Paper>
    </Box>
  );
}
