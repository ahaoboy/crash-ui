import {
  Box,
  Typography,
  Stack,
  TextField,
  MenuItem,
  Button as MuiButton,
  Chip,
} from "@mui/material";
import { IconReload, IconBolt } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";
import { useProxiesStore } from "@/stores/proxies";
import { useConfigStore } from "@/stores/config";
import { sortProxiesByOrderingType, filterProxiesByName } from "@/utils/proxy";
import ProxyNodeCard from "@/components/pages/proxies/ProxyNodeCard";
import {
  PROXIES_DISPLAY_MODE,
  PROXIES_DISPLAY_MODE_ORDER,
  PROXIES_ORDERING_TYPE_ORDER,
  PROXIES_CARD_SIZE,
  PROXIES_ORDERING_TYPE as ORDERING,
} from "@/constants";

export default function ProxiesPage(): React.ReactElement {
  const { t } = useTranslation();
  const proxies = useProxiesStore(useShallow((s) => s.proxies));
  const proxyProviders = useProxiesStore(useShallow((s) => s.proxyProviders));
  const loaded = useProxiesStore((s) => s.proxiesLoaded);
  const fetchProxies = useProxiesStore((s) => s.fetchProxies);
  const selectProxyInGroup = useProxiesStore((s) => s.selectProxyInGroup);
  const proxyGroupLatencyTest = useProxiesStore((s) => s.proxyGroupLatencyTest);
  const proxyLatencyTest = useProxiesStore((s) => s.proxyLatencyTest);
  const updateAllProvider = useProxiesStore((s) => s.updateAllProvider);
  const getNowProxyNodeName = useProxiesStore((s) => s.getNowProxyNodeName);
  const getLatencyByName = useProxiesStore((s) => s.getLatencyByName);
  const isProxyGroup = useProxiesStore((s) => s.isProxyGroup);

  const ordering = useConfigStore((s) => s.proxiesOrderingType);
  const display = useConfigStore((s) => s.proxiesDisplayMode);
  const cardSize = useConfigStore((s) => s.proxiesCardSize);
  const hideUnavailable = useConfigStore((s) => s.hideUnAvailableProxies);
  const nameFilter = useConfigStore((s) => s.proxiesGroupNameFilter);
  const urlForLatencyTest = useConfigStore((s) => s.urlForLatencyTest);
  const qualityMap = useConfigStore((s) => s.latencyQualityMap)();

  const [keyword, setKeyword] = useState("");
  const [busyGroup, setBusyGroup] = useState<string | null>(null);

  useEffect(() => {
    void fetchProxies();
  }, [fetchProxies]);

  if (!loaded)
    return (
      <Typography variant="body2" color="text.secondary">
        {t("noProxiesYet")}
      </Typography>
    );
  if (proxies.length === 0)
    return (
      <Typography variant="body2" color="text.secondary">
        {t("noProxiesYet")}
      </Typography>
    );

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t("proxies")}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }} useFlexGap>
          <TextField
            select
            size="small"
            label={t("displayMode")}
            value={display as string}
            onChange={(e) =>
              useConfigStore.setState({
                proxiesDisplayMode: e.target.value as PROXIES_DISPLAY_MODE,
              })
            }
            sx={{ minWidth: 130 }}
          >
            {PROXIES_DISPLAY_MODE_ORDER.map((m) => (
              <MenuItem key={m as string} value={m as string}>
                {m}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="sort"
            value={ordering as string}
            onChange={(e) =>
              useConfigStore.setState({ proxiesOrderingType: e.target.value as ORDERING })
            }
            sx={{ minWidth: 160 }}
          >
            {PROXIES_ORDERING_TYPE_ORDER.map((o) => (
              <MenuItem key={o as string} value={o as string}>
                {o}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label={t("proxiesCardSize")}
            value={cardSize as string}
            onChange={(e) =>
              useConfigStore.setState({ proxiesCardSize: e.target.value as PROXIES_CARD_SIZE })
            }
            sx={{ minWidth: 140 }}
          >
            {[
              PROXIES_CARD_SIZE.COMFORTABLE,
              PROXIES_CARD_SIZE.COMPACT,
              PROXIES_CARD_SIZE.TIGHT,
            ].map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
          {proxyProviders.length > 0 ? (
            <MuiButton size="small" variant="outlined" onClick={() => void updateAllProvider()}>
              Update all providers
            </MuiButton>
          ) : null}
        </Stack>
      </Box>

      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          size="small"
          placeholder={t("search")}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          sx={{ minWidth: 220 }}
        />
        <TextField
          size="small"
          placeholder="filter (by stored default)"
          value={nameFilter}
          onChange={(e) => useConfigStore.setState({ proxiesGroupNameFilter: e.target.value })}
          sx={{ minWidth: 200 }}
        />
        <Chip
          label={hideUnavailable ? "show all" : "hide unavailable"}
          onClick={() => useConfigStore.setState({ hideUnAvailableProxies: !hideUnavailable })}
        />
      </Box>

      <Stack spacing={2}>
        {proxies.map((group) => {
          const members = filterProxiesByName(
            sortProxiesByOrderingType({
              proxyNames: group.all ?? [],
              orderingType: ordering,
              testUrl: group.testUrl ?? null,
              getLatencyByName,
              isProxyGroup,
              latencyQualityMap: qualityMap,
              urlForLatencyTest,
            }),
            keyword || nameFilter,
          );
          const filteredMembers = hideUnavailable
            ? members.filter(
                (n) =>
                  isProxyGroup(n) ||
                  getLatencyByName(n, group.testUrl ?? null) !== qualityMap.NOT_CONNECTED,
              )
            : members;
          const nowName = getNowProxyNodeName(group.name);

          return (
            <Box key={group.name}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1,
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 16 }}>
                  {group.name}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <MuiButton
                    size="small"
                    variant="outlined"
                    disabled={busyGroup === group.name}
                    onClick={async () => {
                      setBusyGroup(group.name);
                      try {
                        await proxyGroupLatencyTest(group.name);
                      } finally {
                        setBusyGroup(null);
                      }
                    }}
                    startIcon={<IconBolt size={14} />}
                  >
                    {t("testAllLatency")}
                  </MuiButton>
                  <MuiButton
                    size="small"
                    variant="outlined"
                    onClick={() => void fetchProxies()}
                    startIcon={<IconReload size={14} />}
                  >
                    Reload
                  </MuiButton>
                </Stack>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", mx: -0.5 }}>
                {filteredMembers.map((nodeName) => (
                  <ProxyNodeCard
                    key={nodeName}
                    proxyName={nodeName}
                    groupName={group.name}
                    testUrl={group.testUrl ?? null}
                    isSelected={nodeName === group.now || nodeName === nowName}
                    onSelect={() => void selectProxyInGroup(group, nodeName)}
                    onTest={() =>
                      void proxyLatencyTest(
                        nodeName,
                        "",
                        group.testUrl ?? null,
                        group.timeout ?? null,
                      )
                    }
                  />
                ))}
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
