import { describe, it, expect } from "vitest";
import { getDueOccurrences, generateRecurringTxId, buildRecurringTransaction, evaluateAllRecurringRules } from "../../modules/keuangan/utils/recurring";
import { RecurringRule } from "../../modules/keuangan/types";

describe("Phase 4: Recurring Transactions Engine Tests", () => {
  it("generates deterministic transaction ID", () => {
    expect(generateRecurringTxId("rule123", "2026-11-01")).toBe("rec:rule123:2026-11-01");
  });

  it("evaluates daily recurring rule correctly", () => {
    const rule: RecurringRule = {
      id: "r1",
      type: "expense",
      amount: 50000,
      categoryId: "makan-minum",
      walletId: "default",
      frequency: "daily",
      startDate: "2026-10-28",
      active: true
    };

    const due = getDueOccurrences(rule, "2026-10-30");
    expect(due).toEqual(["2026-10-28", "2026-10-29", "2026-10-30"]);
  });

  it("clamps monthly recurring rule on month-end and leap year (2028)", () => {
    const rule: RecurringRule = {
      id: "r2",
      type: "expense",
      amount: 100000,
      categoryId: "tagihan-utilitas",
      walletId: "default",
      frequency: "monthly",
      startDate: "2028-01-31",
      dayOfMonth: 31,
      active: true
    };

    // January 31, February 29 (2028 leap year), March 31
    const due = getDueOccurrences(rule, "2028-03-31");
    expect(due).toContain("2028-01-31");
    expect(due).toContain("2028-02-29"); // leap year clamp for 31
    expect(due).toContain("2028-03-31");
  });

  it("respects lastGeneratedThrough high-water mark and is idempotent", () => {
    const rule: RecurringRule = {
      id: "r3",
      type: "income",
      amount: 5000000,
      categoryId: "gaji",
      walletId: "default",
      frequency: "monthly",
      startDate: "2026-09-25",
      dayOfMonth: 25,
      lastGeneratedThrough: "2026-09-25",
      active: true
    };

    const due = getDueOccurrences(rule, "2026-10-26");
    expect(due).toEqual(["2026-10-25"]);

    const res = evaluateAllRecurringRules([rule], "2026-10-26", "user1");
    expect(res.transactions.length).toBe(1);
    expect(res.ruleUpdates[0].lastGeneratedThrough).toBe("2026-10-25");
  });

  it("skips inactive rules", () => {
    const rule: RecurringRule = {
      id: "r4",
      type: "expense",
      amount: 10000,
      categoryId: "hiburan",
      walletId: "default",
      frequency: "daily",
      startDate: "2026-10-01",
      active: false
    };

    const due = getDueOccurrences(rule, "2026-10-05");
    expect(due).toEqual([]);
  });

  it("builds deterministic transaction correctly", () => {
    const rule: RecurringRule = {
      id: "r5",
      name: "Listrik",
      type: "expense",
      amount: 250000,
      categoryId: "tagihan-utilitas",
      walletId: "default",
      frequency: "monthly",
      startDate: "2026-10-05"
    };

    const tx = buildRecurringTransaction(rule, "2026-10-05", "user1");
    expect(tx.id).toBe("rec:r5:2026-10-05");
    expect(tx.amount).toBe(250000);
    expect(tx.note).toBe("[Berulang] Listrik");
    expect(tx.createdAt).toBe("2026-10-05T00:00:00.000Z");
  });
});
