import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  RotateCcw,
  Calendar,
  X,
  LayoutGrid,
  Table as TableIcon,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { SEED_SCHEDULE } from "../../data/seed";
import { Profile, Record, ScheduleRow } from "../../types";
import { formatRupiah, YEAR_LABELS } from "../../utils/calc";
import { calculateDueDate, formatIndonesianDate, getScheduleStatus } from "../../utils/dates";
import { GratisBadge, ScheduleStatusBadge, StatusBadge } from "../common/Badges";
import { CustomRowModal } from "./CustomRowModal";
import { RecordModal } from "./RecordModal";

interface Props {
  profile: Profile;
  onUpdateScheduleRow: (updatedRow: ScheduleRow) => void;
  onUpdateRecord: (record: Record) => void;
  onAddCustomRow: (newRow: ScheduleRow) => void;
  onDeleteCustomRow: (id: string) => void;
  onResetSchedule: () => void;
  onOpenVaccineDetail: (ref: string) => void;
}

type ActiveFilterChip =
  | "all"
  | "wajib"
  | "pilihan"
  | "kondisional"
  | "belum"
  | "selesai"
  | "terlambat"
  | "segera"
  | "gratis"
  | "swasta";

export const ScheduleTab: React.FC<Props> = ({
  profile,
  onUpdateScheduleRow,
  onUpdateRecord,
  onAddCustomRow,
  onDeleteCustomRow,
  onResetSchedule,
  onOpenVaccineDetail
}) => {
  // Navigation by Year: "all" or 1..5
  const [selectedYear, setSelectedYear] = useState<"all" | 1 | 2 | 3 | 4 | 5>("all");

  // View mode: 'timeline' vs 'table'
  const [viewMode, setViewMode] = useState<"timeline" | "table">("timeline");

  // Expanded rows state (Set of row IDs that are expanded)
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());

  // Search & Horizontally Scrollable Filter Chips
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChip, setActiveChip] = useState<ActiveFilterChip>("all");

  // Modals state
  const [activeRecordRow, setActiveRecordRow] = useState<ScheduleRow | null>(null);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customRowToEdit, setCustomRowToEdit] = useState<ScheduleRow | null>(null);

  // Quick record map
  const recordMap = useMemo(() => {
    return new Map<string, Record>(profile.records.map((r) => [r.rowId, r]));
  }, [profile.records]);

  // Filtered and sorted schedule rows
  const displayedRows = useMemo(() => {
    return profile.schedule
      .filter((row) => {
        // Year filter
        if (selectedYear !== "all" && row.tahun !== selectedYear) return false;

        // Search text
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = row.vaksin.toLowerCase().includes(q);
          const matchNote = row.catatan.toLowerCase().includes(q);
          const matchAge = row.usia.toLowerCase().includes(q);
          if (!matchName && !matchNote && !matchAge) return false;
        }

        // Active Filter Chip logic
        const rec = recordMap.get(row.id);
        const isGiven = Boolean(rec?.diberikan);
        const { status: schedStatus } = getScheduleStatus(row, rec, profile.tanggalLahir);

        if (activeChip === "wajib" && row.status !== "Wajib") return false;
        if (activeChip === "pilihan" && row.status !== "Pilihan") return false;
        if (activeChip === "kondisional" && row.status !== "Kondisional") return false;
        if (activeChip === "belum" && isGiven) return false;
        if (activeChip === "selesai" && !isGiven) return false;
        if (activeChip === "terlambat" && schedStatus !== "Terlambat") return false;
        if (activeChip === "segera" && schedStatus !== "Segera") return false;
        if (activeChip === "gratis" && row.gratis !== "Ya") return false;
        if (activeChip === "swasta" && row.gratis === "Ya") return false;

        return true;
      })
      .sort((a, b) => {
        if (a.bln !== b.bln) return a.bln - b.bln;
        if (a.tahun !== b.tahun) return a.tahun - b.tahun;
        return a.id.localeCompare(b.id);
      });
  }, [profile.schedule, selectedYear, searchQuery, activeChip, recordMap, profile.tanggalLahir]);

  // Group displayed rows into chronological Milestones for Timeline View
  const milestones = useMemo(() => {
    const groups: {
      bln: number;
      usia: string;
      dueDateStr: string;
      tahun: number;
      rows: ScheduleRow[];
      completedCount: number;
      allDone: boolean;
      hasOverdue: boolean;
    }[] = [];

    const map = new Map<number, typeof groups[0]>();

    displayedRows.forEach((row) => {
      let group = map.get(row.bln);
      if (!group) {
        const dueDate = calculateDueDate(profile.tanggalLahir, row.bln);
        group = {
          bln: row.bln,
          usia: row.usia,
          dueDateStr: formatIndonesianDate(dueDate),
          tahun: row.tahun,
          rows: [],
          completedCount: 0,
          allDone: false,
          hasOverdue: false
        };
        map.set(row.bln, group);
        groups.push(group);
      }
      group.rows.push(row);
    });

    // Calculate completion & overdue status per milestone
    groups.forEach((g) => {
      let done = 0;
      let overdue = false;
      g.rows.forEach((r) => {
        const rec = recordMap.get(r.id);
        if (rec?.diberikan) done++;
        const st = getScheduleStatus(r, rec, profile.tanggalLahir).status;
        if (st === "Terlambat") overdue = true;
      });
      g.completedCount = done;
      g.allDone = g.rows.length > 0 && done === g.rows.length;
      g.hasOverdue = overdue && !g.allDone;
    });

    return groups;
  }, [displayedRows, profile.tanggalLahir, recordMap]);

  // Toggle single row expansion
  const toggleRowExpansion = (rowId: string) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  // Expand / collapse all currently displayed rows
  const toggleExpandAll = () => {
    if (expandedRowIds.size === displayedRows.length) {
      setExpandedRowIds(new Set());
    } else {
      setExpandedRowIds(new Set(displayedRows.map((r) => r.id)));
    }
  };

  // Handle quick checkbox toggle
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

  // Handle inline change of min cost
  const handleMinChange = (row: ScheduleRow, value: string) => {
    const parsed = parseInt(value.replace(/\D/g, ""), 10) || 0;
    onUpdateScheduleRow({ ...row, min: parsed });
  };

  // Handle inline change of max cost
  const handleMaxChange = (row: ScheduleRow, value: string) => {
    const parsed = parseInt(value.replace(/\D/g, ""), 10) || 0;
    onUpdateScheduleRow({ ...row, max: parsed });
  };

  // Handle inline toggle of "masuk"
  const handleToggleMasuk = (row: ScheduleRow) => {
    onUpdateScheduleRow({ ...row, masuk: !row.masuk });
  };

  const handleResetConfirmation = () => {
    if (
      confirm(
        "Kembalikan seluruh daftar vaksin dan estimasi biaya ke 35 baris bawaan untuk profil ini? Catatan pemberian yang sudah ada akan tetap tersimpan."
      )
    ) {
      onResetSchedule();
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header Bar & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Jadwal Imunisasi Anak (0–5 Tahun)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Garis waktu kronologis imunisasi sesuai anjuran IDAI & Kemenkes RI.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap sm:flex-nowrap">
          {/* Timeline / Table Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[36px] ${
                viewMode === "timeline"
                  ? "bg-white text-[#1F4E78] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Tampilan Garis Waktu Kronologis (Timeline View)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[36px] ${
                viewMode === "table"
                  ? "bg-white text-[#1F4E78] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Tampilan Tabel Lengkap"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setCustomRowToEdit(null);
              setCustomModalOpen(true);
            }}
            className="px-4 py-2 bg-[#1F4E78] hover:bg-[#153654] text-white rounded-2xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 shadow-sm min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kustom</span>
          </button>
          <button
            type="button"
            onClick={handleResetConfirmation}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs sm:text-sm font-medium transition flex items-center justify-center min-h-[44px] min-w-[44px]"
            title="Reset ke 35 baris awal"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Year Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedYear("all")}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-xs min-h-[44px] ${
            selectedYear === "all"
              ? "bg-[#1F4E78] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/90"
          }`}
        >
          Semua Usia (0–5 Thn)
        </button>
        {([1, 2, 3, 4, 5] as const).map((th) => (
          <button
            key={th}
            type="button"
            onClick={() => setSelectedYear(th)}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-xs min-h-[44px] flex items-center gap-1.5 ${
              selectedYear === th
                ? "bg-[#1F4E78] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/90"
            }`}
          >
            <span>Tahun {th}</span>
            <span className={`text-[11px] font-normal ${selectedYear === th ? "text-teal-200" : "text-slate-400"}`}>
              ({YEAR_LABELS[th]})
            </span>
          </button>
        ))}
      </div>

      {/* 3. Search Bar & HORIZONTAL SCROLLABLE FILTER CHIPS (Like YouTube Categories) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm space-y-3.5">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama vaksin, usia, atau catatan (misal: PCV, BCG, flu)..."
            className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-slate-50/80 focus:outline-hidden focus:ring-2 focus:ring-[#1F4E78] min-h-[48px]"
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

        {/* Horizontally scrollable Filter Chips ribbon */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none">
          {[
            { id: "all", label: "Semua Kategori" },
            { id: "wajib", label: "Wajib (Program)" },
            { id: "pilihan", label: "Pilihan (IDAI)" },
            { id: "kondisional", label: "Kondisional" },
            { id: "belum", label: "Belum Diberikan" },
            { id: "selesai", label: "Sudah Diberikan" },
            { id: "terlambat", label: "Terlambat" },
            { id: "segera", label: "Segera (≤30 hr)" },
            { id: "gratis", label: "Gratis di Puskesmas" },
            { id: "swasta", label: "Swasta (Berbayar)" }
          ].map((chip) => {
            const isChipActive = activeChip === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setActiveChip(chip.id as ActiveFilterChip)}
                className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 min-h-[38px] ${
                  isChipActive
                    ? "bg-[#1F4E78] text-white shadow-xs scale-102"
                    : "bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 border border-slate-200/60"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Status counter & collapse/expand toggle */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>Menampilkan <strong>{displayedRows.length}</strong> vaksin ({milestones.length} tahapan usia)</span>
          <div className="flex items-center gap-3">
            {displayedRows.length > 0 && (
              <button
                type="button"
                onClick={toggleExpandAll}
                className="text-[#1F4E78] font-bold hover:underline"
              >
                {expandedRowIds.size === displayedRows.length ? "Tutup Semua Rincian" : "Buka Semua Rincian"}
              </button>
            )}
            {(activeChip !== "all" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveChip("all");
                }}
                className="text-slate-400 hover:text-slate-700 font-semibold"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. VERTICAL TIMELINE VIEW (Chronological Journey) */}
      {displayedRows.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-500 space-y-2">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold">Tidak ada jadwal yang sesuai dengan filter atau kata kunci pencarian.</p>
        </div>
      ) : viewMode === "timeline" ? (
        <div className="relative pt-2 pb-8">
          {/* Vertical continuous line down the left side */}
          <div className="absolute left-[15px] sm:left-[21px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-300 via-slate-300 to-slate-200" />

          {/* Chronological Milestones Stack */}
          <div className="space-y-8">
            {milestones.map((m) => {
              return (
                <div key={m.bln} className="relative pl-9 sm:pl-12">
                  {/* Milestone Node on the timeline */}
                  <div
                    className={`absolute left-0 sm:left-1.5 top-0.5 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-extrabold text-xs shadow-xs transition-all z-10 border-2 ${
                      m.allDone
                        ? "bg-emerald-500 border-white text-white shadow-emerald-500/20"
                        : m.hasOverdue
                        ? "bg-rose-600 border-white text-white shadow-rose-600/20 animate-pulse"
                        : "bg-white border-[#1F4E78] text-[#1F4E78]"
                    }`}
                    title={`Milestone usia ${m.usia}`}
                  >
                    {m.allDone ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : m.hasOverdue ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <span>{m.bln === 0 ? "0" : `${m.bln}m`}</span>
                    )}
                  </div>

                  {/* Milestone Header Info */}
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-3 pt-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                        Usia {m.usia}
                      </span>
                      <span className="text-xs text-slate-500">
                        • Jatuh tempo: <strong className="text-slate-700">{m.dueDateStr}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {m.allDone ? (
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Lengkap ({m.completedCount}/{m.rows.length})
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {m.completedCount}/{m.rows.length} Selesai
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Corresponding Vaccine Cards placed on the right side of the timeline */}
                  <div className="space-y-3">
                    {m.rows.map((row) => {
                      const rec = recordMap.get(row.id);
                      const isGiven = Boolean(rec?.diberikan);
                      const { status, dueDateStr } = getScheduleStatus(row, rec, profile.tanggalLahir);
                      const isExpanded = expandedRowIds.has(row.id);

                      return (
                        <div
                          key={row.id}
                          className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs overflow-hidden ${
                            isGiven
                              ? "border-emerald-200/90 bg-emerald-50/20"
                              : "border-slate-200/90 hover:border-slate-300"
                          }`}
                        >
                          {/* Row Header */}
                          <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                            {/* Left: Big Checkbox & Vaccine Details */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => handleToggleGiven(row, isGiven)}
                                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all ${
                                  isGiven
                                    ? "bg-emerald-500 border-emerald-600 text-white shadow-xs"
                                    : "bg-slate-50 border-slate-300 text-transparent hover:border-slate-400"
                                }`}
                                title={isGiven ? "Tandai belum diberikan" : "Tandai sudah diberikan"}
                                aria-label={`Tandai ${row.vaksin} sudah diberikan`}
                              >
                                <Check className={`w-5 h-5 ${isGiven ? "text-white" : "opacity-0"}`} />
                              </button>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => onOpenVaccineDetail(row.ref)}
                                    className="font-extrabold text-slate-900 hover:text-[#1F4E78] text-sm sm:text-base leading-tight hover:underline text-left truncate"
                                  >
                                    {row.vaksin}
                                  </button>
                                  {row.isCustom && (
                                    <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                      Kustom
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 mt-1">
                                  <StatusBadge status={row.status} size="sm" />
                                  <GratisBadge gratis={row.gratis} size="sm" />
                                  <ScheduleStatusBadge status={status} size="sm" />
                                </div>
                              </div>
                            </div>

                            {/* Right: Price & Expand/Action */}
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="text-right hidden sm:block">
                                <span className="text-xs font-mono font-bold text-slate-700 block">
                                  {row.gratis === "Ya" ? "Gratis" : `${formatRupiah(row.min)} – ${formatRupiah(row.max)}`}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {row.masuk ? "Masuk Total" : "Dikecualikan"}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleRowExpansion(row.id)}
                                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                                title={isExpanded ? "Tutup rincian" : "Buka rincian biaya & aksi"}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5 text-[#1F4E78]" />
                                ) : (
                                  <ChevronDown className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Card Details */}
                          {isExpanded && (
                            <div className="p-4 bg-slate-50/80 border-t border-slate-100 space-y-3.5 animate-fadeIn">
                              {/* Clinical notes if available */}
                              {row.catatan && (
                                <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                                  {row.catatan}
                                </p>
                              )}

                              {/* Editable Price & Masuk Total */}
                              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                    Biaya Swasta (Min – Maks / Dosis)
                                  </label>
                                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#0000FF]">
                                    <input
                                      type="text"
                                      value={new Intl.NumberFormat("id-ID").format(row.min)}
                                      onChange={(e) => handleMinChange(row, e.target.value)}
                                      className="w-24 px-2.5 py-1.5 rounded-xl border border-blue-300 bg-blue-50/20 text-right min-h-[38px] focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span>–</span>
                                    <input
                                      type="text"
                                      value={new Intl.NumberFormat("id-ID").format(row.max)}
                                      onChange={(e) => handleMaxChange(row, e.target.value)}
                                      className="w-24 px-2.5 py-1.5 rounded-xl border border-blue-300 bg-blue-50/20 text-right min-h-[38px] focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-1 sm:text-right">
                                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                    Masuk Perhitungan Total?
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleMasuk(row)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition min-h-[38px] ${
                                      row.masuk
                                        ? "text-[#0000FF] border-blue-300 bg-blue-50"
                                        : "text-slate-400 border-slate-300 bg-slate-100"
                                    }`}
                                  >
                                    {row.masuk ? "Ya (Dihitung)" : "Tidak (Dikecualikan)"}
                                  </button>
                                </div>
                              </div>

                              {/* Bottom Action buttons */}
                              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => onOpenVaccineDetail(row.ref)}
                                  className="text-xs font-bold text-[#1F4E78] hover:underline py-1.5 flex items-center gap-1"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Lihat Info Medis & KIPI</span>
                                </button>

                                <div className="flex items-center gap-2">
                                  {row.isCustom && (
                                    <button
                                      type="button"
                                      onClick={() => onDeleteCustomRow(row.id)}
                                      className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition min-h-[40px]"
                                    >
                                      Hapus
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setActiveRecordRow(row)}
                                    className="px-4 py-2 bg-[#1F4E78] hover:bg-[#153654] text-white rounded-xl text-xs font-bold transition shadow-xs min-h-[40px]"
                                  >
                                    Catat Tempat & Klaim Asuransi
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Traditional Spreadsheet Table View */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#1F4E78] text-white text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-3 w-12 text-center">Beri</th>
                  <th className="py-3 px-3 w-16">Usia</th>
                  <th className="py-3 px-4">Nama Vaksin</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Gratis</th>
                  <th className="py-3 px-3">Jatuh Tempo</th>
                  <th className="py-3 px-3 text-right">Biaya Swasta (Rp)</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedRows.map((row) => {
                  const rec = recordMap.get(row.id);
                  const isGiven = Boolean(rec?.diberikan);
                  const { dueDateStr } = getScheduleStatus(row, rec, profile.tanggalLahir);

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleGiven(row, isGiven)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto border transition ${
                            isGiven
                              ? "bg-emerald-500 border-emerald-600 text-white"
                              : "bg-white border-slate-300 text-transparent"
                          }`}
                        >
                          <Check className={`w-4 h-4 ${isGiven ? "text-white" : "opacity-0"}`} />
                        </button>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700">{row.usia}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{row.vaksin}</td>
                      <td className="py-3 px-3 text-center"><StatusBadge status={row.status} size="sm" /></td>
                      <td className="py-3 px-3 text-center"><GratisBadge gratis={row.gratis} size="sm" /></td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-xs">{dueDateStr}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#0000FF]">
                        {row.gratis === "Ya" ? "Rp 0" : `${formatRupiah(row.min)} – ${formatRupiah(row.max)}`}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setActiveRecordRow(row)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[#1F4E78] font-bold rounded-lg text-xs"
                        >
                          Catat
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Administration Modal */}
      {activeRecordRow && (
        <RecordModal
          row={activeRecordRow}
          record={recordMap.get(activeRecordRow.id)}
          dueDateStr={formatIndonesianDate(calculateDueDate(profile.tanggalLahir, activeRecordRow.bln))}
          onClose={() => setActiveRecordRow(null)}
          onSave={(rec) => {
            onUpdateRecord(rec);
            setActiveRecordRow(null);
          }}
        />
      )}

      {/* Custom Row Add/Edit Modal */}
      {customModalOpen && (
        <CustomRowModal
          isOpen={customModalOpen}
          rowToEdit={customRowToEdit}
          onClose={() => {
            setCustomModalOpen(false);
            setCustomRowToEdit(null);
          }}
          onSave={(savedRow) => {
            if (customRowToEdit) {
              onUpdateScheduleRow(savedRow);
            } else {
              onAddCustomRow(savedRow);
            }
            setCustomModalOpen(false);
            setCustomRowToEdit(null);
          }}
        />
      )}
    </div>
  );
};
