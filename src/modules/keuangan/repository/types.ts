import { FinanceConfig, Transaction } from "../types";

export interface FinanceRepository {
  subscribeTransactions(
    range: { from: string; to: string },
    onData: (txs: Transaction[]) => void,
    onError: (e: Error) => void
  ): () => void;

  subscribeConfig(
    onData: (cfg: FinanceConfig) => void,
    onError: (e: Error) => void
  ): () => void;

  upsertTransaction(tx: Transaction): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
  saveConfig(cfg: FinanceConfig): Promise<void>;
  updateBudget(categoryId: string, amount: number): Promise<void>;
  deleteAllData(): Promise<void>;
}
