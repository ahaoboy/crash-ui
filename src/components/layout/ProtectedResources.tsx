import { useEffect } from "react";
import { Box } from "@mui/material";
import { useBackendWebSocket } from "@/lib/websocket";
import { useControlInfo } from "@/lib/controlInfo";
import { useKernelStore } from "@/stores/kernel";
import { useConfigStore } from "@/stores/config";

// Hidden component that opens the backend WebSockets when an endpoint is active
// and the kernel (when applicable) is running — mirrors metacubexd's
// ProtectedResources. Disconnects on unmount.
export default function ProtectedResources(): React.ReactElement {
  const ws = useBackendWebSocket();
  const ready = useControlInfo((s) => s.ready);
  const hasFeature = useControlInfo((s) => s.hasFeature);
  const kernelStatus = useKernelStore((s) => s.state?.status);
  const logLevel = useConfigStore((s) => s.logLevel);

  useEffect(() => {
    const shouldConnect = ready && (!hasFeature("kernel-control") || kernelStatus === "running");
    if (shouldConnect) ws.connect();
    else ws.disconnect();
    return () => ws.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, kernelStatus, hasFeature]);

  // Reopen logs socket when the log level changes.
  useEffect(() => {
    ws.reconnectLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logLevel]);

  return <Box aria-hidden sx={{ display: "none" }} />;
}
