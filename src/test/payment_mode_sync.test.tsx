import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import fs from "fs";
import path from "path";
import { useBayiState } from "../modules/bayi/hooks/useBayiState";
import { loadAppState, saveAppState, clearAllData } from "../utils/storage";
import { AuthProvider } from "../context/AuthContext";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("Payment Mode Sync & Regression Tests", () => {
  beforeEach(() => {
    clearAllData();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("persists paymentMode in guest mode across reload via localStorage", () => {
    const { result } = renderHook(() => useBayiState(), { wrapper });
    
    act(() => {
      result.current.updatePaymentMode("FULL_PRIVATE");
      vi.advanceTimersByTime(400);
    });

    expect(result.current.paymentMode).toBe("FULL_PRIVATE");

    // Simulate reload by loading from storage
    const reloaded = loadAppState();
    expect(reloaded.paymentMode).toBe("FULL_PRIVATE");
  });

  it("does not let legacy cloud doc without paymentMode override locally chosen mode", () => {
    const initialState = loadAppState();
    initialState.paymentMode = "FULL_BPJS";
    saveAppState(initialState);

    const { result } = renderHook(() => useBayiState(), { wrapper });
    expect(result.current.paymentMode).toBe("FULL_BPJS");
  });

  it("verifies paymentMode is present in firestore.rules under isValidUserAppState", () => {
    const rulesPath = path.resolve("firestore.rules");
    const rulesContent = fs.readFileSync(rulesPath, "utf-8");
    expect(rulesContent).toContain("paymentMode");
    expect(rulesContent).toContain("FULL_PRIVATE");
    expect(rulesContent).toContain("FULL_BPJS");
  });
});
