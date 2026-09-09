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
import { DEFAULT_SCRIPT_CONTENT } from "@/constants";
import { controlErrorMessage } from "@/utils/controlError";
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
  const [error, setError] = useState("");
  // Seed from the agent's recorded active id so the badge survives a reload
  // instead of resetting to "none active" each session.
  const [activeBaseId, setActiveBaseId] = useState<string | undefined>(undefined);

  const canUse = hasFeature("profiles");

  const refresh = () => {
    if (!canUse) return Promise.resolve();
    return getControlApi()
      .listProfiles()
      .then((list) => {
        setProfiles(list);
        // Sync the active marker from the source of truth so activation done
        // outside this page (tray, scheduler, a prior session) is reflected.
        const active = list.find(
          (p) => p.active && p.type !== "merge" && p.type !== "script",
        );
        if (active) {
          setActiveBaseId(active.id);
        } else if (list.some((p) => p.active === false)) {
          // The backend explicitly reports no active base — clear the marker.
          // Skip when the flag is absent entirely (older backends).
          setActiveBaseId(undefined);
        }
      })
      .catch((e) => setError(controlErrorMessage(e)));
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUse]);

  const run = async (action: () => Promise<unknown>) => {
    setError("");
    try {
      await action();
    } catch (e) {
      setError(controlErrorMessage(e));
    }
  };

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
                  await refresh();
                  setUrl("");
                  setName("");
                } catch (e) {
                  setError(controlErrorMessage(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t("importProfile")}
            </MuiButton>
            <MuiButton
              variant="outlined"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await getControlApi().createProfile({
                    name: `script-${Date.now()}`,
                    type: "script",
                    content: DEFAULT_SCRIPT_CONTENT,
                  });
                  await refresh();
                })
              }
            >
              {t("newScript")}
            </MuiButton>
          </Stack>
        </CardContent>
      </Card>
      {error ? (
        <Typography variant="body2" color="error" sx={{ mb: 1 }}>
          {error}
        </Typography>
      ) : null}
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
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }} useFlexGap>
                  {p.type === "remote" ? (
                    <MuiButton
                      size="small"
                      onClick={() =>
                        run(async () => {
                          await getControlApi().refreshAndActivateProfile(p.id);
                          await refresh();
                        })
                      }
                    >
                      {t("profilesRefreshAndApply")}
                    </MuiButton>
                  ) : null}
                  <MuiButton
                    size="small"
                    onClick={() =>
                      run(async () => {
                        await getControlApi().activateProfile(p.id);
                        setActiveBaseId(p.id);
                        await refresh();
                      })
                    }
                  >
                    {t("activate")}
                  </MuiButton>
                  <MuiButton
                    size="small"
                    color="error"
                    onClick={() =>
                      run(async () => {
                        await getControlApi().deleteProfile(p.id);
                        await refresh();
                      })
                    }
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
                  } catch (e) {
                    setError(controlErrorMessage(e));
                  }
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip size="small" label={p.type} />
                  {p.id === activeBaseId ? (
                    <Chip size="small" color="primary" label={t("activate")} />
                  ) : null}
                  <Typography variant="body2">{p.name}</Typography>
                  {p.type === "remote" ? (
                    <Typography variant="caption" color="text.secondary">
                      {p.updateInterval
                        ? t("profilesAutoUpdateMinutes", { n: p.updateInterval })
                        : t("profilesAutoUpdateOff")}
                    </Typography>
                  ) : null}
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
