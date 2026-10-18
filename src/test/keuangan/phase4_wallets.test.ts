import { describe, it, expect } from "vitest";
import { normalizeConfig } from "../../modules/keuangan/utils/normalization";
import { validateTransactionInput } from "../../modules/keuangan/utils/validation";
import { DEFAULT_FINANCE_CONFIG } from "../../modules/keuangan/constants/categories";

describe("Phase 4: Wallets & Config Normalization Tests", () => {
  it("normalizeConfig ensures default wallet is always present and valid", () => {
    const raw = {
      wallets: {
        custom1: { id: "custom1", name: "BCA", isDefault: false }
      }
    };
    const cfg = normalizeConfig(raw);
    expect(cfg.wallets).toBeDefined();
    expect(cfg.wallets!["default"]).toBeDefined();
    expect(cfg.wallets!["default"].name).toBe("Kas Utama");
    expect(cfg.wallets!["custom1"].name).toBe("BCA");
  });

  it("validateTransactionInput accepts valid wallet and rejects archived/unknown wallets", () => {
    const cfg = {
      ...DEFAULT_FINANCE_CONFIG,
      wallets: {
        default: { id: "default", name: "Kas Utama", isDefault: true },
        archived1: { id: "archived1", name: "OVO", archived: true }
      }
    };

    const validRes = validateTransactionInput(
      { type: "expense", amount: 10000, categoryId: "makan-minum", walletId: "default", date: "2026-10-18" },
      cfg
    );
    expect(validRes.ok).toBe(true);

    const unknownRes = validateTransactionInput(
      { type: "expense", amount: 10000, categoryId: "makan-minum", walletId: "unknown", date: "2026-10-18" },
      cfg
    );
    expect(unknownRes.ok).toBe(false);
    expect(unknownRes.errors.walletId).toBeDefined();

    const archivedRes = validateTransactionInput(
      { type: "expense", amount: 10000, categoryId: "makan-minum", walletId: "archived1", date: "2026-10-18" },
      cfg
    );
    expect(archivedRes.ok).toBe(false);
    expect(archivedRes.errors.walletId).toBeDefined();
  });
});
