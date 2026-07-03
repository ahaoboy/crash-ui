import { Box, Typography } from "@mui/material";
import { IconServer } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import ConnectForm from "@/components/pages/connect/ConnectForm";
import { useEndpointStore } from "@/stores/endpoint";
import { useConfigStore } from "@/stores/config";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useRef, type RefObject } from "react";
import type { ConnectFormHandle } from "@/components/pages/connect/ConnectForm";

export default function IndexPage(): React.ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const hasSavedEndpoints = useEndpointStore((s) => s.endpointList.length > 0);
  const currentEndpoint = useEndpointStore((s) => s.currentEndpoint());
  const defaultPage = useConfigStore((s) => s.defaultPage);
  const formRef = useRef<ConnectFormHandle>(null) as RefObject<ConnectFormHandle | null>;

  useEffect(() => {
    if (currentEndpoint) {
      navigate(`/${defaultPage || "overview"}`, { replace: true });
      return;
    }
    void formRef.current?.autoLogin(Object.fromEntries(params.entries()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        overflowY: "auto",
        p: 2,
      }}
    >
      <Box sx={{ maxWidth: 420, mx: "auto", width: "100%" }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box
            sx={{
              mx: "auto",
              mb: 2,
              width: 56,
              height: 56,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "primary.main",
              backgroundColor: (t2) =>
                t2.palette.mode === "dark" ? "rgba(224,122,95,0.12)" : "rgba(224,122,95,0.08)",
            }}
          >
            <IconServer size={28} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, fontSize: 30 }}>
            Crash<span style={{ color: "#E07A5F" }}>UI</span>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t("connectPrompt")}
          </Typography>
        </Box>
        <ConnectForm ref={formRef} submitLabel={t("connect")} />
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Typography
            component="a"
            href="#/setup"
            onClick={(e) => {
              e.preventDefault();
              navigate("/setup");
            }}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              fontSize: 14,
              color: "text.secondary",
              textDecoration: "none",
              "&:hover": { color: "text.primary" },
            }}
          >
            {hasSavedEndpoints ? t("savedEndpoints") : t("setup")}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
