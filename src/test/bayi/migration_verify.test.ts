import { describe, it, expect } from "vitest";
import { Profile, ScheduleRow } from "../../types";
import { verifyMigration } from "../../utils/migration";

const sampleRow: ScheduleRow = {
  id: "r01",
  tahun: 1,
  usia: "<24 jam",
  bln: 0,
  vaksin: "Hep B",
  ref: "hepb",
  status: "Wajib",
  gratis: "Ya",
  masuk: true,
  min: 0,
  max: 0,
  catatan: ""
};

const profileA: Profile = {
  id: "baby-1",
  panggilan: "Puyo",
  tanggalLahir: "2024-01-01",
  catatan: "Catatan",
  insurance: {
    namaProduk: "BPJS",
    limitPerTahun: { 1: 1500000, 2: 4000000, 3: 1500000, 4: 1000000, 5: 2000000 },
    masaTungguBulan: 0,
    mekanisme: "Cashless",
    vaksinDikecualikan: "",
    catatan: "",
    checklist: [false, false, false, false]
  },
  schedule: [sampleRow],
  records: [
    { rowId: "r01", diberikan: true, tanggalDiberikan: "2024-01-02", biayaAktual: 0 }
  ]
};

const profileB: Profile = {
  id: "baby-2",
  panggilan: "Eci",
  tanggalLahir: "2024-05-01",
  insurance: {
    namaProduk: "",
    limitPerTahun: { 1: 1500000, 2: 4000000, 3: 1500000, 4: 1000000, 5: 2000000 },
    masaTungguBulan: 0,
    mekanisme: "",
    vaksinDikecualikan: "",
    catatan: "",
    checklist: [false, false, false, false]
  },
  schedule: [],
  records: []
};

describe("verifyMigration pure unit tests", () => {
  it("passes when source and target are completely identical", () => {
    const res = verifyMigration([profileA, profileB], [profileA, profileB]);
    expect(res.ok).toBe(true);
  });

  it("fails when counts do not match", () => {
    const res = verifyMigration([profileA, profileB], [profileA]);
    expect(res.ok).toBe(false);
    expect(res.reason).toContain("Jumlah profil tidak cocok");
  });

  it("fails when a baby is missing in target", () => {
    const fakeTarget: Profile = { ...profileB, id: "baby-999" };
    const res = verifyMigration([profileA], [fakeTarget]);
    expect(res.ok).toBe(false);
    expect(res.reason).toContain("tidak ditemukan di tujuan");
  });

  it("fails when metadata differs", () => {
    const altered = { ...profileA, panggilan: "Beda" };
    const res = verifyMigration([profileA], [altered]);
    expect(res.ok).toBe(false);
    expect(res.reason).toContain("Metadata profil");
  });

  it("fails when schedule count differs", () => {
    const altered = { ...profileA, schedule: [] };
    const res = verifyMigration([profileA], [altered]);
    expect(res.ok).toBe(false);
    expect(res.reason).toContain("Jumlah jadwal");
  });

  it("fails when records count differs", () => {
    const altered = { ...profileA, records: [] };
    const res = verifyMigration([profileA], [altered]);
    expect(res.ok).toBe(false);
    expect(res.reason).toContain("Jumlah catatan vaksin");
  });

  it("fails when an altered record field is detected", () => {
    const alteredRecord = { ...profileA.records[0], biayaAktual: 999999 };
    const altered = { ...profileA, records: [alteredRecord] };
    const res = verifyMigration([profileA], [altered]);
    expect(res.ok).toBe(false);
    expect(res.reason).toContain("Fingerprint");
  });
});
