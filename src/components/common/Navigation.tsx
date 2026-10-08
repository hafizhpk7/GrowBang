import React from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Wallet,
  BookOpen,
  Settings
} from "lucide-react";

export type TabId = "beranda" | "jadwal" | "keuangan" | "info-vaksin" | "pengaturan" | "biaya" | "asuransi";

export interface DesktopSidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const PRIMARY_TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "beranda", label: "Beranda", icon: LayoutDashboard },
  { id: "jadwal", label: "Jadwal", icon: CalendarDays },
  { id: "keuangan", label: "Keuangan", icon: Wallet },
  { id: "info-vaksin", label: "Info vaksin", icon: BookOpen }
];

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <aside className="w-64 shrink-0 hidden md:block bg-bg-sidebar border-r border-border p-4 min-h-[calc(100vh-4rem)] flex flex-col justify-between no-print transition-colors">
      <div className="space-y-4">
        <div className="px-3 py-1 flex items-center justify-between">
          <span className="font-serif font-bold text-[20px] text-text tracking-tight">GrowBang</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary-tint text-primary font-medium border border-primary/20">0–5 thn</span>
        </div>
        <nav className="space-y-1" aria-label="Menu Utama">
          {PRIMARY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              activeTab === tab.id ||
              (tab.id === "keuangan" && (activeTab === "biaya" || activeTab === "asuransi"));
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] transition-colors min-h-[44px] cursor-pointer ${
                  isActive
                    ? "bg-primary-tint text-primary-text font-medium"
                    : "text-text-2 hover:text-text hover:bg-surface-sunken"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div className="pt-2">
            <button
              type="button"
              onClick={() => onTabChange("pengaturan")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] transition-colors min-h-[44px] cursor-pointer ${
                activeTab === "pengaturan"
                  ? "bg-primary-tint text-primary-text font-medium"
                  : "text-text-2 hover:text-text hover:bg-surface-sunken"
              }`}
            >
              <Settings className="w-5 h-5 shrink-0" />
              <span>Pengaturan & akun</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Section 6.6 Quiet Sidebar Note: no sparkle icon, primary-tint bg */}
      <div className="p-3 bg-primary-tint rounded-[10px] text-[13px] text-primary-text leading-relaxed">
        14 imunisasi dasar rutin gratis di Puskesmas dan Posyandu.
      </div>
    </aside>
  );
};

export const MobileBottomNav: React.FC<{ activeTab: TabId; onTabChange: (tab: TabId) => void }> = ({
  activeTab,
  onTabChange
}) => {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border px-2 pt-1 pb-[max(env(safe-area-inset-bottom),0.5rem)] no-print"
      aria-label="Navigasi Bawah Ponsel"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {PRIMARY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeTab === tab.id ||
            (tab.id === "keuangan" && (activeTab === "biaya" || activeTab === "asuransi"));
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 min-h-[48px] rounded-[10px] transition-colors cursor-pointer ${
                isActive
                  ? "text-primary font-medium"
                  : "text-text-2 hover:text-text"
              }`}
              aria-label={tab.label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
