import React, { useMemo } from "react";
import { PaymentMode, Profile, Record, ScheduleRow } from "../../../types";
import { formatIndonesianDate, getChildAge, getScheduleStatus } from "../../../utils/dates";
import { calculateCostSummary, formatRupiah } from "../../../utils/calc";
import { CategoryTag, StatusIndicator } from "../../../components/common/Badges";
import { PWABanner } from "./PWABanner";

interface Props {
  profile: Profile;
  paymentMode?: PaymentMode;
  onOpenProfileModal: () => void;
  onOpenRecordModal: (row: ScheduleRow) => void;
  onOpenVaccineDetail: (ref: string) => void;
  onNavigateToTab: (tab: any) => void;
  onQuickMarkGiven: (row: ScheduleRow) => void;
}

export const DashboardTab: React.FC<Props> = ({
  profile,
  paymentMode = "HYBRID",
  onOpenProfileModal,
  onOpenRecordModal,
  onOpenVaccineDetail,
  onNavigateToTab,
  onQuickMarkGiven
}) => {
  const age = getChildAge(profile.tanggalLahir);

  const recordMap = useMemo(() => {
    return new Map<string, Record>(profile.records.map((r) => [r.rowId, r]));
  }, [profile.records]);

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

  // Overall progress calculations
  const totalSchedule = profile.schedule.length;
  const totalDone = profile.records.filter((r) => r.diberikan).length;
  const progressPercent = totalSchedule > 0 ? Math.round((totalDone / totalSchedule) * 100) : 0;

  const wajibRows = profile.schedule.filter((r) => r.status === "Wajib");
  const wajibDone = wajibRows.filter((r) => recordMap.get(r.id)?.diberikan).length;

  const pilihanRows = profile.schedule.filter((r) => r.status === "Pilihan");
  const pilihanDone = pilihanRows.filter((r) => recordMap.get(r.id)?.diberikan).length;

  // Filter actionable items: Overdue (Belum dilakukan) and Upcoming (Dalam 30 hari ke depan)
  const overdueItems = useMemo(
    () => rowStatuses.filter((item) => item.status === "Terlambat"),
    [rowStatuses]
  );

  const upcomingItems = useMemo(
    () => rowStatuses.filter((item) => item.status === "Segera"),
    [rowStatuses]
  );

  // Combined action list: Overdue first, then upcoming
  const actionItems = useMemo(() => {
    return [...overdueItems, ...upcomingItems];
  }, [overdueItems, upcomingItems]);

  // Next upcoming vaccine if action list is empty
  const nextScheduled = useMemo(() => {
    if (actionItems.length > 0) return null;
    return rowStatuses.find((item) => !item.record?.diberikan);
  }, [actionItems, rowStatuses]);

  // Compact financial snapshot
  const totalEstimatedSelfPay = useMemo(() => {
    return calculateCostSummary(profile.schedule, undefined, paymentMode).total.tanggungSendiriMax;
  }, [profile.schedule, paymentMode]);

  const totalRealizedActual = useMemo(() => {
    return profile.records
      .filter((r) => r.diberikan)
      .reduce((sum, r) => sum + (r.biayaAktual || 0), 0);
  }, [profile.records]);

  return (
    <div className="space-y-7 animate-fadeIn w-full">
      <PWABanner />

      {/* Page header: child's name, subline, action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pt-1">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-semibold leading-tight text-text tracking-tight">
            {profile.panggilan === "Alif" ? "GrowBang" : profile.panggilan}
          </h1>
          <p className="text-[15px] text-text-2 mt-1 flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-text">{age.text}</span>
            <span>·</span>
            <span>lahir {formatIndonesianDate(profile.tanggalLahir, "d MMMM yyyy")}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={onOpenProfileModal}
            className="px-4 py-2 bg-surface hover:bg-surface-sunken text-text text-[14px] font-medium rounded-[10px] border border-border transition min-h-[40px] cursor-pointer shadow-xs hover:border-border-strong"
          >
            Ganti profil
          </button>
          <button
            type="button"
            onClick={() => onNavigateToTab("jadwal")}
            className="px-4 py-2 bg-surface hover:bg-surface-sunken text-text text-[14px] font-medium rounded-[10px] border border-border transition min-h-[40px] cursor-pointer shadow-xs hover:border-border-strong"
          >
            Lihat jadwal
          </button>
        </div>
      </div>

      {/* Section "Yang perlu dilakukan" (The main card) */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[20px] font-semibold text-text">Yang perlu dilakukan</h2>
          {actionItems.length > 0 && (
            <span className="text-[13px] text-text-2 font-medium tabular-nums">
              {actionItems.length} jadwal
            </span>
          )}
        </div>

        {actionItems.length === 0 ? (
          <div className="p-6 bg-surface rounded-[12px] border border-border shadow-[0_2px_10px_-2px_rgba(42,36,32,0.05)] text-[14px] text-text-2 space-y-1.5">
            <p className="text-text font-semibold">Tidak ada yang perlu dilakukan sekarang.</p>
            {nextScheduled ? (
              <p className="text-[13px] text-text-2">
                Jadwal berikutnya: <span className="text-text font-semibold">{nextScheduled.row.vaksin}</span> pada usia {nextScheduled.row.usia} ({nextScheduled.dueDateStr}).
              </p>
            ) : (
              <p className="text-[13px] text-text-2">Semua jadwal imunisasi anak Anda telah selesai.</p>
            )}
          </div>
        ) : (
          <div className="bg-surface rounded-[12px] border border-border shadow-[0_2px_10px_-2px_rgba(42,36,32,0.05)] divide-y divide-border overflow-hidden">
            {actionItems.map((item, index) => {
              const isFirstUrgent = index === 0;

              return (
                <div
                  key={item.row.id}
                  className="p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-surface-sunken/40 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onOpenVaccineDetail(item.row.ref)}
                        className="text-sm sm:text-base font-semibold text-text hover:text-primary hover:underline text-left cursor-pointer break-words leading-snug"
                      >
                        {item.row.vaksin}
                      </button>
                      <CategoryTag gratis={item.row.gratis} />
                    </div>

                    <div className="flex items-center gap-x-2 gap-y-1.5 flex-wrap text-[12px] sm:text-[13px] text-text-2">
                      <span className="font-medium text-text">Usia {item.row.usia}</span>
                      <span className="text-text-3">·</span>
                      {item.status === "Terlambat" ? (
                        <StatusIndicator
                          status="Terlambat"
                          label={
                            typeof item.daysDiff === "number" && !isNaN(item.daysDiff) && item.daysDiff !== 0
                              ? `Sudah lewat ${Math.abs(item.daysDiff)} hari (seharusnya ${item.dueDateStr || "-"})`
                              : `Sudah melewati jadwal (${item.dueDateStr || "-"})`
                          }
                        />
                      ) : (
                        <StatusIndicator
                          status="Segera"
                          label={
                            typeof item.daysDiff === "number" && !isNaN(item.daysDiff)
                              ? `Dalam ${Math.max(0, item.daysDiff)} hari (${item.dueDateStr || "-"})`
                              : `Jadwal segera (${item.dueDateStr || "-"})`
                          }
                        />
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex justify-end sm:justify-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-border/40 sm:border-t-0">
                    <button
                      type="button"
                      onClick={() => onQuickMarkGiven(item.row)}
                      className={`px-4 py-2 text-[14px] font-semibold rounded-[10px] min-h-[44px] min-w-[88px] transition cursor-pointer shadow-xs active:scale-95 ${
                        isFirstUrgent
                          ? "bg-primary hover:bg-primary-hover active:bg-primary-hover text-primary-fg"
                          : "bg-surface hover:bg-surface-sunken text-text border border-border-strong"
                      }`}
                    >
                      Catat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Responsive Grid for Kemajuan and Keuangan summary cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section "Kemajuan" with subtle elevation */}
        <section className="bg-surface p-5 sm:p-6 rounded-[12px] border border-border shadow-card space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[16px] font-semibold text-text">Kemajuan imunisasi</h2>
              <span className="text-[14px] text-text font-semibold font-tabular">
                {totalDone} dari {totalSchedule} selesai ({progressPercent}%)
              </span>
            </div>

            {/* 6px bar with rounded track */}
            <div className="w-full bg-track rounded-[3px] h-[7px] overflow-hidden">
              <div
                className="bg-primary h-full rounded-[3px] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[13px] text-text-2 pt-0.5">
            <span>
              Imunisasi program <strong className="text-text font-medium">{wajibDone} dari {wajibRows.length}</strong> selesai
            </span>
            <span>
              Vaksin pilihan <strong className="text-text font-medium">{pilihanDone} dari {pilihanRows.length}</strong> selesai
            </span>
          </div>
        </section>

        {/* Compact Keuangan Summary Card with elevation */}
        <section className="bg-surface p-5 sm:p-6 rounded-[12px] border border-border shadow-card flex flex-col justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-[16px] font-semibold text-text">Perencanaan keuangan</h2>
            <p className="text-[13px] text-text-2 leading-relaxed">
              Realisasi pengeluaran saat ini <span className="font-semibold text-text tabular-nums">{formatRupiah(totalRealizedActual)}</span> dari estimasi maksimal <span className="font-semibold text-text tabular-nums">{formatRupiah(totalEstimatedSelfPay)}</span>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToTab("keuangan")}
            className="self-start sm:self-auto px-4 py-2 bg-surface hover:bg-surface-sunken text-text text-[14px] font-medium rounded-[10px] border border-border-strong transition min-h-[40px] cursor-pointer shadow-xs shrink-0"
          >
            Buka keuangan
          </button>
        </section>
      </div>
    </div>
  );
};
