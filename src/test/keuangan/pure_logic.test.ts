import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  todayLocal,
  isValidDateString,
  monthRange,
  addMonths,
  monthLabel,
  formatDayHeader,
  monthKeyOf
} from "../../modules/keuangan/utils/dates";
import { parseRupiahInput, formatRupiahInput } from "../../modules/keuangan/utils/currency";
import {
  validateTransactionInput
} from "../../modules/keuangan/utils/validation";
import {
  validateCategoryName,
  getAllCategories
} from "../../modules/keuangan/utils/categories";
import {
  summarizeMonth,
  buildTrend,
  monthOverMonthDelta,
  groupByDate,
  filterEntries,
  budgetStatus,
  summarizeBudgets
} from "../../modules/keuangan/utils/calculations";
import {
  buildVaccineEntries,
  summarizePendingClaims
} from "../../modules/keuangan/utils/vaccineEntries";
import { decideGuestMigration } from "../../modules/keuangan/utils/migration";
import { buildExportRows } from "../../modules/keuangan/utils/export";
import { DEFAULT_FINANCE_CONFIG } from "../../modules/keuangan/constants/categories";
import { LedgerEntry, FinanceConfig } from "../../modules/keuangan/types";
import { VaccineCostSource } from "../../modules/bayi/public";

describe("9.1 Pure Logic Unit Tests", () => {
  describe("T-DATE-1 & T-DATE-2 & T-DATE-3: Date Helpers", () => {
    it("T-DATE-1: todayLocal with system time 2026-10-07T20:00:00Z (= 03:00 WIB Oct 8) returns 2026-10-08", () => {
      // 2026-10-07T20:00:00Z in Asia/Jakarta timezone (+7) is 2026-10-08T03:00:00
      const testDate = new Date("2026-10-07T20:00:00Z");
      expect(todayLocal(testDate)).toBe("2026-10-08");
    });

    it("T-DATE-2: isValidDateString leap years and invalid calendar dates", () => {
      expect(isValidDateString("2026-02-29")).toBe(false);
      expect(isValidDateString("2024-02-29")).toBe(true);
      expect(isValidDateString("2026-13-01")).toBe(false);
      expect(isValidDateString("2026-1-5")).toBe(false);
      expect(isValidDateString("")).toBe(false);
      expect(isValidDateString("2026-00-10")).toBe(false);
    });

    it("T-DATE-3: monthRange, addMonths, monthLabel, formatDayHeader", () => {
      expect(monthRange("2026-02")).toEqual({ from: "2026-02-01", to: "2026-02-28" });
      expect(monthRange("2024-02")).toEqual({ from: "2024-02-01", to: "2024-02-29" });
      expect(monthRange("2026-10")).toEqual({ from: "2026-10-01", to: "2026-10-31" });

      expect(addMonths("2026-10", 3)).toBe("2027-01");
      expect(addMonths("2026-01", -2)).toBe("2025-11");

      expect(monthLabel("2026-10")).toBe("Oktober 2026");
      expect(formatDayHeader("2026-10-08")).toBe("Kamis, 8 Oktober 2026");
    });
  });

  describe("T-MONEY-1: Currency Parsing and Formatting", () => {
    it("parseRupiahInput and formatRupiahInput", () => {
      expect(parseRupiahInput("Rp 1.250.000")).toBe(1250000);
      expect(parseRupiahInput("")).toBeNull();
      expect(parseRupiahInput("abc")).toBeNull();
      expect(parseRupiahInput("007")).toBe(7);
      expect(parseRupiahInput("12345678901234")).toBeNull(); // > 13 digits

      expect(formatRupiahInput(1250000)).toBe("1.250.000");
      expect(formatRupiahInput(0)).toBe("0");
    });
  });

  describe("T-VAL-1: validateTransactionInput", () => {
    it("validates transaction inputs properly", () => {
      const config = DEFAULT_FINANCE_CONFIG;

      // Amount tests
      expect(validateTransactionInput({ amount: 0, categoryId: "makan-minum", date: "2026-10-01" }, config).errors.amount).toBe("Nominal harus lebih dari 0");
      expect(validateTransactionInput({ amount: -50, categoryId: "makan-minum", date: "2026-10-01" }, config).errors.amount).toBe("Nominal harus lebih dari 0");
      expect(validateTransactionInput({ amount: 1.5, categoryId: "makan-minum", date: "2026-10-01" }, config).errors.amount).toBe("Nominal harus lebih dari 0");
      expect(validateTransactionInput({ amount: 1e12 + 1, categoryId: "makan-minum", date: "2026-10-01" }, config).errors.amount).toBe("Nominal terlalu besar");
      expect(validateTransactionInput({ amount: 1e12, categoryId: "makan-minum", date: "2026-10-01" }, config).ok).toBe(true);

      // Category tests
      expect(validateTransactionInput({ amount: 100, categoryId: "unknown-cat", date: "2026-10-01" }, config).errors.categoryId).toBe("Pilih kategori");
      expect(validateTransactionInput({ amount: 100, type: "income", categoryId: "makan-minum", date: "2026-10-01" }, config).errors.categoryId).toBe("Pilih kategori");

      // Date tests
      expect(validateTransactionInput({ amount: 100, categoryId: "makan-minum", date: "2099-01-01" }, config, { today: "2026-10-08" }).errors.date).toBe("Tanggal tidak boleh di masa depan");
      expect(validateTransactionInput({ amount: 100, categoryId: "makan-minum", date: "invalid-date" }, config).errors.date).toBe("Tanggal tidak valid");

      // Note tests
      const longNote = "a".repeat(501);
      expect(validateTransactionInput({ amount: 100, categoryId: "makan-minum", date: "2026-10-01", note: longNote }, config).errors.note).toBe("Catatan maksimal 500 karakter");
      const okNote = "a".repeat(500);
      expect(validateTransactionInput({ amount: 100, categoryId: "makan-minum", date: "2026-10-01", note: okNote }, config).ok).toBe(true);
    });
  });

  describe("T-VAL-2: validateCategoryName", () => {
    it("validates category names", () => {
      const config = DEFAULT_FINANCE_CONFIG;

      expect(validateCategoryName("   ", "expense", config).error).toBe("Nama kategori wajib diisi");
      expect(validateCategoryName("a".repeat(41), "expense", config).error).toBe("Nama kategori maksimal 40 karakter");

      // Duplicate case-insensitive
      expect(validateCategoryName("makan & minum", "expense", config).error).toBe("Nama kategori sudah dipakai");
      expect(validateCategoryName("Makan & Minum", "expense", config).error).toBe("Nama kategori sudah dipakai");

      // Duplicate across types allowed
      expect(validateCategoryName("Gaji", "expense", config).ok).toBe(true);

      // Renaming to own name allowed
      const customConfig: FinanceConfig = {
        ...config,
        customCategories: [{ id: "custom-1", name: "Kategori Saya", type: "expense", isSystem: false }]
      };
      expect(validateCategoryName("Kategori Saya", "expense", customConfig, { renamingId: "custom-1" }).ok).toBe(true);
    });
  });

  describe("T-LEDGER-1: Month Summaries, Trend & Grouping", () => {
    it("summarizeMonth, buildTrend, monthOverMonthDelta, groupByDate, filterEntries", () => {
      const entries: LedgerEntry[] = [
        {
          id: "1",
          type: "expense",
          amount: 50000,
          categoryId: "makan-minum",
          date: "2026-10-01",
          createdAt: "2026-10-01T10:00:00Z",
          updatedAt: "2026-10-01T10:00:00Z",
          source: "manual",
          readOnly: false
        },
        {
          id: "2",
          type: "income",
          amount: 200000,
          categoryId: "gaji",
          date: "2026-10-01",
          createdAt: "2026-10-01T09:00:00Z",
          updatedAt: "2026-10-01T09:00:00Z",
          source: "manual",
          readOnly: false
        },
        {
          id: "3",
          type: "expense",
          amount: 30000,
          categoryId: "makan-minum",
          date: "2026-09-30",
          createdAt: "2026-09-30T10:00:00Z",
          updatedAt: "2026-09-30T10:00:00Z",
          source: "manual",
          readOnly: false
        }
      ];

      const sumOct = summarizeMonth(entries, "2026-10");
      expect(sumOct.income).toBe(200000);
      expect(sumOct.expense).toBe(50000);
      expect(sumOct.net).toBe(150000);
      expect(sumOct.count).toBe(2);

      const trend = buildTrend(entries, "2026-10", 2);
      expect(trend).toHaveLength(2);
      expect(trend[0].month).toBe("2026-09");
      expect(trend[0].expense).toBe(30000);
      expect(trend[1].month).toBe("2026-10");
      expect(trend[1].expense).toBe(50000);

      expect(monthOverMonthDelta(50000, 30000)).toBe(67);
      expect(monthOverMonthDelta(50000, 0)).toBeNull();

      const grouped = groupByDate(entries);
      expect(grouped).toHaveLength(2);
      expect(grouped[0].date).toBe("2026-10-01");

      const filtered = filterEntries(entries, { query: "gaji" }, DEFAULT_FINANCE_CONFIG);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("2");
    });
  });

  describe("T-BUDGET-1: budgetStatus and summarizeBudgets", () => {
    it("calculates budget status boundaries accurately", () => {
      expect(budgetStatus(0, 100000).state).toBe("ok");
      expect(budgetStatus(79000, 100000).state).toBe("ok");
      expect(budgetStatus(80000, 100000).state).toBe("warning");
      expect(budgetStatus(100000, 100000).state).toBe("warning");
      expect(budgetStatus(100001, 100000).state).toBe("over");
      expect(budgetStatus(50000, undefined).state).toBe("none");

      const budgets = { "makan-minum": 100000 };
      const expenseByCategory = [{ categoryId: "makan-minum", total: 85000, count: 2 }];
      const sumB = summarizeBudgets(expenseByCategory, budgets, []);
      expect(sumB.totalBudget).toBe(100000);
      expect(sumB.totalSpentOnBudgeted).toBe(85000);
      expect(sumB.rows[0].status.state).toBe("warning");
    });
  });

  describe("T-VAX-1 & T-VAX-2: Vaccine Entries and Pending Claims", () => {
    it("buildVaccineEntries converts given records with actual costs to virtual entries", () => {
      const vaxSources: VaccineCostSource[] = [
        {
          profileId: "p1",
          profileName: "Budi",
          rows: [{ id: "r1", vaksin: "BCG" }],
          records: [
            {
              rowId: "r1",
              diberikan: true,
              tanggalDiberikan: "2026-05-10",
              biayaAktual: 150000.4
            },
            {
              rowId: "r2",
              diberikan: true,
              biayaAktual: 100000 // missing tanggalDiberikan
            },
            {
              rowId: "r3",
              diberikan: false,
              biayaAktual: 50000
            }
          ]
        }
      ];

      const res = buildVaccineEntries(vaxSources);
      expect(res.entries).toHaveLength(1);
      expect(res.skippedWithoutDate).toBe(1);

      const entry = res.entries[0];
      expect(entry.id).toBe("vaccine:p1:r1");
      expect(entry.amount).toBe(150000);
      expect(entry.categoryId).toBe("kesehatan-anak");
      expect(entry.readOnly).toBe(true);
      expect(entry.note).toBe("BCG — Budi");
    });

    it("summarizePendingClaims sums insurance records pending reimbursement", () => {
      const vaxSources: VaccineCostSource[] = [
        {
          profileId: "p1",
          profileName: "Budi",
          rows: [],
          records: [
            {
              rowId: "r1",
              diberikan: true,
              ditanggungAsuransi: true,
              nominalKlaim: 200000,
              statusKlaim: "Diajukan"
            },
            {
              rowId: "r2",
              diberikan: true,
              ditanggungAsuransi: true,
              nominalKlaim: 150000,
              statusKlaim: "Disetujui" // Excluded
            },
            {
              rowId: "r3",
              diberikan: true,
              ditanggungAsuransi: true,
              nominalKlaim: 300000,
              statusKlaim: "Belum diajukan"
            }
          ]
        }
      ];

      const claims = summarizePendingClaims(vaxSources);
      expect(claims.count).toBe(2);
      expect(claims.total).toBe(500000);
    });
  });

  describe("T-MIG-1: decideGuestMigration Truth Table", () => {
    it("covers all 8 decision combinations", () => {
      expect(decideGuestMigration({ signedIn: false, cloudHasData: false, localHasData: false })).toBe("none");
      expect(decideGuestMigration({ signedIn: false, cloudHasData: false, localHasData: true })).toBe("none");
      expect(decideGuestMigration({ signedIn: false, cloudHasData: true, localHasData: false })).toBe("none");
      expect(decideGuestMigration({ signedIn: false, cloudHasData: true, localHasData: true })).toBe("none");

      expect(decideGuestMigration({ signedIn: true, cloudHasData: false, localHasData: false })).toBe("none");
      expect(decideGuestMigration({ signedIn: true, cloudHasData: false, localHasData: true })).toBe("auto-upload");
      expect(decideGuestMigration({ signedIn: true, cloudHasData: true, localHasData: false })).toBe("none");
      expect(decideGuestMigration({ signedIn: true, cloudHasData: true, localHasData: true })).toBe("prompt");
    });
  });

  describe("T-EXP-1: buildExportRows", () => {
    it("formats excel export rows properly", () => {
      const entries: LedgerEntry[] = [
        {
          id: "1",
          type: "expense",
          amount: 50000,
          categoryId: "makan-minum",
          date: "2026-10-05",
          note: "Makan siang",
          createdAt: "2026-10-05T12:00:00Z",
          updatedAt: "2026-10-05T12:00:00Z",
          source: "manual",
          readOnly: false
        }
      ];

      const exported = buildExportRows(entries, DEFAULT_FINANCE_CONFIG, "2026-10");
      expect(exported.transactions).toHaveLength(1);
      expect(exported.transactions[0].Tanggal).toBe("2026-10-05");
      expect(exported.transactions[0].Jenis).toBe("Pengeluaran");
      expect(exported.transactions[0]["Nominal (Rp)"]).toBe(50000);
      expect(exported.transactions[0].Sumber).toBe("Manual");

      expect(exported.summary.find((s) => s.Keterangan === "Total pengeluaran")?.["Nominal (Rp)"]).toBe(50000);
    });
  });
});
