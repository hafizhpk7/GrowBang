import React, { useState } from "react";
import { Baby } from "lucide-react";
import { createNewProfile } from "../../../data/seed";
import { Profile } from "../../../types";

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--scrim)" }}
    >
      <div
        className="bg-surface rounded-[12px] max-w-[440px] w-full border border-border p-6 sm:p-7 space-y-6 animate-fadeIn"
        style={{ boxShadow: "var(--shadow-popover)" }}
      >
        {/* Section 6.8: Typographic welcome (serif heading + one sentence), no stock illustrations */}
        <div className="space-y-1.5 text-center">
          <h2 className="text-[26px] font-serif font-medium text-text">
            Pemantau imunisasi anak
          </h2>
          <p className="text-[14px] text-text-2 leading-relaxed">
            Mulai dengan mencatat profil anak Anda untuk melihat jadwal imunisasi dan estimasi biayanya.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-danger-tint text-danger rounded-[10px] text-[13px]">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[13px] font-medium text-text">
              Nama panggilan anak
            </label>
            <input
              type="text"
              required
              value={panggilan}
              onChange={(e) => setPanggilan(e.target.value)}
              placeholder="Contoh: Kayla / Danis"
              className="w-full px-3 py-2 text-[15px] rounded-[10px] border border-border-strong bg-surface text-text min-h-[44px]"
            />
            <p className="text-[12px] text-text-2">
              Cukup nama panggilan sehari-hari.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[13px] font-medium text-text">
              Tanggal lahir
            </label>
            <input
              type="date"
              required
              value={tanggalLahir}
              onChange={(e) => setTanggalLahir(e.target.value)}
              className="w-full px-3 py-2 text-[15px] rounded-[10px] border border-border-strong bg-surface text-text min-h-[44px]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-primary hover:bg-primary-hover text-primary-fg font-medium rounded-[10px] transition min-h-[44px] cursor-pointer mt-2 text-[14px]"
          >
            Lihat jadwal
          </button>
        </form>
      </div>
    </div>
  );
};
