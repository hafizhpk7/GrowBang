import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  RotateCcw,
  LayoutGrid,
  Table as TableIcon,
  X
} from "lucide-react";
import { PaymentMode, Profile, Record, ScheduleRow } from "../../../types";
import { calculateDueDate, formatIndonesianDate, getScheduleStatus } from "../../../utils/dates";
import { formatRupiahRange, getVaccinePriceDisplay } from "../../../utils/calc";
import { CategoryTag, StatusIndicator } from "../../../components/common/Badges";
import { CustomRowModal } from "./CustomRowModal";
import { PaymentModeSelector } from "./PaymentModeSelector";
import { ScheduleCheckbox } from "./ScheduleCheckbox";

interface Props {
  profile: Profile;
  paymentMode: PaymentMode;
  onUpdatePaymentMode: (mode: PaymentMode) => void;
  onUpdateScheduleRow: (row: ScheduleRow) => void;
  onUpdateRecord: (record: Record) => void;
  onAddCustomRow: (row: ScheduleRow) => void;
  onDeleteCustomRow: (rowId: string) => void;
  onResetSchedule: () => void;
  onOpenVaccineDetail: (ref: string) => void;
}

type ActiveFilter = "all" | "program" | "pilihan" | "belum" | "selesai" | "terlambat";

export const ScheduleTab: React.FC<Props> = ({
  profile,
  paymentMode,
  onUpdatePaymentMode,
  onUpdateScheduleRow,
  onUpdateRecord,
  onAddCustomRow,
  onDeleteCustomRow,
  onResetSchedule,
  onOpenVaccineDetail
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [viewMode, setViewMode] = useState<"timeline" | "table">("timeline");
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customRowToEdit, setCustomRowToEdit] = useState<ScheduleRow | null>(null);

  const recordMap = useMemo(() => {
    return new Map<string, Record>(profile.records.map((r) => [r.rowId, r]));
  }, [profile.records]);

  // Compute status for all schedule rows
  const allRowsWithStatus = useMemo(() => {
    return profile.schedule.map((row) => {
      const rec = recordMap.get(row.id);
      const statusInfo = getScheduleStatus(row, rec, profile.tanggalLahir);
      return {
        row,
        record: rec,
        ...statusInfo
      };
    });
  }, [profile.schedule, profile.tanggalLahir, recordMap]);

  // Filtered rows
  const displayedRows = useMemo(() => {
    return allRowsWithStatus.filter((item) => {
      // Year filter
      if (selectedYear !== "all" && item.row.tahun !== selectedYear) {
        return false;
      }

      // Filter chips
      if (activeFilter === "program" && item.row.status !== "Wajib") return false;
      if (activeFilter === "pilihan" && item.row.status !== "Pilihan") return false;
      if (activeFilter === "belum" && item.record?.diberikan) return false;
      if (activeFilter === "selesai" && !item.record?.diberikan) return false;
      if (activeFilter === "terlambat" && item.status !== "Terlambat") return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.row.vaksin.toLowerCase().includes(q);
        const matchUsia = item.row.usia.toLowerCase().includes(q);
        const matchNote = (item.row.catatan || "").toLowerCase().includes(q);
        return matchName || matchUsia || matchNote;
      }

      return true;
    });
  }, [allRowsWithStatus, selectedYear, activeFilter, searchQuery]);

  // Group displayed rows by year
  const groupedByYear = useMemo(() => {
    const map = new Map<number, typeof displayedRows>();
    displayedRows.forEach((item) => {
      const list = map.get(item.row.tahun) || [];
      list.push(item);
      map.set(item.row.tahun, list);
    });
    return map;
  }, [displayedRows]);

  const handleToggleGiven = (row: ScheduleRow, currentGiven: boolean) => {
    const existingRec = recordMap.get(row.id);
    const todayStr = new Date().toISOString().split("T")[0];

    const updatedRec: Record = {
      ...(existingRec || { rowId: row.id }),
      rowId: row.id,
      diberikan: !currentGiven,
      tanggalDiberikan: !currentGiven ? (existingRec?.tanggalDiberikan || todayStr) : existingRec?.tanggalDiberikan,
      tempat: existingRec?.tempat || (row.gratis === "Ya" ? "Puskesmas" : "Klinik"),
      biayaAktual: existingRec?.biayaAktual !== undefined ? existingRec.biayaAktual : row.gratis === "Ya" ? 0 : row.min
    };

    onUpdateRecord(updatedRec);
  };

  const handleResetConfirmation = () => {
    if (confirm("Kembalikan daftar jadwal dan estimasi biaya ke 35 baris bawaan? Catatan yang sudah ada tetap tersimpan.")) {
      onResetSchedule();
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn w-full">
      {/* 1. Header Bar */}
      <div className="flex flex-col xl:flex-row xl:items-baseline justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1 min-w-[20rem]">
          <h1 className="text-[26px] sm:text-[32px] font-semibold leading-tight text-text tracking-tight">
            Jadwal imunisasi
          </h1>
          <p className="text-[14px] sm:text-[15px] text-text-2 mt-1 max-w-prose">
            Garis waktu kronologis imunisasi 0–5 tahun sesuai anjuran resmi IDAI & Kemenkes RI.
          </p>
        </div>

        {/* Action controls: wrap gracefully on 320px-430px */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Payment Mode Selector Badge */}
          <PaymentModeSelector
            paymentMode={paymentMode}
            onChange={onUpdatePaymentMode}
            variant="badge"
          />

          {/* Timeline / Table Switch */}
          <div className="flex bg-surface-sunken p-1 rounded-[10px] border border-border">
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-[8px] text-[12px] sm:text-[13px] transition cursor-pointer min-h-[36px] ${
                viewMode === "timeline"
                  ? "bg-surface text-text font-semibold border border-border shadow-xs"
                  : "text-text-2 hover:text-text font-medium"
              }`}
              title="Tampilan Garis Waktu"
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline sm:inline">Garis waktu</span>
              <span className="inline xs:hidden sm:hidden">Timeline</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-[8px] text-[12px] sm:text-[13px] transition cursor-pointer min-h-[36px] ${
                viewMode === "table"
                  ? "bg-surface text-text font-semibold border border-border shadow-xs"
                  : "text-text-2 hover:text-text font-medium"
              }`}
              title="Tampilan Tabel"
            >
              <TableIcon className="w-4 h-4 shrink-0" />
              <span>Tabel</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setCustomRowToEdit(null);
              setCustomModalOpen(true);
            }}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-surface hover:bg-surface-sunken text-text text-[12px] sm:text-[13px] font-medium rounded-[10px] border border-border transition min-h-[40px] flex items-center gap-1.5 cursor-pointer shadow-xs hover:border-border-strong shrink-0"
          >
            <Plus className="w-4 h-4 text-primary shrink-0" />
            <span>Kustom</span>
          </button>

          <button
            type="button"
            onClick={handleResetConfirmation}
            className="p-2 sm:p-2.5 bg-surface hover:bg-surface-sunken text-text-2 hover:text-text rounded-[10px] border border-border transition min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer shadow-xs shrink-0"
            title="Reset ke 35 baris bawaan"
            aria-label="Reset ke 35 baris bawaan"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Filters & Search */}
      <div className="space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-text-2 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari vaksin, usia, atau catatan..."
            className="w-full pl-10 pr-9 py-2 text-[14px] rounded-[10px] border border-border bg-surface text-text min-h-[44px] shadow-2xs focus:border-primary"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-2 hover:text-text cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
              aria-label="Bersihkan pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Chips: horizontally scrollable container below lg, wraps at lg+ */}
        <div className="flex items-center gap-2 overflow-x-auto lg:overflow-visible pb-1.5 pt-0.5 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 lg:mx-0 lg:px-0 lg:flex-wrap">
          {[
            { id: "all", label: "Semua" },
            { id: "program", label: "Imunisasi program" },
            { id: "pilihan", label: "Vaksin pilihan" },
            { id: "belum", label: "Belum dilakukan" },
            { id: "selesai", label: "Selesai" },
            { id: "terlambat", label: "Terlambat" }
          ].map((chip) => {
            const isSelected = activeFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setActiveFilter(chip.id as ActiveFilter)}
                className={`px-3 py-1.5 rounded-[8px] text-[13px] whitespace-nowrap transition cursor-pointer min-h-[36px] shrink-0 ${
                  isSelected
                    ? "bg-surface text-text font-semibold border border-border-strong shadow-xs"
                    : "bg-surface text-text-2 hover:text-text border border-border font-medium"
                }`}
              >
                {chip.label}
              </button>
            );
          })}

          <span className="text-border shrink-0 lg:hidden">|</span>

          {/* Year selector */}
          <button
            type="button"
            onClick={() => setSelectedYear("all")}
            className={`px-3 py-1.5 rounded-[8px] text-[13px] whitespace-nowrap transition cursor-pointer min-h-[36px] shrink-0 ${
              selectedYear === "all"
                ? "bg-surface text-text font-semibold border border-border-strong shadow-xs"
                : "bg-surface text-text-2 hover:text-text border border-border font-medium"
            }`}
          >
            Semua tahun
          </button>
          {([1, 2, 3, 4, 5] as const).map((th) => (
            <button
              key={th}
              type="button"
              onClick={() => setSelectedYear(th)}
              className={`px-3 py-1.5 rounded-[8px] text-[13px] whitespace-nowrap transition cursor-pointer min-h-[36px] shrink-0 ${
                selectedYear === th
                  ? "bg-surface text-text font-semibold border border-border-strong shadow-xs"
                  : "bg-surface text-text-2 hover:text-text border border-border font-medium"
              }`}
            >
              Tahun {th}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Schedule Content */}
      {displayedRows.length === 0 ? (
        <div className="p-8 bg-surface rounded-[12px] border border-border shadow-card text-center text-text-2 text-[14px]">
          Tidak ada jadwal imunisasi yang cocok dengan filter atau pencarian Anda.
        </div>
      ) : viewMode === "timeline" ? (
        <div className="space-y-6">
          {Array.from(groupedByYear.entries()).map(([yearNum, items]) => {
            return (
              <div key={yearNum} className="space-y-3">
                {/* Year Header (sticky) */}
                <div className="sticky top-16 z-10 bg-bg/95 py-2.5 border-b border-border flex items-baseline justify-between backdrop-blur-xs">
                  <h2 className="text-[18px] font-serif font-semibold text-text">
                    Tahun {yearNum}{" "}
                    <span className="text-[13px] text-text-2 font-normal font-sans">
                      (
                      {yearNum === 1
                        ? "0–12 bulan"
                        : yearNum === 2
                        ? "1–2 tahun"
                        : yearNum === 3
                        ? "2–3 tahun"
                        : yearNum === 4
                        ? "3–4 tahun"
                        : "4–5 tahun"}
                      )
                    </span>
                  </h2>
                  <span className="text-[13px] text-text font-medium font-tabular">
                    {items.length} jadwal
                  </span>
                </div>

                {/* Rows as elevated card container */}
                <div className="bg-surface rounded-[12px] border border-border shadow-card divide-y divide-border overflow-hidden">
                  {items.map((item) => {
                    const isDone = Boolean(item.record?.diberikan);
                    const priceInfo = getVaccinePriceDisplay(item.row, paymentMode);

                    return (
                      <div
                        key={item.row.id}
                        className="grid grid-cols-[auto_minmax(0,1fr)] sm:grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 gap-y-2 items-start px-4 py-4 sm:px-5 hover:bg-surface-sunken/40 transition-colors"
                      >
                        {/* Column 1: Checkbox */}
                        <ScheduleCheckbox
                          size="md"
                          checked={isDone}
                          onToggle={() => handleToggleGiven(item.row, isDone)}
                          label={`Tandai ${item.row.vaksin} selesai`}
                        />

                        {/* Column 2: Text block.
                            Vertical alignment: checkbox height = 44px (center at 22px).
                            Title line-height (leading-snug at text-base/16px) = 22px (center at 11px).
                            Text block top padding = (44px - 22px) / 2 = 11px (pt-[11px]). */}
                        <div className="space-y-1.5 min-w-0 pt-[11px]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => onOpenVaccineDetail(item.row.ref)}
                              className={`text-[15px] sm:text-base font-semibold leading-snug hover:text-primary hover:underline text-left cursor-pointer break-words ${
                                isDone ? "text-text-2 line-through" : "text-text"
                              }`}
                            >
                              {item.row.vaksin}
                            </button>
                            <CategoryTag gratis={item.row.gratis} />
                          </div>

                          <div className="flex items-center gap-x-2 gap-y-1.5 flex-wrap text-[13px] text-text-2">
                            <span className="font-medium text-text">Usia {item.row.usia}</span>
                            <span className="text-text-2">·</span>
                            <StatusIndicator status={item.status} />
                            {item.dueDateStr && (
                              <>
                                <span className="text-text-2">·</span>
                                <span className="font-medium">{item.dueDateStr}</span>
                              </>
                            )}
                          </div>

                          {item.row.catatan && (
                            <p className="text-[12.5px] leading-relaxed text-text-2 line-clamp-2 lg:line-clamp-3 break-words pt-0.5">
                              {item.row.catatan}
                            </p>
                          )}
                        </div>

                        {/* Column 3 on sm+, Column 2 row 2 on mobile: Price & Info Detail */}
                        <div className="col-start-2 sm:col-start-auto flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2.5 sm:pt-0 border-t border-border/40 sm:border-t-0 sm:min-w-[11rem] sm:text-right font-tabular">
                          <div className="text-left sm:text-right">
                            <span
                              className={`text-[13px] font-medium font-tabular block ${
                                priceInfo.isFree ? "text-primary font-semibold" : "text-text"
                              }`}
                            >
                              {priceInfo.text}
                            </span>
                            {priceInfo.warningNote && (
                              <span className="inline-block text-[10px] text-warning-text bg-warning-tint border border-warning/20 rounded px-1.5 py-0.5 mt-0.5 font-medium">
                                {priceInfo.warningNote}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => onOpenVaccineDetail(item.row.ref)}
                            className="px-3.5 py-2 rounded-[8px] bg-surface-sunken hover:bg-border text-[13px] text-primary hover:text-primary-hover font-semibold transition cursor-pointer min-h-[40px] sm:min-h-[36px] flex items-center justify-center border border-border shrink-0 active:scale-95"
                          >
                            Info Detail
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View with robust structured layout and responsive overflow */
        <div className="bg-surface rounded-[12px] border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-[14px] min-w-[720px] table-fixed border-collapse">
              <colgroup>
                <col className="w-[168px]" />
                <col className="min-w-[260px]" />
                <col className="w-[96px]" />
                <col className="w-[112px] hidden xl:table-column" />
                <col className="w-[168px]" />
                <col className="w-[88px]" />
              </colgroup>
              <thead className="bg-surface-sunken border-b border-border text-[11px] font-semibold text-text-2 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="py-3 px-4 text-left">
                    Status
                  </th>
                  <th scope="col" className="py-3 px-4 text-left">
                    Vaksin
                  </th>
                  <th scope="col" className="py-3 px-4 text-left">
                    Usia
                  </th>
                  <th scope="col" className="py-3 px-4 text-left hidden xl:table-cell">
                    Kategori
                  </th>
                  <th scope="col" className="py-3 px-4 text-left">
                    Estimasi Biaya
                  </th>
                  <th scope="col" className="py-3 px-4 text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-text-2 text-[14px]">
                      Tidak ada imunisasi yang cocok dengan filter atau kata kunci.
                    </td>
                  </tr>
                ) : (
                  displayedRows.map((item) => {
                    const isDone = Boolean(item.record?.diberikan);
                    const priceInfo = getVaccinePriceDisplay(item.row, paymentMode);
                    return (
                      <tr
                        key={item.row.id}
                        className={`transition-colors hover:bg-surface-sunken/40 group ${
                          isDone ? "bg-surface/50" : "bg-surface"
                        }`}
                      >
                        {/* 1. Status Column: Checkbox + Status indicator aligned on middle axis */}
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center gap-2">
                            <ScheduleCheckbox
                              size="sm"
                              checked={isDone}
                              onToggle={() => handleToggleGiven(item.row, isDone)}
                              label={`Tandai status ${item.row.vaksin}`}
                              title={isDone ? "Tandai belum diberikan" : "Tandai sudah diberikan"}
                            />
                            <StatusIndicator status={item.status} />
                          </div>
                        </td>

                        {/* 2. Vaccine Column: Bold title, optional inline CategoryTag, and notes */}
                        <td className="py-3 px-4 align-middle">
                          <div className="flex flex-col gap-1 pr-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => onOpenVaccineDetail(item.row.ref)}
                                className={`font-semibold text-[14px] text-left hover:text-primary transition-colors cursor-pointer break-words leading-snug ${
                                  isDone ? "text-text-2 line-through" : "text-text"
                                }`}
                              >
                                {item.row.vaksin}
                              </button>
                              <span className="xl:hidden">
                                <CategoryTag gratis={item.row.gratis} />
                              </span>
                            </div>
                            {item.row.catatan ? (
                              <p className="text-[12.5px] text-text-2 leading-relaxed break-words line-clamp-2">
                                {item.row.catatan}
                              </p>
                            ) : null}
                          </div>
                        </td>

                        {/* 3. Age Column */}
                        <td className="py-3 px-4 align-middle whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded-[6px] text-[12px] font-medium bg-surface-sunken text-text border border-border">
                            {item.row.usia}
                          </span>
                        </td>

                        {/* 4. Category Column (hidden below xl) */}
                        <td className="py-3 px-4 align-middle whitespace-nowrap hidden xl:table-cell">
                          <CategoryTag gratis={item.row.gratis} />
                        </td>

                        {/* 5. Cost Column: Tabular price estimate */}
                        <td className="py-3 px-4 align-middle whitespace-nowrap font-tabular text-[13px] font-medium">
                          {priceInfo.isFree ? (
                            <span className="text-primary font-semibold">{priceInfo.text}</span>
                          ) : (
                            <div>
                              <span className="text-text">{priceInfo.text}</span>
                              {priceInfo.warningNote && (
                                <span className="block text-[10px] text-warning-text bg-warning-tint border border-warning/20 rounded px-1.5 py-0.5 mt-0.5 w-max font-medium">
                                  {priceInfo.warningNote}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 6. Action Column: Pinned strictly to the right */}
                        <td className="py-3 px-4 align-middle text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onOpenVaccineDetail(item.row.ref)}
                            className="px-2.5 py-1 text-[13px] text-primary hover:text-primary-hover hover:bg-primary-tint font-semibold rounded-[6px] transition cursor-pointer min-h-[32px] inline-flex items-center justify-center border border-transparent hover:border-primary/20"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <p className="lg:hidden text-[12px] text-text-2 mt-2 px-4 pb-3">
            Geser ke samping untuk melihat kolom lainnya.
          </p>
        </div>
      )}

      {/* Custom Row Modal */}
      {customModalOpen && (
        <CustomRowModal
          isOpen={customModalOpen}
          rowToEdit={customRowToEdit}
          onClose={() => {
            setCustomModalOpen(false);
            setCustomRowToEdit(null);
          }}
          onSave={(row) => {
            if (customRowToEdit) {
              onUpdateScheduleRow(row);
            } else {
              onAddCustomRow(row);
            }
            setCustomModalOpen(false);
            setCustomRowToEdit(null);
          }}
          onDelete={(id) => {
            onDeleteCustomRow(id);
            setCustomModalOpen(false);
            setCustomRowToEdit(null);
          }}
        />
      )}
    </div>
  );
};
