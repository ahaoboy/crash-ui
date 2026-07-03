import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { Box, TextField, Button as MuiButton, Typography } from "@mui/material";
import { IconLink, IconLock } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useConnect } from "@/lib/connect";
import { useEndpointStore } from "@/stores/endpoint";
import { getFallbackBackendUrl } from "@/constants";

interface Props {
  submitLabel: string;
}

export interface ConnectFormHandle {
  selectEndpoint: (id: string) => Promise<boolean>;
  autoLogin: (query: Record<string, unknown>, options?: { tryDefault?: boolean }) => Promise<void>;
}

// Single source of truth for connecting to a Mihomo backend. The landing entry
// and the Setup page reuse the same form so the connect flow never drifts.
const ConnectForm = forwardRef<ConnectFormHandle, Props>(function ConnectForm(
  { submitLabel },
  ref,
) {
  const { t } = useTranslation();
  const endpointStore = useEndpointStore();
  const formData = useMemo(() => ({ url: "", secret: "" }), []);
  const {
    endpointError,
    isSubmitting,
    probeState,
    probeTarget,
    defaultBackendURL,
    connect,
    selectEndpoint,
    autoLogin,
    markEngaged,
  } = useConnect(formData);

  const [status, setStatus] = useState<{
    dot: string;
    pulse: boolean;
    label: string;
    target: string;
  }>({
    dot: "rgba(170,180,190,0.6)",
    pulse: false,
    label: t("statusIdle"),
    target: "",
  });
  // Re-derive the status readout whenever any of the deps change.
  const compute = useCallback(() => {
    let dot = "rgba(170,180,190,0.6)";
    let pulse = false;
    let label = t("statusIdle");
    let target = "";
    if (isSubmitting) {
      dot = "#74C0E1";
      pulse = true;
      label = t("statusConnecting");
      target = formData.url;
    } else if (endpointError === "mixed_content") {
      label = t("statusBlocked");
    } else if (endpointError === "auth_error") {
      dot = "#E85C4D";
      label = t("statusAuthError");
      target = formData.url;
    } else if (endpointError === "network_error") {
      dot = "#E85C4D";
      label = t("statusError");
      target = formData.url;
    } else if (probeState === "probing") {
      dot = "#74C0E1";
      pulse = true;
      label = t("statusProbing");
      target = probeTarget;
    } else if (probeState === "unreachable") {
      dot = "#E8B577";
      label = t("statusUnreachable");
      target = probeTarget;
    }

    setStatus({ dot, pulse, label, target });
  }, [endpointError, isSubmitting, probeState, probeTarget, formData.url, formData.secret, t]);

  // Re-run when deps change so the status readout stays in sync.
  useEffect(() => {
    compute();
  }, [compute]);

  useImperativeHandle(
    ref,
    () => ({
      selectEndpoint: (id) => selectEndpoint(id, formData),
      autoLogin: (query, options) => autoLogin(query, formData, options),
    }),
    [autoLogin, selectEndpoint, formData, endpointStore, t],
  );

  return (
    <Box>
      <Box sx={{ mb: 2.5, display: "flex", flexDirection: "column", gap: 0.5 }} role="status">
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box
            component="span"
            sx={{
              position: "relative",
              display: "inline-flex",
              width: 10,
              height: 10,
              flexShrink: 0,
            }}
          >
            {status.pulse ? (
              <Box
                component="span"
                sx={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  opacity: 0.5,
                  backgroundColor: status.dot,
                  animation: "crsh-ping 1.5s linear infinite",
                }}
              />
            ) : null}
            <Box
              component="span"
              sx={{
                position: "relative",
                display: "inline-flex",
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: status.dot,
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {status.label}
          </Typography>
        </Box>
        {status.target ? (
          <Typography
            variant="caption"
            className="tabular-nums"
            sx={{ pl: 2.5 }}
            title={status.target}
          >
            {status.target}
          </Typography>
        ) : null}
      </Box>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void connect(formData.url, formData.secret);
        }}
        onFocus={markEngaged}
        onChange={markEngaged}
        style={{ display: "flex", flexDirection: "column", gap: 20 }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 1 }}
          >
            <IconLink size={16} />
            {t("endpointURL")}
          </Typography>
          <TextField
            type="url"
            value={formData.url}
            onChange={(e) => {
              formData.url = e.target.value;
              compute();
            }}
            placeholder="http(s)://{hostname}:{port}"
            size="small"
            fullWidth
            slotProps={{ htmlInput: { list: "defaultEndpoints", autoComplete: "url" } }}
          />
          <datalist id="defaultEndpoints">
            <option value={getFallbackBackendUrl()} />
            {defaultBackendURL && defaultBackendURL !== getFallbackBackendUrl() ? (
              <option value={defaultBackendURL} />
            ) : null}
            {endpointStore.endpointList.map((e) => (
              <option key={e.id} value={e.url} />
            ))}
          </datalist>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 1 }}
          >
            <IconLock size={16} />
            {t("secret")}
          </Typography>
          <TextField
            type="password"
            value={formData.secret}
            onChange={(e) => {
              formData.secret = e.target.value;
              compute();
            }}
            placeholder="secret"
            size="small"
            fullWidth
            autoComplete="current-password"
          />
          <Typography variant="caption" color="text.secondary">
            {t("secretHint")}
          </Typography>
        </Box>

        {endpointError === "mixed_content" ? (
          <Typography
            role="alert"
            sx={{
              fontSize: 14,
              p: 1.25,
              borderRadius: 1,
              color: "error.main",
              border: "1px solid",
              borderColor: "error.main",
              backgroundColor: "rgba(232,92,77,0.08)",
            }}
          >
            {t("mixedContentError")}
          </Typography>
        ) : null}

        <MuiButton type="submit" variant="contained" color="primary" fullWidth>
          {submitLabel}
        </MuiButton>
      </form>
    </Box>
  );
});

export default ConnectForm;
