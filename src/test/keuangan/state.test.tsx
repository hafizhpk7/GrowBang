import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ToastProvider } from "../../components/common/Toast";
import { FinanceProvider } from "../../modules/keuangan/state/FinanceProvider";
import { useFinance } from "../../modules/keuangan/state/FinanceContext";
import { currentMonthKey } from "../../modules/keuangan/utils/dates";

// Mock AuthContext and BayiContext
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    isGuest: true
  })
}));

vi.mock("../../modules/bayi/public", () => ({
  useVaccineCostSources: () => [
    {
      profileId: "p1",
      profileName: "Anak Budi",
      rows: [{ id: "r1", vaksin: "BCG" }],
      records: [
        {
          rowId: "r1",
          diberikan: true,
          tanggalDiberikan: "2026-10-02",
          biayaAktual: 120000,
          ditanggungAsuransi: true,
          nominalKlaim: 120000,
          statusKlaim: "Belum diajukan"
        }
      ]
    }
  ]
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    <FinanceProvider>{children}</FinanceProvider>
  </ToastProvider>
);

describe("9.3 Finance State & Provider Tests (T-STATE-1 .. T-STATE-6)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("T-STATE-1: add/update/delete/undo transaction flow", async () => {
    const { result } = renderHook(() => useFinance(), { wrapper });

    // Add transaction
    let addRes: any;
    await act(async () => {
      addRes = await result.current.addTransaction({
        type: "expense",
        amount: 50000,
        categoryId: "makan-minum",
        date: "2026-10-05",
        note: "Makan siang"
      });
    });

    expect(addRes.ok).toBe(true);
    const manualTxs = result.current.entries.filter((e) => e.source === "manual");
    expect(manualTxs).toHaveLength(1);
    const addedId = manualTxs[0].id;
    const initialCreatedAt = manualTxs[0].createdAt;

    // Update transaction (createdAt preserved)
    await act(async () => {
      await result.current.updateTransaction(addedId, {
        type: "expense",
        amount: 75000,
        categoryId: "makan-minum",
        date: "2026-10-05",
        note: "Makan siang updated"
      });
    });

    const updatedTx = result.current.entries.find((e) => e.id === addedId);
    expect(updatedTx?.amount).toBe(75000);
    expect(updatedTx?.createdAt).toBe(initialCreatedAt);

    // Delete transaction
    await act(async () => {
      await result.current.deleteTransaction(addedId);
    });

    const afterDelete = result.current.entries.find((e) => e.id === addedId);
    expect(afterDelete).toBeUndefined();
  });

  it("T-STATE-2: month window clamping and changing selectedMonth", async () => {
    const { result } = renderHook(() => useFinance(), { wrapper });

    const cur = currentMonthKey();
    expect(result.current.selectedMonth).toBe(cur);

    // Try setting future month -> clamped to current month
    act(() => {
      result.current.setSelectedMonth("2099-12");
    });
    expect(result.current.selectedMonth).toBe(cur);

    // Set valid past month
    act(() => {
      result.current.setSelectedMonth("2026-05");
    });
    expect(result.current.selectedMonth).toBe("2026-05");
  });

  it("T-STATE-4: includeVaccineCosts toggling affects entries and claims", async () => {
    const { result } = renderHook(() => useFinance(), { wrapper });

    expect(result.current.config.includeVaccineCosts).toBe(true);
    expect(result.current.entries.some((e) => e.source === "vaccine")).toBe(true);
    expect(result.current.pendingClaims.count).toBe(1);

    // Toggle off
    await act(async () => {
      await result.current.setIncludeVaccineCosts(false);
    });

    expect(result.current.config.includeVaccineCosts).toBe(false);
    expect(result.current.entries.some((e) => e.source === "vaccine")).toBe(false);
    expect(result.current.pendingClaims.count).toBe(0);
  });
});
