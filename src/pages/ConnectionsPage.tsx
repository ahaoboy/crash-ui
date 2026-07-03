import {
  Box,
  Typography,
  Card,
  Stack,
  Button as MuiButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  MenuItem,
} from "@mui/material";
import { IconX } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/shallow";
import { useConnectionsStore } from "@/stores/connections";
import { useConfigStore } from "@/stores/config";
import { useEndpointStore } from "@/stores/endpoint";
import { closeAllConnectionsAPI, closeSingleConnectionAPI } from "@/lib/api";
import { formatBytes, formatDuration } from "@/utils/format";
import { CONNECTIONS_TABLE_ACCESSOR_KEY } from "@/constants";

export default function ConnectionsPage(): React.ReactElement {
  const { t } = useTranslation();
  const active = useConnectionsStore(useShallow((s) => s.activeConnections));
  const closed = useConnectionsStore(useShallow((s) => s.closedConnections));
  const paused = useConnectionsStore((s) => s.paused);
  const setPaused = useConnectionsStore((s) => s.setPaused);
  const columnVisibility = useConfigStore(useShallow((s) => s.connectionsTableColumnVisibility));
  const tableSize = useConfigStore((s) => s.connectionsTableSize);
  const quickFilterRegex = useConfigStore((s) => s.quickFilterRegex);
  const endpoint = useEndpointStore(useShallow((s) => s.currentEndpoint()));
  const [filter, setFilter] = useState("");

  useEffect(() => {
    /* store auto-updates */
  }, [endpoint]);

  const filtered = useMemo(() => {
    const kw = filter.trim().toLowerCase();
    if (!kw) return active;
    return active.filter(
      (c) =>
        (c.metadata.host || c.metadata.destinationIP).toLowerCase().includes(kw) ||
        c.metadata.process.toLowerCase().includes(kw) ||
        c.metadata.sourceIP.toLowerCase().includes(kw) ||
        c.chains.join(" ").toLowerCase().includes(kw) ||
        c.rule.toLowerCase().includes(kw),
    );
  }, [active, filter]);

  const quickFilter = useMemo(() => {
    if (!quickFilterRegex) return () => true;
    try {
      const re = new RegExp(quickFilterRegex);
      return (c: (typeof active)[number]) => !re.test(c.chains.join("/") || c.rule);
    } catch {
      return () => true;
    }
  }, [quickFilterRegex, active]);

  const show = (k: CONNECTIONS_TABLE_ACCESSOR_KEY) => columnVisibility[k] !== false;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t("connections")}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }} useFlexGap>
          <TextField
            size="small"
            placeholder={t("search")}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            sx={{ minWidth: 220 }}
          />
          <TextField
            select
            size="small"
            value={tableSize}
            onChange={(e) =>
              useConfigStore.setState({ connectionsTableSize: e.target.value as never })
            }
            sx={{ minWidth: 110 }}
          >
            {["xs", "sm", "md", "lg"].map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
          <MuiButton size="small" variant="outlined" onClick={() => setPaused(!paused)}>
            {paused ? t("resume") : t("pause")}
          </MuiButton>
          <MuiButton
            size="small"
            variant="outlined"
            color="warning"
            onClick={() => void closeAllConnectionsAPI()}
          >
            {t("closeAll")}
          </MuiButton>
        </Stack>
      </Box>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Chip label={`${t("active")}: ${active.length}`} />
        <Chip label={`${t("closed")}: ${closed.length}`} />
      </Stack>
      <TableContainer component={Card} variant="outlined">
        <Table
          size="small"
          sx={{ "& .conn-cell-stack > div + div": { color: "text.secondary", fontSize: 11 } }}
        >
          <TableHead>
            <TableRow>
              {show(CONNECTIONS_TABLE_ACCESSOR_KEY.HostProcess) && (
                <TableCell>{t("hostProcess")}</TableCell>
              )}
              {show(CONNECTIONS_TABLE_ACCESSOR_KEY.RuleChains) && (
                <TableCell>{t("ruleChains")}</TableCell>
              )}
              {show(CONNECTIONS_TABLE_ACCESSOR_KEY.Traffic) && (
                <TableCell>
                  {t("downloadColumn")}/{t("uploadColumn")}
                </TableCell>
              )}
              {show(CONNECTIONS_TABLE_ACCESSOR_KEY.Flow) && <TableCell>{t("flow")}</TableCell>}
              {show(CONNECTIONS_TABLE_ACCESSOR_KEY.ConnectTime) && (
                <TableCell>{t("connectTime")}</TableCell>
              )}
              {show(CONNECTIONS_TABLE_ACCESSOR_KEY.Close) && <TableCell align="right"> </TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.filter(quickFilter).map((c) => {
              return (
                <TableRow key={c.id} hover>
                  <TableCell>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span>{c.metadata.host || c.metadata.destinationIP || "—"}</span>
                      {c.metadata.process ? (
                        <span style={{ color: "#888", fontSize: 11 }}>{c.metadata.process}</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span>
                        {c.rule ? `${c.rule}${c.rulePayload ? `(${c.rulePayload})` : ""}` : "—"}
                      </span>
                      <span style={{ color: "#888", fontSize: 11 }}>{c.chains.join(" → ")}</span>
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span>
                        {formatBytes(c.downloadSpeed)}/s ↓ {formatBytes(c.uploadSpeed)}/s ↑
                      </span>
                      <span style={{ color: "#888", fontSize: 11 }}>
                        {formatBytes(c.download)} / {formatBytes(c.upload)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span>{c.metadata.network.toUpperCase()}</span>
                      <span style={{ color: "#888", fontSize: 11 }}>
                        {c.metadata.sourceIP}:{c.metadata.sourcePort} →{" "}
                        {c.metadata.host || c.metadata.destinationIP}:{c.metadata.destinationPort}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatDuration(new Date(c.start).getTime(), Date.now())}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      aria-label="close"
                      onClick={async () => {
                        try {
                          await closeSingleConnectionAPI(c.id);
                        } catch {
                          /* ignore */
                        }
                      }}
                    >
                      <IconX size={14} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {filtered.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          —
        </Typography>
      ) : null}
    </Box>
  );
}
