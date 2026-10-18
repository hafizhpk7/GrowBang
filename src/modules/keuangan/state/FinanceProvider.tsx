import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "../../../components/common/Toast";
import { useVaccineCostSources } from "../../bayi/public";
import { DEFAULT_FINANCE_CONFIG } from "../constants/categories";
import { LocalRepository, LOCAL_FINANCE_STORAGE_KEY } from "../repository/LocalRepository";
import { CloudRepository } from "../repository/CloudRepository";
import { useFinanceRepository } from "../repository/useFinanceRepository";
import { Category, FinanceConfig, LedgerEntry, RecurringRule, SavingsGoal, Transaction, TxType } from "../types";
import { validateCategoryName } from "../utils/categories";
import { addMonths, currentMonthKey, monthRange, todayLocal } from "../utils/dates";
import { decideGuestMigration } from "../utils/migration";
import { validateRecurringRuleInput, validateSavingsGoalInput, validateTransactionInput, validateWalletName } from "../utils/validation";
import { evaluateAllRecurringRules } from "../utils/recurring";
import { buildVaccineEntries, summarizePendingClaims } from "../utils/vaccineEntries";
import { FinanceContext } from "./FinanceContext";

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { repository, userId } = useFinanceRepository();
  const { showToast } = useToast();
  const vaxSources = useVaccineCostSources();

  const [selectedMonth, setSelectedMonthState] = useState<string>(currentMonthKey());
  const [manualTransactions, setManualTransactions] = useState<Transaction[]>([]);
  const [config, setConfig] = useState<FinanceConfig>({ ...DEFAULT_FINANCE_CONFIG });
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [migrationDecision, setMigrationDecision] = useState<"none" | "auto-upload" | "prompt">("none");

  const migratedRef = useRef<string | null>(null);
  const evaluatedSigRef = useRef<string>("");

  const setSelectedMonth = useCallback((month: string) => {
    const cur = currentMonthKey();
    if (month > cur) {
      setSelectedMonthState(cur);
    } else {
      setSelectedMonthState(month);
    }
  }, []);

  const windowRange = useMemo(() => {
    const startM = addMonths(selectedMonth, -5);
    const from = monthRange(startM).from;
    const to = monthRange(selectedMonth).to;
    return { from, to };
  }, [selectedMonth]);

  // Subscriptions
  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubTx = repository.subscribeTransactions(
      windowRange,
      (txs) => {
        setManualTransactions(txs);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    const unsubCfg = repository.subscribeConfig(
      (cfg) => {
        setConfig(cfg);
      },
      (err) => {
        console.warn("Config sub error:", err);
      }
    );

    const unsubGoals = repository.subscribeSavingsGoals(
      (goals: SavingsGoal[]) => {
        setSavingsGoals(goals);
      },
      (err: Error) => {
        console.warn("Goals sub error:", err);
      }
    );

    const unsubRules = repository.subscribeRecurringRules(
      (rules: RecurringRule[]) => {
        setRecurringRules(rules);
      },
      (err: Error) => {
        console.warn("Rules sub error:", err);
      }
    );

    return () => {
      unsubTx();
      unsubCfg();
      unsubGoals();
      unsubRules();
    };
  }, [repository, windowRange]);

  // Evaluate recurring rules engine on mount / rules change
  useEffect(() => {
    if (loading || recurringRules.length === 0) return;
    const today = todayLocal();
    const sig = today + ":" + recurringRules.map(r => `${r.id}:${r.updatedAt || ""}:${r.active !== false}:${r.lastGeneratedThrough || ""}`).join(",");
    if (evaluatedSigRef.current === sig) return;
    evaluatedSigRef.current = sig;

    const { transactions, ruleUpdates } = evaluateAllRecurringRules(recurringRules, today, userId);
    if (transactions.length > 0 || ruleUpdates.length > 0) {
      repository.generateRecurringTransactions(transactions, ruleUpdates)
        .then(({ created }: { created: number }) => {
          if (created > 0) {
            showToast(`${created} transaksi berulang dibuat.`);
          }
        })
        .catch((err) => {
          console.warn("Failed to generate recurring transactions:", err);
          showToast("Gagal membuat transaksi berulang. Coba lagi.");
        });
    }
  }, [loading, recurringRules, repository, userId, showToast]);

  // Guest -> Cloud migration runner
  useEffect(() => {
    if (!userId) {
      setMigrationDecision("none");
      migratedRef.current = null;
      return;
    }

    if (migratedRef.current === userId) return;

    let isMounted = true;

    async function runMigrationCheck() {
      try {
        const localRepo = new LocalRepository();
        const localBlob = localRepo.getRawData();

        const localHasData =
          (localBlob.transactions && localBlob.transactions.length > 0) ||
          (localBlob.savingsGoals && localBlob.savingsGoals.length > 0) ||
          (localBlob.recurringRules && localBlob.recurringRules.length > 0) ||
          (localBlob.config &&
            ((localBlob.config.customCategories && localBlob.config.customCategories.length > 0) ||
              (localBlob.config.budgets && Object.keys(localBlob.config.budgets).length > 0) ||
              (localBlob.config.wallets && Object.keys(localBlob.config.wallets).length > 1) ||
              localBlob.config.includeVaccineCosts === false));

        if (!localHasData) {
          if (isMounted) setMigrationDecision("none");
          migratedRef.current = userId;
          return;
        }

        const cloudRepo = repository as CloudRepository;
        const cloudHasData = await cloudRepo.checkCloudHasData();

        const decision = decideGuestMigration({
          signedIn: true,
          cloudHasData,
          localHasData
        });

        if (!isMounted) return;

        if (decision === "auto-upload") {
          await cloudRepo.uploadLocalData(localBlob);
          localStorage.removeItem(LOCAL_FINANCE_STORAGE_KEY);
          showToast("Data keuangan tamu diunggah ke akun Anda.");
          setMigrationDecision("none");
        } else if (decision === "prompt") {
          setMigrationDecision("prompt");
        } else {
          setMigrationDecision("none");
        }

        migratedRef.current = userId;
      } catch (e) {
        console.warn("Migration check error:", e);
      }
    }

    runMigrationCheck();

    return () => {
      isMounted = false;
    };
  }, [userId, repository, showToast]);

  const uploadGuestDataToCloud = useCallback(async () => {
    if (!userId) return;
    try {
      const localRepo = new LocalRepository();
      const localBlob = localRepo.getRawData();
      const cloudRepo = repository as CloudRepository;

      await cloudRepo.uploadLocalData(localBlob);
      localStorage.removeItem(LOCAL_FINANCE_STORAGE_KEY);
      showToast("Data keuangan tamu diunggah ke akun Anda.");
      setMigrationDecision("none");
    } catch (e) {
      showToast("Gagal menyimpan. Coba lagi.");
    }
  }, [userId, repository, showToast]);

  const clearGuestData = useCallback(async () => {
    localStorage.removeItem(LOCAL_FINANCE_STORAGE_KEY);
    setMigrationDecision("none");
  }, []);

  const { vaxEntries } = useMemo(() => {
    if (!config.includeVaccineCosts) {
      return { vaxEntries: [], skippedWithoutDate: 0 };
    }
    const res = buildVaccineEntries(vaxSources);
    return {
      vaxEntries: res.entries,
      skippedWithoutDate: res.skippedWithoutDate
    };
  }, [config.includeVaccineCosts, vaxSources]);

  const pendingClaims = useMemo(() => {
    if (!config.includeVaccineCosts) {
      return { count: 0, total: 0 };
    }
    return summarizePendingClaims(vaxSources);
  }, [config.includeVaccineCosts, vaxSources]);

  const skippedVaccineWithoutDate = 0;

  const entries: LedgerEntry[] = useMemo(() => {
    const manualLedger: LedgerEntry[] = manualTransactions.map((tx) => ({
      ...tx,
      source: "manual" as const,
      readOnly: false
    }));

    if (!config.includeVaccineCosts) {
      return manualLedger;
    }

    const filteredVax = vaxEntries.filter(
      (ve) => ve.date >= windowRange.from && ve.date <= windowRange.to
    );

    return [...manualLedger, ...filteredVax];
  }, [manualTransactions, vaxEntries, config.includeVaccineCosts, windowRange]);

  // Transaction Handlers
  const addTransaction = useCallback(
    async (input: {
      type: TxType;
      amount: number;
      categoryId: string;
      walletId?: string;
      date: string;
      note?: string;
    }) => {
      const val = validateTransactionInput(input, config);
      if (!val.ok) {
        return { ok: false, errors: val.errors };
      }

      const id = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "tx-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

      const nowIso = new Date().toISOString();
      const tx: Transaction = {
        id,
        type: input.type,
        amount: Math.floor(input.amount),
        categoryId: input.categoryId,
        walletId: input.walletId || "default",
        date: input.date,
        createdAt: nowIso,
        updatedAt: nowIso
      };

      if (input.note && input.note.trim()) {
        tx.note = input.note.trim();
      }

      try {
        await repository.upsertTransaction(tx);
        showToast("Transaksi disimpan.");
        return { ok: true };
      } catch (e) {
        showToast("Gagal menyimpan. Coba lagi.");
        return { ok: false };
      }
    },
    [config, repository, showToast]
  );

  const updateTransaction = useCallback(
    async (
      id: string,
      input: {
        type: TxType;
        amount: number;
        categoryId: string;
        walletId?: string;
        date: string;
        note?: string;
      }
    ) => {
      const existing = manualTransactions.find((t) => t.id === id);
      const val = validateTransactionInput(input, config, {
        editingId: id,
        existingCategoryId: existing?.categoryId,
        existingWalletId: existing?.walletId
      });
      if (!val.ok) {
        return { ok: false, errors: val.errors };
      }

      const nowIso = new Date().toISOString();
      const createdAt = existing?.createdAt || nowIso;

      const tx: Transaction = {
        id,
        type: input.type,
        amount: Math.floor(input.amount),
        categoryId: input.categoryId,
        walletId: input.walletId || existing?.walletId || "default",
        date: input.date,
        createdAt,
        updatedAt: nowIso
      };

      if (input.note && input.note.trim()) {
        tx.note = input.note.trim();
      }

      try {
        await repository.upsertTransaction(tx);
        showToast("Transaksi diperbarui.");
        return { ok: true };
      } catch (e) {
        showToast("Gagal menyimpan. Coba lagi.");
        return { ok: false };
      }
    },
    [config, manualTransactions, repository, showToast]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      const existing = manualTransactions.find((t) => t.id === id);
      try {
        await repository.deleteTransaction(id);
        if (existing) {
          showToast("Transaksi dihapus.", "Urungkan", () => {
            repository.upsertTransaction(existing).catch(() => {
              showToast("Gagal menyimpan. Coba lagi.");
            });
          });
        } else {
          showToast("Transaksi dihapus.");
        }
      } catch (e) {
        showToast("Gagal menyimpan. Coba lagi.");
      }
    },
    [manualTransactions, repository, showToast]
  );

  // Budget and Category Handlers
  const saveBudget = useCallback(
    async (categoryId: string, amount: number | null) => {
      const newBudgets = { ...(config.budgets || {}) };
      if (amount === null || amount <= 0 || isNaN(amount)) {
        delete newBudgets[categoryId];
      } else {
        newBudgets[categoryId] = Math.floor(amount);
      }

      const newConfig: FinanceConfig = {
        ...config,
        budgets: newBudgets
      };

      try {
        await repository.saveConfig(newConfig);
        showToast("Anggaran disimpan.");
      } catch (e) {
        showToast("Gagal menyimpan. Coba lagi.");
      }
    },
    [config, repository, showToast]
  );

  const addCategory = useCallback(
    async (name: string, type: TxType) => {
      const val = validateCategoryName(name, type, config);
      if (!val.ok) {
        return { ok: false, error: val.error };
      }

      const newId =
        "custom-" +
        (typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Date.now().toString(36) + Math.random().toString(36).slice(2, 6));

      const newCat: Category = {
        id: newId,
        name: name.trim(),
        type,
        isSystem: false
      };

      const newConfig: FinanceConfig = {
        ...config,
        customCategories: [...(config.customCategories || []), newCat]
      };

      try {
        await repository.saveConfig(newConfig);
        showToast("Kategori ditambahkan.");
        return { ok: true };
      } catch (e) {
        showToast("Gagal menyimpan. Coba lagi.");
        return { ok: false, error: "Gagal menyimpan." };
      }
    },
    [config, repository, showToast]
  );

  const renameCategory = useCallback(
    async (id: string, name: string) => {
      const cat = (config.customCategories || []).find((c) => c.id === id);
      if (!cat) return { ok: false, error: "Kategori tidak ditemukan" };

      const val = validateCategoryName(name, cat.type, config, { renamingId: id });
      if (!val.ok) {
        return { ok: false, error: val.error };
      }

      const newCats = (config.customCategories || []).map((c) => {
        if (c.id !== id) return c;
        return { ...c, name: name.trim() };
      });

      const newConfig: FinanceConfig = { ...config, customCategories: newCats };

      try {
        await repository.saveConfig(newConfig);
        return { ok: true };
      } catch (e) {
        showToast("Gagal menyimpan. Coba lagi.");
        return { ok: false, error: "Gagal menyimpan." };
      }
    },
    [config, repository, showToast]
  );

  const setCategoryArchived = useCallback(
    async (id: string, archived: boolean) => {
      const newCats = (config.customCategories || []).map((c) => {
        if (c.id !== id) return c;
        return { ...c, archived };
      });

      const newConfig: FinanceConfig = { ...config, customCategories: newCats };

      try {
        await repository.saveConfig(newConfig);
      } catch (e) {
        showToast("Gagal menyimpan. Coba lagi.");
      }
    },
    [config, repository, showToast]
  );

  const setIncludeVaccineCosts = useCallback(
    async (enabled: boolean) => {
      const newConfig: FinanceConfig = { ...config, includeVaccineCosts: enabled };
      try {
        await repository.saveConfig(newConfig);
      } catch (e) {
        showToast("Gagal menyimpan. Coba lagi.");
      }
    },
    [config, repository, showToast]
  );

  // Wallet Handlers
  const addWallet = useCallback(async (name: string) => {
    const wallets = config.wallets || {};
    const err = validateWalletName(name, wallets);
    if (err) return { ok: false, error: err };

    const wId = "wallet-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const newWallets = {
      ...wallets,
      [wId]: {
        id: wId,
        name: name.trim(),
        isDefault: false,
        archived: false,
        createdAt: new Date().toISOString()
      }
    };
    try {
      await repository.saveConfig({ ...config, wallets: newWallets });
      showToast("Dompet ditambahkan.");
      return { ok: true };
    } catch (e) {
      showToast("Gagal menyimpan. Coba lagi.");
      return { ok: false, error: "Gagal menyimpan." };
    }
  }, [config, repository, showToast]);

  const renameWallet = useCallback(async (id: string, name: string) => {
    if (id === "default") return { ok: false, error: "Dompet utama tidak dapat diubah namanya" };
    const wallets = config.wallets || {};
    const target = wallets[id];
    if (!target) return { ok: false, error: "Dompet tidak ditemukan" };

    const err = validateWalletName(name, wallets);
    if (err) return { ok: false, error: err };

    const newWallets = {
      ...wallets,
      [id]: { ...target, name: name.trim() }
    };
    try {
      await repository.saveConfig({ ...config, wallets: newWallets });
      showToast("Dompet diperbarui.");
      return { ok: true };
    } catch (e) {
      showToast("Gagal menyimpan. Coba lagi.");
      return { ok: false, error: "Gagal menyimpan." };
    }
  }, [config, repository, showToast]);

  const setWalletArchived = useCallback(async (id: string, archived: boolean) => {
    if (id === "default" && archived) {
      showToast("Kas Utama tidak dapat diarsipkan.");
      return;
    }
    const wallets = config.wallets || {};
    const target = wallets[id];
    if (!target) return;

    const newWallets = {
      ...wallets,
      [id]: { ...target, archived }
    };
    try {
      await repository.saveConfig({ ...config, wallets: newWallets });
      showToast(archived ? "Dompet diarsipkan." : "Dompet dipulihkan.");
    } catch (e) {
      showToast("Gagal menyimpan. Coba lagi.");
    }
  }, [config, repository, showToast]);

  // Savings Goals Handlers
  const upsertSavingsGoal = useCallback(async (goal: SavingsGoal) => {
    const val = validateSavingsGoalInput(goal);
    if (!val.ok) return { ok: false, errors: val.errors };

    try {
      await repository.upsertSavingsGoal(goal);
      showToast("Target tabungan disimpan.");
      return { ok: true };
    } catch (e) {
      showToast("Gagal menyimpan. Coba lagi.");
      return { ok: false };
    }
  }, [repository, showToast]);

  const deleteSavingsGoal = useCallback(async (id: string) => {
    try {
      await repository.deleteSavingsGoal(id);
      showToast("Target tabungan dihapus.");
    } catch (e) {
      showToast("Gagal menyimpan. Coba lagi.");
    }
  }, [repository, showToast]);

  const adjustSavingsGoal = useCallback(async (id: string, delta: number) => {
    try {
      await repository.adjustSavingsGoal(id, delta);
      showToast("Tabungan diperbarui.");
    } catch (e) {
      showToast("Gagal menyimpan. Coba lagi.");
    }
  }, [repository, showToast]);

  // Recurring Rules Handlers
  const upsertRecurringRule = useCallback(async (rule: RecurringRule) => {
    const val = validateRecurringRuleInput(rule, config);
    if (!val.ok) return { ok: false, errors: val.errors };

    try {
      await repository.upsertRecurringRule(rule);
      showToast("Aturan transaksi berulang disimpan.");
      return { ok: true };
    } catch (e) {
      showToast("Gagal menyimpan. Coba lagi.");
      return { ok: false };
    }
  }, [config, repository, showToast]);

  const deleteRecurringRule = useCallback(async (id: string) => {
    try {
      await repository.deleteRecurringRule(id);
      showToast("Aturan transaksi berulang dihapus.");
    } catch (e) {
      showToast("Gagal menyimpan. Coba lagi.");
    }
  }, [repository, showToast]);

  const deleteAllFinanceData = useCallback(async () => {
    try {
      await repository.deleteAllData();
      setManualTransactions([]);
      setConfig({ ...DEFAULT_FINANCE_CONFIG });
      setSavingsGoals([]);
      setRecurringRules([]);
      showToast("Semua data keuangan dihapus.");
    } catch (e) {
      showToast("Gagal menyimpan. Coba lagi.");
    }
  }, [repository, showToast]);

  const value = useMemo(
    () => ({
      selectedMonth,
      setSelectedMonth,
      config,
      loading,
      error,
      entries,
      savingsGoals,
      recurringRules,
      pendingClaims,
      skippedVaccineWithoutDate,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      saveBudget,
      addCategory,
      renameCategory,
      setCategoryArchived,
      setIncludeVaccineCosts,
      addWallet,
      renameWallet,
      setWalletArchived,
      upsertSavingsGoal,
      deleteSavingsGoal,
      adjustSavingsGoal,
      upsertRecurringRule,
      deleteRecurringRule,
      deleteAllFinanceData,
      migrationDecision,
      uploadGuestDataToCloud,
      clearGuestData
    }),
    [
      selectedMonth,
      setSelectedMonth,
      config,
      loading,
      error,
      entries,
      savingsGoals,
      recurringRules,
      pendingClaims,
      skippedVaccineWithoutDate,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      saveBudget,
      addCategory,
      renameCategory,
      setCategoryArchived,
      setIncludeVaccineCosts,
      addWallet,
      renameWallet,
      setWalletArchived,
      upsertSavingsGoal,
      deleteSavingsGoal,
      adjustSavingsGoal,
      upsertRecurringRule,
      deleteRecurringRule,
      deleteAllFinanceData,
      migrationDecision,
      uploadGuestDataToCloud,
      clearGuestData
    ]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};
