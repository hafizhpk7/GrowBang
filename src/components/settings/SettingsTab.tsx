import React, { useState, useRef } from "react";
import {
  Settings,
  FileSpreadsheet,
  Download,
  Upload,
  Calendar,
  Printer,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Info,
  CheckCircle2,
  Lock,
  Database
} from "lucide-react";
import { ASSUMPTIONS_AND_NOTES, OFFICIAL_SOURCES } from "../../data/seed";
import { AppState, Profile } from "../../types";
import {
  downloadJsonBackup,
  exportToExcel,
  exportToIcs,
  parseAndValidateBackup
} from "../../utils/export";

interface Props {
  appState: AppState;
  activeProfile: Profile;
  onRestoreState: (state: AppState) => void;
  onClearAllData: () => void;
}

export const SettingsTab: React.FC<Props> = ({
  appState,
  activeProfile,
  onRestoreState,
  onClearAllData
}) => {
  const [restoreStatus, setRestoreStatus] = useState<{ success: boolean; msg: string } | null>(null);
  const [deleteStep, setDeleteStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = parseAndValidateBackup(content);
      if (res.success && res.data) {
        onRestoreState(res.data);
        setRestoreStatus({
          success: true,
          msg: `Berhasil memulihkan ${res.data.profiles.length} profil data imunisasi!`
        });
      } else {
        setRestoreStatus({
          success: false,
          msg: res.error || "Format berkas tidak sesuai."
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleStartDelete = () => {
    setDeleteStep(1);
  };

  const handleConfirmDelete = () => {
    if (deleteStep === 1) {
      setDeleteStep(2);
    } else if (deleteStep === 2) {
      onClearAllData();
      setDeleteStep(0);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-[#1F4E78]" />
            Pengaturan & Ekspor Berkas
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Cadangkan data keluarga, ekspor jadwal ke Excel/Kalender, dan tinjau sumber resmi.
          </p>
        </div>
      </div>

      {/* 2. Export & Import Center */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
          <Download className="w-4 h-4 text-[#1F4E78]" />
          Ekspor & Pencadangan Data
        </h3>

        {restoreStatus && (
          <div
            className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center gap-2.5 ${
              restoreStatus.success
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {restoreStatus.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />}
            <span>{restoreStatus.msg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Export Excel */}
          <button
            type="button"
            onClick={() => exportToExcel(activeProfile)}
            className="p-4 rounded-3xl border border-slate-200/80 bg-slate-50/70 hover:bg-emerald-50/70 hover:border-emerald-300 transition text-left space-y-2 flex flex-col justify-between min-h-[110px]"
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-2xl">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                4 Sheets
              </span>
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900">
                Ekspor Excel (.xlsx)
              </div>
              <p className="text-[11px] text-slate-500">
                Jadwal, Ringkasan, Fungsi & Catatan
              </p>
            </div>
          </button>

          {/* Export ICS Calendar */}
          <button
            type="button"
            onClick={() => exportToIcs(activeProfile)}
            className="p-4 rounded-3xl border border-slate-200/80 bg-slate-50/70 hover:bg-blue-50/70 hover:border-blue-300 transition text-left space-y-2 flex flex-col justify-between min-h-[110px]"
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-2 bg-blue-100 text-blue-800 rounded-2xl">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                .ics
              </span>
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900">
                Ekspor ke Kalender
              </div>
              <p className="text-[11px] text-slate-500">
                Pengingat di Google / Apple Calendar
              </p>
            </div>
          </button>

          {/* Backup JSON */}
          <button
            type="button"
            onClick={() => downloadJsonBackup(appState)}
            className="p-4 rounded-3xl border border-slate-200/80 bg-slate-50/70 hover:bg-teal-50/70 hover:border-teal-300 transition text-left space-y-2 flex flex-col justify-between min-h-[110px]"
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-2 bg-teal-100 text-teal-800 rounded-2xl">
                <Download className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full">
                JSON
              </span>
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900">
                Cadangkan Data (JSON)
              </div>
              <p className="text-[11px] text-slate-500">
                Simpan semua profil & jadwal
              </p>
            </div>
          </button>

          {/* Restore JSON */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-4 rounded-3xl border border-slate-200/80 bg-slate-50/70 hover:bg-amber-50/70 hover:border-amber-300 transition text-left space-y-2 flex flex-col justify-between min-h-[110px]"
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-2xl">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                Restore
              </span>
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900">
                Pulihkan dari JSON
              </div>
              <p className="text-[11px] text-slate-500">
                Impor file cadangan tersimpan
              </p>
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Print Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <div className="text-xs text-slate-600">
            Mencetak lembar jadwal rapi tanpa elemen navigasi browser:
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#1F4E78] hover:bg-[#153654] text-white text-xs font-bold rounded-2xl transition flex items-center justify-center gap-2 shadow-xs min-h-[44px]"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* 3. Security & Privacy Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Client-side Privacy Guarantee */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-1.5">
          <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal-600" />
            Privasi 100% Client-Side
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Data tersimpan eksklusif di memori lokal browser perangkat Anda dan tidak pernah dikirim ke server luar. Aman dan rahasia untuk keluarga Anda.
          </p>
        </div>

        {/* Local Persistence Status */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-1.5">
          <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-[#1F4E78]" />
            Penyimpanan Lokal Aktif
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Menyimpan {appState.profiles.length} profil anak dengan {activeProfile.schedule.length} baris jadwal. Disarankan mengunduh cadangan JSON sebelum mengganti perangkat.
          </p>
        </div>
      </div>

      {/* 4. Notes & Assumptions */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <Info className="w-5 h-5 text-[#1F4E78]" />
          <h3 className="font-extrabold text-base text-slate-900">
            Catatan, Asumsi & Ketentuan Jadwal
          </h3>
        </div>

        <div className="space-y-3">
          {ASSUMPTIONS_AND_NOTES.map((item, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/60 text-xs space-y-1"
            >
              <div className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1F4E78] shrink-0" />
                {item.topik}
              </div>
              <p className="text-slate-600 leading-relaxed pl-4">
                {item.keterangan}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Official Sources */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3.5">
        <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-teal-600" />
          Sumber Rujukan Resmi & Media
        </h3>
        <p className="text-xs text-slate-500">
          Tautan referensi resmi Kementerian Kesehatan RI, IDAI, dan data kisaran harga faskes:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {OFFICIAL_SOURCES.map((src, idx) => (
            <a
              key={idx}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 bg-slate-50 hover:bg-blue-50/80 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 hover:text-[#1F4E78] transition flex items-center justify-between group min-h-[48px]"
            >
              <span className="line-clamp-1">{src.nama}</span>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#1F4E78] shrink-0 ml-2" />
            </a>
          ))}
        </div>
      </div>

      {/* 6. Danger Zone */}
      <div className="bg-rose-50/50 rounded-3xl border border-rose-200 p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2 text-rose-700 font-extrabold text-sm sm:text-base">
          <Trash2 className="w-5 h-5" />
          Zona Bahaya: Reset Total Aplikasi
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Menghapus seluruh profil anak, jadwal yang diubah, dan riwayat klaim dari penyimpanan browser. Pastikan sudah mengunduh cadangan JSON sebelum melanjutkan.
        </p>

        {deleteStep === 0 ? (
          <button
            type="button"
            onClick={handleStartDelete}
            className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold rounded-2xl transition shadow-xs min-h-[44px]"
          >
            Hapus Semua Data Aplikasi
          </button>
        ) : deleteStep === 1 ? (
          <div className="p-4 bg-white rounded-2xl border border-rose-300 space-y-2.5">
            <p className="text-xs sm:text-sm font-extrabold text-rose-600">
              Konfirmasi Tahap 1: Anda yakin ingin menghapus seluruh data aplikasi?
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteStep(0)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 rounded-xl text-slate-700 min-h-[40px]"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs bg-rose-600 text-white font-bold rounded-xl min-h-[40px]"
              >
                Lanjutkan ke Tahap Akhir
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-rose-100 rounded-2xl border border-rose-400 space-y-2.5">
            <p className="text-xs sm:text-sm font-black text-rose-800">
              Konfirmasi Tahap 2: Klik tombol di bawah untuk menghapus permanen sekarang juga.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteStep(0)}
                className="px-4 py-2 text-xs font-semibold bg-slate-200 rounded-xl text-slate-700 min-h-[40px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 text-xs bg-rose-700 hover:bg-rose-800 text-white font-black rounded-xl shadow-sm min-h-[40px]"
              >
                Hapus Permanen & Mulai Ulang
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
