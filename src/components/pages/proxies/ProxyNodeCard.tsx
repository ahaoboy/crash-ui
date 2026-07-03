import { Card, CardContent, Chip, Typography, Box, Stack } from "@mui/material";
import { useShallow } from "zustand/shallow";
import { useProxiesStore } from "@/stores/proxies";
import { formatProxyType as translateProxyType } from "@/utils/proxy";
import Latency from "@/components/common/Latency";
import { useTranslation } from "react-i18next";
import { useConfigStore } from "@/stores/config";
import { PROXIES_CARD_SIZE, PROXIES_CARD_SIZE_MIN_WIDTH, PROXIES_CARD_SIZE_GAP } from "@/constants";

interface Props {
  proxyName: string;
  groupName: string;
  testUrl: string | null;
  isSelected: boolean;
  onSelect: () => void;
  onTest: () => void;
}

// Compact node card. Reads the per-node view from the proxies store, so the
// upstream Proxy model only needs to know the name — no synthesized objects.
export default function ProxyNodeCard({
  proxyName,
  groupName,
  testUrl,
  isSelected,
  onSelect,
  onTest,
}: Props): React.ReactElement {
  const { t } = useTranslation();
  const node = useProxiesStore(useShallow((s) => s.getNode(proxyName)));
  const cardSize = useConfigStore((s) => s.proxiesCardSize) ?? PROXIES_CARD_SIZE.COMFORTABLE;
  const minWidth = PROXIES_CARD_SIZE_MIN_WIDTH[cardSize];
  const gap = PROXIES_CARD_SIZE_GAP[cardSize];

  return (
    <Card
      variant="outlined"
      onClick={onSelect}
      sx={{
        cursor: "pointer",
        minWidth,
        flex: `1 0 ${minWidth}px`,
        maxWidth: minWidth * 2,
        m: `${gap / 2}px`,
        borderRadius: 2,
        borderColor: isSelected ? "primary.main" : "divider",
        borderWidth: isSelected ? 2 : 1,
        transition: "transform 120ms cubic-bezier(0.34,1.4,0.64,1)",
        "&:hover": { transform: "translateY(-2px)" },
      }}
    >
      <CardContent
        sx={{
          p:
            cardSize === PROXIES_CARD_SIZE.TIGHT
              ? 0.75
              : cardSize === PROXIES_CARD_SIZE.COMPACT
                ? 1
                : 1.5,
        }}
      >
        <Stack spacing={0.5}>
          <Typography
            variant="body2"
            noWrap
            sx={{
              fontWeight: 500,
              color: isSelected ? "primary.main" : "text.primary",
            }}
            title={proxyName}
          >
            {proxyName}
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", flexWrap: "wrap" }}>
            {node ? (
              <>
                <Chip size="small" label={translateProxyType(node.type, t)} />
                {node.udp ? (
                  <Chip
                    size="small"
                    variant="outlined"
                    label="UDP"
                    sx={{ height: 18, fontSize: 10 }}
                  />
                ) : null}
                {node.xudp ? (
                  <Chip
                    size="small"
                    variant="outlined"
                    label="XUDP"
                    sx={{ height: 18, fontSize: 10 }}
                  />
                ) : null}
              </>
            ) : (
              <Chip size="small" label="—" />
            )}
            <Box sx={{ ml: "auto" }}>
              <Latency
                proxyName={proxyName}
                testUrl={testUrl}
                groupName={groupName}
                interactive
                onClick={onTest}
              />
            </Box>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
