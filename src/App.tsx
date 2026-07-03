import { useMemo } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { RouterProvider } from "react-router-dom";
import { createTheme_ } from "@/theme/theme";
import { useConfigStore } from "@/stores/config";
import { router } from "@/router";

export default function App(): React.ReactElement {
  const mode = useConfigStore((s) => s.themeMode);
  const theme = useMemo(() => createTheme_(mode), [mode]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
