import React, { useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, Sun, Moon, Laptop, ArrowLeft, ChevronRight, Baby, Wallet } from "lucide-react";
import { ShellHeader } from "../components/ShellHeader";

import { useAuth } from "../../context/AuthContext";
import { useTheme, ThemeMode } from "../../context/ThemeContext";
import { PWAInstallButton } from "../../components/common/PWAInstallButton";
import { PAGE_CONTAINER, READING_MAX } from "../../config/layout";
import { LOGIN_EMAIL_DOMAIN } from "../../config/app";
import { getAccountName, emailToUsername } from "../../utils/loginIdentity";

export const GlobalSettingsPage: React.FC = () => {
  const { user, lastSyncTime, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const accountName = getAccountName(user);
  const isInternalDomain = Boolean(user?.email && user.email.endsWith(`@${LOGIN_EMAIL_DOMAIN}`));
  const username = emailToUsername(user?.email);

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col transition-colors">
      <ShellHeader />

      <main className={`flex-1 ${PAGE_CONTAINER} py-8`}>
        <div className={`${READING_MAX} space-y-8`}>
        {/* Header with Back button */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] sm:text-[32px] font-semibold leading-tight text-text tracking-tight">
              Pengaturan & Akun
            </h1>
            <p className="text-[15px] text-text-2 mt-1">
              Kelola profil akun pengguna global, tema aplikasi, dan preferensi umum.
            </p>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface hover:bg-surface-sunken text-text text-[13px] font-medium rounded-[10px] border border-border transition min-h-[40px] shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Beranda utama</span>
          </Link>
        </div>

        {/* 1. User Account Card */}
        <section className="bg-surface rounded-[12px] border border-border p-5 sm:p-6 space-y-5 shadow-[0_2px_10px_-2px_rgba(42,36,32,0.05)]">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-[16px] font-semibold text-text">Profil Akun Pengguna</h2>
            <span className="text-[12px] text-primary font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Tersinkronisasi Otomatis
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={accountName}
                  className="w-12 h-12 rounded-full object-cover shrink-0 border border-border"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-accent-tint text-accent-text flex items-center justify-center font-semibold text-[16px] shrink-0">
                  {accountName.slice(0, 1).toUpperCase()}
                </div>
              )}

              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[15px] text-text truncate">
                    {accountName}
                  </span>
                  <span className="text-[12px] px-2 py-0.5 rounded-[6px] bg-surface-sunken text-text-2 border border-border font-medium">
                    {isInternalDomain ? "Username" : (isGoogleAccount ? "Google" : "Email")}
                  </span>
                </div>
                <p className="text-[13px] text-text-2 truncate">
                  {isInternalDomain ? `Username: ${username}` : user?.email}
                </p>
                <p className="text-[12px] text-text-3">
                  {lastSyncTime ? `Sinkronisasi terakhir: ${lastSyncTime}` : "Tersambung ke Cloud Firestore"}
                </p>
              </div>
            </div>

            {user && (
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="self-start sm:self-auto px-4 py-2 bg-surface hover:bg-danger-tint text-danger text-[13px] font-medium rounded-[10px] border border-border-strong transition min-h-[40px] flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </button>
            )}
          </div>

          {showLogoutConfirm && (
            <div className="p-4 bg-danger-tint/50 border border-danger/30 rounded-[10px] space-y-2">
              <p className="text-[14px] font-semibold text-danger">
                Apakah Anda yakin ingin keluar dari akun?
              </p>
              <p className="text-[13px] text-text-2">
                Data aplikasi tetap tersimpan aman di cloud dan dapat diakses kembali saat masuk.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-3 py-1.5 bg-surface text-text text-[13px] rounded-[8px] border border-border cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="px-3.5 py-1.5 bg-danger text-white text-[13px] font-medium rounded-[8px] cursor-pointer"
                >
                  {isLoggingOut ? "Keluar..." : "Ya, keluar"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 2. Theme Setting (Terang / Gelap / Sistem) */}
        <section className="bg-surface rounded-[12px] border border-border p-5 sm:p-6 space-y-4 shadow-[0_2px_10px_-2px_rgba(42,36,32,0.05)]">
          <div>
            <h2 className="text-[16px] font-semibold text-text">Tema Tampilan Global</h2>
            <p className="text-[13px] text-text-2 mt-0.5">
              Pilih preferensi tampilan warna aplikasi yang nyaman untuk mata Anda.
            </p>
          </div>

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
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] text-[13px] transition cursor-pointer min-h-[36px] ${
                    isSelected
                      ? "bg-surface text-text font-semibold border border-border shadow-2xs"
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

        {/* 3. Link to Module-Specific Settings */}
        <section className="bg-surface rounded-[12px] border border-border p-5 sm:p-6 space-y-3 shadow-[0_2px_10px_-2px_rgba(42,36,32,0.05)]">
          <h2 className="text-[16px] font-semibold text-text">Pengaturan Spesifik Modul</h2>
          <div className="space-y-2 pt-1">
            <Link
              to="/bayi/pengaturan"
              className="flex items-center justify-between p-3.5 rounded-[10px] bg-surface-sunken hover:bg-border/60 border border-border transition cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[8px] bg-primary-tint text-primary flex items-center justify-center shrink-0">
                  <Baby className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-text group-hover:text-primary transition-colors">
                    Pengaturan Modul Bayi
                  </p>
                  <p className="text-[12px] text-text-2">
                    Kelola rujukan medis, ekspor jadwal imunisasi, dan hapus data bayi.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-text-2 group-hover:text-primary transition-colors shrink-0" />
            </Link>

            <Link
              to="/keuangan-keluarga/pengaturan"
              className="flex items-center justify-between p-3.5 rounded-[10px] bg-surface-sunken hover:bg-border/60 border border-border transition cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[8px] bg-accent-tint text-accent-text flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-text group-hover:text-primary transition-colors">
                    Pengaturan Keuangan Keluarga
                  </p>
                  <p className="text-[12px] text-text-2">
                    Kelola opsi integrasi biaya vaksin, ekspor laporan, dan data keuangan.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-text-2 group-hover:text-primary transition-colors shrink-0" />
            </Link>
          </div>
        </section>

        {/* 4. PWA Installation Card */}
        <section className="bg-surface rounded-[12px] border border-border p-5 sm:p-6 space-y-3 shadow-[0_2px_10px_-2px_rgba(42,36,32,0.05)]">
          <h2 className="text-[16px] font-semibold text-text">Aplikasi Perangkat (PWA)</h2>
          <p className="text-[13px] text-text-2 leading-relaxed">
            Aplikasi ini mendukung Progressive Web App (PWA) sehingga dapat diinstal di beranda HP atau Komputer Anda dan diakses secara offline.
          </p>
          <div className="pt-1">
            <PWAInstallButton />
          </div>
        </section>
        </div>
      </main>


    </div>
  );
};
