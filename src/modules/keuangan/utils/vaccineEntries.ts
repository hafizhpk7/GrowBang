import { VaccineCostSource } from "../../bayi/public";
import { LedgerEntry } from "../types";
import { isValidDateString } from "./dates";

export function buildVaccineEntries(sources: VaccineCostSource[]): {
  entries: LedgerEntry[];
  skippedWithoutDate: number;
} {
  const entries: LedgerEntry[] = [];
  let skippedWithoutDate = 0;

  for (const src of sources || []) {
    const rowMap = new Map<string, string>();
    for (const r of src.rows || []) {
      rowMap.set(r.id, r.vaksin);
    }

    for (const rec of src.records || []) {
      if (
        rec.diberikan === true &&
        typeof rec.biayaAktual === "number" &&
        !isNaN(rec.biayaAktual) &&
        Math.round(rec.biayaAktual) > 0
      ) {
        if (rec.tanggalDiberikan && isValidDateString(rec.tanggalDiberikan)) {
          const vaksinName = rowMap.get(rec.rowId) || "Vaksin";
          const date = rec.tanggalDiberikan;
          const roundedAmount = Math.round(rec.biayaAktual);

          const entry: LedgerEntry = {
            id: `vaccine:${src.profileId}:${rec.rowId}`,
            type: "expense",
            amount: roundedAmount,
            categoryId: "kesehatan-anak",
            date,
            note: `${vaksinName} — ${src.profileName}`,
            createdAt: `${date}T00:00:00.000Z`,
            updatedAt: `${date}T00:00:00.000Z`,
            source: "vaccine",
            readOnly: true,
            profileId: src.profileId,
            profileName: src.profileName,
            rowId: rec.rowId
          };
          entries.push(entry);
        } else {
          skippedWithoutDate += 1;
        }
      }
    }
  }

  return { entries, skippedWithoutDate };
}

export function summarizePendingClaims(sources: VaccineCostSource[]): {
  count: number;
  total: number;
} {
  let count = 0;
  let total = 0;

  for (const src of sources || []) {
    for (const rec of src.records || []) {
      if (
        rec.ditanggungAsuransi === true &&
        typeof rec.nominalKlaim === "number" &&
        !isNaN(rec.nominalKlaim) &&
        rec.nominalKlaim > 0
      ) {
        const st = rec.statusKlaim;
        if (!st || st === "Belum diajukan" || st === "Diajukan") {
          count += 1;
          total += rec.nominalKlaim;
        }
      }
    }
  }

  return { count, total };
}
