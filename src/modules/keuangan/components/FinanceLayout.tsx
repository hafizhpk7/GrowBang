import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Receipt,
  PiggyBank,
  Target,
  Settings,
  Plus,
  LayoutGrid
} from "lucide-react";
import { TransactionModal } from "./TransactionModal";
import { PAGE_CONTAINER } from "../../../config/layout";

export const FinanceLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const pathname = location.pathname;

  const isRingkasan = pathname.includes("/ringkasan");
  const isTransaksi = pathname.includes("/transaksi");
  const isAnggaran = pathname.includes("/anggaran");
  const isTabungan = pathname.includes("/tabungan");
  const isPengaturan = pathname.includes("/pengaturan");

  const showCatatBtn = isRingkasan || isTransaksi;

  const navItems = [
    {
      id: "ringkasan",
      label: "Ringkasan",
      path: "/keuangan-keluarga/ringkasan",
      icon: BarChart3,
      isActive: isRingkasan
    },
    {
      id: "transaksi",
      label: "Transaksi",
      path: "/keuangan-keluarga/transaksi",
      icon: Receipt,
      isActive: isTransaksi
    },
    {
      id: "anggaran",
      label: "Anggaran",
      path: "/keuangan-keluarga/anggaran",
      icon: PiggyBank,
      isActive: isAnggaran
    },
    {
      id: "tabungan",
      label: "Tabungan",
      path: "/keuangan-keluarga/tabungan",
      icon: Target,
      isActive: isTabungan
    },
    {
      id: "pengaturan",
      label: "Pengaturan",
      path: "/keuangan-keluarga/pengaturan",
      icon: Settings,
      isActive: isPengaturan
    }
  ];

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col transition-colors">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-surface border-b border-border sticky top-0 z-30 transition-colors no-print">
        <div className="px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center justify-center w-9 h-9 rounded-[10px] bg-surface-sunken hover:bg-border text-text-2 hover:text-text transition cursor-pointer border border-border"
              aria-label="Kembali ke Beranda utama"
              title="Kembali ke Beranda utama"
            >
              <LayoutGrid className="w-5 h-5" />
            </Link>
            <span className="font-serif font-bold text-[17px] text-text">
              Keuangan Keluarga
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate("/keuangan-keluarga/pengaturan")}
            className="p-2 rounded-[10px] bg-surface-sunken hover:bg-border/60 text-text-2 hover:text-text transition cursor-pointer border border-border"
            aria-label="Pengaturan Keuangan Keluarga"
            title="Pengaturan Keuangan Keluarga"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 w-full flex">
        {/* Desktop Sidebar / Tablet Icon Rail */}
        <aside className="w-[72px] lg:w-64 shrink-0 hidden md:flex flex-col justify-between bg-bg-sidebar border-r border-border p-2.5 lg:p-4 sticky top-0 self-start h-screen overflow-y-auto no-print transition-colors">
          <div className="space-y-4">
            <Link
              to="/"
              className="flex items-center justify-center lg:justify-start gap-2.5 px-2.5 lg:px-3 py-2 rounded-[10px] text-[13px] text-text-2 hover:text-text hover:bg-surface-sunken transition-colors font-medium border border-border/60 group"
              title="Beranda utama"
              aria-label="Beranda utama"
            >
              <LayoutGrid className="w-4 h-4 text-text-2 group-hover:text-primary transition-colors shrink-0" />
              <span className="hidden lg:inline">Beranda utama</span>
            </Link>

            <div className="pt-2 border-t border-border">
              <p className="hidden lg:block px-3 text-[11px] font-semibold text-text-3 uppercase tracking-wider mb-2">
                Keuangan Keluarga
              </p>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      title={item.label}
                      aria-label={item.label}
                      className={`flex items-center justify-center lg:justify-start gap-2.5 px-2.5 lg:px-3 py-2.5 rounded-[10px] text-[13px] font-medium transition cursor-pointer ${
                        item.isActive
                          ? "bg-primary-tint text-primary-text border border-primary/20"
                          : "text-text-2 hover:text-text hover:bg-surface-sunken"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="hidden lg:inline">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {showCatatBtn && (
            <div className="pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                title="Catat transaksi"
                aria-label="Catat transaksi"
                className="w-full py-2.5 px-2 lg:px-3 rounded-[10px] bg-primary hover:bg-primary-hover text-primary-fg text-[13px] font-medium transition cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">Catat transaksi</span>
              </button>
            </div>
          )}
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <div className={`${PAGE_CONTAINER} p-4 sm:p-6 pb-24 md:pb-8`}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Floating Action Button */}
      {showCatatBtn && (
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          aria-label="Catat transaksi"
          title="Catat transaksi"
          className="md:hidden fixed right-4 bottom-20 z-40 w-12 h-12 rounded-full bg-primary hover:bg-primary-hover text-primary-fg flex items-center justify-center shadow-lg transition cursor-pointer border border-primary-hover"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border px-2 py-1.5 flex items-center justify-around no-print shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-[8px] min-h-[44px] min-w-[44px] text-[11px] font-medium transition cursor-pointer ${
                item.isActive ? "text-primary font-bold" : "text-text-2 hover:text-text"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Create Transaction Modal */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};
