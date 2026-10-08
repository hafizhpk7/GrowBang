import React, { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, X } from "lucide-react";

export const PWANotification: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(registration) {
      if (registration) {
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
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 sm:left-auto sm:max-w-sm z-50 no-print" aria-live="polite">
      {offlineReady && (
        <div
          className="bg-surface text-text p-3.5 rounded-[10px] border border-border flex items-center justify-between gap-3 text-[13px]"
          style={{ boxShadow: "var(--shadow-popover)" }}
        >
          <div>
            <p className="font-medium text-text">Aplikasi siap offline</p>
            <p className="text-[12px] text-text-2">Data jadwal tersimpan di perangkat Anda.</p>
          </div>
          <button
            type="button"
            onClick={closeOffline}
            className="p-1 text-text-2 hover:text-text cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {needRefresh && (
        <div
          className="bg-surface text-text p-3.5 rounded-[10px] border border-border flex items-center justify-between gap-3 text-[13px] mt-2"
          style={{ boxShadow: "var(--shadow-popover)" }}
        >
          <div>
            <p className="font-medium text-text">Pembaruan tersedia</p>
            <p className="text-[12px] text-text-2">Muat ulang untuk versi terbaru.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateServiceWorker(true)}
              className="px-2.5 py-1.5 bg-primary text-primary-fg rounded-[6px] text-[12px] font-medium flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Muat ulang</span>
            </button>
            <button
              type="button"
              onClick={closeRefresh}
              className="p-1 text-text-2 hover:text-text cursor-pointer"
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
