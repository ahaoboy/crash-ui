import { IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import { IconPalette } from "@tabler/icons-react";
import { useState } from "react";
import { useConfigStore } from "@/stores/config";
import { CRASH_THEMES } from "@/theme/theme";

// Compact icon-button theme chooser bound to the config store; the registered
// theme name drives the global MUI theme via the AppShell.
export default function ThemeSwitcher(): React.ReactElement {
  const curTheme = useConfigStore((s) => s.curTheme);
  const setCurTheme = useConfigStore((s) => s.setCurTheme);
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  return (
    <>
      <Tooltip title="theme">
        <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)}>
          <IconPalette size={18} />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {CRASH_THEMES.map((name) => (
          <MenuItem
            key={name}
            selected={name === curTheme}
            onClick={() => {
              setCurTheme(name);
              setAnchor(null);
            }}
            sx={{ textTransform: "capitalize" }}
          >
            {name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
