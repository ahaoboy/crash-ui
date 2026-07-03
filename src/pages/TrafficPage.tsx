import { Box, Card, CardContent, Typography, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { useShallow } from "zustand/shallow";
import { useConnectionsStore } from "@/stores/connections";
import { db } from "@/utils/db";
import { formatBytes } from "@/utils/format";

// Traffic analytics page with Recharts pies + connection-count line chart.
export default function TrafficPage(): React.ReactElement {
  const { t } = useTranslation();
  const active = useConnectionsStore(useShallow((s) => s.activeConnections));
  const [data, setData] = useState<Array<{ label: string; download: number; upload: number }>>([]);
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const end = Date.now();
    const start = end - 60 * 60 * 1000; // last hour
    void db
      .query(start, end)
      .then((rows) => {
        const byHost = new Map<string, { download: number; upload: number }>();
        for (const r of rows) {
          const key = r.host || "—";
          const cur = byHost.get(key) ?? { download: 0, upload: 0 };
          cur.download += r.download;
          cur.upload += r.upload;
          byHost.set(key, cur);
        }
        const arr = [...byHost.entries()]
          .map(([label, v]) => ({ label, download: v.download, upload: v.upload }))
          .sort((a, b) => b.download + b.upload - (a.download + a.upload))
          .slice(0, 10);
        setData(arr);
      })
      .catch(() => {
        /* tracking disabled — leave empty */
      });
  }, [active.length, setTick]);

  const connectionCountSeries = useMemo(() => {
    const hist = useConnectionsStore.getState().latestConnectionMsg?.connections?.length ?? 0;
    const now = Date.now();
    const xs = Array.from({ length: 30 }, (_, i) => ({ time: now - (29 - i) * 1000, count: hist }));
    return xs;
  }, [active]);

  const pieData = data.map((d) => ({ name: d.label, value: d.download + d.upload || 1 }));
  const palette = [
    "#E07A5F",
    "#74C0E1",
    "#A3BE8C",
    "#E76F88",
    "#E8B577",
    "#BD93F9",
    "#FF79C6",
    "#8BE9FD",
    "#50FA7B",
    "#F1FA8C",
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        {t("dataUsage")}
      </Typography>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              {t("byHost")} (top 10)
            </Typography>
            <Box sx={{ height: 260, mt: 1 }}>
              {pieData.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t("noDetailedData")}
                </Typography>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={palette[i % palette.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatBytes(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
          </CardContent>
        </Card>
      </Stack>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="overline" color="text.secondary">
            {t("activeConnections")}
          </Typography>
          <Box sx={{ height: 220, mt: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={connectionCountSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(127,127,127,0.2)" />
                <XAxis
                  dataKey="time"
                  tickFormatter={(v) => new Date(v).toLocaleTimeString().slice(3)}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 11 }} width={32} />
                <Tooltip labelFormatter={(v) => new Date(Number(v)).toLocaleTimeString()} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name={t("activeConnections")}
                  stroke="#E07A5F"
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
      <Card variant="outlined" sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="overline" color="text.secondary">
            {t("byHost")} (bytes)
          </Typography>
          <Box sx={{ height: 260, mt: 1 }}>
            {data.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t("noDetailedData")}
              </Typography>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(127,127,127,0.2)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis
                    tickFormatter={(v) => formatBytes(v as number)}
                    tick={{ fontSize: 11 }}
                    width={48}
                  />
                  <Tooltip formatter={(v) => formatBytes(Number(v))} />
                  <Legend />
                  <Bar dataKey="download" name={t("download")} fill="#58c46a" />
                  <Bar dataKey="upload" name={t("upload")} fill="#74C0E1" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
