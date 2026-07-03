import { createTheme, type Theme } from "@mui/material/styles";

export type ThemeMode = "light" | "dark";

const palettes: Record<ThemeMode, { primary: string; bg: string; paper: string }> = {
  dark: { primary: "#E07A5F", bg: "#1a1a2e", paper: "#16213e" },
  light: { primary: "#E07A5F", bg: "#f5f5f5", paper: "#ffffff" },
};

export function createTheme_(mode: ThemeMode): Theme {
  const p = palettes[mode];
  return createTheme({
    palette: {
      mode,
      primary: { main: p.primary },
      background: { default: p.bg, paper: p.paper },
    },
    typography: {
      fontFamily:
        "Ubuntu, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif",
      fontSize: 14,
      h1: { fontSize: "1.5rem", fontWeight: 700 },
      h2: { fontSize: "1.25rem", fontWeight: 700 },
      h3: { fontSize: "1rem", fontWeight: 500 },
      button: { textTransform: "none" as never, fontWeight: 500 },
    },
    shape: { borderRadius: 8 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          "html,body,#root": { height: "100%" },
          body: { overscrollBehaviorY: "none", fontVariantNumeric: "tabular-nums" },
          "*": { boxSizing: "border-box" },
          ".tabular-nums": { fontVariantNumeric: "tabular-nums" },
          "@keyframes spin": { to: { transform: "rotate(360deg)" } },
          ".spin": { animation: "spin 0.8s linear infinite" },
          ".no-scrollbar::-webkit-scrollbar": { display: "none" },
          ".no-scrollbar": { scrollbarWidth: "none" },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            transition:
              "transform 120ms cubic-bezier(0.34,1.4,0.64,1), background-color 120ms ease",
          },
        },
      },
      MuiPaper: { styleOverrides: { rounded: { borderRadius: 16 } } },
      MuiCard: { defaultProps: { elevation: 0 }, styleOverrides: { root: { borderRadius: 16 } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
      MuiOutlinedInput: { styleOverrides: { notchedOutline: { borderWidth: 1 } } },
      MuiTableCell: { styleOverrides: { root: { fontFamily: "inherit" } } },
    },
  });
}
