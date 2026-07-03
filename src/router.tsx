import { Navigate, createHashRouter, redirect, type RouteObject } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";
import { isMockMode } from "@/config/global";
import { useEndpointStore } from "@/stores/endpoint";
import DefaultLayout from "@/components/layout/DefaultLayout";
import BlankLayout from "@/components/layout/BlankLayout";

// Lazy-loaded pages so each route ships its own chunk (matches the bundle
// optimization goal — log/proxies/connections pages only load on demand).
const IndexPage = lazy(() => import("@/pages/IndexPage"));
const SetupPage = lazy(() => import("@/pages/SetupPage"));
const OverviewPage = lazy(() => import("@/pages/OverviewPage"));
const ProxiesPage = lazy(() => import("@/pages/ProxiesPage"));
const ConnectionsPage = lazy(() => import("@/pages/ConnectionsPage"));
const LogsPage = lazy(() => import("@/pages/LogsPage"));
const RulesPage = lazy(() => import("@/pages/RulesPage"));
const TrafficPage = lazy(() => import("@/pages/TrafficPage"));
const ProfilesPage = lazy(() => import("@/pages/ProfilesPage"));
const ConfigPage = lazy(() => import("@/pages/ConfigPage"));
const ControlPage = lazy(() => import("@/pages/ControlPage"));

const SuspenseFallback = (
  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
    <CircularProgress />
  </Box>
);

function withSuspense(node: React.ReactNode): React.ReactNode {
  return <Suspense fallback={SuspenseFallback}>{node}</Suspense>;
}

// Route guard: redirect any non-connection route to "/" when no endpoint is
// configured (analogous to metacubexd's auth.global.ts middleware).
function endpointGuard(): null | Response {
  if (isMockMode()) return null;
  const { selectedEndpoint } = useEndpointStore.getState();
  if (!selectedEndpoint) throw redirect("/");
  return null;
}

const routes: RouteObject[] = [
  {
    path: "/",
    element: <BlankLayout />,
    children: [
      { index: true, element: withSuspense(<IndexPage />) },
      { path: "setup", element: withSuspense(<SetupPage />) },
    ],
  },
  {
    element: <DefaultLayout />,
    loader: endpointGuard,
    children: [
      { path: "overview", element: withSuspense(<OverviewPage />) },
      { path: "proxies", element: withSuspense(<ProxiesPage />) },
      { path: "rules", element: withSuspense(<RulesPage />) },
      { path: "connections", element: withSuspense(<ConnectionsPage />) },
      { path: "logs", element: withSuspense(<LogsPage />) },
      { path: "config", element: withSuspense(<ConfigPage />) },
      { path: "traffic", element: withSuspense(<TrafficPage />) },
      { path: "profiles", element: withSuspense(<ProfilesPage />) },
      { path: "control", element: withSuspense(<ControlPage />) },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
];

export const router = createHashRouter(routes);
