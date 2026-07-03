import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useProxiesStore } from "@/stores/proxies";
import { useConfigStore } from "@/stores/config";
import { classifyLatency, type LatencyBand } from "@/utils/proxy";

interface Props {
  proxyName: string;
  testUrl: string | null;
  providerName?: string;
  groupName?: string;
  interactive?: boolean;
  onClick?: () => void;
  width?: number;
}

const BAND_COLOR: Record<LatencyBand, string> = {
  good: "#58c46a",
  medium: "#e6d04a",
  slow: "#e85c4d",
  "not-connected": "#757a83",
};

// The signature Latency pill: a fixed-width tabular-nums readout tinted by
// latency band. Renders a spinner ring while a test is in-flight.
export default function Latency({
  proxyName,
  testUrl,
  providerName,
  groupName,
  interactive = false,
  onClick,
  width = 44,
}: Props) {
  const { t } = useTranslation();
  const latency = useProxiesStore((s) => s.getLatencyByName)(proxyName, testUrl);
  const testing = useProxiesStore((s) => s.isTesting)(proxyName, { providerName, groupName });
  const qualityMap = useConfigStore((s) => s.latencyQualityMap)();
  const band = classifyLatency(latency, qualityMap);
  const color = BAND_COLOR[band];
  const text = latency > 0 ? String(latency) : "---";

  const ariaLabel = testing
    ? t("recommendation.testing")
    : interactive
      ? `${t("testLatency")}, ${latency > 0 ? `${latency}ms` : "---"}`
      : `${latency > 0 ? `${latency}ms` : "---"}`;

  return (
    <Box
      component="span"
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={ariaLabel}
      aria-busy={testing || undefined}
      onClick={interactive ? onClick : undefined}
      onKeyDown={(e) => {
        if (interactive && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          e.stopPropagation();
          onClick?.();
        }
      }}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width,
        cursor: interactive ? "pointer" : "default",
        borderRadius: 1,
        px: 0.75,
        py: 0.5,
        fontSize: 12,
        fontWeight: 600,
        fontVariantNumeric: "tabular-nums",
        whiteSpace: "nowrap",
        color,
        backgroundColor: (t) =>
          t.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        transition: "transform 120ms cubic-bezier(0.34,1.4,0.64,1), background-color 120ms ease",
        userSelect: "none",
        "&:hover": interactive
          ? { transform: "scale(1.06)", backgroundColor: "rgba(255,255,255,0.12)" }
          : {},
        "&:active": interactive ? { transform: "scale(0.92)" } : {},
      }}
    >
      {testing ? (
        <Box
          component="span"
          aria-hidden
          sx={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            border: "2px solid",
            borderColor: "currentColor",
            borderBottomColor: "transparent",
            opacity: 0.6,
            animation: "spin 0.8s linear infinite",
            "@keyframes spin": { to: { transform: "rotate(360deg)" } },
          }}
        />
      ) : (
        text
      )}
    </Box>
  );
}
