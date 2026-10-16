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
  writeBatch
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../../services/firebase";
import { DEFAULT_FINANCE_CONFIG } from "../constants/categories";
import { FinanceConfig, Transaction } from "../types";
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
              date: data.date,
              createdAt: data.createdAt || `${data.date}T00:00:00.000Z`,
              updatedAt: data.updatedAt || `${data.date}T00:00:00.000Z`
            };
            if (data.note && typeof data.note === "string") {
              tx.note = data.note;
            }
            result.push(tx);
          } else {
            console.warn("Skipped invalid cloud transaction doc:", docSnap.id, data);
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
        const config: FinanceConfig = {
          schemaVersion: 1,
          customCategories: Array.isArray(data?.customCategories)
            ? data.customCategories
            : [],
          budgets:
            data?.budgets && typeof data.budgets === "object"
              ? data.budgets
              : {},
          includeVaccineCosts:
            typeof data?.includeVaccineCosts === "boolean"
              ? data.includeVaccineCosts
              : true
        };
        onData(config);
      },
      (error) => {
        console.error("Error subscribing cloud finance config:", error);
        onError(error);
      }
    );

    return unsubscribe;
  }

  async upsertTransaction(tx: Transaction): Promise<void> {
    const docPath = `${this.basePath}/financeTransactions/${tx.id}`;
    const txRef = doc(db, this.basePath, "financeTransactions", tx.id);

    // Build payload without undefined values
    const payload: Record<string, any> = {
      id: tx.id,
      ownerId: this.uid,
      type: tx.type,
      amount: tx.amount,
      categoryId: tx.categoryId,
      date: tx.date,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
      createdBy: tx.createdBy || this.uid
    };

    if (tx.note && tx.note.trim()) {
      payload.note = tx.note.trim();
    }

    try {
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

    const payload: Record<string, any> = {
      ownerId: this.uid,
      schemaVersion: 1,
      customCategories: cfg.customCategories || [],
      budgets: cfg.budgets || {},
      includeVaccineCosts:
        typeof cfg.includeVaccineCosts === "boolean"
          ? cfg.includeVaccineCosts
          : true,
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
      await updateDoc(cfgRef, { [`budgets.${categoryId}`]: amount });
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, docPath);
    }
  }

  async deleteAllData(): Promise<void> {
    const txsRef = collection(db, this.basePath, "financeTransactions");

    try {
      const snapshot = await getDocs(txsRef);
      const docs = snapshot.docs;

      // Delete in batches of <= 400
      for (let i = 0; i < docs.length; i += 400) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + 400);
        for (const d of chunk) {
          batch.delete(d.ref);
        }
        await batch.commit();
      }

      // Delete config doc
      const cfgRef = doc(db, this.basePath, "financeConfig", "main");
      await deleteDoc(cfgRef);
    } catch (e: any) {
      handleFirestoreError(
        e,
        OperationType.DELETE,
        `${this.basePath}/financeTransactions`
      );
    }
  }

  async uploadLocalData(localBlob: {
    transactions: Transaction[];
    config: FinanceConfig;
  }): Promise<void> {
    // 1. Upload transactions in batches <= 400
    const txs = localBlob.transactions || [];
    for (let i = 0; i < txs.length; i += 400) {
      const batch = writeBatch(db);
      const chunk = txs.slice(i, i + 400);

      for (const tx of chunk) {
        const txRef = doc(db, this.basePath, "financeTransactions", tx.id);
        const payload: Record<string, any> = {
          id: tx.id,
          ownerId: this.uid,
          type: tx.type,
          amount: tx.amount,
          categoryId: tx.categoryId,
          date: tx.date,
          createdAt: tx.createdAt,
          updatedAt: tx.updatedAt
        };
        if (tx.note && tx.note.trim()) {
          payload.note = tx.note.trim();
        }
        batch.set(txRef, payload, { merge: true });
      }

      await batch.commit();
    }

    // 2. Upload config
    if (localBlob.config) {
      await this.saveConfig(localBlob.config);
    }
  }

  async checkCloudHasData(): Promise<boolean> {
    try {
      const txsRef = collection(db, this.basePath, "financeTransactions");
      const txsSnap = await getDocs(query(txsRef, where("id", "!=", "")));
      if (!txsSnap.empty) return true;

      const cfgRef = doc(db, this.basePath, "financeConfig", "main");
      const cfgSnap = await getDoc(cfgRef);
      return cfgSnap.exists();
    } catch (e) {
      console.warn("Failed to check if cloud has finance data:", e);
      return false;
    }
  }
}
