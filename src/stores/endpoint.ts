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
          return new URL(e.url).href.replace(/^http/, "ws").replace(/\/$/, "");
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
