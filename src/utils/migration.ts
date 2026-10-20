import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../services/firebase";
import { AppState, Profile, VaccineRecord } from "../types";
import { loadAppState } from "./storage";

export interface MigrationVerificationResult {
  ok: boolean;
  reason?: string;
}

export function profileFingerprint(p: Profile): string {
  const parts = [
    p.id,
    p.panggilan,
    p.tanggalLahir,
    p.catatan || "",
    p.insurance?.namaProduk || "",
    p.insurance?.mekanisme || "",
    p.schedule.map((r) => `${r.id}:${r.vaksin}:${r.usia}:${r.gratis}:${r.min}:${r.max}`).join("|"),
    p.records.map((rec) => `${rec.rowId}:${rec.diberikan}:${rec.tanggalDiberikan || ""}:${rec.biayaAktual ?? ""}`).join("|")
  ];
  return parts.join(";;");
}

export function verifyMigration(
  source: Profile[],
  target: Profile[]
): MigrationVerificationResult {
  if (source.length !== target.length) {
    return {
      ok: false,
      reason: `Jumlah profil tidak cocok: sumber ${source.length}, tujuan ${target.length}`
    };
  }

  const targetMap = new Map<string, Profile>(target.map((t) => [t.id, t]));

  for (const s of source) {
    const t = targetMap.get(s.id);
    if (!t) {
      return { ok: false, reason: `Profil ${s.id} tidak ditemukan di tujuan` };
    }

    if (s.panggilan !== t.panggilan || s.tanggalLahir !== t.tanggalLahir) {
      return { ok: false, reason: `Metadata profil ${s.id} tidak cocok` };
    }

    if (s.schedule.length !== t.schedule.length) {
      return {
        ok: false,
        reason: `Jumlah jadwal untuk ${s.id} tidak cocok: ${s.schedule.length} vs ${t.schedule.length}`
      };
    }

    if (s.records.length !== t.records.length) {
      return {
        ok: false,
        reason: `Jumlah catatan vaksin untuk ${s.id} tidak cocok: ${s.records.length} vs ${t.records.length}`
      };
    }

    const sFp = profileFingerprint(s);
    const tFp = profileFingerprint(t);
    if (sFp !== tFp) {
      return { ok: false, reason: `Fingerprint profil ${s.id} tidak identik` };
    }
  }

  return { ok: true };
}

export async function fetchPersonalBabyData(uid: string): Promise<Profile[]> {
  try {
    const docRef = doc(db, "users", uid, "appData", "current");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as AppState;
      if (Array.isArray(data.profiles) && data.profiles.length > 0) {
        return data.profiles;
      }
    }
  } catch (err) {
    console.warn("Gagal membaca appData cloud saat migrasi, menggunakan penyimpanan lokal:", err);
  }

  const local = loadAppState();
  return Array.isArray(local.profiles) ? local.profiles : [];
}

export async function getExistingFamilyBabyIds(fid: string): Promise<Set<string>> {
  const babiesColl = collection(db, "families", fid, "babies");
  const snap = await getDocs(babiesColl);
  return new Set(snap.docs.map((d) => d.id));
}

export async function migrateBabyDataToFamily(
  uid: string,
  fid: string,
  selectedProfileIds: string[]
): Promise<{ migratedCount: number; skippedCount: number }> {
  const personalProfiles = await fetchPersonalBabyData(uid);
  const existingIds = await getExistingFamilyBabyIds(fid);

  const toMigrate: Profile[] = [];
  let skippedCount = 0;

  for (const p of personalProfiles) {
    if (selectedProfileIds.includes(p.id)) {
      if (existingIds.has(p.id)) {
        skippedCount++;
      } else {
        toMigrate.push(p);
      }
    }
  }

  if (toMigrate.length === 0) {
    return { migratedCount: 0, skippedCount };
  }

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
    for (const profile of toMigrate) {
      // 1. Baby document
      const babyRef = doc(db, "families", fid, "babies", profile.id);
      const babyPayload: Record<string, any> = {
        id: profile.id,
        panggilan: profile.panggilan,
        tanggalLahir: profile.tanggalLahir,
        insurance: profile.insurance,
        schemaVersion: 1,
        createdAt: nowIso,
        updatedAt: nowIso,
        createdBy: uid,
        updatedBy: uid,
        sourceUid: uid
      };
      if (profile.catatan && profile.catatan.trim()) {
        babyPayload.catatan = profile.catatan.trim();
      }

      currentBatch.set(babyRef, babyPayload);
      opCount++;
      await commitBatchIfNeeded();

      // 2. Schedule doc 'main'
      const scheduleRef = doc(db, "families", fid, "babies", profile.id, "schedule", "main");
      currentBatch.set(scheduleRef, {
        rows: profile.schedule,
        updatedAt: nowIso,
        updatedBy: uid
      });
      opCount++;
      await commitBatchIfNeeded();

      // 3. Records docs
      for (const rec of profile.records) {
        const recRef = doc(db, "families", fid, "babies", profile.id, "records", rec.rowId);
        const recPayload: Record<string, any> = {
          rowId: rec.rowId,
          diberikan: rec.diberikan,
          updatedAt: nowIso,
          updatedBy: uid
        };
        if (rec.tanggalDiberikan) recPayload.tanggalDiberikan = rec.tanggalDiberikan;
        if (rec.tempat) recPayload.tempat = rec.tempat;
        if (rec.merekBatch) recPayload.merekBatch = rec.merekBatch;
        if (typeof rec.biayaAktual === "number") recPayload.biayaAktual = Math.round(rec.biayaAktual);
        if (typeof rec.ditanggungAsuransi === "boolean") recPayload.ditanggungAsuransi = rec.ditanggungAsuransi;
        if (typeof rec.nominalKlaim === "number") recPayload.nominalKlaim = Math.round(rec.nominalKlaim);
        if (rec.statusKlaim) recPayload.statusKlaim = rec.statusKlaim;
        if (rec.efekSamping) recPayload.efekSamping = rec.efekSamping;
        if (rec.catatan) recPayload.catatan = rec.catatan;

        currentBatch.set(recRef, recPayload);
        opCount++;
        await commitBatchIfNeeded();
      }
    }

    await commitBatchIfNeeded(true);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `families/${fid}/babies`);
  }

  // Verification step
  const assembledTarget: Profile[] = [];
  for (const profile of toMigrate) {
    const bSnap = await getDoc(doc(db, "families", fid, "babies", profile.id));
    const sSnap = await getDoc(doc(db, "families", fid, "babies", profile.id, "schedule", "main"));
    const rSnaps = await getDocs(collection(db, "families", fid, "babies", profile.id, "records"));

    if (!bSnap.exists() || !sSnap.exists()) {
      throw new Error(`Verifikasi migrasi gagal: dokumen anak ${profile.id} tidak lengkap`);
    }

    const bData = bSnap.data() as any;
    const sData = sSnap.data() as any;
    const recs: VaccineRecord[] = rSnaps.docs.map((d) => d.data() as VaccineRecord);

    assembledTarget.push({
      id: bData.id,
      panggilan: bData.panggilan,
      tanggalLahir: bData.tanggalLahir,
      catatan: bData.catatan,
      insurance: bData.insurance,
      schedule: sData.rows || [],
      records: recs
    });
  }

  const ver = verifyMigration(toMigrate, assembledTarget);
  if (!ver.ok) {
    throw new Error(`Verifikasi integritas migrasi gagal: ${ver.reason}`);
  }

  return { migratedCount: toMigrate.length, skippedCount };
}
