import React, { useState } from "react";
import {
  X,
  Calendar,
  Building2,
  Tag,
  Receipt,
  FileText,
  AlertCircle,
  Shield,
  CheckCircle
} from "lucide-react";
import {
  ClaimStatus,
  FacilityType,
  ScheduleRow,
  VaccineRecord
} from "../../types";
import { formatRupiah } from "../../utils/calc";

interface Props {
  row: ScheduleRow;
  record?: VaccineRecord;
  dueDateStr?: string;
  onClose: () => void;
  onSave: (record: VaccineRecord) => void;
}

export const RecordModal: React.FC<Props> = ({
  row,
  record,
  dueDateStr = "-",
  onClose,
  onSave
}) => {
  const todayStr = new Date().toISOString().split("T")[0];

  const [diberikan, setDiberikan] = useState<boolean>(
    record?.diberikan ?? false
  );
  const [tanggalDiberikan, setTanggalDiberikan] = useState<string>(
    record?.tanggalDiberikan || todayStr
  );
  const [tempat, setTempat] = useState<FacilityType>(
    record?.tempat || (row.gratis === "Ya" ? "Puskesmas" : "Rumah Sakit")
  );
  const [merekBatch, setMerekBatch] = useState<string>(
    record?.merekBatch || ""
  );
  const [biayaAktual, setBiayaAktual] = useState<number | string>(
    record?.biayaAktual ?? (row.gratis === "Ya" ? 0 : row.min)
  );
  const [catatan, setCatatan] = useState<string>(
    record?.catatan || ""
  );
  const [efekSamping, setEfekSamping] = useState<string>(
    record?.efekSamping || ""
  );
  const [ditanggungAsuransi, setDitanggungAsuransi] = useState<boolean>(
    record?.ditanggungAsuransi ?? false
  );
  const [nominalKlaim, setNominalKlaim] = useState<number | string>(
    record?.nominalKlaim ?? (row.gratis === "Ya" ? 0 : row.min)
  );
  const [statusKlaim, setStatusKlaim] = useState<ClaimStatus>(
    record?.statusKlaim || "Belum diajukan"
  );

  const handleToggleDiberikan = (checked: boolean) => {
    setDiberikan(checked);
    if (checked && !tanggalDiberikan) {
      setTanggalDiberikan(todayStr);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedRecord: VaccineRecord = {
      rowId: row.id,
      diberikan,
      tanggalDiberikan: diberikan ? tanggalDiberikan : undefined,
      tempat: diberikan ? tempat : undefined,
      merekBatch: merekBatch.trim() || undefined,
      biayaAktual: diberikan ? Number(biayaAktual) || 0 : 0,
      catatan: catatan.trim() || undefined,
      efekSamping: efekSamping.trim() || undefined,
      ditanggungAsuransi: diberikan ? ditanggungAsuransi : false,
      nominalKlaim:
        diberikan && ditanggungAsuransi ? Number(nominalKlaim) || 0 : undefined,
      statusKlaim:
        diberikan && ditanggungAsuransi ? statusKlaim : undefined
    };

    onSave(updatedRecord);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      {/* Responsive Bottom Sheet / Centered Modal */}
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] pb-[max(env(safe-area-inset-bottom),0.5rem)] sm:pb-0"
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Grab Bar */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/80">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Pencatatan Imunisasi
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
              {row.vaksin}
            </h3>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span className="font-semibold text-[#1F4E78]">Jadwal: {row.usia}</span>
              <span>•</span>
              <span>Jatuh tempo: {dueDateStr}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/50 transition min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Toggle Sudah Diberikan */}
          <div className="p-4 bg-gradient-to-r from-blue-50/80 to-teal-50/80 rounded-2xl border border-blue-200/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <input
                id="sudah-diberikan-checkbox"
                type="checkbox"
                checked={diberikan}
                onChange={(e) => handleToggleDiberikan(e.target.checked)}
                className="w-5 h-5 text-[#1F4E78] rounded-md border-slate-300 focus:ring-[#1F4E78] cursor-pointer"
              />
              <label htmlFor="sudah-diberikan-checkbox" className="text-sm font-extrabold text-slate-900 cursor-pointer">
                Sudah Diberikan ke Anak
              </label>
            </div>
            {diberikan ? (
              <span className="text-xs font-bold text-white bg-emerald-500 px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                <CheckCircle className="w-3.5 h-3.5" />
                Selesai
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-medium">Belum diberikan</span>
            )}
          </div>

          {diberikan && (
            <div className="space-y-4 pt-1 transition-all">
              {/* Tanggal & Tempat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Tanggal Diberikan
                  </label>
                  <input
                    type="date"
                    required={diberikan}
                    value={tanggalDiberikan}
                    onChange={(e) => setTanggalDiberikan(e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-300 bg-white min-h-[48px] focus:ring-2 focus:ring-[#1F4E78]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Fasilitas Kesehatan
                  </label>
                  <select
                    value={tempat}
                    onChange={(e) => setTempat(e.target.value as FacilityType)}
                    className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-300 bg-white min-h-[48px] focus:ring-2 focus:ring-[#1F4E78]"
                  >
                    <option value="Puskesmas">Puskesmas</option>
                    <option value="Posyandu">Posyandu</option>
                    <option value="Rumah Sakit">Rumah Sakit</option>
                    <option value="Klinik">Klinik</option>
                    <option value="Dokter Praktik">Dokter Praktik</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Merek & Batch */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Merek Vaksin & No. Batch (Opsional)
                </label>
                <input
                  type="text"
                  value={merekBatch}
                  onChange={(e) => setMerekBatch(e.target.value)}
                  placeholder="Misal: Synflorix / Prevenar 13, Batch #12930"
                  className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-300 bg-white min-h-[48px]"
                />
              </div>

              {/* Biaya Aktual */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-slate-400" />
                    Biaya Riil Dikeluarkan (Rp)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Estimasi: {formatRupiah(row.min)} – {formatRupiah(row.max)}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={biayaAktual}
                  onChange={(e) => setBiayaAktual(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-300 bg-white min-h-[48px]"
                />
                <p className="text-[11px] text-slate-500">
                  {row.gratis === "Ya"
                    ? "Vaksin program pemerintah di Puskesmas umumnya gratis (Rp 0)."
                    : "Total riil yang dibayar di kasir fasilitas kesehatan."}
                </p>
              </div>

              {/* Asuransi Toggle & Form */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                    <Shield className="w-4 h-4 text-teal-600" />
                    Klaim ke Asuransi Kesehatan?
                  </label>
                  <input
                    type="checkbox"
                    checked={ditanggungAsuransi}
                    onChange={(e) => setDitanggungAsuransi(e.target.checked)}
                    className="w-5 h-5 text-teal-600 rounded-md border-slate-300 cursor-pointer"
                  />
                </div>

                {ditanggungAsuransi && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">
                        Nominal Diajukan (Rp)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={nominalKlaim}
                        onChange={(e) => setNominalKlaim(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white min-h-[42px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">
                        Status Klaim
                      </label>
                      <select
                        value={statusKlaim}
                        onChange={(e) => setStatusKlaim(e.target.value as ClaimStatus)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold min-h-[42px]"
                      >
                        <option value="Belum diajukan">Belum diajukan</option>
                        <option value="Diajukan">Diajukan</option>
                        <option value="Disetujui">Disetujui</option>
                        <option value="Ditolak">Ditolak</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Efek Samping */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  Reaksi / Efek Samping (KIPI)
                </label>
                <input
                  type="text"
                  value={efekSamping}
                  onChange={(e) => setEfekSamping(e.target.value)}
                  placeholder="Misal: Demam 37.8°C selama 1 hari, kompres hangat"
                  className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-300 bg-white min-h-[48px]"
                />
              </div>

              {/* Catatan Tambahan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Catatan dari dokter anak atau evaluasi berat badan..."
                  className="w-full px-4 py-2.5 text-sm rounded-2xl border border-slate-300 bg-white"
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-sm font-semibold rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition min-h-[48px]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-3 text-sm font-bold rounded-2xl bg-[#1F4E78] hover:bg-[#153654] text-white shadow-md transition min-h-[48px]"
            >
              Simpan Catatan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
