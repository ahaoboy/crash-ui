import { styled } from "@mui/material/styles";
import { Tooltip, Typography } from "@mui/material";
import { APP_VERSION } from "@/config/global";

const Root = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  padding: theme.spacing(0.5, 0),
  color: theme.palette.text.secondary,
  fontSize: 12,
  fontVariantNumeric: "tabular-nums",
}));

// Sidebar / footer version chip — quietly surfaces the dashboard version so a
// user can tell at a glance which build they're running.
export default function Versions({
  collapsed = false,
}: {
  collapsed?: boolean;
}): React.ReactElement {
  return (
    <Root>
      <Tooltip title={`crash-ui ${APP_VERSION}`}>
        <Typography variant="caption" color="text.secondary">
          {collapsed ? "v" : `v${APP_VERSION}`}
        </Typography>
      </Tooltip>
    </Root>
  );
}
