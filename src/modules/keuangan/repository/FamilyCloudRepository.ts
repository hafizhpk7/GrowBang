import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  writeBatch,
  runTransaction,
  limit
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../../services/firebase";
import { DEFAULT_FINANCE_CONFIG } from "../constants/categories";
import { FinanceConfig, RecurringFrequency, RecurringRule, SavingsGoal, Transaction } from "../types";
import { normalizeConfig } from "../utils/normalization";
import { applyConfigPatch, ConfigPatch } from "../utils/configPatch";
import { FinanceRepository } from "./types";

export class FamilyCloudRepository implements FinanceRepository {
  private basePath: string;

  constructor(private fid: string, private uid: string) {
    this.basePath = `families/${fid}`;
  }

  subscribeTransactions(
    range: { from: string; to: string },
    onData: (txs: Transaction[]) => void,
    onError: (e: Error) => void
  ): () => void {
    const txsRef = collection(db, this.basePath, "financeTransactions");
    const q = query(
      txsRef,
      where("date", ">=", range.from),
      where("date", "<=", range.to),
      orderBy("date", "desc")
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const result: Transaction[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (
            data &&
            typeof data.id === "string" &&
            (data.type === "income" || data.type === "expense") &&
            typeof data.amount === "number" &&
            typeof data.categoryId === "string" &&
            typeof data.date === "string"
          ) {
            const tx: Transaction = {
              id: data.id,
              type: data.type,
              amount: data.amount,
              categoryId: data.categoryId,
              walletId: data.walletId || "default",
              date: data.date,
              createdAt: data.createdAt || `${data.date}T00:00:00.000Z`,
              updatedAt: data.updatedAt || `${data.date}T00:00:00.000Z`,
              createdBy: data.createdBy || undefined,
              updatedBy: data.updatedBy || undefined
            };
            if (data.note && typeof data.note === "string") {
              tx.note = data.note;
            }
            result.push(tx);
          }
        });
        onData(result);
      },
      (error) => {
        console.error("Error subscribing family cloud transactions:", error);
        onError(error);
      }
    );
  }

  subscribeConfig(
    onData: (cfg: FinanceConfig) => void,
    onError: (e: Error) => void
  ): () => void {
    const cfgRef = doc(db, this.basePath, "financeConfig", "main");
    return onSnapshot(
      cfgRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          onData({ ...DEFAULT_FINANCE_CONFIG, includeVaccineCosts: false });
          return;
        }

        const data = snapshot.data();
        const customCategories = Array.isArray(data?.customCategories) ? data.customCategories : [];
        const budgets = data?.budgets && typeof data.budgets === "object" ? data.budgets : {};
        // P8: in family mode, effective includeVaccineCosts is always false
        const includeVaccineCosts = false;
        const wallets = data?.wallets && typeof data.wallets === "object" ? data.wallets : undefined;

        onData(
          normalizeConfig({
            schemaVersion: 1,
            customCategories,
            budgets,
            includeVaccineCosts,
            wallets
          })
        );
      },
      (error) => {
        console.error("Error subscribing family cloud config:", error);
        onError(error);
      }
    );
  }

  subscribeSavingsGoals(
    onData: (goals: SavingsGoal[]) => void,
    onError: (e: Error) => void
  ): () => void {
    const ref = collection(db, this.basePath, "savingsGoals");
    return onSnapshot(
      ref,
      (snapshot) => {
        const goals: SavingsGoal[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && typeof data.id === "string" && typeof data.name === "string" && typeof data.targetAmount === "number") {
            goals.push({
              id: data.id,
              name: data.name,
              targetAmount: data.targetAmount,
              currentAmount: typeof data.currentAmount === "number" ? data.currentAmount : 0,
              deadline: data.deadline || undefined,
              createdAt: data.createdAt || undefined,
              updatedAt: data.updatedAt || undefined,
              createdBy: data.createdBy || undefined
            });
          }
        });
        onData(goals);
      },
      (error) => {
        console.error("Error subscribing family savings goals:", error);
        onError(error);
      }
    );
  }

  subscribeRecurringRules(
    onData: (rules: RecurringRule[]) => void,
    onError: (e: Error) => void
  ): () => void {
    const ref = collection(db, this.basePath, "recurringRules");
    return onSnapshot(
      ref,
      (snapshot) => {
        const rules: RecurringRule[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && typeof data.id === "string" && typeof data.amount === "number" && typeof data.categoryId === "string" && typeof data.frequency === "string") {
            rules.push({
              id: data.id,
              name: data.name || undefined,
              type: data.type || "expense",
              amount: data.amount,
              categoryId: data.categoryId,
              walletId: data.walletId || "default",
              frequency: data.frequency as RecurringFrequency,
              active: data.active !== false,
              startDate: data.startDate || undefined,
              dayOfMonth: typeof data.dayOfMonth === "number" ? data.dayOfMonth : undefined,
              dayOfWeek: typeof data.dayOfWeek === "number" ? data.dayOfWeek : undefined,
              lastGeneratedThrough: data.lastGeneratedThrough || undefined,
              createdAt: data.createdAt || undefined,
              updatedAt: data.updatedAt || undefined,
              createdBy: data.createdBy || undefined
            });
          }
        });
        onData(rules);
      },
      (error) => {
        console.error("Error subscribing family recurring rules:", error);
        onError(error);
      }
    );
  }

  async upsertTransaction(tx: Transaction): Promise<void> {
    const docPath = `${this.basePath}/financeTransactions/${tx.id}`;
    const txRef = doc(db, this.basePath, "financeTransactions", tx.id);

    try {
      const existingSnap = await getDoc(txRef);
      const existingData = existingSnap.exists() ? existingSnap.data() : null;
      const createdBy = existingData?.createdBy || tx.createdBy || this.uid;

      // Family mode payload built from FAMILY_TX_KEYS
      const payload: Record<string, any> = {
        id: tx.id,
        familyId: this.fid,
        type: tx.type,
        amount: Math.round(tx.amount),
        categoryId: tx.categoryId,
        walletId: tx.walletId || "default",
        date: tx.date,
        createdAt: existingData?.createdAt || tx.createdAt,
        updatedAt: tx.updatedAt || new Date().toISOString(),
        createdBy,
        updatedBy: this.uid
      };

      if (tx.note && tx.note.trim()) {
        payload.note = tx.note.trim();
      }

      await setDoc(txRef, payload);
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, docPath);
    }
  }

  async updateTransaction(id: string, input: Partial<Transaction>, expectedUpdatedAt?: string): Promise<void> {
    const docPath = `${this.basePath}/financeTransactions/${id}`;
    const txRef = doc(db, this.basePath, "financeTransactions", id);

    try {
      await runTransaction(db, async (txn) => {
        const snap = await txn.get(txRef);
        if (!snap.exists()) {
          const err: any = new Error("NOT_FOUND");
          err.code = "NOT_FOUND";
          throw err;
        }

        const current = snap.data();
        if (expectedUpdatedAt && current.updatedAt !== expectedUpdatedAt) {
          const err: any = new Error("CONFLICT");
          err.code = "CONFLICT";
          err.currentDoc = current;
          throw err;
        }

        const now = new Date().toISOString();
        const updated: Record<string, any> = {
          id,
          familyId: this.fid,
          type: input.type ?? current.type,
          amount: Math.round(input.amount ?? current.amount),
          categoryId: input.categoryId ?? current.categoryId,
          walletId: input.walletId ?? current.walletId ?? "default",
          date: input.date ?? current.date,
          createdAt: current.createdAt,
          updatedAt: now,
          createdBy: current.createdBy,
          updatedBy: this.uid
        };

        const note = input.note !== undefined ? input.note : current.note;
        if (note && String(note).trim()) {
          updated.note = String(note).trim();
        }

        txn.set(txRef, updated);
      });
    } catch (e: any) {
      if (e.message === "CONFLICT" || e.message === "NOT_FOUND") throw e;
      handleFirestoreError(e, OperationType.WRITE, docPath);
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    const docPath = `${this.basePath}/financeTransactions/${id}`;
    const txRef = doc(db, this.basePath, "financeTransactions", id);

    try {
      await deleteDoc(txRef);
    } catch (e: any) {
      handleFirestoreError(e, OperationType.DELETE, docPath);
    }
  }

  /** @internal Used only for initial migration */
  async saveConfig(cfg: FinanceConfig): Promise<void> {
    const docPath = `${this.basePath}/financeConfig/main`;
    const cfgRef = doc(db, this.basePath, "financeConfig", "main");
    const normalized = normalizeConfig(cfg);

    const payload: Record<string, any> = {
      familyId: this.fid,
      schemaVersion: 1,
      customCategories: normalized.customCategories,
      budgets: normalized.budgets,
      includeVaccineCosts: false,
      wallets: normalized.wallets,
      updatedAt: new Date().toISOString(),
      updatedBy: this.uid
    };

    try {
      await setDoc(cfgRef, payload);
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, docPath);
    }
  }

  async updateConfig(patch: ConfigPatch): Promise<void> {
    const docPath = `${this.basePath}/financeConfig/main`;
    const cfgRef = doc(db, this.basePath, "financeConfig", "main");

    try {
      await runTransaction(db, async (txn) => {
        const snap = await txn.get(cfgRef);
        const currentData: FinanceConfig = snap.exists()
          ? (snap.data() as FinanceConfig)
          : { ...DEFAULT_FINANCE_CONFIG, includeVaccineCosts: false };

        const patched = applyConfigPatch(currentData, patch);
        const normalized = normalizeConfig(patched);

        const payload: Record<string, any> = {
          familyId: this.fid,
          schemaVersion: 1,
          customCategories: normalized.customCategories,
          budgets: normalized.budgets,
          includeVaccineCosts: false,
          wallets: normalized.wallets,
          updatedAt: new Date().toISOString(),
          updatedBy: this.uid
        };

        txn.set(cfgRef, payload);
      });
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, docPath);
    }
  }

  async updateBudget(categoryId: string, amount: number): Promise<void> {
    return this.updateConfig({ kind: "setBudget", categoryId, amount });
  }

  async upsertSavingsGoal(goal: SavingsGoal): Promise<void> {
    const docPath = `${this.basePath}/savingsGoals/${goal.id}`;
    const ref = doc(db, this.basePath, "savingsGoals", goal.id);
    try {
      const snap = await getDoc(ref);
      const existing = snap.exists() ? snap.data() : null;
      const nowIso = new Date().toISOString();
      const payload: Record<string, any> = {
        id: goal.id,
        name: goal.name.trim(),
        targetAmount: Math.floor(goal.targetAmount),
        currentAmount: Math.max(0, Math.floor(goal.currentAmount)),
        createdAt: goal.createdAt || existing?.createdAt || nowIso,
        updatedAt: nowIso,
        createdBy: existing?.createdBy || goal.createdBy || this.uid
      };
      if (goal.deadline) {
        payload.deadline = goal.deadline;
      }
      await setDoc(ref, payload);
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, docPath);
    }
  }

  async deleteSavingsGoal(id: string): Promise<void> {
    const docPath = `${this.basePath}/savingsGoals/${id}`;
    const ref = doc(db, this.basePath, "savingsGoals", id);
    try {
      await deleteDoc(ref);
    } catch (e: any) {
      handleFirestoreError(e, OperationType.DELETE, docPath);
    }
  }

  async adjustSavingsGoal(id: string, delta: number): Promise<void> {
    const docPath = `${this.basePath}/savingsGoals/${id}`;
    const ref = doc(db, this.basePath, "savingsGoals", id);
    try {
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(ref);
        if (!snap.exists()) return;
        const data = snap.data();
        const current = typeof data.currentAmount === "number" ? data.currentAmount : 0;
        const newAmount = Math.max(0, current + Math.round(delta));
        transaction.update(ref, { currentAmount: newAmount, updatedAt: new Date().toISOString() });
      });
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, docPath);
    }
  }

  async upsertRecurringRule(rule: RecurringRule): Promise<void> {
    const docPath = `${this.basePath}/recurringRules/${rule.id}`;
    const ref = doc(db, this.basePath, "recurringRules", rule.id);
    try {
      const snap = await getDoc(ref);
      const existing = snap.exists() ? snap.data() : null;
      const nowIso = new Date().toISOString();
      const payload: Record<string, any> = {
        id: rule.id,
        type: rule.type,
        amount: Math.round(rule.amount),
        categoryId: rule.categoryId,
        walletId: rule.walletId,
        frequency: rule.frequency,
        active: rule.active !== false,
        createdAt: rule.createdAt || existing?.createdAt || nowIso,
        updatedAt: nowIso,
        createdBy: existing?.createdBy || rule.createdBy || this.uid
      };
      if (rule.name && rule.name.trim()) payload.name = rule.name.trim();
      if (rule.startDate) payload.startDate = rule.startDate;
      if (typeof rule.dayOfMonth === "number") payload.dayOfMonth = rule.dayOfMonth;
      if (typeof rule.dayOfWeek === "number") payload.dayOfWeek = rule.dayOfWeek;
      if (rule.lastGeneratedThrough) payload.lastGeneratedThrough = rule.lastGeneratedThrough;

      await setDoc(ref, payload);
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, docPath);
    }
  }

  async deleteRecurringRule(id: string): Promise<void> {
    const docPath = `${this.basePath}/recurringRules/${id}`;
    const ref = doc(db, this.basePath, "recurringRules", id);
    try {
      await deleteDoc(ref);
    } catch (e: any) {
      handleFirestoreError(e, OperationType.DELETE, docPath);
    }
  }

  async generateRecurringTransactions(
    txs: Transaction[],
    ruleUpdates: { ruleId: string; lastGeneratedThrough: string }[]
  ): Promise<{ created: number }> {
    if (txs.length === 0 && ruleUpdates.length === 0) {
      return { created: 0 };
    }

    let createdCount = 0;
    try {
      const batch = writeBatch(db);

      for (const tx of txs) {
        const txRef = doc(db, this.basePath, "financeTransactions", tx.id);
        const payload: Record<string, any> = {
          id: tx.id,
          familyId: this.fid,
          type: tx.type,
          amount: Math.round(tx.amount),
          categoryId: tx.categoryId,
          walletId: tx.walletId || "default",
          date: tx.date,
          createdAt: tx.createdAt,
          updatedAt: tx.updatedAt,
          createdBy: tx.createdBy || this.uid,
          updatedBy: this.uid
        };
        if (tx.note) payload.note = tx.note.trim();
        batch.set(txRef, payload);
        createdCount++;
      }

      for (const update of ruleUpdates) {
        const ruleRef = doc(db, this.basePath, "recurringRules", update.ruleId);
        batch.update(ruleRef, {
          lastGeneratedThrough: update.lastGeneratedThrough,
          updatedAt: new Date().toISOString()
        });
      }

      await batch.commit();
      return { created: createdCount };
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, `${this.basePath}/financeTransactions`);
    }
  }

  async deleteAllData(): Promise<void> {
    for (const collName of ["financeTransactions", "savingsGoals", "recurringRules"]) {
      while (true) {
        const q = query(collection(db, this.basePath, collName), limit(400));
        const snaps = await getDocs(q);
        if (snaps.empty) break;

        const batch = writeBatch(db);
        snaps.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }
  }
}
