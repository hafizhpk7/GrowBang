import React, { useState } from "react";
import { X, PlusCircle, AlertCircle } from "lucide-react";
import { Gratis, ScheduleRow, Status } from "../../types";

interface Props {
  isOpen: boolean;
  rowToEdit?: ScheduleRow | null;
  onClose: () => void;
  onSave: (row: ScheduleRow) => void;
  onDelete?: (id: string) => void;
}

export const CustomRowModal: React.FC<Props> = ({
  isOpen,
  rowToEdit,
  onClose,
  onSave,
  onDelete
}) => {
  if (!isOpen) return null;

  const [tahun, setTahun] = useState<1 | 2 | 3 | 4 | 5>(rowToEdit?.tahun || 1);
  const [usia, setUsia] = useState(rowToEdit?.usia || "");
  const [bln, setBln] = useState<number>(rowToEdit?.bln ?? 0);
  const [vaksin, setVaksin] = useState(rowToEdit?.vaksin || "");
  const [status, setStatus] = useState<Status>(rowToEdit?.status || "Pilihan");
  const [gratis, setGratis] = useState<Gratis>(rowToEdit?.gratis || "Tidak");
  const [masuk, setMasuk] = useState<boolean>(rowToEdit?.masuk ?? true);
  const [min, setMin] = useState<number>(rowToEdit?.min ?? 300000);
  const [max, setMax] = useState<number>(rowToEdit?.max ?? 600000);
  const [catatan, setCatatan] = useState(rowToEdit?.catatan || "");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaksin.trim()) {
      setErrorMsg("Nama vaksin wajib diisi.");
      return;
    }
    if (!usia.trim()) {
      setErrorMsg("Usia jadwal wajib diisi (contoh: '6 bln' atau '24 bln').");
      return;
    }

    const row: ScheduleRow = {
      id: rowToEdit?.id || `custom-${Date.now()}`,
      tahun,
      usia: usia.trim(),
      bln: Number(bln) || 0,
      vaksin: vaksin.trim(),
      ref: rowToEdit?.ref || "kustom",
      status,
      gratis,
      masuk,
      min: Number(min) || 0,
      max: Number(max) || 0,
      catatan: catatan.trim(),
      isCustom: true
    };

    onSave(row);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      {/* Responsive Bottom Sheet / Centered Modal */}
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] pb-[max(env(safe-area-inset-bottom),0.5rem)] sm:pb-0"
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Grab Bar */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1F4E78]/10 text-[#1F4E78] flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                {rowToEdit ? "Ubah Baris Vaksin Tambahan" : "Tambah Vaksin Kustom"}
              </h3>
              <p className="text-xs text-slate-500">
                Tambahkan vaksin di luar jadwal standar rekomendasi
              </p>
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
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-2xl border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Nama Vaksin <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={vaksin}
              onChange={(e) => setVaksin(e.target.value)}
              placeholder="Contoh: Dengue (Qdenga) / Tifoid Booster"
              className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-300 bg-white min-h-[48px] focus:ring-2 focus:ring-[#1F4E78]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Kelompok Tahun
              </label>
              <select
                value={tahun}
                onChange={(e) => setTahun(Number(e.target.value) as any)}
                className="w-full px-3 py-3 text-sm rounded-2xl border border-slate-300 bg-white min-h-[48px]"
              >
                <option value={1}>Tahun 1 (0–12 bln)</option>
                <option value={2}>Tahun 2 (12–24 bln)</option>
                <option value={3}>Tahun 3 (24–36 bln)</option>
                <option value={4}>Tahun 4 (36–48 bln)</option>
                <option value={5}>Tahun 5 (48–60 bln)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Label Usia <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={usia}
                onChange={(e) => setUsia(e.target.value)}
                placeholder="Mis: 12 bln"
                className="w-full px-3 py-3 text-sm rounded-2xl border border-slate-300 bg-white min-h-[48px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Bulan ke-
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={bln}
                onChange={(e) => setBln(Number(e.target.value))}
                className="w-full px-3 py-3 text-sm rounded-2xl border border-slate-300 bg-white min-h-[48px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Kategori Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="w-full px-3 py-3 text-sm rounded-2xl border border-slate-300 bg-white min-h-[48px]"
              >
                <option value="Wajib">Wajib (Program Pemerintah)</option>
                <option value="Pilihan">Pilihan (Anjuran IDAI)</option>
                <option value="Kondisional">Kondisional (Tertentu/Endemis)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Tersedia Gratis di Faskes?
              </label>
              <select
                value={gratis}
                onChange={(e) => setGratis(e.target.value as Gratis)}
                className="w-full px-3 py-3 text-sm rounded-2xl border border-slate-300 bg-white min-h-[48px]"
              >
                <option value="Tidak">Tidak (Bayar Sendiri)</option>
                <option value="Ya">Ya (Puskesmas / BPJS)</option>
                <option value="Sebagian">Sebagian (Program Khusus)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Biaya Swasta Min (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="10000"
                value={min}
                onChange={(e) => setMin(Number(e.target.value))}
                className="w-full px-4 py-3 text-sm rounded-2xl border border-blue-300/60 bg-blue-50/20 text-[#0000FF] font-mono font-bold min-h-[48px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Biaya Swasta Maks (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="10000"
                value={max}
                onChange={(e) => setMax(Number(e.target.value))}
                className="w-full px-4 py-3 text-sm rounded-2xl border border-blue-300/60 bg-blue-50/20 text-[#0000FF] font-mono font-bold min-h-[48px]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <input
              type="checkbox"
              id="masuk-total-custom"
              checked={masuk}
              onChange={(e) => setMasuk(e.target.checked)}
              className="w-5 h-5 text-[#1F4E78] rounded-md cursor-pointer"
            />
            <label htmlFor="masuk-total-custom" className="text-xs font-bold text-slate-800 cursor-pointer">
              Sertakan dalam perhitungan Total Biaya ("Masuk total?")
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Catatan Khusus
            </label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan indikasi, anjuran dokter spesialis anak..."
              className="w-full px-4 py-2.5 text-sm rounded-2xl border border-slate-300 bg-white"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-100">
            {rowToEdit && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Hapus baris vaksin kustom ini?")) {
                    onDelete(rowToEdit.id);
                  }
                }}
                className="px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-2xl transition min-h-[44px]"
              >
                Hapus Baris
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
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
                Simpan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
