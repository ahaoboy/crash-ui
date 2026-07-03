import { MenuItem, Select, type SelectProps } from "@mui/material";
import { useTranslation } from "react-i18next";

const LANGS = [
  { code: "en", label: "English" },
  { code: "zh", label: "简体中文" },
  { code: "ru", label: "Русский" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "fr", label: "Français" },
];

// Language picker — only English ships with translations today, but switching
// updates i18next immediately so future locales drop in without UI changes.
export default function LangSwitcher(props: Partial<SelectProps<string>>): React.ReactElement {
  const { i18n } = useTranslation();
  return (
    <Select
      size="small"
      value={i18n.language || "en"}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      variant="outlined"
      sx={{ minWidth: 110 }}
      {...props}
    >
      {LANGS.map((l) => (
        <MenuItem key={l.code} value={l.code}>
          {l.label}
        </MenuItem>
      ))}
    </Select>
  );
}
