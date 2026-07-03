import { create } from "zustand";
import type { ControlFeature, ControlInfo } from "@/types/control";
import { getControlApi } from "./controlApi";

export interface ControlInfoState {
  hasAgent: boolean;
  features: ControlFeature[];
  info: ControlInfo | null;
  ready: boolean;
  hasFeature: (f: ControlFeature) => boolean;
  probe: () => void;
}

let started = false;

export const useControlInfo = create<ControlInfoState>((set, get) => ({
  hasAgent: false,
  features: [],
  info: null,
  ready: false,
  hasFeature: (f) => get().hasAgent && get().features.includes(f),
  probe: () => {
    if (started) return;
    started = true;
    const api = getControlApi();
    api
      .getInfo()
      .then((res) =>
        set({
          info: res,
          hasAgent: res.hasAgent === true,
          features: Array.isArray(res.features) ? res.features : [],
        }),
      )
      .catch(() => set({ hasAgent: false, features: [], info: null }))
      .finally(() => set({ ready: true }));
  },
}));
