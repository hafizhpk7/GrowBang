import React, { useState, useEffect } from "react";
import { Smartphone, Download, X } from "lucide-react";
import { usePWAInstall } from "../../hooks/usePWAInstall";

export const PWABanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem("pwa_banner_dismissed");
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("pwa_banner_dismissed", "true");
  };

  if (dismissed || isInstalled || (!isInstallable && !isIOS)) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200/90 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#1F4E78] text-white flex items-center justify-center shrink-0 shadow-xs">
          <Smartphone className="w-5 h-5 text-teal-300" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
            Instal Aplikasi ke Layar Utama
          </h4>
          <p className="text-[11px] sm:text-xs text-slate-600">
            Buka cepat seperti aplikasi ponsel & gunakan 100% tanpa internet (offline).
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto justify-end">
        <button
          type="button"
          onClick={handleDismiss}
          className="p-2 text-slate-400 hover:text-slate-600 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center text-xs"
          aria-label="Tutup Banner"
        >
          <X className="w-4 h-4" />
        </button>
        {isInstallable && (
          <button
            type="button"
            onClick={install}
            className="px-4 py-2 bg-[#1F4E78] hover:bg-[#153654] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 min-h-[44px]"
          >
            <Download className="w-4 h-4" />
            <span>Pasang Sekarang</span>
          </button>
        )}
      </div>
    </div>
  );
};
