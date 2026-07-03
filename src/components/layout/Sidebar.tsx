import { Box, Button, Stack, styled } from "@mui/material";
import {
  IconHome,
  IconGlobe,
  IconRuler,
  IconNetwork,
  IconChartAreaLine,
  IconFileStack,
  IconSettings,
  IconFileCode,
  IconChevronsLeft,
  IconChevronsRight,
  IconReload,
  IconPower,
  IconMenu2,
  IconRoute,
} from "@tabler/icons-react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useMemo } from "react";
import { useConfigStore } from "@/stores/config";
import { useControlInfo } from "@/lib/controlInfo";
import { useApiActions } from "@/lib/useApiActions";
import LogoText from "@/components/common/LogoText";
import LangSwitcher from "@/components/common/LangSwitcher";
import ThemeSwitcher from "@/components/common/ThemeSwitcher";
import Versions from "@/components/common/Versions";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const Side = styled("aside")(({ theme }) => ({
  width: 208,
  flexShrink: 0,
  borderRight: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  display: "flex",
  flexDirection: "column",
  transition: "width 240ms cubic-bezier(0.34,1,0.64,1)",
  [theme.breakpoints.down("lg")]: { display: "none" },
}));

const SideBody = styled("div")(() => ({
  height: "100%",
  overflow: "hidden auto",
  display: "flex",
  flexDirection: "column",
  padding: 12,
}));

const NavButton = styled(NavLink, { shouldForwardProp: (p) => p !== "$active" })<{
  $active?: boolean;
}>(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 12px",
  borderRadius: 10,
  color: theme.palette.text.secondary,
  textDecoration: "none",
  fontWeight: 500,
  fontSize: 14,
  position: "relative",
  transition: "background-color 160ms ease, transform 120ms ease",
  "&:hover": {
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    transform: "translateX(2px)",
  },
  "&.active": {
    color: theme.palette.primary.main,
    backgroundColor:
      theme.palette.mode === "dark" ? "rgba(224,122,95,0.15)" : "rgba(224,122,95,0.10)",
  },
}));

// Desktop sidebar — collapsible rail with route items + quick kernel actions.
export default function Sidebar(): React.ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  const expanded = useConfigStore((s) => s.sidebarExpanded);
  const hasAgent = useControlInfo((s) => s.hasAgent);
  const hasProfileFeature = useControlInfo((s) => s.hasFeature("profiles"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const actions = useApiActions();

  const navItems = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [
      { href: "/overview", label: t("overview"), icon: <IconHome size={20} /> },
      { href: "/proxies", label: t("proxies"), icon: <IconGlobe size={20} /> },
      { href: "/rules", label: t("rules"), icon: <IconRuler size={20} /> },
      { href: "/connections", label: t("connections"), icon: <IconNetwork size={20} /> },
      { href: "/traffic", label: t("dataUsage"), icon: <IconChartAreaLine size={20} /> },
      { href: "/logs", label: t("logs"), icon: <IconFileStack size={20} /> },
      { href: "/config", label: t("config"), icon: <IconSettings size={20} /> },
    ];
    if (hasProfileFeature)
      items.push({ href: "/profiles", label: t("profiles"), icon: <IconFileCode size={20} /> });
    if (hasAgent)
      items.push({ href: "/control", label: t("controlCenter"), icon: <IconRoute size={20} /> });
    return items;
  }, [t, hasAgent, hasProfileFeature]);

  return (
    <Box sx={{ display: "flex", height: "100%", minHeight: 0 }}>
      <Side sx={{ width: expanded ? 208 : 64 }}>
        <SideBody>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 1.5,
              justifyContent: expanded ? "flex-start" : "center",
            }}
          >
            {expanded ? (
              <LogoText size={16} />
            ) : (
              <Box
                onClick={() => useConfigStore.setState({ sidebarExpanded: !expanded })}
                sx={{ cursor: "pointer", display: "flex" }}
              >
                <LogoText size={14} />
              </Box>
            )}
          </Box>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            color="inherit"
            onClick={() => useConfigStore.setState({ sidebarExpanded: !expanded })}
            sx={{
              mb: 1.5,
              borderColor: "divider",
              color: "text.secondary",
              minWidth: expanded ? undefined : 36,
            }}
          >
            {expanded ? <IconChevronsLeft size={16} /> : <IconChevronsRight size={16} />}
          </Button>

          <nav
            style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}
          >
            {navItems.map((item) => (
              <NavButton key={item.href} to={item.href} title={!expanded ? item.label : undefined}>
                <Box
                  sx={{
                    flexShrink: 0,
                    display: "flex",
                    justifyContent: expanded ? "flex-start" : "center",
                    width: expanded ? 24 : "100%",
                  }}
                >
                  {item.icon}
                </Box>
                {expanded ? (
                  <span
                    style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {item.label}
                  </span>
                ) : null}
              </NavButton>
            ))}
          </nav>

          <Box
            sx={{
              mt: 1.5,
              display: expanded ? "block" : "flex",
              flexDirection: expanded ? undefined : "column",
              gap: 1,
            }}
          >
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              fullWidth
              disabled={actions.reloading}
              onClick={async () => {
                if (await actions.reloadConfig()) window.location.reload();
              }}
              sx={{
                minWidth: expanded ? undefined : 36,
                mb: 1,
                borderColor: "divider",
                color: "text.secondary",
              }}
              title={t("reloadConfig")}
            >
              <IconReload size={16} className={actions.reloading ? "spin" : ""} />
              {expanded ? <span style={{ marginLeft: 8 }}>{t("reloadConfig")}</span> : null}
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="warning"
              fullWidth
              disabled={actions.restarting}
              onClick={async () => {
                if (!window.confirm(t("restartCoreConfirm"))) return;
                if (await actions.restartCore()) window.location.reload();
              }}
              sx={{
                minWidth: expanded ? undefined : 36,
                borderColor: (t2) => t2.palette.warning.main,
                color: "warning.main",
              }}
              title={t("restartCore")}
            >
              <IconPower size={16} className={actions.restarting ? "spin" : ""} />
              {expanded ? <span style={{ marginLeft: 8 }}>{t("restartCore")}</span> : null}
            </Button>
          </Box>

          <Box
            sx={{
              mt: 1.5,
              display: expanded ? "flex" : "flex",
              flexDirection: expanded ? undefined : "column",
              alignItems: expanded ? "row" : "center",
              gap: 1,
            }}
          >
            <LangSwitcher />
            <ThemeSwitcher />
          </Box>

          <Versions collapsed={!expanded} />
        </SideBody>
      </Side>

      {/* Mobile top app bar + drawer toggle */}
      <Box
        sx={{
          display: { xs: "flex", lg: "none" },
          alignItems: "center",
          gap: 1,
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          px: 2,
          backgroundColor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          zIndex: 1100,
        }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="open sidebar"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "inherit",
            display: location.pathname === "/setup" ? "none" : "inline-flex",
          }}
        >
          <IconMenu2 size={20} />
        </button>
        <LogoText size={16} />
        <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
          <LangSwitcher />
          <ThemeSwitcher />
        </Box>
      </Box>

      {mobileOpen ? (
        <Box
          onClick={() => setMobileOpen(false)}
          sx={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            zIndex: 1199,
            display: { lg: "none" },
          }}
        >
          <Stack
            spacing={1}
            onClick={(e) => e.stopPropagation()}
            sx={{
              width: 220,
              height: "100%",
              backgroundColor: "background.paper",
              px: 2,
              py: 2,
              overflowY: "auto",
            }}
          >
            <LogoText size={16} />
            {navItems.map((item) => (
              <NavButton key={item.href} to={item.href} onClick={() => setMobileOpen(false)}>
                {item.icon}
                <span>{item.label}</span>
              </NavButton>
            ))}
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
}
