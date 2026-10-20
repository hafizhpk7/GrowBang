import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  runTransaction,
  setDoc,
  writeBatch
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../../services/firebase";
import { AppState, Insurance, PaymentMode, Profile, ScheduleRow, VaccineRecord } from "../../../types";
import { BayiDiffOp, diffAppState } from "../state/diff";
import { BayiRepository } from "./types";

interface BabyDocData {
  id: string;
  panggilan: string;
  tanggalLahir: string;
  catatan?: string;
  insurance: Insurance;
  schemaVersion: 1;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  sourceUid?: string;
}

export class FamilyBayiRepository implements BayiRepository {
  private basePath: string;
  private currentAssembledProfiles: Profile[] = [];
  private activeProfileId: string = "";
  private paymentMode: PaymentMode = "HYBRID";

  constructor(
    private fid: string,
    private uid: string,
    private isAdmin: boolean
  ) {
    this.basePath = `families/${fid}`;
  }

  private checkAdminPermission() {
    if (!this.isAdmin) {
      const err = new Error("Hanya admin yang dapat mengubah data Bayi keluarga.");
      (err as any).code = "permission-denied";
      throw err;
    }
  }

  subscribe(
    onData: (state: AppState) => void,
    onError: (err: Error) => void
  ): () => void {
    const babiesColl = collection(db, this.basePath, "babies");
    const subCleanups = new Map<string, () => void>();

    // Baby states map
    const babyMetaMap = new Map<string, BabyDocData>();
    const babyScheduleMap = new Map<string, ScheduleRow[]>();
    const babyRecordsMap = new Map<string, Map<string, VaccineRecord>>();

    // User preferences subscription (activeProfileId & paymentMode)
    const userAppDoc = doc(db, "users", this.uid, "appData", "current");
    const unsubUser = onSnapshot(
      userAppDoc,
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          if (d.activeProfileId && typeof d.activeProfileId === "string") {
            this.activeProfileId = d.activeProfileId;
          }
          if (d.paymentMode && ["HYBRID", "FULL_PRIVATE", "FULL_BPJS"].includes(d.paymentMode)) {
            this.paymentMode = d.paymentMode;
          }
        }
        emitIfReady();
      },
      (err) => {
        console.warn("Family user preference sync note:", err);
      }
    );

    const emitIfReady = () => {
      const assembled: Profile[] = [];

      for (const [babyId, meta] of babyMetaMap) {
        const schedule = babyScheduleMap.get(babyId) || [];
        const recordsMap = babyRecordsMap.get(babyId);
        const records = recordsMap ? Array.from(recordsMap.values()) : [];

        assembled.push({
          id: meta.id,
          panggilan: meta.panggilan,
          tanggalLahir: meta.tanggalLahir,
          catatan: meta.catatan,
          insurance: meta.insurance || { hasBpjs: false, hasPrivate: false },
          schedule,
          records
        });
      }

      this.currentAssembledProfiles = assembled;

      // Select active baby ID
      let resolvedActiveId = this.activeProfileId;
      if (!assembled.some((p) => p.id === resolvedActiveId)) {
        resolvedActiveId = assembled[0]?.id || "";
      }

      onData({
        schemaVersion: 1,
        profiles: assembled,
        activeProfileId: resolvedActiveId,
        paymentMode: this.paymentMode
      });
    };

    const unsubBabies = onSnapshot(
      babiesColl,
      (snapshot) => {
        const currentDocIds = new Set<string>();

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() as BabyDocData;
          currentDocIds.add(data.id);
          babyMetaMap.set(data.id, data);

          // If not already subscribed to subcollections for this baby, subscribe
          if (!subCleanups.has(data.id)) {
            const babyId = data.id;

            // Schedule listener
            const schedRef = doc(db, this.basePath, "babies", babyId, "schedule", "main");
            const unsubSched = onSnapshot(
              schedRef,
              (sSnap) => {
                if (sSnap.exists()) {
                  const sData = sSnap.data();
                  babyScheduleMap.set(babyId, sData.rows || []);
                } else {
                  babyScheduleMap.set(babyId, []);
                }
                emitIfReady();
              },
              (err) => onError(err)
            );

            // Records listener
            const recsColl = collection(db, this.basePath, "babies", babyId, "records");
            const unsubRecs = onSnapshot(
              recsColl,
              (rSnap) => {
                const rMap = new Map<string, VaccineRecord>();
                rSnap.docs.forEach((rDoc) => {
                  const recData = rDoc.data() as VaccineRecord;
                  rMap.set(recData.rowId, recData);
                });
                babyRecordsMap.set(babyId, rMap);
                emitIfReady();
              },
              (err) => onError(err)
            );

            subCleanups.set(babyId, () => {
              unsubSched();
              unsubRecs();
            });
          }
        });

        // Clean up removed babies
        for (const [id, cleanup] of subCleanups) {
          if (!currentDocIds.has(id)) {
            cleanup();
            subCleanups.delete(id);
            babyMetaMap.delete(id);
            babyScheduleMap.delete(id);
            babyRecordsMap.delete(id);
          }
        }

        emitIfReady();
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `${this.basePath}/babies`);
        onError(err);
      }
    );

    return () => {
      unsubBabies();
      unsubUser();
      subCleanups.forEach((cleanup) => cleanup());
      subCleanups.clear();
    };
  }

  async saveState(nextState: AppState, prevState?: AppState): Promise<void> {
    this.checkAdminPermission();

    // Use current assembled profiles as base if prevState not provided
    const basePrev: AppState = prevState || {
      schemaVersion: 1,
      profiles: this.currentAssembledProfiles,
      activeProfileId: this.activeProfileId,
      paymentMode: this.paymentMode
    };

    const ops = diffAppState(basePrev, nextState);
    if (ops.length === 0) return;

    await this.applyDiffOps(ops);
  }

  async applyDiffOps(ops: BayiDiffOp[]): Promise<void> {
    this.checkAdminPermission();
    const nowIso = new Date().toISOString();

    let currentBatch = writeBatch(db);
    let opCount = 0;

    const commitBatchIfNeeded = async (force = false) => {
      if (opCount >= 380 || (force && opCount > 0)) {
        await currentBatch.commit();
        currentBatch = writeBatch(db);
        opCount = 0;
      }
    };

    try {
      for (const op of ops) {
        switch (op.type) {
          case "setBaby": {
            const babyRef = doc(db, this.basePath, "babies", op.babyId);
            const snap = await getDoc(babyRef);
            const existing = snap.exists() ? snap.data() : null;

            const payload: Record<string, any> = {
              id: op.babyId,
              panggilan: op.meta.panggilan,
              tanggalLahir: op.meta.tanggalLahir,
              insurance: op.meta.insurance,
              schemaVersion: 1,
              createdAt: existing?.createdAt || nowIso,
              updatedAt: nowIso,
              createdBy: existing?.createdBy || this.uid,
              updatedBy: this.uid
            };
            if (op.meta.catatan && op.meta.catatan.trim()) {
              payload.catatan = op.meta.catatan.trim();
            }
            if (op.meta.sourceUid || existing?.sourceUid) {
              payload.sourceUid = op.meta.sourceUid || existing?.sourceUid;
            }

            currentBatch.set(babyRef, payload);
            opCount++;
            await commitBatchIfNeeded();
            break;
          }

          case "deleteBaby": {
            // Delete records, schedule, baby doc
            await this.deleteBabySubtree(op.babyId);
            break;
          }

          case "setSchedule": {
            const schedRef = doc(db, this.basePath, "babies", op.babyId, "schedule", "main");
            currentBatch.set(schedRef, {
              rows: op.rows,
              updatedAt: nowIso,
              updatedBy: this.uid
            });
            opCount++;
            await commitBatchIfNeeded();
            break;
          }

          case "setRecord": {
            const recRef = doc(db, this.basePath, "babies", op.babyId, "records", op.rowId);
            const recPayload: Record<string, any> = {
              rowId: op.rowId,
              diberikan: op.record.diberikan,
              updatedAt: nowIso,
              updatedBy: this.uid
            };
            if (op.record.tanggalDiberikan) recPayload.tanggalDiberikan = op.record.tanggalDiberikan;
            if (op.record.tempat) recPayload.tempat = op.record.tempat;
            if (op.record.merekBatch) recPayload.merekBatch = op.record.merekBatch;
            if (typeof op.record.biayaAktual === "number") recPayload.biayaAktual = Math.round(op.record.biayaAktual);
            if (typeof op.record.ditanggungAsuransi === "boolean") recPayload.ditanggungAsuransi = op.record.ditanggungAsuransi;
            if (typeof op.record.nominalKlaim === "number") recPayload.nominalKlaim = Math.round(op.record.nominalKlaim);
            if (op.record.statusKlaim) recPayload.statusKlaim = op.record.statusKlaim;
            if (op.record.efekSamping) recPayload.efekSamping = op.record.efekSamping;
            if (op.record.catatan) recPayload.catatan = op.record.catatan;

            currentBatch.set(recRef, recPayload);
            opCount++;
            await commitBatchIfNeeded();
            break;
          }

          case "deleteRecord": {
            const recRef = doc(db, this.basePath, "babies", op.babyId, "records", op.rowId);
            currentBatch.delete(recRef);
            opCount++;
            await commitBatchIfNeeded();
            break;
          }
        }
      }

      await commitBatchIfNeeded(true);
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, `${this.basePath}/babies`);
    }
  }

  private async deleteBabySubtree(babyId: string): Promise<void> {
    // 1. Delete records in batches
    while (true) {
      const q = collection(db, this.basePath, "babies", babyId, "records");
      const snaps = await getDocs(q);
      if (snaps.empty) break;

      const batch = writeBatch(db);
      snaps.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    // 2. Delete schedule doc
    const schedRef = doc(db, this.basePath, "babies", babyId, "schedule", "main");
    try {
      await deleteDoc(schedRef);
    } catch {
      // ignore
    }

    // 3. Delete baby doc
    const babyRef = doc(db, this.basePath, "babies", babyId);
    await deleteDoc(babyRef);
  }

  async savePreferences(activeProfileId: string, paymentMode: PaymentMode): Promise<void> {
    this.activeProfileId = activeProfileId;
    this.paymentMode = paymentMode;

    const userAppDoc = doc(db, "users", this.uid, "appData", "current");
    try {
      await setDoc(userAppDoc, {
        ownerId: this.uid,
        schemaVersion: 1,
        profiles: [], // Per-user preference in family mode keeps profiles empty
        activeProfileId,
        paymentMode,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${this.uid}/appData/current`);
    }
  }

  async updateScheduleRow(babyId: string, row: ScheduleRow): Promise<void> {
    this.checkAdminPermission();
    const schedRef = doc(db, this.basePath, "babies", babyId, "schedule", "main");

    try {
      await runTransaction(db, async (txn) => {
        const snap = await txn.get(schedRef);
        const currentRows: ScheduleRow[] = snap.exists() ? snap.data().rows || [] : [];
        const updatedRows = currentRows.map((r) => (r.id === row.id ? row : r));

        txn.set(schedRef, {
          rows: updatedRows,
          updatedAt: new Date().toISOString(),
          updatedBy: this.uid
        });
      });
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, `families/${this.fid}/babies/${babyId}/schedule/main`);
    }
  }

  async addCustomRow(babyId: string, row: ScheduleRow): Promise<void> {
    this.checkAdminPermission();
    const schedRef = doc(db, this.basePath, "babies", babyId, "schedule", "main");

    try {
      await runTransaction(db, async (txn) => {
        const snap = await txn.get(schedRef);
        const currentRows: ScheduleRow[] = snap.exists() ? snap.data().rows || [] : [];

        txn.set(schedRef, {
          rows: [...currentRows, row],
          updatedAt: new Date().toISOString(),
          updatedBy: this.uid
        });
      });
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, `families/${this.fid}/babies/${babyId}/schedule/main`);
    }
  }

  async deleteCustomRow(babyId: string, rowId: string): Promise<void> {
    this.checkAdminPermission();
    const schedRef = doc(db, this.basePath, "babies", babyId, "schedule", "main");
    const recRef = doc(db, this.basePath, "babies", babyId, "records", rowId);

    try {
      await runTransaction(db, async (txn) => {
        const snap = await txn.get(schedRef);
        const currentRows: ScheduleRow[] = snap.exists() ? snap.data().rows || [] : [];
        const remainingRows = currentRows.filter((r) => r.id !== rowId);

        txn.set(schedRef, {
          rows: remainingRows,
          updatedAt: new Date().toISOString(),
          updatedBy: this.uid
        });
        txn.delete(recRef);
      });
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, `families/${this.fid}/babies/${babyId}/schedule/main`);
    }
  }

  async resetSchedule(babyId: string): Promise<void> {
    this.checkAdminPermission();
    const { SEED_SCHEDULE } = await import("../../../data/seed");
    const schedRef = doc(db, this.basePath, "babies", babyId, "schedule", "main");

    try {
      await runTransaction(db, async (txn) => {
        txn.set(schedRef, {
          rows: JSON.parse(JSON.stringify(SEED_SCHEDULE)),
          updatedAt: new Date().toISOString(),
          updatedBy: this.uid
        });
      });
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, `families/${this.fid}/babies/${babyId}/schedule/main`);
    }
  }

  async updateRecord(babyId: string, record: VaccineRecord): Promise<void> {
    this.checkAdminPermission();
    const recRef = doc(db, this.basePath, "babies", babyId, "records", record.rowId);
    const nowIso = new Date().toISOString();

    const payload: Record<string, any> = {
      rowId: record.rowId,
      diberikan: record.diberikan,
      updatedAt: nowIso,
      updatedBy: this.uid
    };
    if (record.tanggalDiberikan) payload.tanggalDiberikan = record.tanggalDiberikan;
    if (record.tempat) payload.tempat = record.tempat;
    if (record.merekBatch) payload.merekBatch = record.merekBatch;
    if (typeof record.biayaAktual === "number") payload.biayaAktual = Math.round(record.biayaAktual);
    if (typeof record.ditanggungAsuransi === "boolean") payload.ditanggungAsuransi = record.ditanggungAsuransi;
    if (typeof record.nominalKlaim === "number") payload.nominalKlaim = Math.round(record.nominalKlaim);
    if (record.statusKlaim) payload.statusKlaim = record.statusKlaim;
    if (record.efekSamping) payload.efekSamping = record.efekSamping;
    if (record.catatan) payload.catatan = record.catatan;

    try {
      await setDoc(recRef, payload);
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, `families/${this.fid}/babies/${babyId}/records/${record.rowId}`);
    }
  }

  async clearAllData(): Promise<void> {
    this.checkAdminPermission();
    // Delete all babies in family
    const babiesColl = collection(db, this.basePath, "babies");
    const snap = await getDocs(babiesColl);
    for (const d of snap.docs) {
      await this.deleteBabySubtree(d.id);
    }
  }
}
