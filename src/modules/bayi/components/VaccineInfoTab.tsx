import React, { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { SEED_VACCINE_INFO } from "../../../data/seed";
import { Profile, VaccineInfo } from "../../../types";
import { CategoryTag, StatusBadge } from "../../../components/common/Badges";

interface Props {
  profile: Profile;
}

export const VaccineInfoTab: React.FC<Props> = ({ profile }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const scheduleByRef = useMemo(() => {
    const map = new Map<string, typeof profile.schedule>();
    profile.schedule.forEach((row) => {
      const key = row.ref.toLowerCase();
      const list = map.get(key) || [];
      list.push(row);
      map.set(key, list);
    });
    return map;
  }, [profile.schedule]);

  const filteredVaccines = useMemo(() => {
    return SEED_VACCINE_INFO.filter((v: VaccineInfo) => {
      if (filterCategory !== "all") {
        if (filterCategory === "program" && v.status !== "Wajib") return false;
        if (filterCategory === "pilihan" && v.status !== "Pilihan") return false;
        if (filterCategory === "kondisional" && v.status !== "Kondisional") return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = v.nama.toLowerCase().includes(q);
        const matchProtect = v.melindungi.toLowerCase().includes(q);
        const matchWhy = v.penting.toLowerCase().includes(q);
        return matchName || matchProtect || matchWhy;
      }
      return true;
    });
  }, [filterCategory, searchQuery]);

  return (
    <div className="space-y-6 animate-fadeIn max-w-[960px]">
      {/* 1. Header */}
      <div>
        <h1 className="text-[28px] sm:text-[32px] font-medium leading-tight text-text">
          Info vaksin
        </h1>
        <p className="text-[15px] text-text-2 mt-1">
          Kamus lengkap 15 jenis vaksin anak: manfaat perlindungan, anjuran medis, dan antisipasi reaksi KIPI.
        </p>
      </div>

      {/* 2. Search & Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-text-2 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama vaksin atau penyakit..."
            className="w-full pl-10 pr-9 py-2 text-[14px] rounded-[10px] border border-border-strong bg-surface text-text min-h-[44px]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-2 hover:text-text cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "all", label: "Semua" },
            { id: "program", label: "Program pemerintah" },
            { id: "pilihan", label: "Vaksin pilihan" },
            { id: "kondisional", label: "Kondisional" }
          ].map((cat) => {
            const isSelected = filterCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3 py-1.5 rounded-[8px] text-[13px] whitespace-nowrap transition cursor-pointer min-h-[36px] ${
                  isSelected
                    ? "bg-surface-sunken text-text font-medium border border-border-strong"
                    : "bg-surface text-text-2 hover:text-text border border-border"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Cards Grid: 1px border cards, serif vaccine names (Section 6.4) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredVaccines.length === 0 ? (
          <div className="col-span-full py-8 text-center text-text-2 text-[14px] bg-surface rounded-[12px] border border-border">
            Tidak ada vaksin yang cocok dengan pencarian "{searchQuery}".
          </div>
        ) : (
          filteredVaccines.map((v: VaccineInfo) => {
            const schedules = scheduleByRef.get(v.id.toLowerCase()) || [];

            return (
              <div
                key={v.id}
                className="bg-surface rounded-[12px] border border-border p-5 flex flex-col justify-between space-y-4 hover:border-border-strong transition-colors"
              >
                <div className="space-y-3">
                  {/* Top: Name & Badges */}
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <h2 className="text-[18px] font-serif font-medium text-text">
                      {v.nama}
                    </h2>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <StatusBadge status={v.status} />
                      <CategoryTag gratis={v.gratisProgram === "Ya" ? "Ya" : "Tidak"} />
                    </div>
                  </div>

                  {/* Protects against */}
                  <div className="p-3 rounded-[8px] bg-primary-tint/60 border border-primary/20 text-[13px] space-y-0.5">
                    <span className="font-medium text-primary-text">Penyakit yang dicegah:</span>
                    <p className="text-text leading-relaxed">{v.melindungi}</p>
                  </div>

                  {/* Why important */}
                  <div className="p-3 rounded-[8px] bg-surface-sunken border border-border text-[13px] space-y-0.5">
                    <span className="font-medium text-text-2">Mengapa penting:</span>
                    <p className="text-text-2 leading-relaxed">{v.penting}</p>
                  </div>

                  {/* KIPI */}
                  <div className="text-[13px] space-y-0.5 pt-1">
                    <span className="font-medium text-text">Reaksi (KIPI):</span>
                    <p className="text-text-2 leading-relaxed">{v.efekSamping}</p>
                  </div>
                </div>

                {/* Schedules */}
                {schedules.length > 0 && (
                  <div className="pt-3 border-t border-border flex items-center justify-between text-[12px] text-text-2">
                    <span>{schedules.length} dosis anjuran:</span>
                    <span className="font-medium text-text">
                      {schedules.map((s) => s.usia).join(", ")}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
