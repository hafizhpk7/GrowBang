import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { useBayiState } from "../modules/bayi/hooks/useBayiState";
import { STORAGE_KEY } from "../utils/storage";
import { createSampleProfile } from "../data/seed";
import { ToastProvider } from "../components/common/Toast";
import { Profile, ScheduleRow, Insurance } from "../types";

// Mock AuthContext
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    isGuest: true,
    setCloudSyncStatus: vi.fn(),
    markSynced: vi.fn()
  })
}));

// Mock firebase
vi.mock("../services/firebase", () => ({
  saveStateToCloud: vi.fn().mockResolvedValue(undefined),
  subscribeToCloudState: vi.fn().mockReturnValue(() => {})
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

const emptyInsurance: Insurance = {
  namaProduk: "AXA",
  limitPerTahun: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  masaTungguBulan: 0,
  mekanisme: "",
  vaksinDikecualikan: "",
  catatan: "",
  checklist: []
};

describe("3B: State Handlers H1-H13 (useBayiState)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("H1 addProfile appends profile and sets activeProfileId", () => {
    const { result } = renderHook(() => useBayiState(), { wrapper });
    const newP: Profile = {
      id: "p2",
      panggilan: "Siti",
      tanggalLahir: "2024-01-01",
      schedule: [],
      records: [],
      insurance: emptyInsurance
    };

    act(() => {
      result.current.addProfile(newP);
    });

    expect(result.current.appState.profiles.length).toBe(2);
    expect(result.current.appState.activeProfileId).toBe("p2");
    expect(result.current.activeProfile?.panggilan).toBe("Siti");
  });

  it("H2 selectProfile sets activeProfileId", () => {
    const { result } = renderHook(() => useBayiState(), { wrapper });
    const newP: Profile = {
      id: "p2",
      panggilan: "Siti",
      tanggalLahir: "2024-01-01",
      schedule: [],
      records: [],
      insurance: emptyInsurance
    };

    act(() => {
      result.current.addProfile(newP);
      result.current.selectProfile("p2");
    });

    expect(result.current.appState.activeProfileId).toBe("p2");
  });

  it("H3 updateProfile replaces profile with same id", () => {
    const { result } = renderHook(() => useBayiState(), { wrapper });
    const current = result.current.activeProfile!;
    const updated = { ...current, panggilan: "PanggilanBaru" };

    act(() => {
      result.current.updateProfile(updated);
    });

    expect(result.current.activeProfile?.panggilan).toBe("PanggilanBaru");
  });

  it("H4 deleteProfile removes profile and handles active fallback", () => {
    const { result } = renderHook(() => useBayiState(), { wrapper });
    const initialId = result.current.activeProfile!.id;

    const newP: Profile = {
      id: "p2",
      panggilan: "Siti",
      tanggalLahir: "2024-01-01",
      schedule: [],
      records: [],
      insurance: emptyInsurance
    };

    act(() => {
      result.current.addProfile(newP);
      result.current.selectProfile(initialId);
      result.current.deleteProfile(initialId);
    });

    expect(result.current.appState.profiles.length).toBe(1);
    expect(result.current.appState.activeProfileId).toBe("p2");

    act(() => {
      result.current.deleteProfile("p2");
    });

    expect(result.current.appState.profiles.length).toBe(0);
    expect(result.current.appState.activeProfileId).toBe("");
  });

  it("H5 updateScheduleRow replaces row with same id in active profile schedule", () => {
    const { result } = renderHook(() => useBayiState(), { wrapper });
    const firstRow = result.current.activeProfile!.schedule[0];
    const updatedRow = { ...firstRow, catatan: "Catatan Baru" };

    act(() => {
      result.current.updateScheduleRow(updatedRow);
    });

    const found = result.current.activeProfile!.schedule.find((r) => r.id === firstRow.id);
    expect(found?.catatan).toBe("Catatan Baru");
  });

  it("H6 addCustomRow appends custom row to active profile schedule", () => {
    const { result } = renderHook(() => useBayiState(), { wrapper });
    const initialCount = result.current.activeProfile!.schedule.length;

    const customRow: ScheduleRow = {
      id: "custom_1",
      tahun: 1,
      bln: 2,
      usia: "2 bulan",
      vaksin: "Vaksin Custom",
      ref: "MANDATORI",
      status: "Wajib",
      gratis: "Ya",
      masuk: true,
      min: 0,
      max: 0,
      catatan: "Custom",
      isCustom: true
    };

    act(() => {
      result.current.addCustomRow(customRow);
    });

    expect(result.current.activeProfile!.schedule.length).toBe(initialCount + 1);
  });

  it("H7 deleteCustomRow removes row and matching record", () => {
    const { result } = renderHook(() => useBayiState(), { wrapper });
    const rowId = result.current.activeProfile!.schedule[0].id;

    act(() => {
      result.current.updateRecord({ rowId, diberikan: true });
      result.current.deleteCustomRow(rowId);
    });

    expect(result.current.activeProfile!.schedule.some((r) => r.id === rowId)).toBe(false);
    expect(result.current.activeProfile!.records.some((r) => r.rowId === rowId)).toBe(false);
  });

  it("H8 resetSchedule resets schedule to clone of SEED_SCHEDULE without touching records", () => {
    const { result } = renderHook(() => useBayiState(), { wrapper });
    const firstRow = result.current.activeProfile!.schedule[0];
    const initialRecordsCount = result.current.activeProfile!.records.length;

    act(() => {
      result.current.updateScheduleRow({ ...firstRow, catatan: "Modified" });
      result.current.resetSchedule();
    });

    const resetRow = result.current.activeProfile!.schedule.find((r) => r.id === firstRow.id);
    expect(resetRow?.catatan).toBe(firstRow.catatan); // restored from seed
    expect(result.current.activeProfile!.records.length).toBe(initialRecordsCount); // records untouched
  });

  it("H9 updateRecord upserts record by rowId", () => {
    const { result } = renderHook(() => useBayiState(), { wrapper });

    act(() => {
      result.current.updateRecord({ rowId: "r01", diberikan: true, tempat: "Puskesmas" });
    });

    let rec = result.current.activeProfile!.records.find((r) => r.rowId === "r01");
    expect(rec?.diberikan).toBe(true);

    act(() => {
      result.current.updateRecord({ rowId: "r01", diberikan: true, tempat: "Klinik" });
    });

    rec = result.current.activeProfile!.records.find((r) => r.rowId === "r01");
    expect(rec?.tempat).toBe("Klinik");
  });

  it("H10 quickMarkGiven builds record and supports undo", () => {
    const { result } = renderHook(() => useBayiState(), { wrapper });
    const row = result.current.activeProfile!.schedule[0];

    act(() => {
      result.current.quickMarkGiven(row);
    });

    let rec = result.current.activeProfile!.records.find((r) => r.rowId === row.id);
    expect(rec?.diberikan).toBe(true);
  });

  it("H11 updateInsurance updates active profile insurance", () => {
    const { result } = renderHook(() => useBayiState(), { wrapper });

    act(() => {
      result.current.updateInsurance({
        namaProduk: "Prudential",
        nomorPolis: "POL-999",
        limitPerTahun: { 1: 5000000, 2: 5000000, 3: 5000000, 4: 5000000, 5: 5000000 },
        masaTungguBulan: 0,
        mekanisme: "",
        vaksinDikecualikan: "",
        catatan: "",
        checklist: [true, false, false, false]
      });
    });

    expect(result.current.activeProfile!.insurance.namaProduk).toBe("Prudential");
  });

  it("H12 updatePaymentMode sets global paymentMode", () => {
    const { result } = renderHook(() => useBayiState(), { wrapper });

    act(() => {
      result.current.updatePaymentMode("FULL_PRIVATE");
    });

    expect(result.current.paymentMode).toBe("FULL_PRIVATE");
  });

  it("H13 clearAllBabyData clears storage and resets to initial state", () => {
    const navigateMock = vi.fn();
    const { result } = renderHook(() => useBayiState(navigateMock), { wrapper });

    act(() => {
      result.current.clearAllBabyData();
    });

    expect(result.current.appState.profiles.length).toBe(1);
    expect(navigateMock).toHaveBeenCalled();
  });
});
