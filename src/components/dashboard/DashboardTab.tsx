import React, { useMemo } from "react";
import {
  Baby,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Award
} from "lucide-react";
import { Profile, Record, ScheduleRow } from "../../types";
import { formatIndonesianDate, getChildAge, getScheduleStatus } from "../../utils/dates";
import { GratisBadge } from "../common/Badges";
import { PWABanner } from "../common/PWABanner";

interface Props {
  profile: Profile;
  onOpenProfileModal: () => void;
  onOpenRecordModal: (row: ScheduleRow) => void;
  onOpenVaccineDetail: (ref: string) => void;
  onNavigateToTab: (tab: any) => void;
  onQuickMarkGiven: (row: ScheduleRow) => void;
}

export const DashboardTab: React.FC<Props> = ({
  profile,
  onOpenProfileModal,
  onOpenRecordModal,
  onOpenVaccineDetail,
  onNavigateToTab
}) => {
  const age = getChildAge(profile.tanggalLahir);

  // Map of records
  const recordMap = useMemo(() => {
    return new Map<string, Record>(profile.records.map((r) => [r.rowId, r]));
  }, [profile.records]);

  // Statuses for all schedule rows
  const rowStatuses = useMemo(() => {
    return profile.schedule.map((row) => {
      const rec = recordMap.get(row.id);
      const statusInfo = getScheduleStatus(row, rec, profile.tanggalLahir);
      return {
        row,
        record: rec,
        ...statusInfo
      };
    });
  }, [profile.schedule, recordMap, profile.tanggalLahir]);

  // Progress calculations
  const wajibRows = profile.schedule.filter((r) => r.status === "Wajib");
  const wajibDone = wajibRows.filter((r) => recordMap.get(r.id)?.diberikan).length;
  const wajibPercent = wajibRows.length > 0 ? Math.round((wajibDone / wajibRows.length) * 100) : 0;

  const pilihanRows = profile.schedule.filter((r) => r.status === "Pilihan");
  const pilihanDone = pilihanRows.filter((r) => recordMap.get(r.id)?.diberikan).length;
  const pilihanPercent = pilihanRows.length > 0 ? Math.round((pilihanDone / pilihanRows.length) * 100) : 0;

  const totalDiberikan = profile.records.filter((r) => r.diberikan).length;
  const totalVaksin = profile.schedule.length;
  const totalPercent = totalVaksin > 0 ? Math.round((totalDiberikan / totalVaksin) * 100) : 0;

  // Overdue and Upcoming (30 days)
  const overdueList = rowStatuses.filter((item) => item.status === "Terlambat");
  const upcomingList = rowStatuses.filter((item) => item.status === "Segera");

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* PWA Home Screen Install Banner */}
      <PWABanner />

      {/* 1. Hero / Child Health Header Card */}
      <div className="bg-gradient-to-br from-[#1F4E78] via-[#1a446a] to-[#12304d] rounded-3xl p-6 sm:p-8 text-white shadow-md shadow-blue-950/20 relative overflow-hidden">
        {/* Subtle glow decorations */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-72 h-72 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 translate-y-12 w-64 h-64 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl sm:text-3xl font-black text-teal-300 shadow-inner shrink-0">
              {profile.panggilan.slice(0, 1).toUpperCase()}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white truncate">
                  {profile.panggilan}
                </h2>
                <span className="bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  0–5 Tahun
                </span>
              </div>
              <p className="text-teal-200 text-sm font-semibold flex items-center gap-1.5">
                <Baby className="w-4 h-4 shrink-0" />
                <span>Usia saat ini: {age.text}</span>
              </p>
              <p className="text-white/70 text-xs flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>Lahir: {formatIndonesianDate(profile.tanggalLahir, "d MMMM yyyy")}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onOpenProfileModal}
              className="flex-1 sm:flex-none px-4 py-3 bg-white/10 hover:bg-white/20 active:bg-white/25 text-white rounded-2xl text-xs sm:text-sm font-semibold backdrop-blur-md border border-white/20 transition min-h-[46px] flex items-center justify-center gap-2"
            >
              <Baby className="w-4 h-4" />
              <span>Ganti Profil</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToTab("jadwal")}
              className="flex-1 sm:flex-none px-5 py-3 bg-teal-400 hover:bg-teal-300 text-slate-900 rounded-2xl text-xs sm:text-sm font-bold shadow-sm transition min-h-[46px] flex items-center justify-center gap-1.5"
            >
              <span>Jadwal Lengkap</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Progress */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Kelengkapan
            </span>
            <span className="text-xs font-extrabold text-[#1F4E78] bg-blue-50 px-2.5 py-0.5 rounded-full">
              {totalDiberikan} dari {totalVaksin}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">{totalPercent}%</span>
              <span className="text-xs text-slate-500 font-medium">Jadwal Selesai</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#1F4E78] h-full rounded-full transition-all duration-500"
                style={{ width: `${totalPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Wajib (Kemenkes) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Imunisasi Wajib
            </span>
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              {wajibDone} / {wajibRows.length}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">{wajibPercent}%</span>
              <span className="text-xs text-emerald-600 font-medium">Program Pemerintah</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${wajibPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Pilihan (IDAI) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              Vaksin Pilihan
            </span>
            <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
              {pilihanDone} / {pilihanRows.length}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">{pilihanPercent}%</span>
              <span className="text-xs text-amber-600 font-medium">Rekomendasi IDAI</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${pilihanPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Action Cards: Perlu Tindakan Segera (Terlambat & Segera) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card A: Terlambat / Overdue */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Perlu Dikejar (Terlambat)
                </h3>
                <p className="text-xs text-slate-500">
                  Vaksin yang telah melewati usia anjuran
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200/60">
              {overdueList.length} vaksin
            </span>
          </div>

          <div>
            {overdueList.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <span className="font-semibold text-slate-800">Bagus! Tidak ada jadwal yang terlewat.</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {overdueList.map((item) => (
                  <div
                    key={item.row.id}
                    className="p-4 bg-rose-50/50 border border-rose-200/60 rounded-2xl flex items-center justify-between gap-3 text-xs"
                  >
                    {/* Left: Vaccine Name, Gratis Badge, Due Date */}
                    <div className="min-w-0 space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onOpenVaccineDetail(item.row.ref)}
                          className="font-bold text-slate-900 hover:text-[#1F4E78] text-left hover:underline text-sm truncate"
                        >
                          {item.row.vaksin}
                        </button>
                        <GratisBadge gratis={item.row.gratis} size="sm" />
                      </div>
                      <div className="text-slate-500 flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-medium text-slate-700">Usia: {item.row.usia}</span>
                        <span>•</span>
                        <span className="text-rose-600 font-semibold">Jatuh tempo: {item.dueDateStr}</span>
                      </div>
                    </div>

                    {/* Right: Proportional "Catat" button (min 44px) */}
                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenRecordModal(item.row)}
                        className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition text-xs shadow-xs min-h-[44px] min-w-[70px] flex items-center justify-center"
                      >
                        Catat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Card B: Segera / 30 Hari ke Depan */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Mendekati Waktu (≤30 Hari)
                </h3>
                <p className="text-xs text-slate-500">
                  Persiapkan kunjungan ke Posyandu / Faskes
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">
              {upcomingList.length} vaksin
            </span>
          </div>

          <div>
            {upcomingList.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <span className="font-semibold text-slate-800">Tidak ada jadwal dalam 30 hari ke depan.</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {upcomingList.map((item) => (
                  <div
                    key={item.row.id}
                    className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-2xl flex items-center justify-between gap-3 text-xs"
                  >
                    {/* Left: Vaccine Name, Gratis Badge, Due Date */}
                    <div className="min-w-0 space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onOpenVaccineDetail(item.row.ref)}
                          className="font-bold text-slate-900 hover:text-[#1F4E78] text-left hover:underline text-sm truncate"
                        >
                          {item.row.vaksin}
                        </button>
                        <GratisBadge gratis={item.row.gratis} size="sm" />
                      </div>
                      <div className="text-slate-500 flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-medium text-slate-700">Usia: {item.row.usia}</span>
                        <span>•</span>
                        <span className="text-amber-800 font-semibold">Jatuh tempo: {item.dueDateStr}</span>
                      </div>
                    </div>

                    {/* Right: Proportional "Catat" button (min 44px) */}
                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenRecordModal(item.row)}
                        className="px-4 py-2.5 bg-[#1F4E78] hover:bg-[#153654] text-white rounded-xl font-bold transition text-xs shadow-xs min-h-[44px] min-w-[70px] flex items-center justify-center"
                      >
                        Catat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 italic pt-1">
            * Hubungi Puskesmas atau faskes langganan untuk memastikan ketersediaan vaksin.
          </p>
        </div>
      </div>
    </div>
  );
};
