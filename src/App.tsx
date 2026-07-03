import { useMemo } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { RouterProvider } from "react-router-dom";
import { createCrashTheme } from "@/theme/theme";
import { useConfigStore } from "@/stores/config";
import { router } from "@/router";

// App root composes the global providers: MUI theme derived from the user's
// `curTheme` preference, the CSS baseline, the i18next mount (imported for
// side-effect at module scope) and the hash-router.
export default function App(): React.ReactElement {
  const curTheme = useConfigStore((s) => s.curTheme);
  const theme = useMemo(() => createCrashTheme(curTheme), [curTheme]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
