import React from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Calculator,
  Shield,
  BookOpen,
  Settings,
  Baby,
  ChevronRight
} from "lucide-react";
import { Profile } from "../../types";
import { getChildAge } from "../../utils/dates";

export type TabId = "beranda" | "jadwal" | "biaya" | "asuransi" | "info-vaksin" | "pengaturan";

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  profile: Profile;
  onOpenProfileModal: () => void;
}

// The 5 primary tabs for bottom navigation
export const PRIMARY_TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "beranda", label: "Beranda", icon: LayoutDashboard },
  { id: "jadwal", label: "Jadwal", icon: CalendarDays },
  { id: "biaya", label: "Biaya", icon: Calculator },
  { id: "asuransi", label: "Asuransi", icon: Shield },
  { id: "info-vaksin", label: "Info Vaksin", icon: BookOpen }
];

export const DesktopSidebar: React.FC<Props> = ({ activeTab, onTabChange, profile, onOpenProfileModal }) => {
  const age = getChildAge(profile.tanggalLahir);

  return (
    <aside className="w-68 shrink-0 hidden md:block bg-white border-r border-slate-200/80 p-5 min-h-[calc(100vh-4.5rem)] flex flex-col justify-between no-print transition-colors">
      <div className="space-y-6">
        {/* Child Profile Card in Sidebar */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 p-4 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#1F4E78] to-teal-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              {profile.panggilan.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm text-slate-900 truncate">
                {profile.panggilan}
              </h3>
              <p className="text-xs font-semibold text-teal-700">
                {age.text}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenProfileModal}
            className="w-full py-2 px-3 text-xs font-bold text-[#1F4E78] hover:bg-white rounded-xl transition-all border border-blue-200/60 shadow-2xs text-center flex items-center justify-center gap-1.5 min-h-[40px]"
          >
            <Baby className="w-3.5 h-3.5" />
            <span>Ganti / Kelola Anak</span>
            <ChevronRight className="w-3 h-3 ml-auto opacity-60" />
          </button>
        </div>

        {/* Navigation items (5 Primary Tabs) */}
        <nav className="space-y-1.5" aria-label="Menu Utama">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Menu Utama
          </div>
          {PRIMARY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all min-h-[48px] ${
                  isActive
                    ? "bg-[#1F4E78] text-white shadow-md shadow-blue-950/20 translate-x-1"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-colors ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span>{tab.label}</span>
              </button>
            );
          })}

          {/* Desktop Pengaturan item */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onTabChange("pengaturan")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all min-h-[48px] ${
                activeTab === "pengaturan"
                  ? "bg-[#1F4E78] text-white shadow-md shadow-blue-950/20 translate-x-1"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-colors ${
                  activeTab === "pengaturan" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                }`}
              >
                <Settings className="w-4 h-4" />
              </div>
              <span>Pengaturan & Ekspor</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Helpful Info Tip */}
      <div className="p-3.5 bg-teal-50/60 rounded-2xl border border-teal-200/60 text-xs text-teal-900 space-y-1">
        <p className="font-bold flex items-center gap-1.5">
          <span>✨</span> Fasilitas Pemerintah
        </p>
        <p className="text-[11px] text-teal-800/90 leading-relaxed">
          14 imunisasi dasar rutin gratis di Puskesmas & Posyandu.
        </p>
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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-3 pt-2 pb-[max(env(safe-area-inset-bottom),0.65rem)] shadow-lg shadow-slate-900/5 no-print"
      aria-label="Navigasi Bawah Ponsel"
    >
      {/* Dynamic Capsule Bottom Navigation: active tab displays pill + label; inactive tabs show icon only */}
      <div className="flex items-center justify-between max-w-md mx-auto gap-1">
        {PRIMARY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`transition-all duration-300 min-h-[48px] flex items-center justify-center ${
                isActive
                  ? "bg-[#1F4E78]/10 text-[#1F4E78] px-3.5 py-2 rounded-full font-extrabold shadow-2xs"
                  : "text-slate-400 hover:text-slate-700 p-2.5 rounded-full hover:bg-slate-100/60 min-w-[44px]"
              }`}
              aria-label={tab.label}
              title={tab.label}
            >
              <div className="flex items-center gap-1.5">
                <Icon className={`transition-transform duration-200 ${isActive ? "w-4 h-4 scale-110" : "w-5 h-5"}`} />
                {isActive && (
                  <span className="text-xs font-black tracking-tight whitespace-nowrap animate-fadeIn">
                    {tab.label}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
