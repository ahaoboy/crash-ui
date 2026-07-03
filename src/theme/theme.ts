import {
  createTheme,
  type Theme,
  type PaletteMode,
  type PaletteOptions,
} from "@mui/material/styles";
import { THEMES, type ThemeName } from "@/constants";

// Mapping from the upstream daisyUI theme name to an MUI palette. MUI has no
// concept of 32 daisyUI palettes, so we collapse them onto a small handful of
// hand-tuned dark/light presets. "sunset" (the shipped default) drives the
// canonical dark slate + warm terracotta accent from DESIGN.md.

interface Preset {
  mode: PaletteMode;
  primary: string;
  secondary: string;
  error: string;
  warning: string;
  success: string;
  background: { default: string; paper: string };
  text: { primary: string; secondary: string };
}

const SUNSET: Preset = {
  mode: "dark",
  primary: "#E07A5F", // terracotta signal
  secondary: "#E76F88", // console rose
  error: "#F0887A",
  warning: "#E8B577",
  success: "#8DD3A6",
  background: { default: "#202127", paper: "#242429" },
  text: { primary: "#D5D9DD", secondary: "#9AA2AD" },
};

const NORD: Preset = {
  mode: "dark",
  primary: "#88C0D0",
  secondary: "#81A1C1",
  error: "#BF616A",
  warning: "#EBCB8B",
  success: "#A3BE8C",
  background: { default: "#2E3440", paper: "#3B4252" },
  text: { primary: "#ECEFF4", secondary: "#D8DEE9" },
};

const LIGHT: Preset = {
  mode: "light",
  primary: "#E07A5F",
  secondary: "#E76F88",
  error: "#D04C3A",
  warning: "#D8993A",
  success: "#3FA56E",
  background: { default: "#F7F7F8", paper: "#FFFFFF" },
  text: { primary: "#1E1F22", secondary: "#5B6066" },
};

const CYBERPUNK: Preset = {
  mode: "dark",
  primary: "#FF2F87",
  secondary: "#00E1FF",
  error: "#FF2A4D",
  warning: "#FFE45E",
  success: "#22FF88",
  background: { default: "#0B0120", paper: "#15043A" },
  text: { primary: "#F3E9FF", secondary: "#B58BE6" },
};

// All other daisyUI themes collapse onto sunset (the shipped default); the
// name still marks which preset the user chose so the user can change later.
function presetFor(name: ThemeName): Preset {
  switch (name) {
    case "sunset":
    case "dracula":
    case "black":
    case "dim":
    case "dark":
    case "synthwave":
    case "business":
    case "night":
      return SUNSET;
    case "nord":
      return NORD;
    case "cyberpunk":
    case "fantasy":
    case "halloween":
    case "acid":
      return CYBERPUNK;
    case "light":
    case "garden":
    case "winter":
    case "pastel":
    case "lemonade":
    case "cupcake":
    case "bumblebee":
    case "corporate":
    case "emerald":
    case "forest":
    case "coffee":
      return LIGHT;
    default:
      return SUNSET;
  }
}

export function createCrashTheme(name: ThemeName): Theme {
  const preset = presetFor(name);
  const paletteOptions: PaletteOptions = {
    mode: preset.mode,
    primary: { main: preset.primary },
    secondary: { main: preset.secondary },
    error: { main: preset.error },
    warning: { main: preset.warning },
    success: { main: preset.success },
    background: preset.background,
    text: preset.text,
  };
  return createTheme({
    palette: paletteOptions,
    typography: {
      fontFamily:
        "Ubuntu, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif",
      fontSize: 14,
      h1: { fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.01em" },
      h2: { fontSize: "1.25rem", fontWeight: 700 },
      h3: { fontSize: "1rem", fontWeight: 500 },
      button: { textTransform: "none" as never, fontWeight: 500 },
    },
    shape: { borderRadius: 8 },
    components: {
      MuiCssBaseline: { styleOverrides: { body: { overscrollBehaviorY: "none" } } },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            transition:
              "transform 120ms cubic-bezier(0.34, 1.4, 0.64, 1), background-color 120ms ease",
          },
        },
      },
      MuiPaper: {
        styleOverrides: { rounded: { borderRadius: 16 } },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { borderRadius: 16 } },
      },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
      MuiOutlinedInput: { styleOverrides: { notchedOutline: { borderWidth: 1 } } },
      MuiTableCell: { styleOverrides: { root: { fontFamily: "inherit" } } },
    },
  });
}

export const CRASH_THEMES: ThemeName[] = [...THEMES];
