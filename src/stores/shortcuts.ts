import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_SHORTCUTS } from "@/constants/shortcuts";
import type { ShortcutConfig } from "@/constants/shortcuts";

export interface ShortcutsStoreState {
  customShortcuts: Partial<ShortcutConfig>;
  shortcuts: ShortcutConfig;
  isHelpModalOpen: boolean;
  isOnboardingOpen: boolean;
  openHelpModal: () => void;
  closeHelpModal: () => void;
  toggleHelpModal: () => void;
  updateShortcut: (k: keyof ShortcutConfig, v: string) => void;
  resetToDefaults: () => void;
  setOnboardingOpen: (b: boolean) => void;
}

export const useShortcutsStore = create<ShortcutsStoreState>()(
  persist(
    (set, get) => ({
      customShortcuts: {},
      shortcuts: { ...DEFAULT_SHORTCUTS },
      isHelpModalOpen: false,
      isOnboardingOpen: false,
      openHelpModal: () => set({ isHelpModalOpen: true }),
      closeHelpModal: () => set({ isHelpModalOpen: false }),
      toggleHelpModal: () => set((s) => ({ isHelpModalOpen: !s.isHelpModalOpen })),
      updateShortcut: (k, v) => {
        const next = { ...get().customShortcuts, [k]: v };
        set({
          customShortcuts: next,
          shortcuts: { ...DEFAULT_SHORTCUTS, ...next },
        });
      },
      resetToDefaults: () => set({ customShortcuts: {}, shortcuts: { ...DEFAULT_SHORTCUTS } }),
      setOnboardingOpen: (b) => set({ isOnboardingOpen: b }),
    }),
    {
      name: "shortcuts-storage",
      partialize: (s) => ({ customShortcuts: s.customShortcuts }),
      merge: (persisted, current) => {
        const custom =
          (persisted as Partial<ShortcutsStoreState> | undefined)?.customShortcuts ?? {};
        return {
          ...current,
          customShortcuts: custom,
          shortcuts: { ...DEFAULT_SHORTCUTS, ...custom },
        };
      },
    },
  ),
);
