import React, { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
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
    <div className="bg-primary-tint border border-primary/20 rounded-[12px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-text">
      <div className="space-y-0.5">
        <h3 className="text-[14px] font-medium text-text">
          Pasang aplikasi ke layar utama
        </h3>
        <p className="text-[13px] text-text-2">
          Buka cepat dari beranda ponsel dan gunakan kapan saja tanpa internet (offline).
        </p>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <button
          type="button"
          onClick={handleDismiss}
          className="p-2 text-text-2 hover:text-text rounded-[10px] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          aria-label="Tutup banner"
        >
          <X className="w-4 h-4" />
        </button>
        {isInstallable && (
          <button
            type="button"
            onClick={install}
            className="px-3.5 py-2 bg-primary hover:bg-primary-hover text-primary-fg text-[13px] font-medium rounded-[10px] transition min-h-[44px] flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Pasang</span>
          </button>
        )}
      </div>
    </div>
  );
};
