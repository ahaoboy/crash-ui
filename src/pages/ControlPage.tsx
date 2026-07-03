import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button as MuiButton,
  Chip,
  TextField,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";
import { useControlInfo } from "@/lib/controlInfo";
import { useKernelStore } from "@/stores/kernel";
import { getControlApi } from "@/lib/controlApi";
import type {
  SystemProxyState,
  KernelVersions,
  WebdavBackupResult,
  WebdavRestoreResult,
} from "@/types/control";

// Control Center — bundled-agent dashboard surfaced only when hasAgent is true.
// Kernel lifecycle, system-proxy, kernel-version switching and WebDAV backup
// are agent-gated host integrations; each lives behind the appropriate
// capability flag registered in the /api/control/info probe.
export default function ControlPage(): React.ReactElement {
  const { t } = useTranslation();
  const hasAgent = useControlInfo((s) => s.hasAgent);
  const state = useKernelStore(useShallow((s) => s.state));
  const setKernel = useKernelStore((s) => s.setState);
  const [sysProxy, setSysProxy] = useState<SystemProxyState | null>(null);
  const [versions, setVersions] = useState<KernelVersions | null>(null);

  useEffect(() => {
    void getControlApi()
      .getKernelStatus()
      .then(setKernel)
      .catch(() => {
        /* ignore */
      });
    void getControlApi()
      .getSysProxy()
      .then(setSysProxy)
      .catch(() => {
        /* not supported */
      });
    void getControlApi()
      .getKernelVersions()
      .then(setVersions)
      .catch(() => {
        /* ignore */
      });
  }, [setKernel]);

  if (!hasAgent) {
    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          {t("controlCenter")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("controlCenterDesc")}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        {t("controlCenter")}
      </Typography>
      <Stack spacing={2}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              {t("controlCenterKernel")}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 1, alignItems: "center", flexWrap: "wrap" }}
              useFlexGap
            >
              <Chip
                label={state?.status ?? "unknown"}
                color={state?.status === "running" ? "success" : "default"}
              />
              <MuiButton
                size="small"
                variant="outlined"
                disabled={state?.status === "starting"}
                onClick={async () => setKernel(await getControlApi().startKernel())}
              >
                Start
              </MuiButton>
              <MuiButton
                size="small"
                variant="outlined"
                color="warning"
                disabled={state?.status === "stopping"}
                onClick={async () => setKernel(await getControlApi().stopKernel())}
              >
                Stop
              </MuiButton>
              <MuiButton
                size="small"
                variant="outlined"
                onClick={async () => setKernel(await getControlApi().restartKernel())}
              >
                Restart
              </MuiButton>
            </Stack>
            {versions ? (
              <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  versions:
                </Typography>
                {versions.versions.map((v) => (
                  <Chip
                    key={v}
                    label={v}
                    variant={v === versions.current ? "filled" : "outlined"}
                    onClick={async () => {
                      await getControlApi().switchKernel(v);
                      setKernel(await getControlApi().getKernelStatus());
                    }}
                  />
                ))}
              </Box>
            ) : null}
          </CardContent>
        </Card>
        {sysProxy ? (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                {t("systemProxy.title")}
              </Typography>
              <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  label={sysProxy.enabled ? t("enabled") : t("disabled")}
                  color={sysProxy.enabled ? "success" : "default"}
                />
                <MuiButton
                  size="small"
                  variant="outlined"
                  onClick={async () =>
                    setSysProxy(await getControlApi().setSysProxy({ enabled: !sysProxy.enabled }))
                  }
                >
                  Toggle
                </MuiButton>
              </Box>
            </CardContent>
          </Card>
        ) : null}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              {t("webdavBackup")}
            </Typography>
            <WebDAVPanel />
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

function WebDAVPanel(): React.ReactElement {
  const { t } = useTranslation();
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [dir, setDir] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const creds = { url, username, password, dir: dir || undefined };

  return (
    <Stack spacing={1} sx={{ mt: 1, maxWidth: 480 }}>
      <TextField
        size="small"
        placeholder={t("url")}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          placeholder={t("username")}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          sx={{ flex: 1 }}
        />
        <TextField
          size="small"
          type="password"
          placeholder={t("password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ flex: 1 }}
        />
      </Stack>
      <TextField
        size="small"
        placeholder={t("dir")}
        value={dir}
        onChange={(e) => setDir(e.target.value)}
      />
      <Stack direction="row" spacing={1}>
        <MuiButton
          size="small"
          variant="contained"
          disabled={busy || !url}
          onClick={async () => {
            setBusy(true);
            setMessage("");
            try {
              if (!creds.username) {
                setMessage("Missing fields");
                setBusy(false);
                return;
              }
              const r: WebdavBackupResult = await getControlApi().webdavBackup({ webdav: creds });
              setMessage(r.ok ? `OK · ${r.path}` : "failed");
            } catch (e) {
              setMessage(String(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          {t("backupNow")}
        </MuiButton>
        <MuiButton
          size="small"
          variant="outlined"
          disabled={busy || !url}
          onClick={async () => {
            setBusy(true);
            setMessage("");
            try {
              const r: WebdavRestoreResult = await getControlApi().webdavRestore({
                webdav: credentialsFor(creds),
              });
              setMessage(t("restoreOk", { count: r.restored }));
            } catch (e) {
              setMessage(String(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          {t("restoreNow")}
        </MuiButton>
      </Stack>
      {message ? (
        <Typography variant="caption" color="text.secondary">
          {message}
        </Typography>
      ) : null}
    </Stack>
  );

  function credentialsFor(c: typeof creds) {
    return c;
  }
}
