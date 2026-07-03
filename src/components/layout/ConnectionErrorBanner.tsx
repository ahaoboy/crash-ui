import { useEffect, useState } from "react";
import { Box, Button } from "@mui/material";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useEndpointStore } from "@/stores/endpoint";
import { useKernelStore } from "@/stores/kernel";
import { useControlInfo } from "@/lib/controlInfo";
import { fetchBackendVersionAPI } from "@/lib/api";

// Fixed banner that surfaces a backend-unreachable state once the control probe
// resolves. Skipped in mock mode and (on desktop) when the managed kernel is
// intentionally stopped — matches City 21's ConnectionErrorBanner logic.
export default function ConnectionErrorBanner(): React.ReactElement | null {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const ready = useControlInfo((s) => s.ready);
  const hasKernelControl = useControlInfo((s) => s.hasFeature("kernel-control"));
  const kernelStatus = useKernelStore((s) => s.state?.status);
  const endpoint = useEndpointStore((s) => s.currentEndpoint());
  const setSelected = useEndpointStore((s) => s.setSelectedEndpoint);
  const [isError, setIsError] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let active = true;
    if (!ready || !endpoint) {
      setIsError(false);
      return;
    }
    if (hasKernelControl && kernelStatus !== "running") {
      setIsError(false);
      return;
    }
    setRetrying(true);
    fetchBackendVersionAPI()
      .then(() => {
        if (active) setIsError(false);
      })
      .catch(() => {
        if (active) setIsError(true);
      })
      .finally(() => {
        if (active) setRetrying(false);
      });
    return () => {
      active = false;
    };
  }, [ready, endpoint, hasKernelControl, kernelStatus]);

  if (!isError) return null;

  return (
    <Box
      role="alert"
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        px: 3,
        py: 1.5,
        backgroundColor: "error.main",
        color: "error.contrastText",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
        <IconAlertTriangle size={20} />
        <span
          style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {t("connectionError")}
        </span>
        {endpoint ? (
          <Box
            component="span"
            sx={{ display: { xs: "none", sm: "inline" }, fontSize: 12, opacity: 0.85 }}
          >
            {endpoint.url}
          </Box>
        ) : null}
      </Box>
      <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
        <Button
          color="inherit"
          size="small"
          disabled={retrying}
          onClick={() => {
            setRetrying(true);
            fetchBackendVersionAPI()
              .then(() => setIsError(false))
              .catch(() => setIsError(true))
              .finally(() => setRetrying(false));
          }}
        >
          {t("retry")}
        </Button>
        <Button
          color="inherit"
          size="small"
          variant="outlined"
          onClick={() => {
            setSelected("");
            navigate("/setup");
          }}
        >
          {t("switchEndpoint")}
        </Button>
      </Box>
    </Box>
  );
}
