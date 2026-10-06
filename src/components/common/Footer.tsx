import React from "react";
import { AlertCircle, Lock } from "lucide-react";
import { PERMANENT_DISCLAIMER } from "../../data/seed";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white text-slate-500 py-6 px-4 sm:px-6 transition-colors no-print">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Permanent Medical Disclaimer Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start sm:items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-xs sm:text-sm text-amber-900 font-medium leading-relaxed">
            <strong>Peringatan Medis:</strong> {PERMANENT_DISCLAIMER}
          </p>
        </div>

        {/* Footer notes */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 pt-2">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-teal-600" />
            <span>100% Client-Side: Data tersimpan lokal di perangkat ini dan tidak dikirim ke server mana pun.</span>
          </div>
          <div>
            Pemantau Imunisasi Bayi–Balita 0–5 Tahun © {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </footer>
  );
};
