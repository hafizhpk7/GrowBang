import { Category, DEFAULT_WALLETS, FinanceConfig, Wallet } from "../types";

export type ConfigPatch =
  | { kind: "setBudget"; categoryId: string; amount: number | null } // null removes the budget
  | { kind: "addCategory"; category: Category }
  | { kind: "updateCategory"; id: string; changes: Partial<Category> }
  | { kind: "setIncludeVaccineCosts"; value: boolean }
  | { kind: "upsertWallet"; wallet: Wallet }
  | { kind: "setWalletArchived"; id: string; archived: boolean };

export function applyConfigPatch(config: FinanceConfig, patch: ConfigPatch): FinanceConfig {
  // Ensure we don't mutate input
  const baseWallets = { ...(config.wallets || DEFAULT_WALLETS) };

  switch (patch.kind) {
    case "setBudget": {
      const nextBudgets = { ...(config.budgets || {}) };
      if (patch.amount === null || patch.amount <= 0) {
        delete nextBudgets[patch.categoryId];
      } else {
        nextBudgets[patch.categoryId] = Math.round(patch.amount);
      }
      return {
        ...config,
        budgets: nextBudgets
      };
    }

    case "addCategory": {
      const exists = (config.customCategories || []).some((c) => c.id === patch.category.id);
      if (exists) {
        return {
          ...config,
          customCategories: config.customCategories.map((c) =>
            c.id === patch.category.id ? { ...c, ...patch.category } : c
          )
        };
      }
      return {
        ...config,
        customCategories: [...(config.customCategories || []), patch.category]
      };
    }

    case "updateCategory": {
      return {
        ...config,
        customCategories: (config.customCategories || []).map((c) =>
          c.id === patch.id ? { ...c, ...patch.changes, id: c.id } : c
        )
      };
    }

    case "setIncludeVaccineCosts": {
      return {
        ...config,
        includeVaccineCosts: patch.value
      };
    }

    case "upsertWallet": {
      return {
        ...config,
        wallets: {
          ...baseWallets,
          [patch.wallet.id]: {
            ...patch.wallet
          }
        }
      };
    }

    case "setWalletArchived": {
      // Default wallet CANNOT be archived
      if (patch.id === "default" && patch.archived) {
        return config;
      }
      const target = baseWallets[patch.id];
      if (!target) return config;

      return {
        ...config,
        wallets: {
          ...baseWallets,
          [patch.id]: {
            ...target,
            archived: patch.archived
          }
        }
      };
    }

    default:
      return config;
  }
}
