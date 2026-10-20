import { describe, it, expect } from "vitest";
import { AppState, Profile, ScheduleRow, Record, Insurance } from "../../types";
import { SEED_SCHEDULE } from "../../data/seed";
import * as transitions from "../../modules/bayi/state/transitions";

const sampleInsurance: Insurance = {
  namaProduk: "BPJS Kesehatan",
  limitPerTahun: { 1: 1500000, 2: 4000000, 3: 1500000, 4: 1000000, 5: 2000000 },
  masaTungguBulan: 0,
  mekanisme: "Cashless",
  vaksinDikecualikan: "",
  catatan: "",
  checklist: [false, false, false, false]
};

const sampleRow: ScheduleRow = {
  id: "r01",
  tahun: 1,
  usia: "<24 jam",
  bln: 0,
  vaksin: "Hepatitis B",
  ref: "hepb",
  status: "Wajib",
  gratis: "Ya",
  masuk: true,
  min: 150000,
  max: 250000,
  catatan: ""
};

const sampleProfile1: Profile = {
  id: "baby-1",
  panggilan: "Puyo",
  tanggalLahir: "2024-01-01",
  catatan: "Anak pertama",
  schedule: [sampleRow],
  records: [
    { rowId: "r01", diberikan: true, tanggalDiberikan: "2024-01-02", tempat: "Puskesmas", biayaAktual: 0 }
  ],
  insurance: sampleInsurance
};

const sampleProfile2: Profile = {
  id: "baby-2",
  panggilan: "Eci",
  tanggalLahir: "2024-06-01",
  schedule: [sampleRow],
  records: [],
  insurance: sampleInsurance
};

const baseState: AppState = {
  schemaVersion: 1,
  profiles: [sampleProfile1, sampleProfile2],
  activeProfileId: "baby-1",
  paymentMode: "HYBRID"
};

describe("Bayi pure state transitions (Golden Tests)", () => {
  it("addProfile appends profile and switches activeProfileId to new baby", () => {
    const newBaby: Profile = {
      id: "baby-3",
      panggilan: "Kula",
      tanggalLahir: "2024-09-01",
      schedule: [],
      records: [],
      insurance: sampleInsurance
    };
    const next = transitions.addProfile(baseState, newBaby);
    expect(next.profiles).toHaveLength(3);
    expect(next.profiles[2].id).toBe("baby-3");
    expect(next.activeProfileId).toBe("baby-3");
    expect(next.paymentMode).toBe(baseState.paymentMode);
  });

  it("selectProfile updates activeProfileId", () => {
    const next = transitions.selectProfile(baseState, "baby-2");
    expect(next.activeProfileId).toBe("baby-2");
    expect(next.profiles).toBe(baseState.profiles);
  });

  it("updateProfile replaces the matching profile and preserves activeProfileId", () => {
    const updated = { ...sampleProfile1, panggilan: "Puyo Ganteng" };
    const next = transitions.updateProfile(baseState, updated);
    expect(next.profiles[0].panggilan).toBe("Puyo Ganteng");
    expect(next.profiles[1].panggilan).toBe("Eci");
    expect(next.activeProfileId).toBe("baby-1");
  });

  it("deleteProfile: deleting active profile falls back to remaining[0].id", () => {
    const next = transitions.deleteProfile(baseState, "baby-1");
    expect(next.profiles).toHaveLength(1);
    expect(next.profiles[0].id).toBe("baby-2");
    expect(next.activeProfileId).toBe("baby-2");
  });

  it("deleteProfile: deleting inactive profile keeps existing activeProfileId", () => {
    const next = transitions.deleteProfile(baseState, "baby-2");
    expect(next.profiles).toHaveLength(1);
    expect(next.profiles[0].id).toBe("baby-1");
    expect(next.activeProfileId).toBe("baby-1");
  });

  it("deleteProfile: deleting the last profile leaves activeProfileId empty string", () => {
    const singleState: AppState = {
      schemaVersion: 1,
      profiles: [sampleProfile1],
      activeProfileId: "baby-1",
      paymentMode: "HYBRID"
    };
    const next = transitions.deleteProfile(singleState, "baby-1");
    expect(next.profiles).toHaveLength(0);
    expect(next.activeProfileId).toBe("");
  });

  it("updateScheduleRow updates the targeted schedule row in the active profile", () => {
    const modifiedRow: ScheduleRow = {
      ...sampleRow,
      vaksin: "Hepatitis B (Updated)",
      gratis: "Tidak",
      min: 150000
    };
    const next = transitions.updateScheduleRow(baseState, "baby-1", modifiedRow);
    const baby1 = next.profiles.find((p) => p.id === "baby-1")!;
    expect(baby1.schedule[0].vaksin).toBe("Hepatitis B (Updated)");
    expect(baby1.schedule[0].gratis).toBe("Tidak");
  });

  it("addCustomRow appends custom row to schedule in specified profile", () => {
    const customRow: ScheduleRow = {
      id: "custom-1700000000",
      tahun: 1,
      usia: "2 Bulan",
      bln: 2,
      vaksin: "Vaksin Tambahan",
      ref: "custom",
      status: "Pilihan",
      gratis: "Tidak",
      masuk: true,
      min: 250000,
      max: 300000,
      catatan: ""
    };
    const next = transitions.addCustomRow(baseState, "baby-1", customRow);
    const baby1 = next.profiles.find((p) => p.id === "baby-1")!;
    expect(baby1.schedule).toHaveLength(sampleProfile1.schedule.length + 1);
    expect(baby1.schedule[baby1.schedule.length - 1].id).toBe("custom-1700000000");
  });

  it("deleteCustomRow removes row from schedule AND records in specified profile", () => {
    const stateWithCustom: AppState = {
      ...baseState,
      profiles: [
        {
          ...sampleProfile1,
          schedule: [
            ...sampleProfile1.schedule,
            {
              id: "custom-999",
              tahun: 1,
              usia: "1 Bulan",
              bln: 1,
              vaksin: "Khusus",
              ref: "custom",
              status: "Pilihan",
              gratis: "Ya",
              masuk: true,
              min: 0,
              max: 0,
              catatan: ""
            }
          ],
          records: [
            ...sampleProfile1.records,
            { rowId: "custom-999", diberikan: true, tanggalDiberikan: "2024-02-01" }
          ]
        },
        sampleProfile2
      ]
    };

    const next = transitions.deleteCustomRow(stateWithCustom, "baby-1", "custom-999");
    const baby1 = next.profiles.find((p) => p.id === "baby-1")!;
    expect(baby1.schedule.some((r) => r.id === "custom-999")).toBe(false);
    expect(baby1.records.some((r) => r.rowId === "custom-999")).toBe(false);
  });

  it("resetSchedule resets schedule to SEED_SCHEDULE without removing records", () => {
    const next = transitions.resetSchedule(baseState, "baby-1");
    const baby1 = next.profiles.find((p) => p.id === "baby-1")!;
    expect(baby1.schedule).toHaveLength(SEED_SCHEDULE.length);
    expect(baby1.records).toHaveLength(sampleProfile1.records.length);
  });

  it("updateRecord upserts record: replaces existing or appends new", () => {
    const existingUpdate: Record = {
      rowId: "r01",
      diberikan: true,
      tanggalDiberikan: "2024-01-05",
      tempat: "Puskesmas",
      biayaAktual: 50000
    };
    const next1 = transitions.updateRecord(baseState, "baby-1", existingUpdate);
    const baby1Recs = next1.profiles.find((p) => p.id === "baby-1")!.records;
    expect(baby1Recs).toHaveLength(1);
    expect(baby1Recs[0].biayaAktual).toBe(50000);

    const newRec: Record = {
      rowId: "r02",
      diberikan: true,
      tanggalDiberikan: "2024-02-01",
      biayaAktual: 0
    };
    const next2 = transitions.updateRecord(next1, "baby-1", newRec);
    const baby1Recs2 = next2.profiles.find((p) => p.id === "baby-1")!.records;
    expect(baby1Recs2).toHaveLength(2);
  });

  it("updateInsurance updates insurance data for specified profile", () => {
    const newIns: Insurance = {
      ...sampleInsurance,
      namaProduk: "Prudential"
    };
    const next = transitions.updateInsurance(baseState, "baby-1", newIns);
    expect(next.profiles[0].insurance.namaProduk).toBe("Prudential");
  });

  it("updatePaymentMode updates paymentMode in AppState", () => {
    const next = transitions.updatePaymentMode(baseState, "FULL_PRIVATE");
    expect(next.paymentMode).toBe("FULL_PRIVATE");
  });

  it("buildQuickMarkRecord defaults gratis to Puskesmas and 0 biaya", () => {
    const rowGratis: ScheduleRow = {
      ...sampleRow,
      id: "r02",
      vaksin: "BCG",
      gratis: "Ya",
      min: 0,
      max: 0
    };
    const res = transitions.buildQuickMarkRecord(sampleProfile1, rowGratis, "2024-02-01");
    expect(res.newRecord.diberikan).toBe(true);
    expect(res.newRecord.tempat).toBe("Puskesmas");
    expect(res.newRecord.biayaAktual).toBe(0);
  });

  it("buildQuickMarkRecord defaults paid to Klinik and min cost", () => {
    const rowBayar: ScheduleRow = {
      ...sampleRow,
      id: "r10",
      vaksin: "Rotavirus",
      gratis: "Tidak",
      min: 350000,
      max: 450000
    };
    const res = transitions.buildQuickMarkRecord(sampleProfile1, rowBayar, "2024-03-01");
    expect(res.newRecord.diberikan).toBe(true);
    expect(res.newRecord.tempat).toBe("Klinik");
    expect(res.newRecord.biayaAktual).toBe(350000);
  });
});
