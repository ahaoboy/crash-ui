import { Typography, Box } from "@mui/material";
import { APP_VERSION, getAppCommit } from "@/config/global";

export default function Versions(): React.ReactElement {
  const commit = getAppCommit();
  return (
    <Box sx={{ textAlign: "center", py: 0.5 }}>
      <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 11, display: "block" }}>
        v{APP_VERSION}
      </Typography>
      {commit ? (
        <Typography
          variant="caption"
          title={commit}
          sx={{
            color: "text.disabled",
            fontSize: 10,
            display: "block",
            fontFamily: "monospace",
            opacity: 0.7,
            lineHeight: 1.4,
          }}
        >
          {commit}
        </Typography>
      ) : null}
    </Box>
  );
}
