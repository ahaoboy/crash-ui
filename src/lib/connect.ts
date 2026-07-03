import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEndpointStore } from "@/stores/endpoint";
import { checkEndpointAPI } from "./api";
import { getFallbackBackendUrl } from "@/constants";
import { getDefaultBackendURL } from "@/config/global";
import { randomUUID, transformEndpointURL } from "@/utils/format";
import { debug } from "@/utils/debug";

export type ProbeState = "idle" | "probing" | "unreachable";
export type EndpointError = "mixed_content" | "auth_error" | "network_error" | null;
export type EndpointCheckErrorValue = EndpointError;

interface ConnectOptions {
  silent?: boolean;
  shouldNavigate?: () => boolean;
}

interface FormState {
  url: string;
  secret: string;
}

export function useConnect(formState?: FormState) {
  const navigate = useNavigate();
  const endpointStore = useEndpointStore();
  const userEngaged = useRef(false);

  const [endpointError, setEndpointError] = useState<EndpointError>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [probeState, setProbeState] = useState<ProbeState>("idle");
  const [probeTarget, setProbeTarget] = useState("");

  const defaultBackendURL = useMemo(() => {
    const fromEnv = getDefaultBackendURL();
    return fromEnv || getFallbackBackendUrl();
  }, []);

  function onSuccess(id: string): void {
    endpointStore.setSelectedEndpoint(id);
    navigate("/overview", { replace: true });
  }

  async function connect(
    url: string,
    secret: string,
    options: ConnectOptions = {},
  ): Promise<boolean> {
    const { silent = false, shouldNavigate } = options;
    if (!silent) {
      setSubmitting(true);
      setEndpointError(null);
    }
    try {
      const transformedURL = transformEndpointURL(url);
      debug.connect.log(`connect: probing ${transformedURL}`);
      const err = await checkEndpointAPI(transformedURL, secret);
      if (err) {
        debug.connect.error(`connect: probe failed for ${transformedURL}: ${err}`);
        if (!silent) setEndpointError(err);
        return false;
      }
      debug.connect.log(`connect: probe success for ${transformedURL}`);
      if (!shouldNavigate || shouldNavigate()) {
        const list = [...endpointStore.endpointList];
        const existing = list.find((e) => e.url === transformedURL);
        if (existing) {
          existing.secret = secret;
          existing.id = randomUUID();
        } else {
          list.unshift({ id: randomUUID(), url: transformedURL, secret });
        }
        endpointStore.setEndpointList(list);
        const id = list.find((e) => e.url === transformedURL)!.id;
        onSuccess(id);
      }
      return true;
    } finally {
      if (!silent) setSubmitting(false);
    }
  }

  async function selectEndpoint(id: string, formData: FormState): Promise<boolean> {
    const endpoint = endpointStore.endpointList.find((e) => e.id === id);
    if (!endpoint) return false;
    formData.url = endpoint.url;
    formData.secret = endpoint.secret;
    setSubmitting(true);
    setEndpointError(null);
    try {
      const err = await checkEndpointAPI(endpoint.url, endpoint.secret);
      if (err) {
        setEndpointError(err);
        return false;
      }
      onSuccess(id);
      return true;
    } finally {
      setSubmitting(false);
    }
  }

  async function autoLogin(
    query: Record<string, unknown>,
    formData: FormState,
    options: ConnectOptions & { tryDefault?: boolean } = {},
  ): Promise<void> {
    const { tryDefault = true, shouldNavigate } = options;
    const hostname = query?.hostname as string | undefined;
    if (hostname) {
      const protocol = query.http
        ? "http:"
        : query.https
          ? "https:"
          : typeof window !== "undefined"
            ? window.location.protocol
            : "http:";
      const port = query.port ? `:${query.port}` : "";
      formData.url = `${protocol}//${hostname}${port}`;
      formData.secret = (query.secret as string) || "";
      await connect(formData.url, formData.secret, { shouldNavigate });
      return;
    }
    if (tryDefault && endpointStore.endpointList.length === 0 && formState) {
      formData.url = defaultBackendURL;
      formData.secret = "";
      setProbeTarget(transformEndpointURL(defaultBackendURL));
      setProbeState("probing");
      const ok = await connect(formData.url, formData.secret, { silent: true, shouldNavigate });
      const engaged = shouldNavigate ? !shouldNavigate() : false;
      setProbeState(ok || engaged ? "idle" : "unreachable");
    }
  }

  function markEngaged(): void {
    userEngaged.current = true;
    setProbeState("idle");
    setProbeTarget("");
  }

  return {
    endpointError,
    setEndpointError,
    isSubmitting,
    setSubmitting,
    probeState,
    probeTarget,
    defaultBackendURL,
    connect,
    selectEndpoint,
    autoLogin,
    markEngaged,
    userEngaged,
  };
}
