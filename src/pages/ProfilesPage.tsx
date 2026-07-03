import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button as MuiButton,
  TextField,
  Chip,
  List,
  ListItem,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { getControlApi } from "@/lib/controlApi";
import { useControlInfo } from "@/lib/controlInfo";
import type { ProfileDetail, ProfileMeta } from "@/types/control";

// Profiles page: list + import URL + activate + delete.
export default function ProfilesPage(): React.ReactElement {
  const { t } = useTranslation();
  const hasFeature = useControlInfo((s) => s.hasFeature);
  const [profiles, setProfiles] = useState<ProfileMeta[]>([]);
  const [selected, setSelected] = useState<ProfileDetail | null>(null);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const canUse = hasFeature("profiles");

  useEffect(() => {
    if (!canUse) return;
    void getControlApi()
      .listProfiles()
      .then(setProfiles)
      .catch(() => {
        /* ignore */
      });
  }, [canUse]);

  if (!canUse) {
    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          {t("profiles")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("noProfilesYet")}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        {t("profiles")}
      </Typography>
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="overline" color="text.secondary">
            {t("importProfile")}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
            <TextField
              size="small"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              placeholder="name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ flex: { sm: 0, md: 1 } }}
              helperText={t("importProfileHint")}
            />
            <MuiButton
              variant="contained"
              disabled={busy || !url}
              onClick={async () => {
                setBusy(true);
                try {
                  await getControlApi().importProfile(url, name || undefined);
                  setProfiles(await getControlApi().listProfiles());
                  setUrl("");
                  setName("");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t("importProfile")}
            </MuiButton>
          </Stack>
        </CardContent>
      </Card>
      {profiles.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t("noProfilesYet")}
        </Typography>
      ) : (
        <List>
          {profiles.map((p) => (
            <ListItem
              key={p.id}
              divider
              secondaryAction={
                <Stack direction="row" spacing={1}>
                  <MuiButton
                    size="small"
                    onClick={async () => {
                      await getControlApi().activateProfile(p.id);
                    }}
                  >
                    Activate
                  </MuiButton>
                  <MuiButton
                    size="small"
                    color="error"
                    onClick={async () => {
                      await getControlApi().deleteProfile(p.id);
                      setProfiles(await getControlApi().listProfiles());
                    }}
                  >
                    {t("delete")}
                  </MuiButton>
                </Stack>
              }
            >
              <Box
                sx={{ flex: 1, cursor: "pointer" }}
                onClick={async () => {
                  try {
                    setSelected(await getControlApi().getProfile(p.id));
                  } catch {
                    /* ignore */
                  }
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip size="small" label={p.type} />
                  <Typography variant="body2">{p.name}</Typography>
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontFamily: "monospace", display: "block", noWrap: true } as never}
                >
                  {p.url || "—"}
                </Typography>
              </Box>
            </ListItem>
          ))}
        </List>
      )}
      {selected ? (
        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              {selected.meta.name}
            </Typography>
            <textarea
              defaultValue={selected.content}
              onBlur={async (e) => {
                await getControlApi().updateProfile(selected.meta.id, { content: e.target.value });
              }}
              style={{
                width: "100%",
                minHeight: 360,
                fontFamily: "monospace",
                fontSize: 12,
                background: "transparent",
                color: "inherit",
                border: "1px solid #444",
                borderRadius: 8,
                padding: 12,
              }}
            />
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <MuiButton
                size="small"
                onClick={async () => {
                  const r = await getControlApi().validateProfile(selected.meta.id);
                  alert(r.valid ? t("validateOk") : `${t("validateFailed")}: ${r.message}`);
                }}
              >
                {t("validate")}
              </MuiButton>
              <MuiButton size="small" color="error" onClick={() => setSelected(null)}>
                {t("close")}
              </MuiButton>
            </Stack>
          </CardContent>
        </Card>
      ) : null}
    </Box>
  );
}
