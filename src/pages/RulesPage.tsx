import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Box,
  Chip,
  Stack,
  Typography,
  MenuItem,
  TextField as SelectField,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconBell, IconBellOff } from "@tabler/icons-react";
import { useRulesStore } from "@/stores/rules";
import { useConfigStore } from "@/stores/config";
import { getRuleFacets, filterRules, sortRulesByOrderingType } from "@/utils/proxy";
import { RULES_ORDERING_TYPE, RULES_ORDERING_TYPE_ORDER } from "@/constants";
import { toggleRuleDisabledAPI } from "@/lib/api";

// Searchable rule table with faceted type/policy filters, hit-count sort and a
// running-disable toggle (mihomo exposes this via PATCH /rules/disable).
export default function RulesPage(): React.ReactElement {
  const { t } = useTranslation();
  const rules = useRulesStore((s) => s.rules);
  const ruleProviders = useRulesStore((s) => s.ruleProviders);
  const updateAll = useRulesStore((s) => s.updateAllRuleProvider);
  const updateRules = useRulesStore((s) => s.updateRules);
  const ordering = useConfigStore((s) => s.rulesOrderingType);
  const setOrdering = (v: RULES_ORDERING_TYPE) => useConfigStore.setState({ rulesOrderingType: v });
  const typesFilter = useConfigStore((s) => s.rulesTypeFilter);
  const policiesFilter = useConfigStore((s) => s.rulesPolicyFilter);
  const statusFilter = useConfigStore((s) => s.rulesStatusFilter);
  const resetFilters = useConfigStore((s) => s.resetRulesFilters);
  const [keyword, setKeyword] = useState("");
  const [updatingAll, setUpdatingAll] = useState(false);

  useEffect(() => {
    void updateRules();
  }, [updateRules]);

  const facets = useMemo(
    () => ({
      types: getRuleFacets(rules, "type"),
      policies: getRuleFacets(rules, "proxy"),
    }),
    [rules],
  );

  const filtered = useMemo(() => {
    const cleaned = filterRules(rules, {
      types: typesFilter,
      policies: policiesFilter,
      status: statusFilter,
    });
    const sorted = sortRulesByOrderingType(cleaned, ordering);
    const kw = keyword.trim().toLowerCase();
    if (!kw) return sorted;
    return sorted.filter(
      (r) =>
        r.type.toLowerCase().includes(kw) ||
        r.payload.toLowerCase().includes(kw) ||
        r.proxy.toLowerCase().includes(kw),
    );
  }, [rules, typesFilter, policiesFilter, statusFilter, ordering, keyword]);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        {t("rules")}
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder={t("search")}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          sx={{ minWidth: 220 }}
        />
        <SelectField
          select
          size="small"
          label="sort"
          value={ordering}
          onChange={(e) => setOrdering(e.target.value as RULES_ORDERING_TYPE)}
        >
          {RULES_ORDERING_TYPE_ORDER.map((o) => (
            <MenuItem key={String(o)} value={o as unknown as string}>
              {o}
            </MenuItem>
          ))}
        </SelectField>
        <ToggleButtonGroup
          size="small"
          value={statusFilter}
          exclusive
          onChange={(_, v) => v && useConfigStore.setState({ rulesStatusFilter: v })}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="enabled">Enabled</ToggleButton>
          <ToggleButton value="disabled">Disabled</ToggleButton>
        </ToggleButtonGroup>
        <Chip label={`Types: ${typesFilter.length}`} onClick={resetFilters} />
        <Chip label={`Policies: ${policiesFilter.length}`} />
      </Stack>

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="overline" color="text.secondary">
            Type facets
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
            {facets.types.map((f) => (
              <Chip
                key={f.value}
                label={`${f.value} · ${f.count}`}
                color={typesFilter.includes(f.value) ? "primary" : "default"}
                variant={typesFilter.includes(f.value) ? "filled" : "outlined"}
                onClick={() => {
                  const next = typesFilter.includes(f.value)
                    ? typesFilter.filter((v) => v !== f.value)
                    : [...typesFilter, f.value];
                  useConfigStore.setState({ rulesTypeFilter: next });
                }}
              />
            ))}
          </Stack>
        </CardContent>
      </Card>

      <TableContainer component={Card} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>{t("type")}</TableCell>
              <TableCell>{t("host")}</TableCell>
              <TableCell>{t("rules")}</TableCell>
              <TableCell align="right">Hits</TableCell>
              <TableCell align="right">{t("close")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.index} hover>
                <TableCell>{r.index}</TableCell>
                <TableCell>
                  <Chip size="small" label={r.type} />
                </TableCell>
                <TableCell>{r.payload || "—"}</TableCell>
                <TableCell>
                  <Chip size="small" label={r.proxy} />
                </TableCell>
                <TableCell align="right" className="tabular-nums">
                  {r.extra?.hitCount ?? 0}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={async () => {
                      const disabled = !r.extra?.disabled;
                      await toggleRuleDisabledAPI(r.index, disabled);
                      await updateRules();
                    }}
                    title={r.extra?.disabled ? "Enable" : "Disable"}
                  >
                    {r.extra?.disabled ? <IconBellOff size={14} /> : <IconBell size={14} />}
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {ruleProviders.length > 0 ? (
        <Box sx={{ mt: 2 }}>
          <Typography variant="overline" color="text.secondary">
            {t("ruleProviders")}
          </Typography>
          {ruleProviders.map((p) => (
            <Chip
              key={p.name}
              label={`${p.name} · ${p.ruleCount}`}
              sx={{ mr: 1, mt: 1 }}
              onClick={async () => {
                setUpdatingAll(true);
                await useRulesStore.getState().updateRuleProviderByName(p.name);
                setUpdatingAll(false);
              }}
            />
          ))}
          <Chip
            label="Update all"
            variant="outlined"
            sx={{ ml: 1, mt: 1 }}
            onClick={async () => {
              setUpdatingAll(true);
              await updateAll();
              setUpdatingAll(false);
            }}
            disabled={updatingAll}
          />
        </Box>
      ) : null}
    </Box>
  );
}
