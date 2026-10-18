import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Download, Trash2, Settings as SettingsIcon, UploadCloud, AlertTriangle } from "lucide-react";
import { MonthSelector } from "../components/MonthSelector";
import { useFinance } from "../state/FinanceContext";
import { summarizeMonth } from "../utils/calculations";
import { monthLabel } from "../utils/dates";
import { exportFinanceToExcel } from "../utils/export";
import { WalletsSection } from "../components/WalletsSection";
import { RecurringSection } from "../components/RecurringSection";

export const PengaturanPage: React.FC = () => {
  const {
    selectedMonth,
    setSelectedMonth,
    config,
    entries,
    setIncludeVaccineCosts,
    deleteAllFinanceData,
    migrationDecision,
    uploadGuestDataToCloud,
    clearGuestData
  } = useFinance();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearGuestConfirm, setShowClearGuestConfirm] = useState(false);

  const summary = summarizeMonth(entries, selectedMonth);
  const hasEntriesInMonth = summary.count > 0;

  const handleExport = () => {
    exportFinanceToExcel(entries, config, selectedMonth);
  };

  return (
    <div className="space-y-6">
      {/* Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-serif font-bold text-text">Pengaturan Modul</h1>
          <p className="text-[13px] text-text-2">
            Opsi integrasi, ekspor laporan, dan pengelolaan data Keuangan Keluarga.
          </p>
        </div>

        <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
      </div>

      {/* Guest Migration Card (When Prompted) */}
      {migrationDecision === "prompt" && (
        <div className="bg-primary-tint border border-primary/30 rounded-[12px] p-5 space-y-3 shadow-card">
          <div className="flex items-start gap-3">
            <UploadCloud className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-[15px] font-bold text-text">Migrasi Data Tamu</h3>
              <p className="text-[13px] text-text-2 leading-relaxed">
                Ada data keuangan tamu di perangkat ini yang belum diunggah ke akun Anda.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              type="button"
              onClick={uploadGuestDataToCloud}
              className="px-4 py-2 rounded-[10px] bg-primary hover:bg-primary-hover text-primary-fg text-[13px] font-medium transition cursor-pointer"
            >
              Unggah ke akun
            </button>
            <button
              type="button"
              onClick={() => setShowClearGuestConfirm(true)}
              className="px-4 py-2 rounded-[10px] bg-surface-sunken hover:bg-border/60 text-text-2 hover:text-text text-[13px] font-medium transition cursor-pointer border border-border"
            >
              Hapus data tamu
            </button>
          </div>
        </div>
      )}

      {/* Integration Option Card */}
      <div className="bg-surface rounded-[12px] border border-border p-5 space-y-4 shadow-card">
        <h2 className="text-[16px] font-serif font-bold text-text">Integrasi Modul Bayi</h2>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <label htmlFor="toggle-vax" className="text-[14px] font-medium text-text cursor-pointer">
              Sertakan biaya vaksin dari modul Bayi
            </label>
            <p className="text-[12px] text-text-2 leading-relaxed">
              Biaya vaksin yang sudah dicatat di modul Bayi ikut dihitung sebagai pengeluaran kategori Kesehatan Anak. Data tidak disalin; hanya dibaca.
            </p>
          </div>

          <input
            id="toggle-vax"
            type="checkbox"
            checked={config.includeVaccineCosts}
            onChange={(e) => setIncludeVaccineCosts(e.target.checked)}
            className="w-5 h-5 rounded border-border text-primary focus:ring-primary cursor-pointer shrink-0 mt-1"
          />
        </div>
      </div>

      {/* Wallets Section */}
      <WalletsSection />

      {/* Recurring Section */}
      <RecurringSection />

      {/* Export Laporan Card */}
      <div className="bg-surface rounded-[12px] border border-border p-5 space-y-4 shadow-card">
        <h2 className="text-[16px] font-serif font-bold text-text">Ekspor Laporan Keuangan</h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-[13px] font-medium text-text">Ekspor Laporan Excel (.xlsx)</p>
            <p className="text-[12px] text-text-2">
              Bulan: <span className="font-semibold text-text">{monthLabel(selectedMonth)}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={!hasEntriesInMonth}
            className={`px-4 py-2.5 rounded-[10px] text-[13px] font-medium transition cursor-pointer flex items-center justify-center gap-2 shrink-0 ${
              hasEntriesInMonth
                ? "bg-primary hover:bg-primary-hover text-primary-fg"
                : "bg-surface-sunken text-text-3 border border-border cursor-not-allowed"
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Unduh bulan ini (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Account Settings Link */}
      <div className="bg-surface rounded-[12px] border border-border p-5 flex items-center justify-between gap-3 shadow-card">
        <div className="space-y-0.5">
          <h3 className="text-[14px] font-medium text-text">Pengaturan Akun & Sinkronisasi</h3>
          <p className="text-[12px] text-text-2">Kelola profil, foto, dan akun Google/Email Anda.</p>
        </div>

        <Link
          to="/pengaturan"
          className="px-4 py-2 rounded-[10px] bg-surface-sunken hover:bg-border/60 text-text text-[13px] font-medium transition cursor-pointer border border-border shrink-0 flex items-center gap-1.5"
        >
          <SettingsIcon className="w-4 h-4 text-text-2" />
          <span>Buka pengaturan akun</span>
        </Link>
      </div>

      {/* Danger Zone */}
      <div className="bg-surface rounded-[12px] border border-danger/30 p-5 space-y-4 shadow-card">
        <h2 className="text-[16px] font-serif font-bold text-danger">Zona Bahaya</h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-[13px] font-medium text-text">Hapus semua data Keuangan Keluarga</p>
            <p className="text-[12px] text-text-2">
              Menghapus seluruh transaksi, anggaran, dan kategori kustom modul keuangan saja.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2.5 rounded-[10px] bg-danger-tint hover:bg-danger/20 text-danger text-[13px] font-medium transition cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus data keuangan</span>
          </button>
        </div>
      </div>

      {/* Modal Confirm Delete All */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
          style={{ backgroundColor: "var(--scrim)" }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-surface rounded-[12px] max-w-[440px] w-full border border-border p-6 space-y-5 shadow-popover"
          >
            <div className="flex items-center gap-3 text-danger">
              <div className="w-10 h-10 rounded-full bg-danger-tint flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-[18px] font-serif font-bold text-text">Konfirmasi Hapus Data</h3>
            </div>

            <p className="text-[13px] text-text-2 leading-relaxed">
              Hapus semua data Keuangan Keluarga? Semua transaksi, kategori kustom, dan anggaran akan dihapus (termasuk dari akun Anda jika Anda sedang masuk). Data Bayi dan akun Anda tidak ikut terhapus. Biaya vaksin dari modul Bayi tetap ada di modul Bayi.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 rounded-[10px] bg-surface-sunken hover:bg-border/60 text-text text-[13px] font-medium transition cursor-pointer min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowDeleteConfirm(false);
                  await deleteAllFinanceData();
                }}
                className="px-4 py-2.5 rounded-[10px] bg-danger hover:bg-danger/90 text-white text-[13px] font-medium transition cursor-pointer min-h-[44px]"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Clear Guest */}
      {showClearGuestConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
          style={{ backgroundColor: "var(--scrim)" }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-surface rounded-[12px] max-w-[440px] w-full border border-border p-6 space-y-5 shadow-popover"
          >
            <h3 className="text-[18px] font-serif font-bold text-text">Hapus Data Tamu?</h3>

            <p className="text-[13px] text-text-2 leading-relaxed">
              Apakah Anda yakin ingin menghapus data keuangan tamu lokal di perangkat ini tanpa mengunggahnya ke akun Anda?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearGuestConfirm(false)}
                className="px-4 py-2.5 rounded-[10px] bg-surface-sunken hover:bg-border/60 text-text text-[13px] font-medium transition cursor-pointer min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowClearGuestConfirm(false);
                  await clearGuestData();
                }}
                className="px-4 py-2.5 rounded-[10px] bg-danger hover:bg-danger/90 text-white text-[13px] font-medium transition cursor-pointer min-h-[44px]"
              >
                Ya, hapus data tamu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
