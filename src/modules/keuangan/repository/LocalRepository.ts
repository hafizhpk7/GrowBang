import { DEFAULT_FINANCE_CONFIG } from "../constants/categories";
import { FinanceConfig, RecurringRule, SavingsGoal, Transaction } from "../types";
import { normalizeConfig } from "../utils/normalization";
import { FinanceRepository } from "./types";

export const LOCAL_FINANCE_STORAGE_KEY = "keuangan-keluarga-v1";

interface LocalStorageData {
  schemaVersion: number;
  transactions: Transaction[];
  config: FinanceConfig;
  savingsGoals: SavingsGoal[];
  recurringRules: RecurringRule[];
}

export class LocalRepository implements FinanceRepository {
  private txListeners: Set<{
    range: { from: string; to: string };
    onData: (txs: Transaction[]) => void;
    onError: (e: Error) => void;
  }> = new Set();

  private configListeners: Set<{
    onData: (cfg: FinanceConfig) => void;
    onError: (e: Error) => void;
  }> = new Set();

  private goalsListeners: Set<{
    onData: (goals: SavingsGoal[]) => void;
    onError: (e: Error) => void;
  }> = new Set();

  private rulesListeners: Set<{
    onData: (rules: RecurringRule[]) => void;
    onError: (e: Error) => void;
  }> = new Set();

  private loadData(): LocalStorageData {
    try {
      const raw = localStorage.getItem(LOCAL_FINANCE_STORAGE_KEY);
      if (!raw) {
        return {
          schemaVersion: 1,
          transactions: [],
          config: { ...DEFAULT_FINANCE_CONFIG },
          savingsGoals: [],
          recurringRules: []
        };
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return {
          schemaVersion: 1,
          transactions: [],
          config: { ...DEFAULT_FINANCE_CONFIG },
          savingsGoals: [],
          recurringRules: []
        };
      }

      const validTxs: Transaction[] = [];
      if (Array.isArray(parsed.transactions)) {
        for (const tx of parsed.transactions) {
          if (
            tx &&
            typeof tx === "object" &&
            typeof tx.id === "string" &&
            (tx.type === "income" || tx.type === "expense") &&
            typeof tx.amount === "number" &&
            typeof tx.categoryId === "string" &&
            typeof tx.date === "string"
          ) {
            validTxs.push({
              ...tx,
              walletId: tx.walletId || "default"
            } as Transaction);
          }
        }
      }

      const config = normalizeConfig(parsed.config);

      const savingsGoals: SavingsGoal[] = [];
      if (Array.isArray(parsed.savingsGoals)) {
        for (const g of parsed.savingsGoals) {
          if (g && typeof g.id === "string" && typeof g.name === "string" && typeof g.targetAmount === "number") {
            savingsGoals.push(g as SavingsGoal);
          }
        }
      }

      const recurringRules: RecurringRule[] = [];
      if (Array.isArray(parsed.recurringRules)) {
        for (const r of parsed.recurringRules) {
          if (r && typeof r.id === "string" && typeof r.amount === "number" && typeof r.categoryId === "string" && typeof r.frequency === "string") {
            recurringRules.push(r as RecurringRule);
          }
        }
      }

      return {
        schemaVersion: 1,
        transactions: validTxs,
        config,
        savingsGoals,
        recurringRules
      };
    } catch (e) {
      console.warn("Failed to parse local finance data:", e);
      return {
        schemaVersion: 1,
        transactions: [],
        config: { ...DEFAULT_FINANCE_CONFIG },
        savingsGoals: [],
        recurringRules: []
      };
    }
  }

  private saveData(data: LocalStorageData): void {
    try {
      localStorage.setItem(LOCAL_FINANCE_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Failed to save local finance data:", e);
      throw e;
    }
  }

  private notifyTxListeners(): void {
    const data = this.loadData();
    for (const listener of this.txListeners) {
      const filtered = data.transactions.filter(
        (tx) => tx.date >= listener.range.from && tx.date <= listener.range.to
      );
      listener.onData(filtered);
    }
  }

  private notifyConfigListeners(): void {
    const data = this.loadData();
    for (const listener of this.configListeners) {
      listener.onData(data.config);
    }
  }

  private notifyGoalsListeners(): void {
    const data = this.loadData();
    for (const listener of this.goalsListeners) {
      listener.onData(data.savingsGoals);
    }
  }

  private notifyRulesListeners(): void {
    const data = this.loadData();
    for (const listener of this.rulesListeners) {
      listener.onData(data.recurringRules);
    }
  }

  subscribeTransactions(
    range: { from: string; to: string },
    onData: (txs: Transaction[]) => void,
    onError: (e: Error) => void
  ): () => void {
    const listener = { range, onData, onError };
    this.txListeners.add(listener);

    const data = this.loadData();
    const filtered = data.transactions.filter(
      (tx) => tx.date >= range.from && tx.date <= range.to
    );
    onData(filtered);

    return () => {
      this.txListeners.delete(listener);
    };
  }

  subscribeConfig(
    onData: (cfg: FinanceConfig) => void,
    onError: (e: Error) => void
  ): () => void {
    const listener = { onData, onError };
    this.configListeners.add(listener);

    const data = this.loadData();
    onData(data.config);

    return () => {
      this.configListeners.delete(listener);
    };
  }

  subscribeSavingsGoals(
    onData: (goals: SavingsGoal[]) => void,
    onError: (e: Error) => void
  ): () => void {
    const listener = { onData, onError };
    this.goalsListeners.add(listener);

    const data = this.loadData();
    onData(data.savingsGoals);

    return () => {
      this.goalsListeners.delete(listener);
    };
  }

  subscribeRecurringRules(
    onData: (rules: RecurringRule[]) => void,
    onError: (e: Error) => void
  ): () => void {
    const listener = { onData, onError };
    this.rulesListeners.add(listener);

    const data = this.loadData();
    onData(data.recurringRules);

    return () => {
      this.rulesListeners.delete(listener);
    };
  }

  async upsertTransaction(tx: Transaction): Promise<void> {
    const data = this.loadData();
    const resolvedTx = { ...tx, walletId: tx.walletId || "default" };
    const idx = data.transactions.findIndex((t) => t.id === tx.id);
    if (idx >= 0) {
      if (!resolvedTx.createdBy && data.transactions[idx].createdBy) {
        resolvedTx.createdBy = data.transactions[idx].createdBy;
      }
      data.transactions[idx] = resolvedTx;
    } else {
      data.transactions.push(resolvedTx);
    }
    this.saveData(data);
    this.notifyTxListeners();
  }

  async deleteTransaction(id: string): Promise<void> {
    const data = this.loadData();
    data.transactions = data.transactions.filter((t) => t.id !== id);
    this.saveData(data);
    this.notifyTxListeners();
  }

  async saveConfig(cfg: FinanceConfig): Promise<void> {
    const data = this.loadData();
    data.config = normalizeConfig(cfg);
    this.saveData(data);
    this.notifyConfigListeners();
  }

  async updateBudget(categoryId: string, amount: number): Promise<void> {
    const data = this.loadData();
    data.config.budgets[categoryId] = amount;
    this.saveData(data);
    this.notifyConfigListeners();
  }

  async upsertSavingsGoal(goal: SavingsGoal): Promise<void> {
    const data = this.loadData();
    const idx = data.savingsGoals.findIndex((g) => g.id === goal.id);
    const nowIso = new Date().toISOString();
    const resolved = {
      ...goal,
      updatedAt: nowIso,
      createdAt: goal.createdAt || nowIso,
      currentAmount: Math.max(0, goal.currentAmount)
    };
    if (idx >= 0) {
      if (!resolved.createdBy && data.savingsGoals[idx].createdBy) {
        resolved.createdBy = data.savingsGoals[idx].createdBy;
      }
      data.savingsGoals[idx] = resolved;
    } else {
      data.savingsGoals.push(resolved);
    }
    this.saveData(data);
    this.notifyGoalsListeners();
  }

  async deleteSavingsGoal(id: string): Promise<void> {
    const data = this.loadData();
    data.savingsGoals = data.savingsGoals.filter((g) => g.id !== id);
    this.saveData(data);
    this.notifyGoalsListeners();
  }

  async adjustSavingsGoal(id: string, delta: number): Promise<void> {
    const data = this.loadData();
    const idx = data.savingsGoals.findIndex((g) => g.id === id);
    if (idx >= 0) {
      const g = data.savingsGoals[idx];
      const nextAmount = Math.max(0, g.currentAmount + delta);
      data.savingsGoals[idx] = {
        ...g,
        currentAmount: nextAmount,
        updatedAt: new Date().toISOString()
      };
      this.saveData(data);
      this.notifyGoalsListeners();
    }
  }

  async upsertRecurringRule(rule: RecurringRule): Promise<void> {
    const data = this.loadData();
    const idx = data.recurringRules.findIndex((r) => r.id === rule.id);
    const nowIso = new Date().toISOString();
    const resolved = {
      ...rule,
      updatedAt: nowIso,
      createdAt: rule.createdAt || nowIso,
      walletId: rule.walletId || "default"
    };
    if (idx >= 0) {
      if (!resolved.createdBy && data.recurringRules[idx].createdBy) {
        resolved.createdBy = data.recurringRules[idx].createdBy;
      }
      data.recurringRules[idx] = resolved;
    } else {
      data.recurringRules.push(resolved);
    }
    this.saveData(data);
    this.notifyRulesListeners();
  }

  async deleteRecurringRule(id: string): Promise<void> {
    const data = this.loadData();
    data.recurringRules = data.recurringRules.filter((r) => r.id !== id);
    this.saveData(data);
    this.notifyRulesListeners();
  }

  async generateRecurringTransactions(
    txs: Transaction[],
    ruleUpdates: { ruleId: string; lastGeneratedThrough: string }[]
  ): Promise<{ created: number }> {
    const data = this.loadData();
    let created = 0;

    for (const tx of txs) {
      const exists = data.transactions.some((t) => t.id === tx.id);
      if (!exists) {
        data.transactions.push({ ...tx, walletId: tx.walletId || "default" });
        created++;
      }
    }

    for (const up of ruleUpdates) {
      const rIdx = data.recurringRules.findIndex((r) => r.id === up.ruleId);
      if (rIdx >= 0) {
        if (!data.recurringRules[rIdx].lastGeneratedThrough || up.lastGeneratedThrough > data.recurringRules[rIdx].lastGeneratedThrough!) {
          data.recurringRules[rIdx] = {
            ...data.recurringRules[rIdx],
            lastGeneratedThrough: up.lastGeneratedThrough,
            updatedAt: new Date().toISOString()
          };
        }
      }
    }

    this.saveData(data);
    this.notifyTxListeners();
    this.notifyRulesListeners();
    return { created };
  }

  async deleteAllData(): Promise<void> {
    localStorage.removeItem(LOCAL_FINANCE_STORAGE_KEY);
    this.notifyTxListeners();
    this.notifyConfigListeners();
    this.notifyGoalsListeners();
    this.notifyRulesListeners();
  }

  public getRawData(): LocalStorageData {
    return this.loadData();
  }
}
