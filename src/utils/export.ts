import * as XLSX from "xlsx";
import { ASSUMPTIONS_AND_NOTES, SEED_VACCINE_INFO } from "../data/seed";
import { Profile } from "../types";
import { calculateCostSummary, formatRupiah, YEAR_LABELS } from "./calc";
import { calculateDueDate, formatIndonesianDate } from "./dates";

export function exportToExcel(profile: Profile): void {
  const wb = XLSX.utils.book_new();

  // 1. Sheet "Jadwal"
  const recordMap = new Map(profile.records.map((r) => [r.rowId, r]));
  const jadwalData = profile.schedule.map((row) => {
    const rec = recordMap.get(row.id);
    const dueDate = calculateDueDate(profile.tanggalLahir, row.bln);

    return {
      Tahun: row.tahun,
      Usia: row.usia,
      "Bulan ke-": row.bln,
      "Perkiraan Jatuh Tempo": formatIndonesianDate(dueDate),
      Vaksin: row.vaksin,
      Status: row.status,
      "Gratis Puskesmas/BPJS?": row.gratis,
      "Masuk total?": row.masuk ? "Ya" : "Tidak",
      "Biaya swasta min (Rp)": row.min,
      "Biaya swasta maks (Rp)": row.max,
      Catatan: row.catatan || "",
      "Sudah Diberikan": rec?.diberikan ? "Ya" : "Belum",
      "Tanggal Diberikan": rec?.tanggalDiberikan ? formatIndonesianDate(rec.tanggalDiberikan) : "-",
      Fasilitas: rec?.tempat || "-",
      "Merek / Batch": rec?.merekBatch || "-",
      "Biaya Aktual (Rp)": rec?.biayaAktual ?? "-",
      "Asuransi?": rec?.ditanggungAsuransi ? "Ya" : "Tidak",
      "Nominal Klaim (Rp)": rec?.nominalKlaim ?? "-",
      "Status Klaim": rec?.statusKlaim || "-"
    };
  });
  const wsJadwal = XLSX.utils.json_to_sheet(jadwalData);
  XLSX.utils.book_append_sheet(wb, wsJadwal, "Jadwal");

  // 2. Sheet "Ringkasan"
  const { years, total } = calculateCostSummary(profile.schedule);
  const ringkasanData = years.map((y) => ({
    Tahun: y.tahun,
    "Rentang usia": y.rentangUsia,
    "Tanggung sendiri – min (Rp)": y.tanggungSendiriMin,
    "Tanggung sendiri – maks (Rp)": y.tanggungSendiriMax,
    "Semua di swasta – min (Rp)": y.semuaSwastaMin,
    "Semua di swasta – maks (Rp)": y.semuaSwastaMax,
    "Dibebaskan program – min (Rp)": y.dibebaskanMin,
    "Dibebaskan program – maks (Rp)": y.dibebaskanMax
  }));

  ringkasanData.push({
    Tahun: "Total 0–5 th" as any,
    "Rentang usia": "0–60 bln",
    "Tanggung sendiri – min (Rp)": total.tanggungSendiriMin,
    "Tanggung sendiri – maks (Rp)": total.tanggungSendiriMax,
    "Semua di swasta – min (Rp)": total.semuaSwastaMin,
    "Semua di swasta – maks (Rp)": total.semuaSwastaMax,
    "Dibebaskan program – min (Rp)": total.dibebaskanMin,
    "Dibebaskan program – maks (Rp)": total.dibebaskanMax
  });
  const wsRingkasan = XLSX.utils.json_to_sheet(ringkasanData);
  XLSX.utils.book_append_sheet(wb, wsRingkasan, "Ringkasan");

  // 3. Sheet "Fungsi Vaksin"
  const fungsiVaksinData = SEED_VACCINE_INFO.map((v) => ({
    Vaksin: v.nama,
    "Melindungi dari": v.melindungi,
    "Mengapa penting": v.penting,
    "Reaksi setelah imunisasi (KIPI)": v.efekSamping,
    "Status umum": v.status,
    "Gratis di program?": v.gratisProgram
  }));
  const wsFungsi = XLSX.utils.json_to_sheet(fungsiVaksinData);
  XLSX.utils.book_append_sheet(wb, wsFungsi, "Fungsi Vaksin");

  // 4. Sheet "Catatan"
  const catatanData = ASSUMPTIONS_AND_NOTES.map((c) => ({
    Topik: c.topik,
    Keterangan: c.keterangan
  }));
  const wsCatatan = XLSX.utils.json_to_sheet(catatanData);
  XLSX.utils.book_append_sheet(wb, wsCatatan, "Catatan");

  const fileName = `Jadwal_Imunisasi_${profile.panggilan.replace(/\s+/g, "_")}_0-5_Tahun.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportToIcs(profile: Profile): void {
  const recordMap = new Map(profile.records.map((r) => [r.rowId, r]));
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pemantau Imunisasi 0-5 Tahun//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH"
  ];

  profile.schedule.forEach((row) => {
    const rec = recordMap.get(row.id);
    if (rec?.diberikan) return; // Only export pending/upcoming items

    const dueDate = calculateDueDate(profile.tanggalLahir, row.bln);
    const yyyy = dueDate.getFullYear();
    const mm = String(dueDate.getMonth() + 1).padStart(2, "0");
    const dd = String(dueDate.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}${mm}${dd}`;

    const uid = `${profile.id}-${row.id}-${dateStr}@pemantau-imunisasi.app`;
    const summary = `Imunisasi: ${row.vaksin} – ${profile.panggilan}`;
    const desc = `Jadwal Usia: ${row.usia} (${row.bln} bln)\\nStatus: ${row.status}\\nGratis Program: ${row.gratis}\\nPerkiraan Biaya Swasta: ${formatRupiah(row.min)} - ${formatRupiah(row.max)}\\nCatatan: ${row.catatan || "-"}`;

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dateStr}T090000Z`,
      `DTSTART;VALUE=DATE:${dateStr}`,
      `DTEND;VALUE=DATE:${dateStr}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${desc}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT"
    );
  });

  lines.push("END:VCALENDAR");

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Jadwal_Imunisasi_${profile.panggilan.replace(/\s+/g, "_")}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJsonBackup(data: any): void {
  const dateStr = new Date().toISOString().split("T")[0];
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cadangan-imunisasi-0-5-tahun-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseAndValidateBackup(jsonString: string): { success: boolean; data?: any; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== "object") {
      return { success: false, error: "Format berkas bukan objek JSON yang valid." };
    }
    if (!Array.isArray(parsed.profiles) || parsed.profiles.length === 0) {
      return { success: false, error: "Berkas tidak memiliki data profil yang valid." };
    }
    // Verify each profile has schedule
    for (const p of parsed.profiles) {
      if (!p.id || !p.panggilan || !p.tanggalLahir || !Array.isArray(p.schedule)) {
        return { success: false, error: `Profil "${p?.panggilan || "Tanpa Nama"}" memiliki data yang rusak atau tidak lengkap.` };
      }
    }
    return { success: true, data: parsed };
  } catch (err: any) {
    return { success: false, error: "Gagal membaca berkas JSON: " + (err.message || "Sintaks tidak valid") };
  }
}
