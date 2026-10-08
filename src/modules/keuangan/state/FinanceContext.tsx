import { createContext, useContext } from "react";
import { Category, FinanceConfig, LedgerEntry, Transaction, TxType } from "../types";

export interface FinanceContextType {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  config: FinanceConfig;
  loading: boolean;
  error: Error | null;
  entries: LedgerEntry[];
  pendingClaims: { count: number; total: number };
  skippedVaccineWithoutDate: number;

  addTransaction: (input: {
    type: TxType;
    amount: number;
    categoryId: string;
    date: string;
    note?: string;
  }) => Promise<{ ok: boolean; errors?: any }>;

  updateTransaction: (
    id: string,
    input: {
      type: TxType;
      amount: number;
      categoryId: string;
      date: string;
      note?: string;
    }
  ) => Promise<{ ok: boolean; errors?: any }>;

  deleteTransaction: (id: string) => Promise<void>;

  saveBudget: (categoryId: string, amount: number | null) => Promise<void>;
  addCategory: (name: string, type: TxType) => Promise<{ ok: boolean; error?: string }>;
  renameCategory: (id: string, name: string) => Promise<{ ok: boolean; error?: string }>;
  setCategoryArchived: (id: string, archived: boolean) => Promise<void>;
  setIncludeVaccineCosts: (enabled: boolean) => Promise<void>;
  deleteAllFinanceData: () => Promise<void>;

  migrationDecision: "none" | "auto-upload" | "prompt";
  uploadGuestDataToCloud: () => Promise<void>;
  clearGuestData: () => Promise<void>;
}

export const FinanceContext = createContext<FinanceContextType | null>(null);

export function useFinance(): FinanceContextType {
  const ctx = useContext(FinanceContext);
  if (!ctx) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return ctx;
}
