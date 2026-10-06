import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import {
  Calculator,
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp,
  Wallet,
  Receipt,
  ShieldCheck,
  Calendar,
  TrendingUp,
  Percent
} from "lucide-react";
import { Profile, ScheduleRow } from "../../types";
import {
  calculateCostSummary,
  calculateRealization,
  formatRupiah,
  formatRupiahRange,
  ScenarioOptions
} from "../../utils/calc";
import { GratisBadge, StatusBadge } from "../common/Badges";

interface Props {
  profile: Profile;
}

export const CostTab: React.FC<Props> = ({ profile }) => {
  // Scenario toggles
  const [scenarios, setScenarios] = useState<ScenarioOptions>({
    heksavalenSwasta: false,
    sertakanKondisional: false
  });

  // Chart mode: "max" | "min" | "avg"
  const [chartMetric, setChartMetric] = useState<"max" | "min" | "avg">("max");

  // Expanded years state (Set of year numbers)
  const [expandedYearSet, setExpandedYearSet] = useState<Set<number>>(new Set([1, 2]));

  // Cost summaries calculated dynamically based on active scenarios
  const { years, total } = useMemo(() => {
    return calculateCostSummary(profile.schedule, scenarios);
  }, [profile.schedule, scenarios]);

  // Realized actual costs and insurance claims calculated from records
  const realization = useMemo(
    () => calculateRealization(profile.records, profile.schedule),
    [profile.records, profile.schedule]
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

  // Financial visual ratios
  const totalCombined = (total.tanggungSendiriMax + total.dibebaskanMax) || 1;
  const selfPayPercent = Math.min(100, Math.round((total.tanggungSendiriMax / totalCombined) * 100));
  const freeSubsidyPercent = Math.min(100, Math.round((total.dibebaskanMax / totalCombined) * 100));
  const realizationPercent = total.tanggungSendiriMax > 0
    ? Math.min(100, Math.round((realization.totalBiayaAktual / total.tanggungSendiriMax) * 100))
    : 0;
  const insuranceCoveragePercent = realization.totalBiayaAktual > 0
    ? Math.min(100, Math.round((realization.totalKlaimDisetujui / realization.totalBiayaAktual) * 100))
    : 0;

  // Chart data preparation
  const chartData = useMemo(() => {
    return years.map((y) => {
      let outOfPocket = 0;
      let freeProgram = 0;

      if (chartMetric === "max") {
        outOfPocket = y.tanggungSendiriMax;
        freeProgram = y.dibebaskanMax;
      } else if (chartMetric === "min") {
        outOfPocket = y.tanggungSendiriMin;
        freeProgram = y.dibebaskanMin;
      } else {
        outOfPocket = Math.round((y.tanggungSendiriMin + y.tanggungSendiriMax) / 2);
        freeProgram = Math.round((y.dibebaskanMin + y.dibebaskanMax) / 2);
      }

      return {
        name: `Th ${y.tahun}`,
        rentang: y.rentangUsia,
        "Tanggung Sendiri": outOfPocket,
        "Dibebaskan Program": freeProgram
      };
    });
  }, [years, chartMetric]);

  const toggleYearExpansion = (tahun: number) => {
    setExpandedYearSet((prev) => {
      const next = new Set(prev);
      if (next.has(tahun)) {
        next.delete(tahun);
      } else {
        next.add(tahun);
      }
      return next;
    });
  };

  const isScenarioActive = scenarios.heksavalenSwasta || scenarios.sertakanKondisional;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Calculator className="w-6 h-6 text-[#1F4E78]" />
            Perencanaan & Realisasi Biaya Imunisasi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Pusat pemantauan finansial: estimasi mandiri, subsidi program pemerintah, realisasi biaya aktual, dan klaim asuransi.
          </p>
        </div>
      </div>

      {/* 2. Visual Financial Overview Cards (Consolidated from Dashboard) */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#1F4E78]" />
            Ikhtisar Finansial & Realisasi Pengeluaran
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            Akumulasi 0–5 Tahun
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Tanggung Sendiri with Visual Bar */}
          <div className="bg-white p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Estimasi Tanggung Sendiri
              </span>
              <div className="text-xl font-black text-[#1F4E78] mt-1">
                {formatRupiahRange(total.tanggungSendiriMin, total.tanggungSendiriMax)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Total vaksin pilihan di swasta
              </p>
            </div>
            {/* Visual Indicator Bar */}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#1F4E78] h-full rounded-full transition-all duration-500"
                  style={{ width: `${selfPayPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                <span>Porsi biaya mandiri</span>
                <span className="text-[#1F4E78] font-bold">{selfPayPercent}%</span>
              </div>
            </div>
          </div>

          {/* Card 2: Realisasi Biaya with Visual Bar */}
          <div className="bg-white p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Realisasi Biaya Aktual
              </span>
              <div className="text-xl font-black text-slate-900 mt-1">
                {formatRupiah(realization.totalBiayaAktual)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Total riil tercatat yang sudah dibayar
              </p>
            </div>
            {/* Visual Indicator Bar */}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-slate-700 h-full rounded-full transition-all duration-500"
                  style={{ width: `${realizationPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                <span>Realisasi dari estimasi</span>
                <span className="text-slate-800 font-bold">{realizationPercent}%</span>
              </div>
            </div>
          </div>

          {/* Card 3: Klaim Asuransi with Visual Bar */}
          <div className="bg-white p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Klaim Asuransi Disetujui
              </span>
              <div className="text-xl font-black text-teal-600 mt-1">
                {formatRupiah(realization.totalKlaimDisetujui)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tercakup oleh polis asuransi
              </p>
            </div>
            {/* Visual Indicator Bar */}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-teal-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${insuranceCoveragePercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                <span>Rasio cover asuransi</span>
                <span className="text-teal-700 font-bold">{insuranceCoveragePercent}%</span>
              </div>
            </div>
          </div>

          {/* Card 4: Dibebaskan Program with Visual Bar */}
          <div className="bg-white p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Hemat Lewat Program
              </span>
              <div className="text-xl font-black text-emerald-600 mt-1">
                {formatRupiahRange(total.dibebaskanMin, total.dibebaskanMax)}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Subsidi vaksin program pemerintah
              </p>
            </div>
            {/* Visual Indicator Bar */}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${freeSubsidyPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                <span>Subsidi program gratis</span>
                <span className="text-emerald-700 font-bold">{freeSubsidyPercent}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Master Card: Total Akumulasi 0–5 Tahun */}
      <div className="bg-gradient-to-br from-[#1F4E78] to-[#153654] p-5 sm:p-7 rounded-3xl text-white shadow-md shadow-blue-950/15 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/20 pb-4">
          <div>
            <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider block">
              Ringkasan Keseluruhan
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
              Total Finansial Imunisasi 0–5 Tahun
            </h3>
          </div>
          <span className="text-xs font-bold text-white bg-white/15 px-3 py-1 rounded-full">
            5 Tahun Usia Balita
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-1">
            <span className="text-[11px] font-bold text-teal-200 uppercase tracking-wider block">
              Tanggung Sendiri (Mandiri)
            </span>
            <div className="text-xl sm:text-2xl font-black text-white">
              {formatRupiah(total.tanggungSendiriMin, true)} – {formatRupiah(total.tanggungSendiriMax, true)}
            </div>
            <p className="text-[11px] text-white/70">
              Biaya vaksin non-program di swasta
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-1">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
              Dibebaskan Program (Hemat)
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-300">
              {formatRupiah(total.dibebaskanMin, true)} – {formatRupiah(total.dibebaskanMax, true)}
            </div>
            <p className="text-[11px] text-white/70">
              Ditanggung penuh gratis oleh Kemenkes
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-1">
            <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider block">
              Bila Semua di Swasta
            </span>
            <div className="text-xl sm:text-2xl font-black text-white">
              {formatRupiah(total.semuaSwastaMin, true)} – {formatRupiah(total.semuaSwastaMax, true)}
            </div>
            <p className="text-[11px] text-white/70">
              Jika semua dosis diambil di faskes swasta
            </p>
          </div>
        </div>
      </div>

      {/* 4. Simulation / Scenarios Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-2xl">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Simulasi Skenario Tambahan
            </h3>
          </div>
          {isScenarioActive && (
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              Skenario Aktif
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Scenario (a): Heksavalen swasta */}
          <label className="flex items-start gap-3.5 p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 cursor-pointer bg-slate-50/50 transition">
            <input
              type="checkbox"
              checked={scenarios.heksavalenSwasta}
              onChange={(e) =>
                setScenarios((prev) => ({ ...prev, heksavalenSwasta: e.target.checked }))
              }
              className="mt-1 w-5 h-5 text-[#1F4E78] rounded-md cursor-pointer shrink-0"
            />
            <div className="text-xs space-y-1">
              <div className="font-extrabold text-slate-900">
                Pakai Heksavalen Swasta (DPT-HB-Hib + Polio)
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Menghitung 4 dosis DPT pentavalen menjadi heksavalen swasta (±Rp900.000–Rp1.300.000/dosis).
              </p>
            </div>
          </label>

          {/* Scenario (b): Sertakan Kondisional */}
          <label className="flex items-start gap-3.5 p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 cursor-pointer bg-slate-50/50 transition">
            <input
              type="checkbox"
              checked={scenarios.sertakanKondisional}
              onChange={(e) =>
                setScenarios((prev) => ({ ...prev, sertakanKondisional: e.target.checked }))
              }
              className="mt-1 w-5 h-5 text-[#1F4E78] rounded-md cursor-pointer shrink-0"
            />
            <div className="text-xs space-y-1">
              <div className="font-extrabold text-slate-900">
                Sertakan Semua Vaksin Kondisional & Opsional
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Memasukkan vaksin Japanese Encephalitis (JE), MMR alternatif, dan Meningokokus ke total.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* 5. PER-YEAR SUMMARY CARDS WITH TAP-TO-EXPAND DRILL-DOWN */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#1F4E78]" />
            Rincian Estimasi Biaya per Tahun
          </h3>
          <span className="text-xs text-slate-500">
            Ketuk kartu untuk melihat rincian per vaksin
          </span>
        </div>

        <div className="space-y-4">
          {years.map((y) => {
            const isExpanded = expandedYearSet.has(y.tahun);
            const yearRows = rowsByYear.get(y.tahun) || [];

            return (
              <div
                key={y.tahun}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all duration-200 overflow-hidden"
              >
                {/* Year Card Header (Always visible - clickable) */}
                <div
                  onClick={() => toggleYearExpansion(y.tahun)}
                  className="p-5 sm:p-6 cursor-pointer select-none hover:bg-slate-50/60 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Year Title & Age */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-[#1F4E78] text-white flex items-center justify-center font-black text-sm shrink-0">
                        {y.tahun}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                          Tahun {y.tahun} ({y.rentangUsia})
                        </h4>
                        <p className="text-xs text-slate-500">
                          {yearRows.length} jadwal vaksin dalam kelompok usia ini
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Center & Right: High-level numbers & Expand button */}
                  <div className="flex items-center justify-between md:justify-end gap-4 sm:gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 text-left">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Tanggung Sendiri
                        </span>
                        <div className="font-black text-sm sm:text-base text-[#1F4E78]">
                          {formatRupiah(y.tanggungSendiriMin, true)} – {formatRupiah(y.tanggungSendiriMax, true)}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Dibebaskan Program
                        </span>
                        <div className="font-black text-sm sm:text-base text-emerald-600">
                          {formatRupiah(y.dibebaskanMin, true)} – {formatRupiah(y.dibebaskanMax, true)}
                        </div>
                      </div>

                      <div className="hidden sm:block">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Semua di Swasta
                        </span>
                        <div className="font-bold text-sm sm:text-base text-slate-700">
                          {formatRupiah(y.semuaSwastaMin, true)} – {formatRupiah(y.semuaSwastaMax, true)}
                        </div>
                      </div>
                    </div>

                    <div className="p-2 text-slate-400 hover:text-slate-800 rounded-xl bg-slate-100 min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0">
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-[#1F4E78]" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Drill-Down Breakdown List */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-6 space-y-3 animate-fadeIn">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Rincian Komponen Vaksin Tahun {y.tahun}:</span>
                      <span className="font-normal text-slate-400">Total: {yearRows.length} vaksin</span>
                    </div>

                    <div className="space-y-2">
                      {yearRows.map((row) => (
                        <div
                          key={row.id}
                          className="bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-sm">
                                {row.vaksin}
                              </span>
                              <StatusBadge status={row.status} size="sm" />
                              <GratisBadge gratis={row.gratis} size="sm" />
                              {row.isCustom && (
                                <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                                  Kustom
                                </span>
                              )}
                            </div>
                            <div className="text-slate-500 text-[11px] flex items-center gap-2 flex-wrap">
                              <span>Usia: {row.usia}</span>
                              <span>•</span>
                              <span>Masuk Total: <strong>{row.masuk ? "Ya" : "Tidak"}</strong></span>
                              {row.catatan && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-400 line-clamp-1">{row.catatan}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-mono font-bold text-xs sm:text-sm text-[#0000FF]">
                              {row.gratis === "Ya"
                                ? "Gratis Puskesmas"
                                : `${formatRupiah(row.min)} – ${formatRupiah(row.max)}`}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              per dosis
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Graphical Comparison Chart */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              Grafik Komparasi Finansial per Tahun
            </h3>
            <p className="text-xs text-slate-500">
              Perbandingan porsi estimasi biaya mandiri vs pembebasan program subsidi pemerintah
            </p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setChartMetric("max")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                chartMetric === "max" ? "bg-white text-[#1F4E78] shadow-xs" : "text-slate-500"
              }`}
            >
              Estimasi Maksimal
            </button>
            <button
              type="button"
              onClick={() => setChartMetric("min")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                chartMetric === "min" ? "bg-white text-[#1F4E78] shadow-xs" : "text-slate-500"
              }`}
            >
              Estimasi Minimal
            </button>
            <button
              type="button"
              onClick={() => setChartMetric("avg")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                chartMetric === "avg" ? "bg-white text-[#1F4E78] shadow-xs" : "text-slate-500"
              }`}
            >
              Rata-rata
            </button>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B" }} tickLine={false} />
              <YAxis
                tickFormatter={(val) => `Rp${(val / 1000000).toFixed(1)}jt`}
                tick={{ fontSize: 11, fill: "#64748B" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(val: any) => formatRupiah(Number(val) || 0)}
                contentStyle={{
                  borderRadius: "1rem",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              <Bar dataKey="Tanggung Sendiri" fill="#1F4E78" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Dibebaskan Program" fill="#10B981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
