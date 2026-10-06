import React, { useState } from "react";
import { ShieldCheck, Sparkles, Baby, Calendar } from "lucide-react";
import { createNewProfile, createSampleProfile } from "../../data/seed";
import { Profile } from "../../types";

interface Props {
  isOpen: boolean;
  onComplete: (profile: Profile) => void;
}

export const OnboardingModal: React.FC<Props> = ({ isOpen, onComplete }) => {
  const [panggilan, setPanggilan] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState(
    new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!panggilan.trim()) {
      setErrorMsg("Mohon masukkan nama panggilan anak.");
      return;
    }
    const newId = "child-" + Date.now();
    const profile = createNewProfile(newId, panggilan.trim(), tanggalLahir);
    onComplete(profile);
  };

  const handleUseSample = () => {
    const sample = createSampleProfile();
    onComplete(sample);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200/80 overflow-hidden p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2.5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-[#1F4E78] to-teal-500 rounded-3xl flex items-center justify-center text-white mx-auto shadow-lg shadow-teal-500/25">
            <ShieldCheck className="w-9 h-9 sm:w-11 sm:h-11" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Pemantau Imunisasi <span className="text-[#1F4E78]">0–5 Tahun</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
            Pantau 35 vaksin rekomendasi IDAI & Kemenkes, catat jadwal penyuntikan, hitung estimasi biaya, dan rencanakan klaim asuransi anak Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50/80 p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
          <div className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Baby className="w-4 h-4 text-[#1F4E78]" />
            Mulai dengan Profil Anak Anda
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-2xl border border-rose-200">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Nama Panggilan Anak <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={panggilan}
              onChange={(e) => setPanggilan(e.target.value)}
              placeholder="Contoh: Kayla / Danis"
              className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1F4E78] min-h-[48px]"
            />
            <p className="text-[11px] text-slate-500">
              Cukup nama panggilan, tidak perlu nama lengkap.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Tanggal Lahir <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={tanggalLahir}
              onChange={(e) => setTanggalLahir(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1F4E78] min-h-[48px]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-[#1F4E78] hover:bg-[#153654] text-white rounded-2xl font-bold text-sm shadow-md shadow-blue-900/20 transition min-h-[48px] flex items-center justify-center gap-2"
          >
            Mulai Pantau Imunisasi Sekarang
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="grow border-t border-slate-200"></div>
          <span className="shrink mx-4 text-xs text-slate-400 font-semibold">atau coba demo</span>
          <div className="grow border-t border-slate-200"></div>
        </div>

        <button
          type="button"
          onClick={handleUseSample}
          className="w-full py-3 px-4 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 min-h-[48px]"
        >
          <Sparkles className="w-4 h-4 text-teal-600" />
          Coba dengan Data Contoh (Bayi Usia 6 Bulan)
        </button>
      </div>
    </div>
  );
};
