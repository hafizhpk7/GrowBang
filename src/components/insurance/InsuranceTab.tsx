import React, { useMemo } from "react";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  TrendingUp,
  Receipt,
  HelpCircle,
  Clock,
  PiggyBank,
  CheckSquare,
  Square,
  Lock,
  AlertCircle
} from "lucide-react";
import { CHECKLIST_ITEMS } from "../../data/seed";
import { Insurance, Profile, Record, ScheduleRow } from "../../types";
import { calculateCostSummary, formatRupiah, YEAR_LABELS } from "../../utils/calc";
import { formatIndonesianDate } from "../../utils/dates";

interface Props {
  profile: Profile;
  onUpdateInsurance: (insurance: Insurance) => void;
  onOpenRecordModal: (row: ScheduleRow) => void;
}

export const InsuranceTab: React.FC<Props> = ({
  profile,
  onUpdateInsurance,
  onOpenRecordModal
}) => {
  const insurance = profile.insurance;

  // Calculate annual out-of-pocket max estimates
  const { years } = useMemo(() => calculateCostSummary(profile.schedule), [profile.schedule]);

  // Find all records with insurance claims
  const rowMap = useMemo(
    () => new Map<string, ScheduleRow>(profile.schedule.map((r) => [r.id, r])),
    [profile.schedule]
  );

  const claimRecords = useMemo(() => {
    return profile.records
      .filter((rec) => rec.ditanggungAsuransi || (rec.nominalKlaim && rec.nominalKlaim > 0))
      .map((rec) => ({
        record: rec,
        row: rowMap.get(rec.rowId)
      }))
      .filter((item) => item.row !== undefined);
  }, [profile.records, rowMap]);

  // Claims totals by status
  const claimStats = useMemo(() => {
    let belumDiajukan = 0;
    let diajukan = 0;
    let disetujui = 0;
    let ditolak = 0;

    claimRecords.forEach(({ record }) => {
      const amt = Number(record.nominalKlaim) || 0;
      if (record.statusKlaim === "Diajukan") diajukan += amt;
      else if (record.statusKlaim === "Disetujui") disetujui += amt;
      else if (record.statusKlaim === "Ditolak") ditolak += amt;
      else belumDiajukan += amt;
    });

    return { belumDiajukan, diajukan, disetujui, ditolak, total: belumDiajukan + diajukan + disetujui + ditolak };
  }, [claimRecords]);

  // Update policy fields
  const handleFieldChange = (field: keyof Insurance, value: any) => {
    onUpdateInsurance({
      ...insurance,
      [field]: value
    });
  };

  const handleLimitChange = (tahun: 1 | 2 | 3 | 4 | 5, value: string) => {
    const parsed = parseInt(value.replace(/\D/g, ""), 10) || 0;
    onUpdateInsurance({
      ...insurance,
      limitPerTahun: {
        ...insurance.limitPerTahun,
        [tahun]: parsed
      }
    });
  };

  const handleToggleChecklist = (index: number) => {
    const updated = [...(insurance.checklist || [false, false, false, false])];
    updated[index] = !updated[index];
    onUpdateInsurance({
      ...insurance,
      checklist: updated
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-[#1F4E78]" />
            Perencanaan Asuransi & Pelacak Klaim
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Bandingkan plafon manfaat rawat jalan/imunisasi polis Anda terhadap proyeksi kebutuhan vaksin.
          </p>
        </div>
      </div>

      {/* 2. Important Tip & Savings Advice Banner */}
      <div className="bg-gradient-to-r from-blue-50/90 to-teal-50/90 p-5 sm:p-6 rounded-3xl border border-blue-200 space-y-2.5 shadow-2xs">
        <div className="flex items-center gap-2 text-[#1F4E78] font-extrabold text-sm sm:text-base">
          <PiggyBank className="w-5 h-5 text-teal-600" />
          Tips Finansial untuk Orang Tua
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          <strong>Tahun 2 (usia 12–24 bulan)</strong> adalah puncak pengeluaran vaksin pilihan (Varisela, Hepatitis A, Flu tahunan). Pastikan limit tahunan polis Anda mencukupi. Jika polis asuransi Anda mengecualikan imunisasi, siapkan pos tabungan mandiri minimal <strong>Rp 4.500.000 – Rp 7.600.000</strong> untuk 5 tahun pertama anak.
        </p>
      </div>

      {/* 3. Insurance Policy Form */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-[#1F4E78]" />
            Parameter Manfaat Polis Asuransi
          </h3>
          <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            Privasi Aman: Tanpa No. Polis
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Nama Produk Asuransi
            </label>
            <input
              type="text"
              value={insurance.namaProduk}
              onChange={(e) => handleFieldChange("namaProduk", e.target.value)}
              placeholder="Misal: Prudential / Manulife / AIA Rawat Jalan"
              className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-300 bg-white min-h-[48px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Mekanisme Klaim
            </label>
            <select
              value={insurance.mekanisme}
              onChange={(e) => handleFieldChange("mekanisme", e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-300 bg-white min-h-[48px]"
            >
              <option value="">-- Pilih Mekanisme --</option>
              <option value="Cashless">Cashless (Kartu / RS Rekanan)</option>
              <option value="Reimburse">Reimburse (Kirim Kwitansi)</option>
              <option value="Keduanya">Keduanya</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Masa Tunggu (Bulan)
            </label>
            <input
              type="number"
              min="0"
              max="24"
              value={insurance.masaTungguBulan}
              onChange={(e) => handleFieldChange("masaTungguBulan", Number(e.target.value))}
              placeholder="Misal: 0 atau 1 bulan"
              className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-300 bg-white min-h-[48px]"
            />
          </div>
        </div>

        {/* Limit Per Year Inputs */}
        <div className="space-y-2.5 pt-2">
          <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            Plafon / Limit Manfaat Imunisasi per Tahun (Rp)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {([1, 2, 3, 4, 5] as const).map((th) => (
              <div key={th} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-500">
                  Tahun {th} ({YEAR_LABELS[th]})
                </span>
                <input
                  type="text"
                  value={new Intl.NumberFormat("id-ID").format(insurance.limitPerTahun?.[th] || 0)}
                  onChange={(e) => handleLimitChange(th, e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 rounded-xl border border-slate-300 bg-white min-h-[40px]"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Vaksin yang Dikecualikan Polis (Exclusion List)
            </label>
            <input
              type="text"
              value={insurance.vaksinDikecualikan}
              onChange={(e) => handleFieldChange("vaksinDikecualikan", e.target.value)}
              placeholder="Contoh: Flu tidak ditanggung, hanya menanggung vaksin wajib"
              className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-300 bg-white min-h-[48px]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Catatan Khusus Polis
            </label>
            <input
              type="text"
              value={insurance.catatan}
              onChange={(e) => handleFieldChange("catatan", e.target.value)}
              placeholder="Contoh: Butuh rujukan dokter, kwitansi asli harus dikirim max 30 hari"
              className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-300 bg-white min-h-[48px]"
            />
          </div>
        </div>
      </div>

      {/* 4. VISUAL BULLET GRAPH / PROGRESS BAR: ESTIMATED EXPENSE VS ANNUAL INSURANCE LIMIT */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-5 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#1F4E78]" />
              Indikator Visual Plafon Polis vs Estimasi Kebutuhan Biaya
            </h3>
            <p className="text-xs text-slate-500">
              Grafik peluru (bullet graph) memantau batas aman plafon tahunan polis asuransi Anda.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              Aman (&le;75%)
            </span>
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              Waspada (76–100%)
            </span>
            <span className="flex items-center gap-1.5 text-rose-700">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              Defisit (&gt;100%)
            </span>
          </div>
        </div>

        {/* Bullet Progress Bars Stack for Years 1-5 */}
        <div className="space-y-5">
          {years.map((y) => {
            const limit = insurance.limitPerTahun?.[y.tahun] || 0;
            const need = y.tanggungSendiriMax;
            const diff = limit - need;
            const isAdequate = diff >= 0;

            // Ratio of need to insurance limit
            const ratio = limit > 0 ? (need / limit) * 100 : 0;
            const clampedBarWidth = Math.min(100, Math.max(0, ratio));

            // Dynamic color transition based on limit utilization
            let barColor = "bg-slate-300";
            let statusTextColor = "text-slate-600";
            let statusBadgeBg = "bg-slate-100 text-slate-700";
            let statusLabel = "Plafon Belum Diisi";

            if (limit > 0) {
              if (ratio <= 75) {
                barColor = "bg-emerald-500";
                statusTextColor = "text-emerald-700";
                statusBadgeBg = "bg-emerald-50 text-emerald-800 border-emerald-200";
                statusLabel = "Plafon Aman";
              } else if (ratio <= 100) {
                barColor = "bg-amber-500";
                statusTextColor = "text-amber-700";
                statusBadgeBg = "bg-amber-50 text-amber-800 border-amber-200";
                statusLabel = "Mendekati Plafon";
              } else {
                barColor = "bg-rose-500";
                statusTextColor = "text-rose-700";
                statusBadgeBg = "bg-rose-50 text-rose-800 border-rose-200 animate-pulse";
                statusLabel = `Defisit Rp ${new Intl.NumberFormat("id-ID").format(Math.abs(diff))}`;
              }
            }

            return (
              <div
                key={y.tahun}
                className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3"
              >
                {/* Year Title & Numbers */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-[#1F4E78] text-white flex items-center justify-center font-black text-xs shrink-0">
                      {y.tahun}
                    </span>
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm">
                        Tahun {y.tahun} ({y.rentangUsia})
                      </span>
                      <span className="text-slate-500 ml-2">
                        Estimasi Kebutuhan: <strong>{formatRupiah(need)}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-600">
                      Limit Polis: <strong className="text-slate-900">{formatRupiah(limit)}</strong>
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusBadgeBg}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>

                {/* The Bullet Graph Visual Bar */}
                <div className="space-y-1.5">
                  <div className="relative w-full bg-slate-200/80 h-3.5 rounded-full overflow-hidden">
                    {/* Progress Fill */}
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${limit > 0 ? clampedBarWidth : 0}%` }}
                    />
                  </div>

                  {/* Bullet Graph Range Labels */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold px-0.5">
                    <span>Rp 0</span>
                    {limit > 0 ? (
                      <>
                        <span>Plafon Polis: {formatRupiah(limit)} (100%)</span>
                        <span className={`font-bold ${statusTextColor}`}>
                          {ratio > 100 ? `${Math.round(ratio)}% (Overlimit)` : `${Math.round(ratio)}%`}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400 italic">Isi limit di formulir atas</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Claims Tracker Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden space-y-3 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#1F4E78]" />
              Pelacak Klaim Asuransi Tercatat ({claimRecords.length})
            </h3>
            <p className="text-xs text-slate-500">
              Daftar vaksin yang diajukan ke asuransi beserta status prosesnya
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="bg-slate-100 px-3 py-1.5 rounded-xl text-slate-700 font-medium">
              Diajukan: <strong>{formatRupiah(claimStats.diajukan)}</strong>
            </span>
            <span className="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl font-bold">
              Disetujui: <strong>{formatRupiah(claimStats.disetujui)}</strong>
            </span>
          </div>
        </div>

        {claimRecords.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-xs sm:text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            Belum ada vaksin yang ditandai untuk klaim asuransi. Anda dapat mengaktifkannya di tab Jadwal saat mencatat pemberian vaksin.
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-700 uppercase text-[11px] font-bold">
                  <th className="py-3 px-3">Vaksin</th>
                  <th className="py-3 px-3">Jadwal</th>
                  <th className="py-3 px-3">Tgl Pemberian</th>
                  <th className="py-3 px-3 text-right">Biaya Riil</th>
                  <th className="py-3 px-3 text-right">Nominal Klaim</th>
                  <th className="py-3 px-3 text-center">Status Klaim</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claimRecords.map(({ record, row }) => (
                  <tr key={record.rowId} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {row?.vaksin}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-semibold">
                      {row?.usia}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {record.tanggalDiberikan || "-"}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      {formatRupiah(record.biayaAktual || 0)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#1F4E78]">
                      {formatRupiah(record.nominalKlaim || 0)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          record.statusKlaim === "Disetujui"
                            ? "bg-emerald-100 text-emerald-800"
                            : record.statusKlaim === "Diajukan"
                            ? "bg-amber-100 text-amber-800"
                            : record.statusKlaim === "Ditolak"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {record.statusKlaim || "Belum diajukan"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row && (
                        <button
                          type="button"
                          onClick={() => onOpenRecordModal(row)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[#1F4E78] font-bold rounded-lg text-xs"
                        >
                          Ubah
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Insurance Inquiry Checklist */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm sm:text-base border-b border-slate-100 pb-3">
          <HelpCircle className="w-5 h-5 text-[#1F4E78]" />
          Daftar Pertanyaan Wajib ke Agen / Pihak Asuransi
        </div>
        <div className="space-y-2.5">
          {CHECKLIST_ITEMS.map((item, idx) => {
            const isChecked = Boolean(insurance.checklist?.[idx]);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleToggleChecklist(idx)}
                className={`w-full text-left p-3.5 rounded-2xl border transition flex items-start gap-3 min-h-[44px] ${
                  isChecked
                    ? "bg-blue-50/70 border-blue-200 text-[#1F4E78]"
                    : "bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {isChecked ? (
                  <CheckSquare className="w-4 h-4 text-[#1F4E78] mt-0.5 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                )}
                <span className="text-xs sm:text-sm font-medium leading-relaxed">
                  {item}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
