import React, { useState } from "react";
import { Download, Share2, X, Smartphone, PlusSquare } from "lucide-react";
import { usePWAInstall } from "../../hooks/usePWAInstall";

interface Props {
  className?: string;
  variant?: "header" | "banner";
}

export const PWAInstallButton: React.FC<Props> = ({ className = "", variant = "header" }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already installed, hide
  if (isInstalled) {
    return null;
  }

  // Not installable and not iOS, hide
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
        className={`inline-flex items-center justify-center gap-1.5 font-bold transition-all shadow-2xs hover:shadow-xs min-h-[44px] min-w-[44px] ${
          variant === "header"
            ? "p-2 sm:px-3 sm:py-2 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs"
            : "px-4 py-2.5 rounded-2xl bg-[#1F4E78] hover:bg-[#153654] text-white text-xs sm:text-sm"
        } ${className}`}
        title="Instal Aplikasi ke Layar Utama (Bisa Digunakan 100% Offline)"
        aria-label="Instal Aplikasi ke Layar Utama"
      >
        <Download className={`w-4 h-4 shrink-0 ${variant === "header" ? "text-teal-700" : "text-white"}`} />
        <span className="hidden sm:inline">Instal Aplikasi</span>
      </button>

      {/* iOS Safari Guided Install Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1F4E78] flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Pasang di iPhone / iPad
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Gunakan aplikasi ini seperti aplikasi bawaan dan akses 100% tanpa internet:
            </p>

            <ol className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#1F4E78] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Ketuk tombol <strong>Bagikan (Share)</strong> <Share2 className="w-3.5 h-3.5 inline mx-1 text-blue-600" /> di bilah navigasi Safari.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#1F4E78] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Gulir ke bawah dan pilih <strong>"Tambah ke Layar Utama"</strong> (Add to Home Screen) <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-slate-700" />.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#1F4E78] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Ketuk <strong>"Tambah"</strong> di pojok kanan atas.
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3 bg-[#1F4E78] text-white font-bold text-xs rounded-2xl transition min-h-[44px]"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
