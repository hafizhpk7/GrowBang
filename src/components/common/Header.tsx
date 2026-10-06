import React from "react";
import { ChevronDown, Printer, Settings } from "lucide-react";
import { Profile } from "../../types";
import { getChildAge } from "../../utils/dates";
import { PWAInstallButton } from "./PWAInstallButton";

interface Props {
  profile: Profile;
  profiles: Profile[];
  onSelectProfile: (id: string) => void;
  onOpenProfileModal: () => void;
  onNavigateToSettings: () => void;
  isSettingsActive?: boolean;
}

export const Header: React.FC<Props> = ({
  profile,
  onOpenProfileModal,
  onNavigateToSettings,
  isSettingsActive = false
}) => {
  const age = getChildAge(profile.tanggalLahir);

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 transition-colors no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3">
        {/* Far Left: Profile Selection Dropdown Capsule */}
        <div className="flex items-center min-w-0">
          <button
            type="button"
            onClick={onOpenProfileModal}
            className="group flex items-center gap-2.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-slate-50 hover:bg-slate-100 rounded-full text-xs sm:text-sm font-medium text-slate-800 transition-all border border-slate-200/90 shadow-2xs hover:shadow-xs min-h-[44px] min-w-[44px]"
            aria-label="Pilih atau kelola profil anak"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1F4E78] to-teal-600 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-2xs">
              {profile.panggilan.slice(0, 1).toUpperCase()}
            </div>
            <div className="text-left min-w-0 pr-1">
              <div className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight truncate max-w-[110px] sm:max-w-[180px]">
                {profile.panggilan}
              </div>
              <div className="text-[10px] sm:text-[11px] text-teal-700 font-semibold leading-tight truncate">
                {age.text}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform shrink-0" />
          </button>
        </div>

        {/* Far Right: Action Buttons Group (Install PWA, Print, Settings) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* PWA Install Button (visible only when installable on mobile/desktop) */}
          <PWAInstallButton variant="header" />

          {/* Cetak Quick Action Button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 sm:px-3 sm:py-2 rounded-2xl text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all shadow-2xs hover:shadow-xs min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 text-xs font-bold"
            title="Cetak Jadwal / Simpan PDF"
            aria-label="Cetak Jadwal / Simpan PDF"
          >
            <Printer className="w-4 h-4 text-slate-600 shrink-0" />
            <span className="hidden sm:inline">Cetak</span>
          </button>

          {/* Pengaturan Button */}
          <button
            type="button"
            onClick={onNavigateToSettings}
            className={`p-2 sm:px-3 sm:py-2 rounded-2xl transition-all shadow-2xs hover:shadow-xs min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 text-xs font-bold border ${
              isSettingsActive
                ? "bg-[#1F4E78] text-white border-[#1F4E78] shadow-xs"
                : "text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border-slate-200/80"
            }`}
            title="Pengaturan & Ekspor Data"
            aria-label="Buka Pengaturan & Ekspor Data"
          >
            <Settings className={`w-4 h-4 shrink-0 ${isSettingsActive ? "text-white" : "text-slate-600"}`} />
            <span className="hidden sm:inline">Pengaturan</span>
          </button>
        </div>
      </div>
    </header>
  );
};
