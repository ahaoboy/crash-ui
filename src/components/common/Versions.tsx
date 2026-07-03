import { Typography } from "@mui/material";
import { APP_VERSION } from "@/config/global";

export default function Versions(): React.ReactElement {
  return (
    <Typography
      variant="caption"
      sx={{ color: "text.disabled", textAlign: "center", fontSize: 11, py: 0.5 }}
    >
      v{APP_VERSION}
    </Typography>
  );
}
