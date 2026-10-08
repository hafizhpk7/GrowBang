import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  STORAGE_KEY,
  SCHEMA_VERSION,
  getInitialState,
  loadAppState,
  saveAppState,
  clearAllData
} from "../utils/storage";
import {
  calculateCostSummary,
  calculateRealization,
  formatRupiah,
  formatRupiahRange,
  getVaccinePriceDisplay
} from "../utils/calc";
import {
  calculateDueDate,
  formatIndonesianDate,
  formatFullIndonesianDate,
  getChildAge,
  getScheduleStatus
} from "../utils/dates";
import { parseAndValidateBackup } from "../utils/export";
import { createSampleProfile } from "../data/seed";
import { AppState, PaymentMode, Profile, Record } from "../types";

describe("C1: storage.ts Characterization Tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("empty localStorage -> loadAppState returns initial state and writes to localStorage", () => {
    const loaded = loadAppState();
    expect(loaded.profiles.length).toBe(1);
    expect(loaded.paymentMode).toBe("HYBRID");
    expect(loaded.schemaVersion).toBe(SCHEMA_VERSION);
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it("valid saved state round-trips unchanged", () => {
    const sample = createSampleProfile();
    const state: AppState = {
      schemaVersion: 1,
      profiles: [sample],
      activeProfileId: sample.id,
      paymentMode: "FULL_PRIVATE"
    };
    saveAppState(state);
    const loaded = loadAppState();
    expect(loaded).toEqual(state);
  });

  it("invalid JSON -> returns initial state, does not throw", () => {
    localStorage.setItem(STORAGE_KEY, "invalid json {");
    let loaded: ReturnType<typeof loadAppState> | null = null;
    expect(() => {
      loaded = loadAppState();
    }).not.toThrow();
    expect((loaded as any)?.profiles.length).toBe(1);
  });

  it("parsed value not an object or profiles not an array -> initial state", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify("not an object"));
    const loaded1 = loadAppState();
    expect(loaded1.profiles.length).toBe(1);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ profiles: "not array" }));
    const loaded2 = loadAppState();
    expect(loaded2.profiles.length).toBe(1);
  });

  it("profiles: [] -> returns profiles [] and activeProfileId ''", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, profiles: [], activeProfileId: "abc" })
    );
    const loaded = loadAppState();
    expect(loaded.profiles).toEqual([]);
    expect(loaded.activeProfileId).toBe("");
  });

  it("activeProfileId pointing to non-existent profile -> falls back to first profile id", () => {
    const sample = createSampleProfile();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        profiles: [sample],
        activeProfileId: "non-existent-id"
      })
    );
    const loaded = loadAppState();
    expect(loaded.activeProfileId).toBe(sample.id);
  });

  it("missing paymentMode -> HYBRID, missing schemaVersion -> 1", () => {
    const sample = createSampleProfile();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        profiles: [sample],
        activeProfileId: sample.id
      })
    );
    const loaded = loadAppState();
    expect(loaded.paymentMode).toBe("HYBRID");
    expect(loaded.schemaVersion).toBe(1);
  });

  it("saveAppState returns false when localStorage.setItem throws", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const state = getInitialState();
    const success = saveAppState(state);
    expect(success).toBe(false);
    spy.mockRestore();
  });

  it("clearAllData removes STORAGE_KEY", () => {
    localStorage.setItem(STORAGE_KEY, "test");
    clearAllData();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("legacy-fixture test: loads old saved state without paymentMode correctly", () => {
    const legacyFixture = JSON.stringify({
      schemaVersion: 1,
      profiles: [
        {
          id: "p1",
          panggilan: "Budi",
          namaLengkap: "Budi Santoso",
          jenisKelamin: "L",
          tanggalLahir: "2023-01-01",
          tempatLahir: "Jakarta",
          schedule: [],
          records: [],
          insurance: { namaProduk: "BPJS", limitPerTahun: {}, checklist: [] }
        }
      ],
      activeProfileId: "p1"
    });
    localStorage.setItem(STORAGE_KEY, legacyFixture);
    const loaded = loadAppState();
    expect(loaded.paymentMode).toBe("HYBRID");
    expect(loaded.profiles[0].panggilan).toBe("Budi");
  });
});

describe("C2: calc.ts Characterization Tests", () => {
  const sampleProfile = createSampleProfile();

  it("calculateCostSummary snapshots for 3 PaymentModes x 4 scenario combinations", () => {
    const modes: PaymentMode[] = ["HYBRID", "FULL_PRIVATE", "FULL_BPJS"];
    const scenarioCombos = [
      { heksavalenSwasta: false, sertakanKondisional: false },
      { heksavalenSwasta: true, sertakanKondisional: false },
      { heksavalenSwasta: false, sertakanKondisional: true },
      { heksavalenSwasta: true, sertakanKondisional: true }
    ];

    const results: any[] = [];
    modes.forEach((mode) => {
      scenarioCombos.forEach((scen) => {
        const summary = calculateCostSummary(sampleProfile.schedule, scen, mode);
        results.push({
          mode,
          scen,
          total: summary.total
        });
      });
    });

    expect(results).toMatchSnapshot();
  });

  it("calculateRealization scenarios", () => {
    const emptyRealization = calculateRealization([], sampleProfile.schedule);
    expect(emptyRealization.totalBiayaAktual).toBe(0);

    const records: Record[] = [
      {
        rowId: "r01",
        diberikan: true,
        tanggalDiberikan: "2023-01-05",
        biayaAktual: 150000,
        ditanggungAsuransi: true,
        nominalKlaim: 150000,
        statusKlaim: "Disetujui"
      },
      {
        rowId: "r02",
        diberikan: true,
        tanggalDiberikan: "2023-02-05",
        biayaAktual: 200000,
        ditanggungAsuransi: false
      }
    ];

    const filledRealization = calculateRealization(records, sampleProfile.schedule);
    expect(filledRealization.totalBiayaAktual).toBe(350000);
    expect(filledRealization.totalKlaimDisetujui).toBe(150000);
    expect(filledRealization).toMatchSnapshot();
  });

  it("formatRupiah and formatRupiahRange formatting", () => {
    expect(formatRupiah(100000)).toBe("Rp 100.000");
    expect(formatRupiah(0, true)).toBe("-");
    expect(formatRupiah(null)).toBe("-");
    expect(formatRupiahRange(100000, 200000)).toBe("Rp 100.000 – Rp 200.000");
    expect(formatRupiahRange(0, 0, true)).toBe("-");
  });

  it("getVaccinePriceDisplay for all payment modes", () => {
    const rowMandatory = sampleProfile.schedule.find((r) => r.gratis === "Ya")!;
    const rowOptional = sampleProfile.schedule.find((r) => r.gratis === "Tidak")!;

    expect(getVaccinePriceDisplay(rowMandatory, "HYBRID")).toEqual({
      text: "Rp 0 (Puskesmas)",
      isFree: true
    });

    expect(getVaccinePriceDisplay(rowMandatory, "FULL_PRIVATE").isFree).toBe(false);

    expect(getVaccinePriceDisplay(rowOptional, "FULL_BPJS")).toEqual({
      text: formatRupiahRange(rowOptional.min, rowOptional.max),
      isFree: false,
      warningNote: "Tidak ditanggung BPJS"
    });
  });
});

describe("C3: dates.ts Characterization Tests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-08T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calculateDueDate and formatIndonesianDate", () => {
    const dueDate = calculateDueDate("2025-01-01", 6);
    expect(dueDate.toISOString().split("T")[0]).toBe("2025-07-01");
    expect(formatIndonesianDate(dueDate)).toBe("1 Jul 2025");
    expect(formatFullIndonesianDate(dueDate)).toBe("1 Juli 2025");
  });

  it("getChildAge", () => {
    const age = getChildAge("2025-04-08"); // 18 months
    expect(age.text).toContain("1 tahun 6 bulan");
  });

  it("getScheduleStatus decision tree", () => {
    const row = createSampleProfile().schedule[0];
    const statusOverdue = getScheduleStatus(row, undefined, "2020-01-01");
    expect(statusOverdue.status).toBe("Terlambat");

    const statusDone = getScheduleStatus(row, { rowId: row.id, diberikan: true }, "2020-01-01");
    expect(statusDone.status).toBe("Selesai");
  });
});

describe("C4: export.ts Characterization Tests", () => {
  it("parseAndValidateBackup validates JSON backup correctly", () => {
    const validSample = {
      schemaVersion: 1,
      profiles: [createSampleProfile()]
    };
    const validResult = parseAndValidateBackup(JSON.stringify(validSample));
    expect(validResult.success).toBe(true);

    const invalidResult = parseAndValidateBackup("not json");
    expect(invalidResult.success).toBe(false);

    const emptyProfilesResult = parseAndValidateBackup(JSON.stringify({ profiles: [] }));
    expect(emptyProfilesResult.success).toBe(false);
  });
});
