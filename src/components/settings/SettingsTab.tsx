import React, { useState } from "react";
import { User as UserIcon, LogOut, Trash2, ExternalLink, Sun, Moon, Laptop } from "lucide-react";
import { ASSUMPTIONS_AND_NOTES, OFFICIAL_SOURCES } from "../../data/seed";
import { AppState, Profile } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useTheme, ThemeMode } from "../../context/ThemeContext";

interface Props {
  appState: AppState;
  activeProfile: Profile;
  onClearAllData: () => void;
}

export const SettingsTab: React.FC<Props> = ({
  appState,
  activeProfile,
  onClearAllData
}) => {
  const { user, lastSyncTime, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const [deleteStep, setDeleteStep] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (err) {
      console.error("Gagal keluar:", err);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const providerId = user?.providerData?.[0]?.providerId || "";
  const isGoogleAccount = providerId === "google.com";

  return (
    <div className="space-y-8 animate-fadeIn max-w-[960px]">
      {/* 1. Header */}
      <div>
        <h1 className="text-[28px] sm:text-[32px] font-medium leading-tight text-text">
          Pengaturan & akun
        </h1>
        <p className="text-[15px] text-text-2 mt-1">
          Kelola profil pengguna, tema tampilan, rujukan medis resmi, dan penyimpanan data.
        </p>
      </div>

      {/* 2. User Account Card */}
      <section className="bg-surface rounded-[12px] border border-border p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-[16px] font-medium text-text">Profil pengguna</h2>
          <span className="text-[12px] text-primary font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Tersinkronisasi otomatis
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "Pengguna"}
                className="w-12 h-12 rounded-full object-cover shrink-0 border border-border"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-accent-tint text-accent-text flex items-center justify-center font-medium text-[16px] shrink-0">
                {(user?.displayName || user?.email || "U").slice(0, 1).toUpperCase()}
              </div>
            )}

            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-[15px] text-text truncate">
                  {user?.displayName || "Orang Tua"}
                </span>
                <span className="text-[12px] px-2 py-0.5 rounded-[6px] bg-surface-sunken text-text-2 border border-border">
                  {isGoogleAccount ? "Google" : "Email"}
                </span>
              </div>
              <p className="text-[13px] text-text-2 truncate">{user?.email}</p>
              <p className="text-[12px] text-text-3">
                {lastSyncTime ? `Sinkronisasi terakhir: ${lastSyncTime}` : "Tersambung ke Cloud Firestore"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="self-start sm:self-auto px-4 py-2 bg-surface hover:bg-surface-sunken text-danger text-[13px] font-medium rounded-[10px] border border-border-strong transition min-h-[40px] flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>

        {showLogoutConfirm && (
          <div className="p-4 bg-danger-tint/50 border border-danger/30 rounded-[10px] space-y-2">
            <p className="text-[14px] font-medium text-danger">
              Apakah Anda yakin ingin keluar dari akun?
            </p>
            <p className="text-[13px] text-text-2">
              Data imunisasi anak tetap tersimpan aman di cloud dan dapat diakses kembali saat masuk.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-3 py-1.5 bg-surface text-text text-[13px] rounded-[8px] border border-border"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-3.5 py-1.5 bg-danger text-white text-[13px] font-medium rounded-[8px]"
              >
                {isLoggingOut ? "Keluar..." : "Ya, keluar"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3. Theme Setting (Terang / Gelap / Sistem) */}
      <section className="bg-surface rounded-[12px] border border-border p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-[16px] font-medium text-text">Tema tampilan</h2>
          <p className="text-[13px] text-text-2 mt-0.5">
            Pilih preferensi tampilan warna aplikasi yang nyaman untuk mata Anda.
          </p>
        </div>

        {/* Segmented control: container var(--surface-sunken), radius 10 per Section 5 */}
        <div className="inline-flex bg-surface-sunken p-1 rounded-[10px] border border-border">
          {[
            { id: "light", label: "Terang", icon: Sun },
            { id: "dark", label: "Gelap", icon: Moon },
            { id: "system", label: "Sistem", icon: Laptop }
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = theme === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTheme(item.id as ThemeMode)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] text-[13px] transition cursor-pointer ${
                  isSelected
                    ? "bg-surface text-text font-medium border border-border"
                    : "text-text-2 hover:text-text border border-transparent"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Data Storage & Privacy Note */}
      <section className="bg-surface rounded-[12px] border border-border p-5 sm:p-6 space-y-3">
        <h2 className="text-[16px] font-medium text-text">Data & privasi keluarga</h2>
        <p className="text-[13px] text-text-2 leading-relaxed">
          Menyimpan {appState.profiles.length} profil anak dengan {activeProfile.schedule.length} jadwal vaksin. Informasi anak diisolasi per akun pengguna menggunakan Firebase Security Rules dan tetap dapat diakses secara offline melalui Progressive Web App (PWA).
        </p>
      </section>

      {/* 5. Medical References */}
      <section className="bg-surface rounded-[12px] border border-border p-5 sm:p-6 space-y-4">
        <h2 className="text-[16px] font-medium text-text">Rujukan medis resmi</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ASSUMPTIONS_AND_NOTES.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-[10px] bg-surface-sunken/60 border border-border text-[13px] space-y-1">
              <div className="font-medium text-text">{item.topik}</div>
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

      {/* 6. Danger Zone */}
      <section className="rounded-[12px] border border-danger/30 p-5 sm:p-6 space-y-3 bg-danger-tint/30">
        <div className="flex items-center gap-2 text-danger font-medium text-[16px]">
          <Trash2 className="w-4 h-4" />
          <span>Hapus semua data</span>
        </div>
        <p className="text-[13px] text-text-2 leading-relaxed">
          Tindakan ini akan mengosongkan riwayat jadwal dan mereset profil anak di perangkat ini ke setelan awal.
        </p>

        {deleteStep === 0 && (
          <button
            type="button"
            onClick={handleStartDelete}
            className="px-4 py-2 bg-surface hover:bg-danger-tint text-danger text-[13px] font-medium rounded-[10px] border border-danger/40 transition min-h-[40px] cursor-pointer"
          >
            Hapus data aplikasi
          </button>
        )}

        {deleteStep === 1 && (
          <div className="p-3.5 bg-surface rounded-[10px] border border-danger/40 space-y-2">
            <p className="text-[13px] font-medium text-danger">
              Peringatan tahap 1: Anda yakin ingin menghapus data seluruh anak?
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteStep(0)}
                className="px-3 py-1.5 text-text bg-surface-sunken rounded-[8px] text-[13px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 bg-danger text-white font-medium rounded-[8px] text-[13px]"
              >
                Lanjutkan
              </button>
            </div>
          </div>
        )}

        {deleteStep === 2 && (
          <div className="p-3.5 bg-surface rounded-[10px] border border-danger space-y-2">
            <p className="text-[13px] font-medium text-danger">
              Konfirmasi terakhir: Data yang dihapus tidak dapat dipulihkan!
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteStep(0)}
                className="px-3 py-1.5 text-text bg-surface-sunken rounded-[8px] text-[13px]"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 bg-danger text-white font-medium rounded-[8px] text-[13px]"
              >
                Ya, hapus permanen
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
