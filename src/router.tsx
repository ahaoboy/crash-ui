import { Navigate, createHashRouter, redirect, type RouteObject } from "react-router-dom";
import { useEndpointStore } from "@/stores/endpoint";
import DefaultLayout from "@/components/layout/DefaultLayout";
import BlankLayout from "@/components/layout/BlankLayout";
import IndexPage from "@/pages/IndexPage";
import SetupPage from "@/pages/SetupPage";
import OverviewPage from "@/pages/OverviewPage";
import ProxiesPage from "@/pages/ProxiesPage";
import ConnectionsPage from "@/pages/ConnectionsPage";
import LogsPage from "@/pages/LogsPage";
import RulesPage from "@/pages/RulesPage";
import TrafficPage from "@/pages/TrafficPage";
import ProfilesPage from "@/pages/ProfilesPage";
import ConfigPage from "@/pages/ConfigPage";
import ControlPage from "@/pages/ControlPage";

// Route guard: redirect to "/" when no endpoint is configured.
function endpointGuard(): null | Response {
  const { selectedEndpoint } = useEndpointStore.getState();
  if (!selectedEndpoint) throw redirect("/");
  return null;
}

const routes: RouteObject[] = [
  {
    path: "/",
    element: <BlankLayout />,
    children: [
      { index: true, element: <IndexPage /> },
      { path: "setup", element: <SetupPage /> },
    ],
  },
  {
    element: <DefaultLayout />,
    loader: endpointGuard,
    children: [
      { path: "overview", element: <OverviewPage /> },
      { path: "proxies", element: <ProxiesPage /> },
      { path: "rules", element: <RulesPage /> },
      { path: "connections", element: <ConnectionsPage /> },
      { path: "logs", element: <LogsPage /> },
      { path: "config", element: <ConfigPage /> },
      { path: "traffic", element: <TrafficPage /> },
      { path: "profiles", element: <ProfilesPage /> },
      { path: "control", element: <ControlPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
];

export const router = createHashRouter(routes);
