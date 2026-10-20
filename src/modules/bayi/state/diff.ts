import { AppState, Insurance, Profile, ScheduleRow, VaccineRecord } from "../../../types";

export type BayiDiffOp =
  | {
      type: "setBaby";
      babyId: string;
      meta: {
        id: string;
        panggilan: string;
        tanggalLahir: string;
        catatan?: string;
        insurance: Insurance;
        schemaVersion: 1;
        sourceUid?: string;
      };
    }
  | {
      type: "deleteBaby";
      babyId: string;
    }
  | {
      type: "setSchedule";
      babyId: string;
      rows: ScheduleRow[];
    }
  | {
      type: "setRecord";
      babyId: string;
      rowId: string;
      record: VaccineRecord;
    }
  | {
      type: "deleteRecord";
      babyId: string;
      rowId: string;
    };

function isMetaEqual(a: Profile, b: Profile): boolean {
  if (a.panggilan !== b.panggilan) return false;
  if (a.tanggalLahir !== b.tanggalLahir) return false;
  if ((a.catatan || "") !== (b.catatan || "")) return false;
  return JSON.stringify(a.insurance || {}) === JSON.stringify(b.insurance || {});
}

function isScheduleEqual(a: ScheduleRow[], b: ScheduleRow[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const ra = a[i];
    const rb = b[i];
    if (
      ra.id !== rb.id ||
      ra.vaksin !== rb.vaksin ||
      ra.usia !== rb.usia ||
      ra.gratis !== rb.gratis ||
      ra.status !== rb.status ||
      ra.min !== rb.min ||
      ra.max !== rb.max ||
      (ra.catatan || "") !== (rb.catatan || "")
    ) {
      return false;
    }
  }
  return true;
}

function isRecordEqual(a: VaccineRecord, b: VaccineRecord): boolean {
  if (a.diberikan !== b.diberikan) return false;
  if ((a.tanggalDiberikan || "") !== (b.tanggalDiberikan || "")) return false;
  if ((a.tempat || "") !== (b.tempat || "")) return false;
  if ((a.merekBatch || "") !== (b.merekBatch || "")) return false;
  if ((a.biayaAktual ?? null) !== (b.biayaAktual ?? null)) return false;
  if ((a.ditanggungAsuransi ?? null) !== (b.ditanggungAsuransi ?? null)) return false;
  if ((a.nominalKlaim ?? null) !== (b.nominalKlaim ?? null)) return false;
  if ((a.statusKlaim || "") !== (b.statusKlaim || "")) return false;
  if ((a.efekSamping || "") !== (b.efekSamping || "")) return false;
  if ((a.catatan || "") !== (b.catatan || "")) return false;
  return true;
}

/**
 * Computes the minimal diff of mutations needed to transition from prev to next state.
 * Untouched entities produce zero ops.
 */
export function diffAppState(prev: AppState, next: AppState): BayiDiffOp[] {
  const ops: BayiDiffOp[] = [];

  const prevMap = new Map<string, Profile>(prev.profiles.map((p) => [p.id, p]));
  const nextMap = new Map<string, Profile>(next.profiles.map((p) => [p.id, p]));

  // 1. Detect deleted babies
  for (const [prevId] of prevMap) {
    if (!nextMap.has(prevId)) {
      ops.push({ type: "deleteBaby", babyId: prevId });
    }
  }

  // 2. Detect added or modified babies
  for (const [nextId, nextProf] of nextMap) {
    const prevProf = prevMap.get(nextId);

    if (!prevProf) {
      // Brand new baby: setBaby meta, setSchedule (initial seed/custom rows), and any records
      ops.push({
        type: "setBaby",
        babyId: nextId,
        meta: {
          id: nextProf.id,
          panggilan: nextProf.panggilan,
          tanggalLahir: nextProf.tanggalLahir,
          catatan: nextProf.catatan?.trim() || undefined,
          insurance: nextProf.insurance,
          schemaVersion: 1
        }
      });

      ops.push({
        type: "setSchedule",
        babyId: nextId,
        rows: nextProf.schedule
      });

      for (const rec of nextProf.records) {
        ops.push({
          type: "setRecord",
          babyId: nextId,
          rowId: rec.rowId,
          record: rec
        });
      }
    } else {
      // Existing baby: check meta
      if (!isMetaEqual(prevProf, nextProf)) {
        ops.push({
          type: "setBaby",
          babyId: nextId,
          meta: {
            id: nextProf.id,
            panggilan: nextProf.panggilan,
            tanggalLahir: nextProf.tanggalLahir,
            catatan: nextProf.catatan?.trim() || undefined,
            insurance: nextProf.insurance,
            schemaVersion: 1
          }
        });
      }

      // Check schedule
      if (!isScheduleEqual(prevProf.schedule, nextProf.schedule)) {
        ops.push({
          type: "setSchedule",
          babyId: nextId,
          rows: nextProf.schedule
        });
      }

      // Check records
      const prevRecMap = new Map<string, VaccineRecord>(prevProf.records.map((r) => [r.rowId, r]));
      const nextRecMap = new Map<string, VaccineRecord>(nextProf.records.map((r) => [r.rowId, r]));

      // Deleted records
      for (const [rowId] of prevRecMap) {
        if (!nextRecMap.has(rowId)) {
          ops.push({
            type: "deleteRecord",
            babyId: nextId,
            rowId
          });
        }
      }

      // Added or updated records
      for (const [rowId, nRec] of nextRecMap) {
        const pRec = prevRecMap.get(rowId);
        if (!pRec || !isRecordEqual(pRec, nRec)) {
          ops.push({
            type: "setRecord",
            babyId: nextId,
            rowId,
            record: nRec
          });
        }
      }
    }
  }

  return ops;
}
