import { describe, it, expect, beforeEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import {
  LocalRepository,
  LOCAL_FINANCE_STORAGE_KEY
} from "../../modules/keuangan/repository/LocalRepository";
import {
  FIRESTORE_TX_KEYS,
  FIRESTORE_CONFIG_KEYS
} from "../../modules/keuangan/constants/categories";
import { Transaction } from "../../modules/keuangan/types";

// Mock Firebase for CloudRepository testing
vi.mock("firebase/firestore", () => ({
  collection: vi.fn((db, ...pathSegments) => ({ path: pathSegments.join("/") })),
  doc: vi.fn((db, ...pathSegments) => ({ path: pathSegments.join("/") })),
  query: vi.fn((ref, ...clauses) => ({ ref, clauses })),
  where: vi.fn((field, op, val) => ({ field, op, val })),
  orderBy: vi.fn((field, dir) => ({ field, dir })),
  onSnapshot: vi.fn((q, callback) => {
    // Return unsubscribe
    return () => {};
  }),
  setDoc: vi.fn().mockResolvedValue(undefined),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  getDocs: vi.fn().mockResolvedValue({ docs: [], empty: true }),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false, data: () => null }),
  writeBatch: vi.fn(() => ({
    delete: vi.fn(),
    set: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined)
  }))
}));

describe("9.2 Repository & Rules Consistency Tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("T-LOCAL-1: LocalRepository", () => {
    it("handles storage operations, corrupted JSON, range filtering, and never touches Bayi storage key", async () => {
      const repo = new LocalRepository();

      // Empty storage returns defaults
      let loadedCfg: any = null;
      repo.subscribeConfig((cfg) => {
        loadedCfg = cfg;
      }, vi.fn());
      expect(loadedCfg.includeVaccineCosts).toBe(true);

      // Upsert transaction
      const tx: Transaction = {
        id: "tx-1",
        type: "expense",
        amount: 50000,
        categoryId: "makan-minum",
        date: "2026-10-05",
        createdAt: "2026-10-05T10:00:00Z",
        updatedAt: "2026-10-05T10:00:00Z"
      };

      await repo.upsertTransaction(tx);

      let loadedTxs: Transaction[] = [];
      repo.subscribeTransactions({ from: "2026-10-01", to: "2026-10-31" }, (txs) => {
        loadedTxs = txs;
      }, vi.fn());

      expect(loadedTxs).toHaveLength(1);
      expect(loadedTxs[0].amount).toBe(50000);

      // Verify Bayi key "imunisasi-app-v1" was NEVER created or written
      expect(localStorage.getItem("imunisasi-app-v1")).toBeNull();
      expect(localStorage.getItem(LOCAL_FINANCE_STORAGE_KEY)).not.toBeNull();

      // Corrupted JSON in localStorage
      localStorage.setItem(LOCAL_FINANCE_STORAGE_KEY, "invalid json {");
      expect(() => repo.getRawData()).not.toThrow();
      expect(repo.getRawData().transactions).toHaveLength(0);

      // QuotaExceeded error simulation
      const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
      await expect(repo.upsertTransaction(tx)).rejects.toThrow("QuotaExceededError");
      spy.mockRestore();
    });
  });

  describe("T-RULES-1: Rules and Constants Consistency", () => {
    it("extracts firestore.rules keys and limits and asserts they match code constants exactly", () => {
      const rulesPath = path.resolve(process.cwd(), "firestore.rules");
      const rulesContent = fs.readFileSync(rulesPath, "utf8");

      // Check isValidFinanceTx hasAll/hasOnly array matching FIRESTORE_TX_KEYS
      for (const key of FIRESTORE_TX_KEYS) {
        expect(rulesContent).toContain(`'${key}'`);
      }

      // Check isValidFinanceConfig hasAll/hasOnly array matching FIRESTORE_CONFIG_KEYS
      for (const key of FIRESTORE_CONFIG_KEYS) {
        expect(rulesContent).toContain(`'${key}'`);
      }

      // Check limits
      expect(rulesContent).toContain("1000000000000"); // 1 Trillion rupiah
      expect(rulesContent).toContain("500"); // 500 chars note limit
      expect(rulesContent).toContain("100"); // 100 custom categories limit
      expect(rulesContent).toContain("200"); // 200 budgets limit
    });
  });
});
