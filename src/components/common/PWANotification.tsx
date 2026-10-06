import React, { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { CheckCircle2, RefreshCw, X, WifiOff } from "lucide-react";

export const PWANotification: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(registration) {
      if (registration) {
        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn("Registrasi Service Worker:", error);
    }
  });

  const closeOffline = () => {
    setOfflineReady(false);
  };

  const closeRefresh = () => {
    setNeedRefresh(false);
  };

  // Auto-dismiss offline ready after 5 seconds
  useEffect(() => {
    if (offlineReady) {
      const timer = setTimeout(() => {
        setOfflineReady(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [offlineReady, setOfflineReady]);

  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-fadeIn no-print">
      {offlineReady && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-slate-700 flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-white">
                Aplikasi siap digunakan offline
              </p>
              <p className="text-[11px] text-slate-400">
                Data jadwal dan pencatatan tersimpan di perangkat Anda.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeOffline}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {needRefresh && (
        <div className="bg-[#1F4E78] text-white p-4 rounded-2xl shadow-xl border border-blue-400/40 flex items-center justify-between gap-3 text-xs sm:text-sm mt-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 text-teal-200 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <p className="font-extrabold text-white">
                Versi baru tersedia
              </p>
              <p className="text-[11px] text-teal-100">
                Klik perbarui untuk memuat pembaruan terbaru.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => updateServiceWorker(true)}
              className="px-3 py-1.5 bg-teal-400 hover:bg-teal-300 text-slate-900 rounded-xl font-bold text-xs transition shadow-xs"
            >
              Perbarui
            </button>
            <button
              type="button"
              onClick={closeRefresh}
              className="p-1 text-white/70 hover:text-white rounded-lg min-h-[32px] min-w-[32px] flex items-center justify-center"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
