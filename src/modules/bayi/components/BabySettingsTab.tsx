import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, ExternalLink, Download, Calendar, FileSpreadsheet, RotateCcw, Settings, ChevronRight } from "lucide-react";
import { ASSUMPTIONS_AND_NOTES, OFFICIAL_SOURCES } from "../../../data/seed";
import { useBayi } from "../context/BayiContext";
import { exportToExcel, exportToIcs, downloadJsonBackup } from "../../../utils/export";

export const BabySettingsTab: React.FC = () => {
  const { appState, activeProfile, resetSchedule, clearAllBabyData } = useBayi();

  const [deleteStep, setDeleteStep] = useState(0);

  const handleStartDelete = () => {
    setDeleteStep(1);
  };

  const handleConfirmDelete = () => {
    if (deleteStep === 1) {
      setDeleteStep(2);
    } else if (deleteStep === 2) {
      clearAllBabyData();
      setDeleteStep(0);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-[960px]">
      {/* 1. Header & Link to Global Settings */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-semibold leading-tight text-text tracking-tight">
            Pengaturan Modul Bayi
          </h1>
          <p className="text-[15px] text-text-2 mt-1">
            Ekspor data imunisasi, rujukan medis resmi, reset jadwal, dan kelola data modul Bayi.
          </p>
        </div>

        <Link
          to="/pengaturan"
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface hover:bg-surface-sunken text-text text-[13px] font-medium rounded-[10px] border border-border transition min-h-[40px] shrink-0 self-start sm:self-auto"
        >
          <Settings className="w-4 h-4 text-text-2" />
          <span>Pengaturan Akun Global</span>
          <ChevronRight className="w-3.5 h-3.5 text-text-2" />
        </Link>
      </div>

      {/* 2. Data Overview & Export Card */}
      <section className="bg-surface rounded-[12px] border border-border p-5 sm:p-6 space-y-4 shadow-[0_2px_10px_-2px_rgba(42,36,32,0.05)]">
        <h2 className="text-[16px] font-semibold text-text">Ekspor & Cadangan Data Imunisasi</h2>
        <p className="text-[13px] text-text-2 leading-relaxed">
          Menyimpan {appState.profiles.length} profil anak dengan {activeProfile?.schedule.length || 0} jadwal vaksin. Unduh data dalam format Excel, Kalender (.ics), atau JSON.
        </p>

        {activeProfile && (
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => exportToExcel(activeProfile)}
              className="px-3.5 py-2 bg-surface hover:bg-surface-sunken text-text text-[13px] font-medium rounded-[10px] border border-border transition flex items-center gap-2 min-h-[40px] cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => exportToIcs(activeProfile)}
              className="px-3.5 py-2 bg-surface hover:bg-surface-sunken text-text text-[13px] font-medium rounded-[10px] border border-border transition flex items-center gap-2 min-h-[40px] cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-primary" />
              <span>Ekspor Kalender (.ics)</span>
            </button>

            <button
              type="button"
              onClick={() => downloadJsonBackup(appState)}
              className="px-3.5 py-2 bg-surface hover:bg-surface-sunken text-text text-[13px] font-medium rounded-[10px] border border-border transition flex items-center gap-2 min-h-[40px] cursor-pointer"
            >
              <Download className="w-4 h-4 text-primary" />
              <span>Cadangan JSON</span>
            </button>
          </div>
        )}
      </section>

      {/* 3. Reset Schedule Options */}
      <section className="bg-surface rounded-[12px] border border-border p-5 sm:p-6 space-y-3 shadow-[0_2px_10px_-2px_rgba(42,36,32,0.05)]">
        <h2 className="text-[16px] font-semibold text-text">Reset Jadwal Imunisasi</h2>
        <p className="text-[13px] text-text-2 leading-relaxed">
          Mengembalikan daftar jadwal vaksin ke setelan bawaan rekomendasi IDAI tanpa menghapus riwayat pemberian yang telah dicatat.
        </p>
        <div className="pt-1">
          <button
            type="button"
            onClick={resetSchedule}
            className="px-4 py-2 bg-surface hover:bg-surface-sunken text-text text-[13px] font-medium rounded-[10px] border border-border-strong transition min-h-[40px] flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-text-2" />
            <span>Reset Jadwal ke Standar IDAI</span>
          </button>
        </div>
      </section>

      {/* 4. Medical References */}
      <section className="bg-surface rounded-[12px] border border-border p-5 sm:p-6 space-y-4 shadow-[0_2px_10px_-2px_rgba(42,36,32,0.05)]">
        <h2 className="text-[16px] font-semibold text-text">Rujukan Medis Resmi</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ASSUMPTIONS_AND_NOTES.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-[10px] bg-surface-sunken/60 border border-border text-[13px] space-y-1">
              <div className="font-semibold text-text">{item.topik}</div>
              <p className="text-text-2 leading-relaxed">{item.keterangan}</p>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-border flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-text-2">Sumber rujukan:</span>
          {OFFICIAL_SOURCES.map((source, idx) => (
            <a
              key={idx}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-surface-sunken hover:bg-border text-text text-[12px] border border-border transition"
            >
              <span>{source.nama}</span>
              <ExternalLink className="w-3 h-3 text-text-2" />
            </a>
          ))}
        </div>
      </section>

      {/* 5. Danger Zone: Delete Baby Data */}
      <section className="rounded-[12px] border border-danger/30 p-5 sm:p-6 space-y-3 bg-danger-tint/30 shadow-[0_2px_10px_-2px_rgba(42,36,32,0.05)]">
        <div className="flex items-center gap-2 text-danger font-semibold text-[16px]">
          <Trash2 className="w-4 h-4" />
          <span>Hapus Semua Data Bayi</span>
        </div>
        <p className="text-[13px] text-text-2 leading-relaxed">
          Tindakan ini akan mengosongkan data profil dan jadwal anak pada modul Bayi. Data akun dan modul lainnya tidak akan terhapus.
        </p>

        {deleteStep === 0 && (
          <button
            type="button"
            onClick={handleStartDelete}
            className="px-4 py-2 bg-surface hover:bg-danger-tint text-danger text-[13px] font-medium rounded-[10px] border border-danger/40 transition min-h-[40px] cursor-pointer"
          >
            Hapus Data Modul Bayi
          </button>
        )}

        {deleteStep === 1 && (
          <div className="p-3.5 bg-surface rounded-[10px] border border-danger/40 space-y-2">
            <p className="text-[13px] font-semibold text-danger">
              Peringatan tahap 1: Anda yakin ingin menghapus data profil seluruh anak di modul Bayi?
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteStep(0)}
                className="px-3 py-1.5 text-text bg-surface-sunken rounded-[8px] text-[13px] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 bg-danger text-white font-medium rounded-[8px] text-[13px] cursor-pointer"
              >
                Lanjutkan
              </button>
            </div>
          </div>
        )}

        {deleteStep === 2 && (
          <div className="p-3.5 bg-surface rounded-[10px] border border-danger space-y-2">
            <p className="text-[13px] font-semibold text-danger">
              Konfirmasi terakhir: Data profil dan jadwal anak pada modul Bayi akan terhapus secara permanen!
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteStep(0)}
                className="px-3 py-1.5 text-text bg-surface-sunken rounded-[8px] text-[13px] cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 bg-danger text-white font-medium rounded-[8px] text-[13px] cursor-pointer"
              >
                Ya, hapus data Bayi
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
