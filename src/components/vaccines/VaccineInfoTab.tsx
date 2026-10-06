import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Search,
  AlertCircle,
  Thermometer,
  Calendar,
  X,
  ShieldCheck,
  HeartPulse
} from "lucide-react";
import { Profile, VaccineInfo } from "../../types";
import { SEED_VACCINE_INFO } from "../../data/seed";
import { StatusBadge, GratisBadge } from "../common/Badges";

interface Props {
  profile: Profile;
}

const GENERAL_KIPI_NOTE =
  "Kejadian Ikutan Pasca Imunisasi (KIPI) seperti demam ringan, nyeri atau bengkak pada lokasi suntikan, dan anak agak rewel adalah respon normal sistem imun tubuh yang sedang membentuk antibodi pelindung.";

export const VaccineInfoTab: React.FC<Props> = ({ profile }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredVaccines = useMemo(() => {
    return SEED_VACCINE_INFO.filter((v: VaccineInfo) => {
      const matchSearch =
        v.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.melindungi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.penting.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.efekSamping.toLowerCase().includes(searchQuery.toLowerCase());

      const matchFilter =
        filterStatus === "all" || v.status === filterStatus;

      return matchSearch && matchFilter;
    });
  }, [searchQuery, filterStatus]);

  // Index user's schedule rows by vaccine ID or reference
  const scheduleByRef = useMemo(() => {
    const map = new Map<string, typeof profile.schedule>();
    profile.schedule.forEach((row) => {
      const key = (row.ref || "").toLowerCase();
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(row);
    });
    return map;
  }, [profile.schedule]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-[#1F4E78]" />
            Informasi Medis & Reaksi Vaksin (KIPI)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Fungsi perlindungan, urgensi medis, serta reaksi umum pasca imunisasi (KIPI) untuk 15 vaksin bayi–balita.
          </p>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari vaksin, penyakit, atau gejala reaksi (contoh: BCG, demam, diare, ruam)..."
            className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm rounded-2xl border border-slate-300 bg-slate-50/60 focus:outline-hidden focus:ring-2 focus:ring-[#1F4E78] min-h-[48px]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 text-xs sm:text-sm rounded-2xl border border-slate-300 bg-white text-slate-700 min-h-[48px]"
          >
            <option value="all">Semua Kategori</option>
            <option value="Wajib">Wajib (Program Pemerintah)</option>
            <option value="Pilihan">Pilihan (Anjuran IDAI)</option>
            <option value="Kondisional">Kondisional (Tertentu)</option>
          </select>
        </div>
      </div>

      {/* 3. Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVaccines.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm bg-white rounded-3xl border border-slate-200">
            Tidak ada vaksin yang cocok dengan kata pencarian "{searchQuery}".
          </div>
        ) : (
          filteredVaccines.map((v: VaccineInfo) => {
            const schedules = scheduleByRef.get(v.id.toLowerCase()) || [];

            return (
              <div
                key={v.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition space-y-4"
              >
                <div className="space-y-3.5">
                  {/* Top: Name & Badges */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug">
                        {v.nama}
                      </h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <StatusBadge status={v.status} size="sm" />
                        <GratisBadge
                          gratis={v.gratisProgram === "Ya" ? "Ya" : "Tidak"}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Protects against */}
                  <div className="bg-teal-50/60 p-3.5 rounded-2xl border border-teal-200/50 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-teal-800 font-bold uppercase tracking-wide text-[10px]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Penyakit yang Dicegah
                    </div>
                    <p className="text-slate-900 font-semibold leading-relaxed">
                      {v.melindungi}
                    </p>
                  </div>

                  {/* Why important */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-[#1F4E78] font-bold uppercase tracking-wide text-[10px]">
                      <HeartPulse className="w-3.5 h-3.5" />
                      Mengapa Sangat Penting
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {v.penting}
                    </p>
                  </div>

                  {/* Distinct KIPI / Side Effects Section */}
                  <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/70 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-amber-900 font-extrabold uppercase tracking-wide text-[10px]">
                      <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                      Reaksi Setelah Imunisasi (KIPI)
                    </div>
                    <p className="text-amber-950 leading-relaxed font-medium">
                      {v.efekSamping}
                    </p>
                  </div>
                </div>

                {/* Schedules linked to this vaccine */}
                {schedules.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 text-xs space-y-2">
                    <span className="font-bold text-slate-500 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5" />
                      Jadwal Usia pada Balita:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {schedules.map((row) => (
                        <span
                          key={row.id}
                          className="bg-blue-50 text-[#1F4E78] border border-blue-200/60 text-[11px] px-2.5 py-1 rounded-full font-bold"
                        >
                          {row.usia} ({row.vaksin})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 4. Common Side Effects & Home Care Guidance */}
      <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50/70 rounded-3xl border border-amber-200/80 space-y-2 shadow-2xs">
        <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm sm:text-base">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          Panduan Penanganan Reaksi Imunisasi (KIPI) di Rumah
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          {GENERAL_KIPI_NOTE} Bila anak demam, berikan ASI atau cairan lebih sering, gunakan pakaian tipis menyerap keringat, kompres air hangat suam-suam kuku, dan berikan obat penurun panas (parasetamol) sesuai takaran dokter. Segera hubungi dokter spesialis anak bila demam di atas 39°C, anak kejang, atau menangis melengking terus-menerus tanpa henti lebih dari 3 jam.
        </p>
      </div>
    </div>
  );
};
