import { DEFAULT_FINANCE_CONFIG } from "../constants/categories";
import { FinanceConfig, Transaction } from "../types";
import { FinanceRepository } from "./types";

export const LOCAL_FINANCE_STORAGE_KEY = "keuangan-keluarga-v1";

interface LocalStorageData {
  schemaVersion: number;
  transactions: Transaction[];
  config: FinanceConfig;
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

  private loadData(): LocalStorageData {
    try {
      const raw = localStorage.getItem(LOCAL_FINANCE_STORAGE_KEY);
      if (!raw) {
        return {
          schemaVersion: 1,
          transactions: [],
          config: { ...DEFAULT_FINANCE_CONFIG }
        };
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return {
          schemaVersion: 1,
          transactions: [],
          config: { ...DEFAULT_FINANCE_CONFIG }
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
            validTxs.push(tx as Transaction);
          } else {
            console.warn("Dropped invalid local transaction:", tx);
          }
        }
      }

      const config: FinanceConfig = {
        schemaVersion: 1,
        customCategories: Array.isArray(parsed.config?.customCategories)
          ? parsed.config.customCategories
          : [],
        budgets:
          parsed.config?.budgets && typeof parsed.config.budgets === "object"
            ? parsed.config.budgets
            : {},
        includeVaccineCosts:
          typeof parsed.config?.includeVaccineCosts === "boolean"
            ? parsed.config.includeVaccineCosts
            : true
      };

      return {
        schemaVersion: 1,
        transactions: validTxs,
        config
      };
    } catch (e) {
      console.warn("Failed to parse local finance data:", e);
      return {
        schemaVersion: 1,
        transactions: [],
        config: { ...DEFAULT_FINANCE_CONFIG }
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

  subscribeTransactions(
    range: { from: string; to: string },
    onData: (txs: Transaction[]) => void,
    onError: (e: Error) => void
  ): () => void {
    const listener = { range, onData, onError };
    this.txListeners.add(listener);

    // Initial async-or-sync call
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

  async upsertTransaction(tx: Transaction): Promise<void> {
    const data = this.loadData();
    const idx = data.transactions.findIndex((t) => t.id === tx.id);
    if (idx >= 0) {
      data.transactions[idx] = tx;
    } else {
      data.transactions.push(tx);
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
    data.config = cfg;
    this.saveData(data);
    this.notifyConfigListeners();
  }

  async deleteAllData(): Promise<void> {
    localStorage.removeItem(LOCAL_FINANCE_STORAGE_KEY);
    this.notifyTxListeners();
    this.notifyConfigListeners();
  }

  public getRawData(): LocalStorageData {
    return this.loadData();
  }
}
