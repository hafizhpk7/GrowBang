import { describe, it, expect } from "vitest";
import { AppState, Profile, ScheduleRow, Record, Insurance } from "../../types";
import { diffAppState } from "../../modules/bayi/state/diff";

const sampleInsurance: Insurance = {
  namaProduk: "BPJS",
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
  vaksin: "Hep B",
  ref: "hepb",
  status: "Wajib",
  gratis: "Ya",
  masuk: true,
  min: 0,
  max: 0,
  catatan: ""
};

const baby1: Profile = {
  id: "baby-1",
  panggilan: "Puyo",
  tanggalLahir: "2024-01-01",
  catatan: "Catatan Puyo",
  schedule: [sampleRow],
  records: [
    { rowId: "r01", diberikan: true, tanggalDiberikan: "2024-01-02", biayaAktual: 0 }
  ],
  insurance: sampleInsurance
};

const baseState: AppState = {
  schemaVersion: 1,
  profiles: [baby1],
  activeProfileId: "baby-1",
  paymentMode: "HYBRID"
};

describe("diffAppState pure unit tests", () => {
  it("returns empty ops when state is unchanged", () => {
    const ops = diffAppState(baseState, { ...baseState });
    expect(ops).toHaveLength(0);
  });

  it("detects new baby addition: setBaby, setSchedule, and records", () => {
    const baby2: Profile = {
      id: "baby-2",
      panggilan: "Eci",
      tanggalLahir: "2024-06-01",
      schedule: [sampleRow],
      records: [],
      insurance: sampleInsurance
    };

    const nextState: AppState = {
      ...baseState,
      profiles: [...baseState.profiles, baby2]
    };

    const ops = diffAppState(baseState, nextState);
    expect(ops).toHaveLength(2); // setBaby and setSchedule
    expect(ops[0]).toEqual({
      type: "setBaby",
      babyId: "baby-2",
      meta: {
        id: "baby-2",
        panggilan: "Eci",
        tanggalLahir: "2024-06-01",
        catatan: undefined,
        insurance: sampleInsurance,
        schemaVersion: 1
      }
    });
    expect(ops[1]).toEqual({
      type: "setSchedule",
      babyId: "baby-2",
      rows: baby2.schedule
    });
  });

  it("detects baby deletion: deleteBaby", () => {
    const nextState: AppState = {
      ...baseState,
      profiles: []
    };

    const ops = diffAppState(baseState, nextState);
    expect(ops).toHaveLength(1);
    expect(ops[0]).toEqual({
      type: "deleteBaby",
      babyId: "baby-1"
    });
  });

  it("detects baby metadata update only", () => {
    const updatedBaby1: Profile = {
      ...baby1,
      panggilan: "Puyo Update"
    };

    const nextState: AppState = {
      ...baseState,
      profiles: [updatedBaby1]
    };

    const ops = diffAppState(baseState, nextState);
    expect(ops).toHaveLength(1);
    expect(ops[0].type).toBe("setBaby");
    if (ops[0].type === "setBaby") {
      expect(ops[0].meta.panggilan).toBe("Puyo Update");
    }
  });

  it("detects schedule change: setSchedule only", () => {
    const updatedSchedule: ScheduleRow[] = [
      ...baby1.schedule,
      {
        id: "custom-1",
        tahun: 1,
        usia: "1 Bulan",
        bln: 1,
        vaksin: "Vaksin Tambahan",
        ref: "custom",
        status: "Pilihan",
        gratis: "Tidak",
        masuk: true,
        min: 100000,
        max: 200000,
        catatan: ""
      }
    ];

    const nextState: AppState = {
      ...baseState,
      profiles: [{ ...baby1, schedule: updatedSchedule }]
    };

    const ops = diffAppState(baseState, nextState);
    expect(ops).toHaveLength(1);
    expect(ops[0]).toEqual({
      type: "setSchedule",
      babyId: "baby-1",
      rows: updatedSchedule
    });
  });

  it("detects record addition or update: setRecord only", () => {
    const newRecord: Record = {
      rowId: "r02",
      diberikan: true,
      tanggalDiberikan: "2024-02-01",
      biayaAktual: 50000
    };

    const nextState: AppState = {
      ...baseState,
      profiles: [{ ...baby1, records: [...baby1.records, newRecord] }]
    };

    const ops = diffAppState(baseState, nextState);
    expect(ops).toHaveLength(1);
    expect(ops[0]).toEqual({
      type: "setRecord",
      babyId: "baby-1",
      rowId: "r02",
      record: newRecord
    });
  });

  it("detects record deletion: deleteRecord only", () => {
    const nextState: AppState = {
      ...baseState,
      profiles: [{ ...baby1, records: [] }]
    };

    const ops = diffAppState(baseState, nextState);
    expect(ops).toHaveLength(1);
    expect(ops[0]).toEqual({
      type: "deleteRecord",
      babyId: "baby-1",
      rowId: "r01"
    });
  });
});
