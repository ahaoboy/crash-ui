import { Box, Paper, Typography, List, ListItem, IconButton, Divider } from "@mui/material";
import { IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useEndpointStore } from "@/stores/endpoint";
import ConnectForm from "@/components/pages/connect/ConnectForm";

export default function SetupPage(): React.ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const endpointList = useEndpointStore((s) => s.endpointList);
  const removeEndpoint = useEndpointStore((s) => s.removeEndpoint);

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        overflowY: "auto",
        p: { xs: 2, sm: 3 },
        justifyContent: "center",
      }}
    >
      <Box sx={{ maxWidth: 560, width: "100%", mx: "auto", my: "auto" }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          {t("setup")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t("setupDescription")}
        </Typography>
        <ConnectForm submitLabel={t("connect")} />
        <Paper variant="outlined" sx={{ mt: 3, p: 0, overflow: "hidden" }}>
          <Typography variant="overline" sx={{ p: 1.5, display: "block", color: "text.secondary" }}>
            {t("savedEndpoints")}
          </Typography>
          {endpointList.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ px: 1.5, pb: 1.5 }}>
              —
            </Typography>
          ) : (
            <List dense disablePadding>
              {endpointList.map((e) => (
                <div key={e.id}>
                  <Divider />
                  <ListItem
                    disablePadding
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => removeEndpoint(e.id)}
                      >
                        <IconTrash size={16} />
                      </IconButton>
                    }
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        cursor: "pointer",
                        p: 1.5,
                      }}
                      onClick={() => navigate("/overview")}
                    >
                      <Typography variant="body2">{e.label || e.url}</Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontFamily: "monospace",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {e.url}
                      </Typography>
                    </Box>
                  </ListItem>
                </div>
              ))}
            </List>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
