import { FinanceConfig, RecurringRule, SavingsGoal, Transaction } from "../types";

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

  subscribeSavingsGoals(onData: (g: SavingsGoal[]) => void, onError: (e: Error) => void): () => void;
  upsertSavingsGoal(goal: SavingsGoal): Promise<void>;
  deleteSavingsGoal(id: string): Promise<void>;
  adjustSavingsGoal(id: string, delta: number): Promise<void>;

  subscribeRecurringRules(onData: (r: RecurringRule[]) => void, onError: (e: Error) => void): () => void;
  upsertRecurringRule(rule: RecurringRule): Promise<void>;
  deleteRecurringRule(id: string): Promise<void>;

  generateRecurringTransactions(
    txs: Transaction[],
    ruleUpdates: { ruleId: string; lastGeneratedThrough: string }[]
  ): Promise<{ created: number }>;

  deleteAllData(): Promise<void>;
}
