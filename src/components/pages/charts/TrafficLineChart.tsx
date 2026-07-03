import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { useShallow } from "zustand/shallow";
import { useGlobalStore } from "@/stores/global";

// Recharts-based traffic line chart. Subscribes to the latestTraffic updates and
// snapshots the chart history at render — the underlying history buckets are
// non-reactive (kept raw to avoid proxying every per-second push), so we force
// a render each second via a timer.
export default function TrafficLineChart(): React.ReactElement {
  const latest = useGlobalStore(useShallow((s) => s.latestTraffic));
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => (n + 1) % 1_000_000), 1000);
    return () => clearInterval(id);
  }, []);

  const history = useGlobalStore.getState().trafficChartHistory;
  const data = useMemo(() => {
    const dl = history.download;
    const ul = history.upload;
    const len = Math.max(dl.length, ul.length);
    const out: Array<{ time: number; download: number; upload: number }> = [];
    for (let i = 0; i < len; i++) {
      out.push({
        time: dl[i]?.[0] ?? ul[i]?.[0] ?? Date.now(),
        download: dl[i]?.[1] ?? 0,
        upload: ul[i]?.[1] ?? 0,
      });
    }
    return out;
  }, [history, latest]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(127,127,127,0.2)" />
        <XAxis
          dataKey="time"
          tickFormatter={(v) => new Date(v).toLocaleTimeString()}
          tick={{ fontSize: 11 }}
          stroke="rgba(127,127,127,0.4)"
        />
        <YAxis
          tickFormatter={(v) => formatShort(v)}
          tick={{ fontSize: 11 }}
          stroke="rgba(127,127,127,0.4)"
          width={48}
        />
        <Tooltip
          labelFormatter={(v) => new Date(Number(v)).toLocaleTimeString()}
          formatter={(v) => formatShort(Number(v))}
          contentStyle={{
            background: "#1f1f24",
            border: "1px solid #444",
            borderRadius: 8,
            color: "#eee",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="download"
          name="Down"
          stroke="#58c46a"
          dot={false}
          strokeWidth={1.5}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="upload"
          name="Up"
          stroke="#74C0E1"
          dot={false}
          strokeWidth={1.5}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function formatShort(v: number): string {
  if (v >= 1_073_741_824) return `${(v / 1_073_741_824).toFixed(1)}GB`;
  if (v >= 1_048_576) return `${(v / 1_048_576).toFixed(1)}MB`;
  if (v >= 1024) return `${(v / 1024).toFixed(0)}KB`;
  return `${v}B`;
}
