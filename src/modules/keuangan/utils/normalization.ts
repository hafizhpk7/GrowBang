import { FinanceConfig, Wallet } from "../types";
import { DEFAULT_FINANCE_CONFIG } from "../constants/categories";

export function normalizeConfig(raw: any): FinanceConfig {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_FINANCE_CONFIG };
  }

  const wallets: Record<string, Wallet> = {};
  let hasDefault = false;

  if (raw.wallets && typeof raw.wallets === "object") {
    for (const [wId, wVal] of Object.entries(raw.wallets)) {
      if (wVal && typeof wVal === "object" && (wVal as any).id && typeof (wVal as any).name === "string") {
        const name = String((wVal as any).name).trim();
        if (name.length > 0 && name.length <= 40) {
          const isDef = wId === "default" || Boolean((wVal as any).isDefault);
          wallets[wId] = {
            id: wId,
            name,
            isDefault: isDef,
            archived: Boolean((wVal as any).archived),
            createdAt: (wVal as any).createdAt || undefined
          };
          if (isDef) hasDefault = true;
        }
      }
    }
  }

  if (!hasDefault || !wallets["default"]) {
    wallets["default"] = { id: "default", name: "Kas Utama", isDefault: true };
  } else {
    wallets["default"].isDefault = true;
    wallets["default"].name = wallets["default"].name || "Kas Utama";
  }

  return {
    schemaVersion: 1,
    customCategories: Array.isArray(raw.customCategories) ? raw.customCategories : [],
    budgets: raw.budgets && typeof raw.budgets === "object" ? raw.budgets : {},
    includeVaccineCosts: typeof raw.includeVaccineCosts === "boolean" ? raw.includeVaccineCosts : true,
    wallets
  };
}
