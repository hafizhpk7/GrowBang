import React, { useState } from "react";
import { X, Calendar, Building2, Tag, Receipt, FileText } from "lucide-react";
import { ClaimStatus, FacilityType, ScheduleRow, VaccineRecord } from "../../types";

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

  const [diberikan, setDiberikan] = useState<boolean>(record?.diberikan ?? true);
  const [tanggalDiberikan, setTanggalDiberikan] = useState<string>(
    record?.tanggalDiberikan || todayStr
  );
  const [tempat, setTempat] = useState<FacilityType>(
    record?.tempat || (row.gratis === "Ya" ? "Puskesmas" : "Klinik")
  );
  const [merekBatch, setMerekBatch] = useState<string>(record?.merekBatch || "");
  const [biayaAktual, setBiayaAktual] = useState<number | string>(
    record?.biayaAktual ?? (row.gratis === "Ya" ? 0 : row.min)
  );
  const [catatan, setCatatan] = useState<string>(record?.catatan || "");
  const [ditanggungAsuransi, setDitanggungAsuransi] = useState<boolean>(
    record?.ditanggungAsuransi ?? false
  );
  const [nominalKlaim, setNominalKlaim] = useState<number | string>(
    record?.nominalKlaim ?? (row.gratis === "Ya" ? 0 : row.min)
  );
  const [statusKlaim, setStatusKlaim] = useState<ClaimStatus>(
    record?.statusKlaim || "Belum diajukan"
  );

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
      ditanggungAsuransi: diberikan ? ditanggungAsuransi : false,
      nominalKlaim:
        diberikan && ditanggungAsuransi ? Number(nominalKlaim) || 0 : undefined,
      statusKlaim: diberikan && ditanggungAsuransi ? statusKlaim : undefined
    };

    onSave(updatedRecord);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: "var(--scrim)" }}
      role="dialog"
      aria-modal="true"
    >
      {/* Mobile bottom sheet (rounded 16 16 0 0), desktop centered dialog 480px */}
      <div
        className="bg-surface rounded-t-[16px] sm:rounded-[12px] max-w-[480px] w-full border border-border overflow-hidden flex flex-col max-h-[90vh] pb-[max(env(safe-area-inset-bottom),1rem)] sm:pb-0 animate-fadeIn"
        style={{ boxShadow: "var(--shadow-popover)" }}
      >
        {/* Mobile handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 bg-border-strong rounded-full" />
        </div>

        {/* Header */}
        <div className="p-4 border-b border-border flex items-start justify-between">
          <div>
            <h3 className="text-[18px] font-serif font-medium text-text">
              Tandai sudah diberikan
            </h3>
            <p className="text-[13px] text-text-2">
              {row.vaksin} · jadwal anjuran {row.usia} ({dueDateStr})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-text-2 hover:text-text rounded-[10px] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-[14px]">
          {/* Status Switch */}
          <div className="flex items-center justify-between p-3 bg-surface-sunken rounded-[10px]">
            <div>
              <p className="font-medium text-text">Status pemberian vaksin</p>
              <p className="text-[13px] text-text-2">
                {diberikan ? "Sudah disuntikkan kepada anak" : "Belum diberikan"}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={diberikan}
                onChange={(e) => setDiberikan(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-track peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          {diberikan && (
            <>
              {/* Tanggal & Tempat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[13px] font-medium text-text">
                    Tanggal diberikan
                  </label>
                  <input
                    type="date"
                    required
                    value={tanggalDiberikan}
                    onChange={(e) => setTanggalDiberikan(e.target.value)}
                    className="w-full px-3 py-2 text-[15px] rounded-[10px] border border-border-strong bg-surface text-text min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[13px] font-medium text-text">
                    Tempat faskes
                  </label>
                  <select
                    value={tempat}
                    onChange={(e) => setTempat(e.target.value as FacilityType)}
                    className="w-full px-3 py-2 text-[15px] rounded-[10px] border border-border-strong bg-surface text-text min-h-[44px]"
                  >
                    <option value="Puskesmas">Puskesmas</option>
                    <option value="Posyandu">Posyandu</option>
                    <option value="Klinik">Klinik</option>
                    <option value="Rumah Sakit">Rumah Sakit</option>
                    <option value="Dokter Praktik">Dokter Praktik</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Biaya Riil */}
              <div className="space-y-1">
                <label className="text-[13px] font-medium text-text">
                  Biaya yang dibayarkan (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-2 text-[14px]">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    inputMode="numeric"
                    value={biayaAktual}
                    onChange={(e) => setBiayaAktual(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-[15px] font-tabular rounded-[10px] border border-border-strong bg-surface text-text min-h-[44px]"
                    placeholder="0 jika gratis di Puskesmas"
                  />
                </div>
                <p className="text-[12px] text-text-2">
                  {row.gratis === "Ya"
                    ? "Vaksin ini termasuk program pemerintah (Rp 0 di Puskesmas/Posyandu)."
                    : "Estimasi normal: Rp " + row.min.toLocaleString("id-ID") + " – Rp " + row.max.toLocaleString("id-ID")}
                </p>
              </div>

              {/* Merek & Batch */}
              <div className="space-y-1">
                <label className="text-[13px] font-medium text-text">
                  Merek / No. Batch (opsional)
                </label>
                <input
                  type="text"
                  value={merekBatch}
                  onChange={(e) => setMerekBatch(e.target.value)}
                  placeholder="Contoh: Bio Farma, Sanofi, Hexaxim #B123"
                  className="w-full px-3 py-2 text-[15px] rounded-[10px] border border-border-strong bg-surface text-text min-h-[44px]"
                />
              </div>

              {/* Catatan */}
              <div className="space-y-1">
                <label className="text-[13px] font-medium text-text">
                  Catatan dokter / reaksi (opsional)
                </label>
                <input
                  type="text"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Contoh: Demam ringan 1 hari, kompres hangat"
                  className="w-full px-3 py-2 text-[15px] rounded-[10px] border border-border-strong bg-surface text-text min-h-[44px]"
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[14px] font-medium text-text hover:bg-surface-sunken rounded-[10px] border border-border-strong transition min-h-[44px] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-[14px] font-medium bg-primary hover:bg-primary-hover text-primary-fg rounded-[10px] transition min-h-[44px] cursor-pointer"
            >
              Selesai
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
