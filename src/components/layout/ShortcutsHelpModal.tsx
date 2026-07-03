import { Dialog, DialogTitle, DialogContent, List, ListItem, Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/shallow";
import { useShortcutsStore } from "@/stores/shortcuts";
import { SHORTCUT_CATEGORIES, SHORTCUT_LABELS, formatShortcutKey } from "@/constants/shortcuts";

// Modal that lists the active keyboard shortcuts. Opened via the "?" key.
export default function ShortcutsHelpModal(): React.ReactElement {
  const { t } = useTranslation();
  const open = useShortcutsStore((s) => s.isHelpModalOpen);
  const close = useShortcutsStore((s) => s.closeHelpModal);
  const shortcuts = useShortcutsStore(useShallow((s) => s.shortcuts));

  return (
    <Dialog open={open} onClose={close} maxWidth="xs" fullWidth>
      <DialogTitle>{t("shortcuts.title")}</DialogTitle>
      <DialogContent dividers>
        {SHORTCUT_CATEGORIES.map((cat) => (
          <div key={cat.id} style={{ marginBottom: 16 }}>
            <Typography variant="overline" color="text.secondary">
              {t(cat.labelKey)}
            </Typography>
            <List dense disablePadding>
              {cat.shortcuts.map((action) => (
                <ListItem key={action} disableGutters>
                  <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                    <Typography variant="body2">{t(SHORTCUT_LABELS[action])}</Typography>
                    <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                      {formatShortcutKey(shortcuts[action as keyof typeof shortcuts] ?? "")}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          </div>
        ))}
      </DialogContent>
    </Dialog>
  );
}
