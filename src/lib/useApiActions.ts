import { useState, useCallback } from "react";
import {
  reloadConfigFileAPI,
  restartBackendAPI,
  flushFakeIPAPI,
  flushDNSCacheAPI,
  updateGEODatabasesAPI,
} from "@/lib/api";

// Bundles the small batch of one-shot kernel-side operations the sidebar's
// quick actions surface. Returns busy flags alongside the action — same pattern
// as the upstream useConfigActions composable but with React state.
export function useApiActions() {
  const [reloading, setReloading] = useState(false);
  const [restarting, setRestarting] = useState(false);

  const reloadConfig = useCallback(async (): Promise<boolean> => {
    setReloading(true);
    try {
      return await reloadConfigFileAPI();
    } finally {
      setReloading(false);
    }
  }, []);

  const restartCore = useCallback(async (): Promise<boolean> => {
    setRestarting(true);
    try {
      return await restartBackendAPI();
    } finally {
      setRestarting(false);
    }
  }, []);

  const flushFakeIP = useCallback(() => flushFakeIPAPI(), []);
  const flushDNS = useCallback(() => flushDNSCacheAPI(), []);
  const updateGEO = useCallback(() => updateGEODatabasesAPI(), []);

  return { reloading, restarting, reloadConfig, restartCore, flushFakeIP, flushDNS, updateGEO };
}
