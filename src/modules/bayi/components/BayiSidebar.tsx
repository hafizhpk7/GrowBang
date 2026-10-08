import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Wallet,
  BookOpen,
  Settings,
  LayoutGrid
} from "lucide-react";
import { APP_NAME } from "../../../config/app";

export const BAYI_NAV_ITEMS = [
  { path: "/bayi/beranda", label: "Beranda", icon: LayoutDashboard },
  { path: "/bayi/jadwal", label: "Jadwal", icon: CalendarDays },
  { path: "/bayi/biaya", label: "Biaya vaksin", icon: Wallet },
  { path: "/bayi/info-vaksin", label: "Info vaksin", icon: BookOpen }
];

export const BayiSidebar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <aside className="w-64 shrink-0 hidden md:block bg-bg-sidebar border-r border-border p-4 min-h-[calc(100vh-4rem)] flex flex-col justify-between no-print transition-colors">
      <div className="space-y-4">
        {/* Back to Launcher Home Link */}
        <Link
          to="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] text-text-2 hover:text-text hover:bg-surface-sunken transition-colors font-medium border border-border/60 group"
          title="Kembali ke launcher utama"
        >
          <LayoutGrid className="w-4 h-4 text-text-2 group-hover:text-primary transition-colors shrink-0" />
          <span>Beranda utama</span>
        </Link>

        {/* Brand & Badge */}
        <div className="px-3 py-1 flex items-center justify-between border-b border-border/40 pb-3">
          <span className="font-serif font-bold text-[20px] text-text tracking-tight">{APP_NAME}</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary-tint text-primary font-medium border border-primary/20">0–5 thn</span>
        </div>

        {/* Module Nav Links */}
        <nav className="space-y-1" aria-label="Menu Modul Bayi">
          {BAYI_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || (item.path === "/bayi/biaya" && (currentPath === "/bayi/keuangan" || currentPath === "/bayi/asuransi"));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] transition-colors min-h-[44px] cursor-pointer ${
                  isActive
                    ? "bg-primary-tint text-primary-text font-semibold"
                    : "text-text-2 hover:text-text hover:bg-surface-sunken font-medium"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-2">
            <Link
              to="/bayi/pengaturan"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] transition-colors min-h-[44px] cursor-pointer ${
                currentPath === "/bayi/pengaturan"
                  ? "bg-primary-tint text-primary-text font-semibold"
                  : "text-text-2 hover:text-text hover:bg-surface-sunken font-medium"
              }`}
            >
              <Settings className="w-5 h-5 shrink-0" />
              <span>Pengaturan & rujukan</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Quiet Sidebar Note */}
      <div className="p-3 bg-primary-tint rounded-[10px] text-[13px] text-primary-text leading-relaxed font-medium">
        14 imunisasi dasar rutin gratis di Puskesmas dan Posyandu.
      </div>
    </aside>
  );
};
