import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Endpoint } from "@/types";

export interface EndpointStoreState {
  selectedEndpoint: string;
  endpointList: Endpoint[];
  setSelectedEndpoint: (id: string) => void;
  setEndpointList: (list: Endpoint[]) => void;
  addEndpoint: (e: Endpoint) => void;
  removeEndpoint: (id: string) => void;
  updateEndpoint: (id: string, updates: Partial<Endpoint>) => void;
  // Computed helpers (selectors)
  currentEndpoint: () => Endpoint | undefined;
  wsEndpointURL: () => string;
}

export const useEndpointStore = create<EndpointStoreState>()(
  persist(
    (set, get) => ({
      selectedEndpoint: "",
      endpointList: [],
      setSelectedEndpoint: (id) => set({ selectedEndpoint: id }),
      setEndpointList: (list) => set({ endpointList: list }),
      addEndpoint: (endpoint) => set((s) => ({ endpointList: [endpoint, ...s.endpointList] })),
      removeEndpoint: (id) =>
        set((s) => ({
          endpointList: s.endpointList.filter((e) => e.id !== id),
          selectedEndpoint: s.selectedEndpoint === id ? "" : s.selectedEndpoint,
        })),
      updateEndpoint: (id, updates) =>
        set((s) => ({
          endpointList: s.endpointList.map((e) =>
            e.id === id ? ({ ...e, ...updates } as Endpoint) : e,
          ),
        })),
      currentEndpoint: () => get().endpointList.find((e) => e.id === get().selectedEndpoint),
      wsEndpointURL: () => {
        const e = get().currentEndpoint();
        if (!e) return "";
        try {
          const parsed = new URL(e.url);
          if (parsed.protocol === "http:") parsed.protocol = "ws:";
          if (parsed.protocol === "https:") parsed.protocol = "wss:";
          const href = parsed.href;
          return href.endsWith("/") ? href.slice(0, -1) : href;
        } catch {
          return "";
        }
      },
    }),
    {
      name: "endpoint-storage",
      partialize: (s) => ({
        selectedEndpoint: s.selectedEndpoint,
        endpointList: s.endpointList,
      }),
    },
  ),
);
