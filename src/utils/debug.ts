type LogChannel = "api" | "ws" | "store" | "ctrl" | "connect" | "all";

function log(
  channel: LogChannel,
  level: "log" | "warn" | "error",
  message: string,
  ...args: unknown[]
): void {
  const prefix = `[crash-ui][${channel}]`;
  console[level](`${prefix} ${message}`, ...args);
}

export const debug = {
  api: {
    log: (msg: string, ...args: unknown[]) => log("api", "log", msg, ...args),
    error: (msg: string, ...args: unknown[]) => log("api", "error", msg, ...args),
  },
  ws: {
    log: (msg: string, ...args: unknown[]) => log("ws", "log", msg, ...args),
    error: (msg: string, ...args: unknown[]) => log("ws", "error", msg, ...args),
  },
  store: {
    log: (msg: string, ...args: unknown[]) => log("store", "log", msg, ...args),
    error: (msg: string, ...args: unknown[]) => log("store", "error", msg, ...args),
  },
  ctrl: {
    log: (msg: string, ...args: unknown[]) => log("ctrl", "log", msg, ...args),
    error: (msg: string, ...args: unknown[]) => log("ctrl", "error", msg, ...args),
  },
  connect: {
    log: (msg: string, ...args: unknown[]) => log("connect", "log", msg, ...args),
    error: (msg: string, ...args: unknown[]) => log("connect", "error", msg, ...args),
  },
};

/** Convenience: log an error with its full stack trace */
export function logError(channel: LogChannel, context: string, err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  log(channel, "error", `${context}: ${msg}`, err instanceof Error ? err : undefined);
}
