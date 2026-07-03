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
        maxWidth: 300,
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
          <Box
            sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: isSelected ? "primary.main" : "text.primary",
              }}
              title={proxyName}
            >
              {proxyName}
            </Typography>
            <Latency
              proxyName={proxyName}
              testUrl={testUrl}
              groupName={groupName}
              interactive
              onClick={onTest}
            />
          </Box>
          {node ? (
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", flexWrap: "wrap" }}>
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
            </Box>
          ) : (
            <Chip size="small" label="—" />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
