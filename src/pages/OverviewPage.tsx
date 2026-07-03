import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { IconArrowDown, IconArrowUp, IconBolt, IconCpu } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/shallow";
import { useGlobalStore } from "@/stores/global";
import { useConnectionsStore } from "@/stores/connections";
import { useEndpointStore } from "@/stores/endpoint";
import { formatBytes } from "@/utils/format";
import { useProxiesStore } from "@/stores/proxies";
import { useEffect } from "react";
import TrafficLineChart from "@/components/pages/charts/TrafficLineChart";

// Top-level dashboard summary: traffic/memory/connection readouts + small line
// chart of recent traffic history. Charts are intentionally simple Recharts
// line charts rather than the original Highcharts area-spline widgets.
export default function OverviewPage(): React.ReactElement {
  const { t } = useTranslation();
  const traffic = useGlobalStore(useShallow((s) => s.latestTraffic));
  const memory = useGlobalStore(useShallow((s) => s.latestMemory));
  const activeConnections = useConnectionsStore((s) => s.activeConnections.length);
  const proxiesLoaded = useProxiesStore((s) => s.proxiesLoaded);
  const fetchProxies = useProxiesStore((s) => s.fetchProxies);
  const endpoint = useEndpointStore(useShallow((s) => s.currentEndpoint()));

  useEffect(() => {
    if (endpoint && !proxiesLoaded) void fetchProxies();
  }, [endpoint, proxiesLoaded, fetchProxies]);

  const stats: Array<{ label: string; value: string; icon: React.ReactNode; color?: string }> = [
    {
      label: t("down"),
      value: formatBytes(traffic?.down ?? 0) + "/s",
      icon: <IconArrowDown size={16} />,
      color: "success.main",
    },
    {
      label: t("up"),
      value: formatBytes(traffic?.up ?? 0) + "/s",
      icon: <IconArrowUp size={16} />,
      color: "info.main",
    },
    { label: t("memory"), value: formatBytes(memory?.inuse ?? 0), icon: <IconCpu size={16} /> },
    {
      label: t("activeConnections"),
      value: String(activeConnections),
      icon: <IconBolt size={16} />,
    },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        {t("overview")}
      </Typography>
      <Grid container spacing={2}>
        {stats.map((s) => (
          <Grid key={s.label} size={{ xs: 6, sm: 3 }}>
            <Card variant="outlined">
              <CardContent
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  "&:last-child": { pb: 1.5 },
                }}
              >
                <Box sx={{ color: s.color ?? "text.secondary" }}>{s.icon}</Box>
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    {s.label}
                  </Typography>
                  <Typography variant="h6" className="tabular-nums">
                    {s.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                {t("trafficTrend")}
              </Typography>
              <Box sx={{ height: 220, mt: 1 }}>
                <TrafficLineChart />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
