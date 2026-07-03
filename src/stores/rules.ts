import { create } from "zustand";
import type { Rule, RuleProvider } from "@/types";
import { fetchRulesAPI, fetchRuleProvidersAPI, updateRuleProviderAPI } from "@/lib/api";

export interface RulesStoreState {
  rules: Rule[];
  ruleProviders: RuleProvider[];
  updateRules: () => Promise<void>;
  updateAllRuleProvider: () => Promise<void>;
  updateRuleProviderByName: (name: string) => Promise<void>;
}

export const useRulesStore = create<RulesStoreState>((set, get) => ({
  rules: [],
  ruleProviders: [],
  updateRules: async () => {
    const [{ rules: rulesData }, { providers }] = await Promise.all([
      fetchRulesAPI(),
      fetchRuleProvidersAPI(),
    ]);
    set({
      rules: Object.values(rulesData),
      ruleProviders: Object.values(providers),
    });
  },
  updateAllRuleProvider: async () => {
    await Promise.allSettled(get().ruleProviders.map((p) => updateRuleProviderAPI(p.name)));
    await get().updateRules();
  },
  updateRuleProviderByName: async (name) => {
    await updateRuleProviderAPI(name);
    await get().updateRules();
  },
}));
