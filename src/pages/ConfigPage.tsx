import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Card as MuiCard,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { fetchBackendConfigAPI, updateBackendConfigAPI } from "@/lib/api";
import { useApiActions } from "@/lib/useApiActions";
import { useConfigStore } from "@/stores/config";
import { useConfigStore as cfg } from "@/stores/config";
import ConfigTitle from "@/components/common/ConfigTitle";
import type { Config } from "@/types";
import { IconRoute, IconGlobe, IconRuler } from "@tabler/icons-react";

const MODES_LABEL: Record<string, { icon: React.ReactNode; key: string }> = {
  rule: { icon: <IconRuler size={16} />, key: "ruleMode" },
  direct: { icon: <IconRoute size={16} />, key: "directMode" },
  global: { icon: <IconGlobe size={16} />, key: "globalMode" },
};

// Config page — backend runtime config + proxies/logs/connections preferences.
export default function ConfigPage(): React.ReactElement {
  const { t } = useTranslation();
  const actions = useApiActions();
  const [config, setConfig] = useState<Config | null>(null);
  const [currentMode, setCurrentMode] = useState<string>("rule");
  const [modes, setModes] = useState<string[]>(["rule", "direct", "global"]);
  void config;

  useEffect(() => {
    void fetchBackendConfigAPI()
      .then((c) => {
        setConfig(c);
        setCurrentMode(c.mode || "rule");
        setModes(c["mode-list"] || c.modes || ["rule", "direct", "global"]);
      })
      .catch(() => {
        /* endpoint may be down — leave blank */
      });
  }, []);

  return (
    <Box sx={{ maxWidth: 760, mx: "auto" }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        {t("config")}
      </Typography>
      <Stack spacing={2}>
        <Card variant="outlined">
          <CardContent>
            <ConfigTitle title={t("runningMode")} subtitle="" />
            <ToggleButtonGroup
              exclusive
              value={currentMode}
              onChange={(_, v) => {
                if (!v || v === currentMode) return;
                setCurrentMode(v);
                void updateBackendConfigAPI("mode", v as never).catch(() =>
                  setCurrentMode(currentMode),
                );
              }}
              size="small"
              sx={{ mt: 1 }}
            >
              {modes.map((m) => {
                const meta = MODES_LABEL[m];
                return (
                  <ToggleButton key={m} value={m}>
                    {meta ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        {meta.icon}
                        {t(meta.key)}
                      </span>
                    ) : (
                      m
                    )}
                  </ToggleButton>
                );
              })}
            </ToggleButtonGroup>
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <ConfigTitle title={t("kernelTitle")} />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <button
                onClick={() =>
                  void actions.reloadConfig().then((ok: boolean) => ok && window.location.reload())
                }
                disabled={actions.reloading}
              >
                {t("reloadConfig")}
              </button>
              <button
                onClick={async () => {
                  if (confirm(t("restartCoreConfirm"))) {
                    const ok = await actions.restartCore();
                    if (ok) window.location.reload();
                  }
                }}
                disabled={actions.restarting}
              >
                {t("restartCore")}
              </button>
              <button onClick={() => void actions.flushFakeIP()}>{t("flushFakeIP")}</button>
              <button onClick={() => void actions.flushDNS()}>{t("flushDNS")}</button>
              <button onClick={() => void actions.updateGEO()}>{t("updateGeoDBs")}</button>
            </Box>
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardContent>
            <ConfigTitle title={t("proxiesSettings")} />
            <Stack spacing={2} sx={{ mt: 1 }}>
              <LabeledNumber
                label={t("latencyTestTimeoutDuration")}
                value={cfg.getState().latencyTestTimeoutDuration}
                onChange={(v) => cfg.setState({ latencyTestTimeoutDuration: v })}
              />
              <LabeledString
                label={t("urlForLatencyTest")}
                value={cfg.getState().urlForLatencyTest}
                onChange={(v) => cfg.setState({ urlForLatencyTest: v })}
              />
              <Box component="button">
                {t("renderInTwoColumns")}: {String(cfg.getState().useMobileBottomNav)}
              </Box>
              <button onClick={() => cfg.getState().resetProxiesSettings()}>
                {t("resetSettings")}
              </button>
            </Stack>
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardContent>
            <ConfigTitle title={t("appearance")} />
            <Stack spacing={1} sx={{ mt: 1 }}>
              <LabeledNumber
                label={t("latencyMediumThreshold")}
                value={cfg.getState().latencyMediumThreshold}
                onChange={(v) => cfg.setState({ latencyMediumThreshold: v })}
              />
              <LabeledNumber
                label={t("latencyHighThreshold")}
                value={cfg.getState().latencyHighThreshold}
                onChange={(v) => cfg.setState({ latencyHighThreshold: v })}
              />
              <button onClick={() => cfg.getState().resetAppConfig()}>{t("resetSettings")}</button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
      <MuiCard variant="outlined" sx={{ mt: 2 }}>
        <CardContent>
          <ConfigTitle title={t("logsSettings")} />
          <button onClick={() => useConfigStore.getState().resetRulesFilters()}>
            {t("reset")}
          </button>
        </CardContent>
      </MuiCard>
    </Box>
  );
}

function LabeledString({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 14 }}>
      <span style={{ color: "text.secondary" }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "transparent",
          color: "inherit",
          border: "1px solid #444",
          padding: "6px 8px",
          borderRadius: 8,
        }}
      />
    </label>
  );
}

function LabeledNumber({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 14 }}>
      <span style={{ color: "text.secondary" }}>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          background: "transparent",
          color: "inherit",
          border: "1px solid #444",
          padding: "6px 8px",
          borderRadius: 8,
        }}
      />
    </label>
  );
}
