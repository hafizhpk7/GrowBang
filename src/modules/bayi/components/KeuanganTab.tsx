import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { ChevronDown, ChevronUp, CheckSquare, Square } from "lucide-react";
import { CHECKLIST_ITEMS } from "../../../data/seed";
import { Insurance, PaymentMode, Profile, ScheduleRow } from "../../../types";
import {
  calculateCostSummary,
  calculateRealization,
  formatRupiah,
  formatRupiahRange,
  getVaccinePriceDisplay,
  ScenarioOptions
} from "../../../utils/calc";
import { CategoryTag } from "../../../components/common/Badges";
import { PaymentModeSelector } from "./PaymentModeSelector";

interface Props {
  profile: Profile;
  paymentMode: PaymentMode;
  onUpdatePaymentMode: (mode: PaymentMode) => void;
  onUpdateInsurance: (insurance: Insurance) => void;
  onOpenRecordModal: (row: ScheduleRow) => void;
}

type SubTab = "simulasi" | "asuransi" | "realisasi";

export const KeuanganTab: React.FC<Props> = ({
  profile,
  paymentMode,
  onUpdatePaymentMode,
  onUpdateInsurance
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("simulasi");
  const [scenarios, setScenarios] = useState<ScenarioOptions>({
    heksavalenSwasta: false,
    sertakanKondisional: false
  });
  const [expandedYearSet, setExpandedYearSet] = useState<Set<number>>(new Set([1, 2]));

  const insurance = profile.insurance;

  const { years, total } = useMemo(() => {
    return calculateCostSummary(profile.schedule, scenarios, paymentMode);
  }, [profile.schedule, scenarios, paymentMode]);

  const realization = useMemo(
    () => calculateRealization(profile.records, profile.schedule),
    [profile.records, profile.schedule]
  );

  const rowMap = useMemo(
    () => new Map<string, ScheduleRow>(profile.schedule.map((r) => [r.id, r])),
    [profile.schedule]
  );

  // Group schedule rows by year
  const rowsByYear = useMemo(() => {
    const map = new Map<number, ScheduleRow[]>();
    profile.schedule.forEach((row) => {
      const list = map.get(row.tahun) || [];
      list.push(row);
      map.set(row.tahun, list);
    });
    return map;
  }, [profile.schedule]);

  const claimRecords = useMemo(() => {
    return profile.records
      .filter((rec) => rec.ditanggungAsuransi || (rec.nominalKlaim && rec.nominalKlaim > 0))
      .map((rec) => ({
        record: rec,
        row: rowMap.get(rec.rowId)
      }))
      .filter((item) => item.row !== undefined);
  }, [profile.records, rowMap]);

  // Section 2 Semantics & Narrative:
  const normalMax = total.tanggungSendiriMax + total.dibebaskanMax;
  const govSavingsMax = total.dibebaskanMax;
  const insuranceBenefit = realization.totalKlaimDisetujui;
  const netOutOfPocketMax = Math.max(0, total.tanggungSendiriMax - insuranceBenefit);

  // Stacked chart data
  const chartData = useMemo(() => {
    return years.map((y) => ({
      name: `Th ${y.tahun}`,
      rentang: y.rentangUsia,
      "Kamu bayar": y.tanggungSendiriMax,
      "Gratis (program)": y.dibebaskanMax
    }));
  }, [years]);

  const toggleYearExpansion = (tahun: number) => {
    setExpandedYearSet((prev) => {
      const next = new Set(prev);
      if (next.has(tahun)) next.delete(tahun);
      else next.add(tahun);
      return next;
    });
  };

  const handleFieldChange = (field: keyof Insurance, value: any) => {
    onUpdateInsurance({
      ...insurance,
      [field]: value
    });
  };

  const handleLimitChange = (tahun: 1 | 2 | 3 | 4 | 5, value: string) => {
    const parsed = parseInt(value.replace(/\D/g, ""), 10) || 0;
    onUpdateInsurance({
      ...insurance,
      limitPerTahun: {
        ...insurance.limitPerTahun,
        [tahun]: parsed
      }
    });
  };

  const handleToggleChecklist = (index: number) => {
    const updated = [...(insurance.checklist || [false, false, false, false])];
    updated[index] = !updated[index];
    onUpdateInsurance({
      ...insurance,
      checklist: updated
    });
  };

  return (
    <div className="space-y-7 animate-fadeIn w-full">
      {/* 1. Header */}
      <div>
        <h1 className="text-[28px] sm:text-[32px] font-semibold leading-tight text-text tracking-tight">
          Keuangan
        </h1>
        <p className="text-[15px] text-text-2 mt-1">
          Perencanaan estimasi biaya, subsidi program pemerintah, dan perlindungan asuransi anak.
        </p>
      </div>

      {/* 2. Hero Financial Narrative Card with soft elevation */}
      <section className="bg-surface rounded-[12px] border border-border shadow-[0_2px_10px_-2px_rgba(42,36,32,0.05)] p-5 sm:p-7 space-y-6">
        {/* Payment Mode Selector inside Hero Card */}
        <PaymentModeSelector
          paymentMode={paymentMode}
          onChange={onUpdatePaymentMode}
          variant="full"
        />

        <div className="pt-2 border-t border-border/80">
          <span className="text-[13px] font-medium text-text-2">Estimasi beban mandiri orang tua</span>
          <div className="flex items-baseline gap-3 mt-1 flex-wrap">
            <span className="text-[34px] sm:text-[38px] font-serif font-semibold text-text tabular-nums leading-none">
              {formatRupiah(netOutOfPocketMax)}
            </span>
            <span className="text-[13px] text-text-2 font-medium">
              (total estimasi 0–5 tahun)
            </span>
          </div>
        </div>

        {/* Narrative steps equation with subtle pastel containers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-border text-[13px]">
          <div className="p-3.5 rounded-[10px] bg-surface-sunken/80 border border-border space-y-1">
            <span className="text-text-2 font-medium">Biaya normal di faskes swasta</span>
            <p className="font-semibold text-text text-[16px] font-tabular">
              {formatRupiah(normalMax)}
            </p>
          </div>

          <div className="p-3.5 rounded-[10px] bg-primary-tint/70 space-y-1 border border-primary/20">
            <span className="text-primary-text font-medium">Gratis program pemerintah</span>
            <p className="font-semibold text-primary-text text-[16px] font-tabular">
              - {formatRupiah(govSavingsMax)}
            </p>
          </div>

          <div className="p-3.5 rounded-[10px] bg-info-tint/70 space-y-1 border border-info/20">
            <span className="text-info font-medium">Ditanggung asuransi (disetujui)</span>
            <p className="font-semibold text-info text-[16px] font-tabular">
              - {formatRupiah(insuranceBenefit)}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Sub-section Tabs */}
      <div className="flex bg-surface-sunken p-1 rounded-[10px] border border-border">
        {[
          { id: "simulasi", label: "Simulasi & proyeksi biaya" },
          { id: "asuransi", label: "Polis asuransi" },
          { id: "realisasi", label: "Riwayat realisasi & klaim" }
        ].map((tab) => {
          const isSelected = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as SubTab)}
              className={`flex-1 py-2 text-[13px] sm:text-[14px] rounded-[8px] transition cursor-pointer text-center ${
                isSelected
                  ? "bg-surface text-text font-semibold border border-border shadow-xs"
                  : "text-text-2 hover:text-text font-medium"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4. Tab 1: Simulasi & Proyeksi Biaya */}
      {activeSubTab === "simulasi" && (
        <div className="space-y-6">
          {/* Skenario Switch */}
          <div className="bg-surface rounded-[12px] border border-border shadow-[0_2px_10px_-2px_rgba(42,36,32,0.05)] p-5 space-y-3">
            <h2 className="text-[15px] font-semibold text-text">Skenario perhitungan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-[13px]">
              <label className="flex items-center gap-2.5 cursor-pointer p-2 rounded-[8px] hover:bg-surface-sunken/60 transition">
                <input
                  type="checkbox"
                  checked={scenarios.heksavalenSwasta}
                  onChange={(e) =>
                    setScenarios((s) => ({ ...s, heksavalenSwasta: e.target.checked }))
                  }
                  className="rounded-[4px] border-border-strong text-primary w-4 h-4"
                />
                <span className="text-text font-medium leading-relaxed">
                  Gunakan vaksin kombo heksavalen di klinik / RS swasta
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer p-2 rounded-[8px] hover:bg-surface-sunken/60 transition">
                <input
                  type="checkbox"
                  checked={scenarios.sertakanKondisional}
                  onChange={(e) =>
                    setScenarios((s) => ({ ...s, sertakanKondisional: e.target.checked }))
                  }
                  className="rounded-[4px] border-border-strong text-primary w-4 h-4"
                />
                <span className="text-text font-medium leading-relaxed">
                  Sertakan vaksin kondisional (JE, Meningokokus, MMR)
                </span>
              </label>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-surface rounded-[12px] border border-border shadow-[0_2px_10px_-2px_rgba(42,36,32,0.05)] p-5 sm:p-6 space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[16px] font-semibold text-text">Estimasi pengeluaran per tahun</h2>
              <span className="text-[13px] text-text-2 font-medium">Tahun 1–5</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--text-2)" }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--text-2)" }}
                    tickFormatter={(v) => `${Math.round(v / 1000000)}jt`}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatRupiah(Number(val)), ""]}
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "var(--text)",
                      boxShadow: "var(--shadow-popover)"
                    }}
                  />
                  <Bar dataKey="Gratis (program)" stackId="a" fill="var(--chart-program)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Kamu bayar" stackId="a" fill="var(--chart-parent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-6 text-[12px] pt-1 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-[3px] bg-[#87BBA2]" />
                <span className="text-text-2 font-medium">Gratis program pemerintah</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-[3px] bg-text" />
                <span className="text-text-2 font-medium">Beban mandiri orang tua</span>
              </div>
            </div>
          </div>

          {/* Rincian per tahun accordion */}
          <div className="space-y-3">
            <h2 className="text-[16px] font-semibold text-text">Rincian tahunan</h2>
            <div className="space-y-2.5">
              {years.map((y) => {
                const isExpanded = expandedYearSet.has(y.tahun);
                const yearRows = rowsByYear.get(y.tahun) || [];
                return (
                  <div
                    key={y.tahun}
                    className="bg-surface rounded-[12px] border border-border shadow-[0_2px_10px_-2px_rgba(42,36,32,0.05)] overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => toggleYearExpansion(y.tahun)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-surface-sunken/40 transition cursor-pointer"
                    >
                      <div>
                        <span className="text-[15px] font-semibold text-text">
                          Tahun {y.tahun}{" "}
                          <span className="text-[13px] text-text-2 font-normal">
                            ({y.rentangUsia})
                          </span>
                        </span>
                        <p className="text-[12px] text-text-2 mt-0.5">
                          {yearRows.length} antigen vaksin
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[15px] font-semibold text-text font-tabular">
                          {formatRupiah(y.tanggungSendiriMax)}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-text-2" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-text-2" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 sm:p-5 pt-0 border-t border-border/60 divide-y divide-border/60 text-[13px]">
                        {yearRows.map((row) => {
                          const priceDisplay = getVaccinePriceDisplay(row, paymentMode);
                          return (
                            <div key={row.id} className="py-2.5 flex items-center justify-between gap-3">
                              <div className="space-y-0.5">
                                <span className="text-text font-medium">{row.vaksin}</span>
                                <div className="flex items-center gap-2 text-text-2 text-[12px] flex-wrap">
                                  <span>Usia {row.usia}</span>
                                  <span>·</span>
                                  <CategoryTag gratis={row.gratis} />
                                  {priceDisplay.warningNote && (
                                    <span className="inline-block text-[10px] text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded px-1.5 py-0.5 font-medium">
                                      {priceDisplay.warningNote}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className={`font-medium font-tabular ${priceDisplay.isFree ? "text-primary font-semibold" : "text-text"}`}>
                                {priceDisplay.text}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Polis Asuransi */}
      {activeSubTab === "asuransi" && (
        <div className="space-y-6">
          <section className="bg-surface rounded-[12px] border border-border shadow-[0_2px_10px_-2px_rgba(42,36,32,0.05)] p-5 sm:p-6 space-y-4">
            <h2 className="text-[16px] font-semibold text-text">Informasi polis asuransi</h2>

            <div className="space-y-3.5 text-[14px]">
              <div className="space-y-1">
                <label className="text-[13px] font-medium text-text">Nama produk / penyedia asuransi</label>
                <input
                  type="text"
                  value={insurance.namaProduk}
                  onChange={(e) => handleFieldChange("namaProduk", e.target.value)}
                  placeholder="Contoh: Prudential / Manulife / AXA"
                  className="w-full px-3.5 py-2 text-[15px] rounded-[10px] border border-border bg-surface text-text min-h-[44px] shadow-2xs focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[13px] font-medium text-text">Nomor polis</label>
                <input
                  type="text"
                  value={insurance.nomorPolis || ""}
                  onChange={(e) => handleFieldChange("nomorPolis", e.target.value)}
                  placeholder="Contoh: POL-12345678"
                  className="w-full px-3.5 py-2 text-[15px] rounded-[10px] border border-border bg-surface text-text min-h-[44px] shadow-2xs focus:border-primary"
                />
              </div>

              <div className="pt-2">
                <label className="text-[13px] font-medium text-text block mb-2">Limit tahunan rawat jalan imunisasi (Rp)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                  {([1, 2, 3, 4, 5] as const).map((th) => (
                    <div key={th} className="flex items-center justify-between gap-2 p-2.5 bg-surface-sunken/80 border border-border rounded-[8px]">
                      <span className="text-text-2 font-medium">Tahun {th}</span>
                      <input
                        type="number"
                        min="0"
                        step="500000"
                        inputMode="numeric"
                        value={insurance.limitPerTahun?.[th] || 0}
                        onChange={(e) => handleLimitChange(th, e.target.value)}
                        className="w-32 px-2.5 py-1 text-right text-[13px] font-semibold font-tabular rounded-[6px] border border-border bg-surface text-text"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Checklist kelayakan klaim */}
          <section className="bg-surface rounded-[12px] border border-border shadow-[0_2px_10px_-2px_rgba(42,36,32,0.05)] p-5 sm:p-6 space-y-3">
            <h2 className="text-[16px] font-semibold text-text">Kelengkapan dokumen klaim</h2>
            <div className="space-y-2 text-[13px]">
              {CHECKLIST_ITEMS.map((item, idx) => {
                const isChecked = Boolean(insurance.checklist?.[idx]);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleToggleChecklist(idx)}
                    className="w-full text-left p-2.5 rounded-[8px] hover:bg-surface-sunken flex items-start gap-2.5 transition cursor-pointer border border-transparent hover:border-border"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-text-2 shrink-0 mt-0.5" />
                    )}
                    <span className={isChecked ? "text-text font-medium" : "text-text-2"}>{item}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* 6. Tab 3: Riwayat Realisasi & Klaim */}
      {activeSubTab === "realisasi" && (
        <div className="space-y-6">
          <section className="bg-surface rounded-[12px] border border-border shadow-[0_2px_10px_-2px_rgba(42,36,32,0.05)] p-5 sm:p-6 space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[16px] font-semibold text-text">Riwayat pengeluaran riil</h2>
              <span className="text-[14px] font-semibold text-text font-tabular">
                Total tercatat: {formatRupiah(realization.totalBiayaAktual)}
              </span>
            </div>

            {claimRecords.length === 0 ? (
              <div className="py-8 text-center text-text-2 text-[14px] bg-surface-sunken/40 rounded-[8px] border border-border/60">
                Belum ada pengeluaran atau pengajuan klaim asuransi yang tercatat. Catat vaksinasi selesai untuk menambahkan riwayat transaksi.
              </div>
            ) : (
              <div className="divide-y divide-border border border-border rounded-[8px] overflow-hidden">
                {claimRecords.map(({ record, row }) => (
                  <div key={record.rowId} className="p-3.5 flex items-center justify-between gap-3 text-[13px] hover:bg-surface-sunken/30">
                    <div>
                      <p className="font-semibold text-text">{row?.vaksin}</p>
                      <p className="text-[12px] text-text-2">
                        {record.tempat || "Faskes"} · {record.tanggalDiberikan || "-"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-text font-tabular">
                        {formatRupiah(record.biayaAktual)}
                      </p>
                      <span className="text-[12px] text-primary font-medium">
                        {record.statusKlaim || "Tercatat"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
