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
  runTransaction
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../../services/firebase";
import { DEFAULT_FINANCE_CONFIG } from "../constants/categories";
import { FinanceConfig, RecurringFrequency, RecurringRule, SavingsGoal, Transaction } from "../types";
import { normalizeConfig } from "../utils/normalization";
import { FinanceRepository } from "./types";

export class CloudRepository implements FinanceRepository {
  private basePath: string;

  constructor(private uid: string, familyId?: string | null) {
    this.basePath = familyId ? `families/${familyId}` : `users/${uid}`;
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

    const unsubscribe = onSnapshot(
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
              createdBy: data.createdBy || undefined
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
        console.error("Error subscribing cloud transactions:", error);
        onError(error);
      }
    );

    return unsubscribe;
  }

  subscribeConfig(
    onData: (cfg: FinanceConfig) => void,
    onError: (e: Error) => void
  ): () => void {
    const cfgRef = doc(db, this.basePath, "financeConfig", "main");

    const unsubscribe = onSnapshot(
      cfgRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          onData({ ...DEFAULT_FINANCE_CONFIG });
          return;
        }

        const data = docSnap.data();
        const config = normalizeConfig(data);
        onData(config);
      },
      (error) => {
        console.error("Error subscribing cloud finance config:", error);
        onError(error);
      }
    );

    return unsubscribe;
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
        console.error("Error subscribing savings goals:", error);
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
        console.error("Error subscribing recurring rules:", error);
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

      const payload: Record<string, any> = {
        id: tx.id,
        ownerId: this.uid,
        type: tx.type,
        amount: tx.amount,
        categoryId: tx.categoryId,
        walletId: tx.walletId || "default",
        date: tx.date,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
        createdBy
      };

      if (tx.note && tx.note.trim()) {
        payload.note = tx.note.trim();
      }

      await setDoc(txRef, payload);
    } catch (e: any) {
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

  async saveConfig(cfg: FinanceConfig): Promise<void> {
    const docPath = `${this.basePath}/financeConfig/main`;
    const cfgRef = doc(db, this.basePath, "financeConfig", "main");
    const normalized = normalizeConfig(cfg);

    const payload: Record<string, any> = {
      ownerId: this.uid,
      schemaVersion: 1,
      customCategories: normalized.customCategories,
      budgets: normalized.budgets,
      includeVaccineCosts: normalized.includeVaccineCosts,
      wallets: normalized.wallets,
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(cfgRef, payload);
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, docPath);
    }
  }

  async updateBudget(categoryId: string, amount: number): Promise<void> {
    const docPath = `${this.basePath}/financeConfig/main`;
    const cfgRef = doc(db, this.basePath, "financeConfig", "main");
    try {
      await updateDoc(cfgRef, { [`budgets.${categoryId}`]: amount, updatedAt: new Date().toISOString() });
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, docPath);
    }
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
        deadline: goal.deadline || null,
        createdAt: goal.createdAt || existing?.createdAt || nowIso,
        updatedAt: nowIso,
        createdBy: existing?.createdBy || goal.createdBy || this.uid
      };
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
        const next = Math.max(0, current + delta);
        transaction.update(ref, {
          currentAmount: next,
          updatedAt: new Date().toISOString()
        });
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
        name: rule.name ? rule.name.trim() : null,
        type: rule.type,
        amount: Math.floor(rule.amount),
        categoryId: rule.categoryId,
        walletId: rule.walletId || "default",
        frequency: rule.frequency,
        active: rule.active !== false,
        startDate: rule.startDate || null,
        dayOfMonth: rule.dayOfMonth ?? null,
        dayOfWeek: rule.dayOfWeek ?? null,
        lastGeneratedThrough: rule.lastGeneratedThrough || existing?.lastGeneratedThrough || null,
        createdAt: rule.createdAt || existing?.createdAt || nowIso,
        updatedAt: nowIso,
        createdBy: existing?.createdBy || rule.createdBy || this.uid
      };
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
    if (txs.length === 0 && ruleUpdates.length === 0) return { created: 0 };

    let created = 0;
    const missingTxs: Transaction[] = [];
    for (let i = 0; i < txs.length; i += 20) {
      const chunk = txs.slice(i, i + 20);
      const checks = await Promise.all(
        chunk.map(async (tx) => {
          const ref = doc(db, this.basePath, "financeTransactions", tx.id);
          const snap = await getDoc(ref);
          return { tx, exists: snap.exists() };
        })
      );
      for (const item of checks) {
        if (!item.exists) {
          missingTxs.push(item.tx);
        }
      }
    }

    const operations: (() => Promise<void>)[] = [];

    for (let i = 0; i < missingTxs.length; i += 400) {
      const chunk = missingTxs.slice(i, i + 400);
      operations.push(async () => {
        const batch = writeBatch(db);
        for (const tx of chunk) {
          const ref = doc(db, this.basePath, "financeTransactions", tx.id);
          batch.set(ref, {
            id: tx.id,
            ownerId: this.uid,
            type: tx.type,
            amount: tx.amount,
            categoryId: tx.categoryId,
            walletId: tx.walletId || "default",
            date: tx.date,
            note: tx.note || null,
            createdAt: tx.createdAt,
            updatedAt: tx.updatedAt,
            createdBy: tx.createdBy || this.uid
          });
          created++;
        }
        await batch.commit();
      });
    }

    for (let i = 0; i < ruleUpdates.length; i += 400) {
      const chunk = ruleUpdates.slice(i, i + 400);
      operations.push(async () => {
        const batch = writeBatch(db);
        for (const up of chunk) {
          const ref = doc(db, this.basePath, "recurringRules", up.ruleId);
          batch.update(ref, {
            lastGeneratedThrough: up.lastGeneratedThrough,
            updatedAt: new Date().toISOString()
          });
        }
        await batch.commit();
      });
    }

    for (const op of operations) {
      await op();
    }

    return { created };
  }

  async deleteAllData(): Promise<void> {
    const collectionsToClean = ["financeTransactions", "savingsGoals", "recurringRules"];
    try {
      for (const colName of collectionsToClean) {
        const colRef = collection(db, this.basePath, colName);
        const snap = await getDocs(colRef);
        const docs = snap.docs;
        for (let i = 0; i < docs.length; i += 400) {
          const batch = writeBatch(db);
          const chunk = docs.slice(i, i + 400);
          for (const d of chunk) {
            batch.delete(d.ref);
          }
          await batch.commit();
        }
      }

      const cfgRef = doc(db, this.basePath, "financeConfig", "main");
      await deleteDoc(cfgRef);
    } catch (e: any) {
      handleFirestoreError(e, OperationType.DELETE, this.basePath);
    }
  }

  async uploadLocalData(localBlob: {
    transactions: Transaction[];
    config: FinanceConfig;
    savingsGoals?: SavingsGoal[];
    recurringRules?: RecurringRule[];
  }): Promise<void> {
    const txs = localBlob.transactions || [];
    for (let i = 0; i < txs.length; i += 400) {
      const batch = writeBatch(db);
      const chunk = txs.slice(i, i + 400);
      for (const tx of chunk) {
        const ref = doc(db, this.basePath, "financeTransactions", tx.id);
        batch.set(ref, {
          id: tx.id,
          ownerId: this.uid,
          type: tx.type,
          amount: tx.amount,
          categoryId: tx.categoryId,
          walletId: tx.walletId || "default",
          date: tx.date,
          note: tx.note || null,
          createdAt: tx.createdAt,
          updatedAt: tx.updatedAt,
          createdBy: tx.createdBy || this.uid
        }, { merge: true });
      }
      await batch.commit();
    }

    if (localBlob.config) {
      await this.saveConfig(localBlob.config);
    }

    const goals = localBlob.savingsGoals || [];
    for (let i = 0; i < goals.length; i += 400) {
      const batch = writeBatch(db);
      const chunk = goals.slice(i, i + 400);
      for (const g of chunk) {
        const ref = doc(db, this.basePath, "savingsGoals", g.id);
        batch.set(ref, {
          id: g.id,
          name: g.name,
          targetAmount: g.targetAmount,
          currentAmount: g.currentAmount,
          deadline: g.deadline || null,
          createdAt: g.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: g.createdBy || this.uid
        }, { merge: true });
      }
      await batch.commit();
    }

    const rules = localBlob.recurringRules || [];
    for (let i = 0; i < rules.length; i += 400) {
      const batch = writeBatch(db);
      const chunk = rules.slice(i, i + 400);
      for (const r of chunk) {
        const ref = doc(db, this.basePath, "recurringRules", r.id);
        batch.set(ref, {
          id: r.id,
          name: r.name || null,
          type: r.type,
          amount: r.amount,
          categoryId: r.categoryId,
          walletId: r.walletId || "default",
          frequency: r.frequency,
          active: r.active !== false,
          startDate: r.startDate || null,
          dayOfMonth: r.dayOfMonth ?? null,
          dayOfWeek: r.dayOfWeek ?? null,
          lastGeneratedThrough: r.lastGeneratedThrough || null,
          createdAt: r.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: r.createdBy || this.uid
        }, { merge: true });
      }
      await batch.commit();
    }
  }

  async checkCloudHasData(): Promise<boolean> {
    try {
      const txsRef = collection(db, this.basePath, "financeTransactions");
      const txsSnap = await getDocs(query(txsRef, where("id", "!=", "")));
      if (!txsSnap.empty) return true;

      const goalsRef = collection(db, this.basePath, "savingsGoals");
      const goalsSnap = await getDocs(goalsRef);
      if (!goalsSnap.empty) return true;

      const rulesRef = collection(db, this.basePath, "recurringRules");
      const rulesSnap = await getDocs(rulesRef);
      if (!rulesSnap.empty) return true;

      const cfgRef = doc(db, this.basePath, "financeConfig", "main");
      const cfgSnap = await getDoc(cfgRef);
      if (cfgSnap.exists()) {
        const data = cfgSnap.data();
        if (data.wallets && Object.keys(data.wallets).length > 1) return true;
        if (data.customCategories && data.customCategories.length > 0) return true;
      }
      return false;
    } catch (e) {
      console.warn("Failed to check if cloud has finance data:", e);
      return false;
    }
  }
}
