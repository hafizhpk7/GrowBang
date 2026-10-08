import React from "react";
import { useAuth } from "../../context/AuthContext";

export const Footer: React.FC = () => {
  const { user } = useAuth();

  return (
    <footer className="mt-12 pt-6 border-t border-border text-[13px] text-text-2 space-y-2 no-print">
      <p>
        Ini bukan nasihat medis. Konsultasikan jadwal dengan dokter anak atau Puskesmas. Harga hanya estimasi.
      </p>
      <p className="text-[12px] text-text-3">
        {user
          ? "Tersinkronisasi ke Firebase Firestore untuk akun keluarga Anda."
          : "Tersimpan secara lokal di perangkat Anda."}{" "}
        © {new Date().getFullYear()} Pemantau Imunisasi 0–5 Tahun.
      </p>
    </footer>
  );
};
