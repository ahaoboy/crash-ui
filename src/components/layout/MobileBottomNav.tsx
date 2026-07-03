import { styled } from "@mui/material/styles";
import { Box, Paper } from "@mui/material";
import {
  IconHome,
  IconGlobe,
  IconRuler,
  IconNetwork,
  IconPlus,
  IconX,
  IconChartAreaLine,
  IconFileStack,
  IconSettings,
  IconRoute,
} from "@tabler/icons-react";
import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useControlInfo } from "@/lib/controlInfo";

const Bar = styled(Paper)(({ theme }) => ({
  position: "fixed",
  bottom: theme.spacing(1.5),
  left: theme.spacing(1),
  right: theme.spacing(1),
  [theme.breakpoints.up("sm")]: { left: theme.spacing(2), right: theme.spacing(2) },
  margin: "0 auto",
  maxWidth: 520,
  width: "auto",
  borderRadius: 22,
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  height: 60,
  zIndex: 1100,
  padding: 0,
  [theme.breakpoints.up("lg")]: { display: "none" },
  overflow: "visible",
}));

const Cell = styled(NavLink)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 2,
  textDecoration: "none",
  color: theme.palette.text.secondary,
  padding: 0,
  position: "relative",
  flexShrink: 0,
  "&.active": { color: theme.palette.primary.main },
  "&:active": { transform: "scale(0.92)" },
  transition: "transform 160ms ease",
}));

const Fab = styled("button", { shouldForwardProp: (p) => p !== "$active" })<{ $active?: boolean }>(
  ({ theme, $active }) => ({
    position: "relative",
    top: -10,
    width: 52,
    height: 52,
    borderRadius: 18,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    cursor: "pointer",
    backgroundColor: $active
      ? theme.palette.primary.main
      : theme.palette.mode === "dark"
        ? "rgba(255,255,255,0.10)"
        : "rgba(0,0,0,0.06)",
    color: $active ? theme.palette.primary.contrastText : theme.palette.text.primary,
    boxShadow: $active ? `0 6px 22px ${theme.palette.primary.main}40` : "none",
    transition: "transform 200ms ease",
    "&:active": { transform: "scale(0.92)" },
  }),
);

interface Item {
  href: string;
  label: string;
  icon: React.ReactNode;
  primary?: boolean;
}

// Mobile-first bottom navigation: 4 primary items + a center FAB containing
// secondary routes. Mirrors metacubexd's MobileBottomNav affordance.
export default function MobileBottomNav(): React.ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  const hasAgent = useControlInfo((s) => s.hasAgent);
  const hasProfileFeature = useControlInfo((s) => s.hasFeature("profiles"));
  const [open, setOpen] = useState(false);

  const primary: Item[] = [
    { href: "/overview", label: t("overview"), icon: <IconHome size={20} />, primary: true },
    { href: "/proxies", label: t("proxies"), icon: <IconGlobe size={20} />, primary: true },
    { href: "/rules", label: t("rules"), icon: <IconRuler size={20} />, primary: true },
    {
      href: "/connections",
      label: t("connections"),
      icon: <IconNetwork size={20} />,
      primary: true,
    },
  ];
  const secondary: Item[] = [
    { href: "/traffic", label: t("dataUsage"), icon: <IconChartAreaLine size={18} /> },
    { href: "/logs", label: t("logs"), icon: <IconFileStack size={18} /> },
    { href: "/config", label: t("config"), icon: <IconSettings size={18} /> },
  ];
  if (hasProfileFeature)
    secondary.push({ href: "/profiles", label: t("profiles"), icon: <IconRoute size={18} /> });
  if (hasAgent)
    secondary.push({ href: "/control", label: t("controlCenter"), icon: <IconRoute size={18} /> });

  const secondaryActive = secondary.some((s) => s.href === location.pathname);

  return (
    <Bar elevation={4}>
      <Labelled item={primary[0]!} />
      <Labelled item={primary[1]!} />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <Fab $active={open || secondaryActive} aria-label="more" onClick={() => setOpen((v) => !v)}>
          {open ? <IconX size={22} /> : <IconPlus size={22} />}
        </Fab>
        {open ? (
          <Box
            onClick={() => setOpen(false)}
            sx={{
              position: "fixed",
              inset: 0,
              top: "-100vh",
              zIndex: 1099,
              display: { lg: "none" },
            }}
          />
        ) : null}
        {open ? (
          <Box
            sx={{
              position: "fixed",
              bottom: 80,
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: (t2) => t2.palette.background.paper,
              borderRadius: 16,
              padding: 1,
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              zIndex: 1101,
              boxShadow: 6,
              overflow: "hidden",
            }}
          >
            {secondary.map((s) => (
              <NavLink
                key={s.href}
                to={s.href}
                onClick={() => setOpen(false)}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 14px",
                  textDecoration: "none",
                  color: isActive ? "#E07A5F" : "inherit",
                  fontWeight: 500,
                  fontSize: 14,
                  whiteSpace: "nowrap",
                  borderRadius: 10,
                })}
              >
                {s.icon}
                {s.label}
              </NavLink>
            ))}
          </Box>
        ) : null}
      </Box>
      <Labelled item={primary[2]!} />
      <Labelled item={primary[3]!} />
    </Bar>
  );
}

function Labelled({ item }: { item: Item }): React.ReactElement {
  return (
    <Cell to={item.href}>
      {item.icon}
      <span style={{ fontSize: 10, fontWeight: 500 }}>{item.label}</span>
    </Cell>
  );
}
