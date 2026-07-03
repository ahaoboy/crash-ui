import { IconButton, Tooltip } from "@mui/material";
import { IconLanguage } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

const LABELS: Record<string, string> = { en: "EN", cn: "CN" };

export default function LangSwitcher(): React.ReactElement {
  const { i18n } = useTranslation();
  const cur = (i18n.language || "en") as "en" | "cn";
  const next = cur === "en" ? "cn" : "en";
  return (
    <Tooltip title={`${LABELS[cur]} → ${LABELS[next]}`}>
      <IconButton size="small" onClick={() => i18n.changeLanguage(next)}>
        <IconLanguage size={18} />
      </IconButton>
    </Tooltip>
  );
}
