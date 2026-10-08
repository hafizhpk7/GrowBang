import React, { useState } from "react";
import { Download } from "lucide-react";
import { usePWAInstall } from "../../hooks/usePWAInstall";

interface Props {
  className?: string;
  variant?: "header" | "banner";
}

export const PWAInstallButton: React.FC<Props> = ({ className = "", variant = "header" }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleClick = () => {
    if (isInstallable) {
      install();
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-1.5 font-medium transition min-h-[44px] min-w-[44px] cursor-pointer ${
          variant === "header"
            ? "px-3 py-1.5 rounded-[10px] bg-surface hover:bg-surface-sunken text-text border border-border-strong text-[13px]"
            : "px-4 py-2 rounded-[10px] bg-primary hover:bg-primary-hover text-primary-fg text-[13px]"
        } ${className}`}
        title="Pasang aplikasi ke layar utama"
        aria-label="Pasang aplikasi ke layar utama"
      >
        <Download className="w-4 h-4 shrink-0" />
        <span className="hidden sm:inline">Pasang aplikasi</span>
      </button>

      {/* iOS Safari Guided Install Sheet */}
      {showIOSModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ backgroundColor: "var(--scrim)" }}
        >
          <div
            className="bg-surface rounded-t-[16px] sm:rounded-[12px] max-w-sm w-full p-5 border border-border space-y-3"
            style={{ boxShadow: "var(--shadow-popover)" }}
          >
            <h3 className="font-serif font-medium text-text text-[16px]">
              Pasang di iPhone / iPad
            </h3>
            <ol className="text-[13px] text-text-2 space-y-2 list-decimal list-inside leading-relaxed">
              <li>Ketuk tombol Bagikan (Share) di Safari.</li>
              <li>Gulir ke bawah dan pilih Tambahkan ke Layar Utama.</li>
              <li>Ketuk Tambah di pojok kanan atas.</li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 bg-surface-sunken hover:bg-border text-text rounded-[8px] text-[13px] font-medium min-h-[44px] cursor-pointer mt-2"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
