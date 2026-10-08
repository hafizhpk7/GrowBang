import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Info,
  Plus,
  ArrowRight,
  RefreshCw,
  Wallet
} from "lucide-react";
import { formatRupiah } from "../../../utils/calc";
import { MODULE_REGISTRY } from "../../registry";
import { MonthSelector } from "../components/MonthSelector";
import { TransactionModal } from "../components/TransactionModal";
import { useFinance } from "../state/FinanceContext";
import { LedgerEntry } from "../types";
import { resolveCategoryName } from "../utils/categories";
import {
  buildTrend,
  monthOverMonthDelta,
  summarizeBudgets,
  summarizeMonth
} from "../utils/calculations";
import { addMonths, formatDayHeader, monthKeyOf } from "../utils/dates";

export const RingkasanPage: React.FC = () => {
  const {
    selectedMonth,
    setSelectedMonth,
    config,
    loading,
    error,
    entries,
    pendingClaims,
    skippedVaccineWithoutDate
  } = useFinance();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);

  const bayiModule = MODULE_REGISTRY.find((m) => m.id === "bayi");
  const bayiBiayaPath = bayiModule ? `${bayiModule.basePath.replace(/\/beranda$/, "")}/biaya` : "/bayi/biaya";

  // Current month summary
  const summary = summarizeMonth(entries, selectedMonth);

  // Previous month summary for delta
  const prevMonthKey = addMonths(selectedMonth, -1);
  const prevSummary = summarizeMonth(entries, prevMonthKey);

  const expDelta = monthOverMonthDelta(summary.expense, prevSummary.expense);

  // Budgets summary
  const budgetSummary = summarizeBudgets(
    summary.expenseByCategory,
    config.budgets || {},
    []
  );

  // Categories with warning or over status
  const warningOrOverBudgets = budgetSummary.rows.filter(
    (r) => r.status.state === "warning" || r.status.state === "over"
  );

  // Trend data for 6 months
  const trendData = buildTrend(entries, selectedMonth, 6);

  // Chart 1: Expense by category (top 8 + Kategori lain)
  const chartCategoryData = React.useMemo(() => {
    if (summary.expenseByCategory.length === 0) return [];

    const top = summary.expenseByCategory.slice(0, 8);
    const rest = summary.expenseByCategory.slice(8);

    const result = top.map((item) => ({
      name: resolveCategoryName(config, item.categoryId),
      total: item.total
    }));

    if (rest.length > 0) {
      const restTotal = rest.reduce((sum, item) => sum + item.total, 0);
      result.push({
        name: "Kategori lain",
        total: restTotal
      });
    }

    return result;
  }, [summary.expenseByCategory, config]);

  // Month entries (up to 5 recent)
  const recentEntries = React.useMemo(() => {
    const monthList = entries.filter((e) => monthKeyOf(e.date) === selectedMonth);
    monthList.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.createdAt.localeCompare(a.createdAt);
    });
    return monthList.slice(0, 5);
  }, [entries, selectedMonth]);

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-10 bg-surface-sunken rounded-[10px] w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-28 bg-surface-sunken rounded-[12px]" />
          <div className="h-28 bg-surface-sunken rounded-[12px]" />
          <div className="h-28 bg-surface-sunken rounded-[12px]" />
        </div>
        <div className="h-48 bg-surface-sunken rounded-[12px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-surface rounded-[12px] border border-border text-center space-y-3">
        <p className="text-[14px] text-danger font-medium">Gagal memuat data keuangan.</p>
        <button
          type="button"
          onClick={() => setSelectedMonth(selectedMonth)}
          className="px-4 py-2 rounded-[10px] bg-primary text-primary-fg text-[13px] font-medium transition cursor-pointer inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Coba lagi</span>
        </button>
      </div>
    );
  }

  const isMonthEmpty = summary.count === 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-serif font-bold text-text">Ringkasan Keuangan</h1>
          <p className="text-[13px] text-text-2">
            Pemasukan, pengeluaran, dan kesehatan anggaran keluarga Anda.
          </p>
        </div>

        <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
      </div>

      {/* Three Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pemasukan Card */}
        <div className="bg-surface rounded-[12px] border border-border p-4 space-y-1.5 shadow-card">
          <span className="text-[12px] font-semibold text-text-3 uppercase tracking-wider">
            Pemasukan
          </span>
          <p className="text-[20px] font-bold text-primary-text">
            {formatRupiah(summary.income)}
          </p>
        </div>

        {/* Pengeluaran Card */}
        <div className="bg-surface rounded-[12px] border border-border p-4 space-y-1.5 shadow-card">
          <span className="text-[12px] font-semibold text-text-3 uppercase tracking-wider">
            Pengeluaran
          </span>
          <p className="text-[20px] font-bold text-text">
            {formatRupiah(summary.expense)}
          </p>
          {expDelta !== null && (
            <p className="text-[12px] text-text-2 flex items-center gap-1">
              {expDelta > 0 ? (
                <span className="text-danger flex items-center">
                  ↑ {expDelta}% dari bulan lalu
                </span>
              ) : expDelta < 0 ? (
                <span className="text-primary-text flex items-center">
                  ↓ {Math.abs(expDelta)}% dari bulan lalu
                </span>
              ) : (
                <span>Sama dengan bulan lalu</span>
              )}
            </p>
          )}
        </div>

        {/* Selisih Card */}
        <div className="bg-surface rounded-[12px] border border-border p-4 space-y-1.5 shadow-card">
          <span className="text-[12px] font-semibold text-text-3 uppercase tracking-wider">
            Selisih
          </span>
          <p
            className={`text-[20px] font-bold ${
              summary.net < 0 ? "text-danger" : "text-primary-text"
            }`}
          >
            {formatRupiah(summary.net)}
          </p>
        </div>
      </div>

      {/* Info Card: Pending Insurance Claims */}
      {config.includeVaccineCosts && pendingClaims.count > 0 && (
        <div className="p-4 bg-info-tint/60 border border-info/30 rounded-[12px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-text">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-info shrink-0" />
            <span className="text-[13px] font-medium">
              Klaim asuransi belum cair: {pendingClaims.count} klaim · {formatRupiah(pendingClaims.total)}
            </span>
          </div>
          <Link
            to={bayiBiayaPath}
            className="text-[12px] font-medium text-info hover:underline inline-flex items-center gap-1 shrink-0"
          >
            <span>Lihat di Biaya vaksin</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Budget Summary Card */}
      {budgetSummary.rows.length > 0 && (
        <div className="bg-surface rounded-[12px] border border-border p-5 space-y-4 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-serif font-bold text-text">Status Anggaran Bulanan</h3>
            <Link
              to="/keuangan-keluarga/anggaran"
              className="text-[12px] font-medium text-primary hover:underline"
            >
              Atur anggaran
            </Link>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[13px]">
              <span className="text-text-2">Total terpakai:</span>
              <span className="font-semibold text-text">
                {formatRupiah(budgetSummary.totalSpentOnBudgeted)} dari{" "}
                {formatRupiah(budgetSummary.totalBudget)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 bg-track rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  budgetSummary.totalSpentOnBudgeted > budgetSummary.totalBudget
                    ? "bg-danger"
                    : budgetSummary.totalSpentOnBudgeted / budgetSummary.totalBudget >= 0.8
                    ? "bg-warning"
                    : "bg-primary"
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (budgetSummary.totalSpentOnBudgeted / budgetSummary.totalBudget) * 100
                    )
                  )}%`
                }}
              />
            </div>
          </div>

          {/* Warning / Over categories */}
          {warningOrOverBudgets.length > 0 && (
            <div className="pt-2 border-t border-border space-y-2">
              <p className="text-[12px] font-medium text-text-2">Kategori mendekati / melebihi batas:</p>
              <div className="flex flex-wrap gap-2">
                {warningOrOverBudgets.map((row) => {
                  const catName = resolveCategoryName(config, row.categoryId);
                  const isOver = row.status.state === "over";
                  return (
                    <span
                      key={row.categoryId}
                      className={`text-[12px] px-2.5 py-1 rounded-[8px] border font-medium ${
                        isOver
                          ? "bg-danger-tint text-danger border-danger/30"
                          : "bg-warning-tint text-warning-text border-warning/30"
                      }`}
                    >
                      {catName}: {formatRupiah(row.spent)} / {formatRupiah(row.budget)} ({isOver ? "Melebihi" : "Hampir habis"})
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State vs Charts */}
      {isMonthEmpty ? (
        <div className="bg-surface rounded-[12px] border border-border p-8 text-center space-y-4 shadow-card">
          <div className="w-12 h-12 bg-surface-sunken text-text-2 rounded-full flex items-center justify-center mx-auto">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-[16px] font-serif font-bold text-text">Belum ada transaksi bulan ini</h3>
            <p className="text-[13px] text-text-2 max-w-sm mx-auto">
              Mulai catat pemasukan dan pengeluaran Anda untuk melihat grafik dan statistik keuangan.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-[10px] bg-primary hover:bg-primary-hover text-primary-fg text-[13px] font-medium transition cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Catat transaksi pertama</span>
          </button>
        </div>
      ) : (
        <>
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Expense by Category */}
            <div className="bg-surface rounded-[12px] border border-border p-5 space-y-4 shadow-card">
              <h3 className="text-[15px] font-serif font-bold text-text">Pengeluaran per kategori</h3>

              {chartCategoryData.length === 0 ? (
                <p className="text-[13px] text-text-3 italic py-8 text-center">
                  Belum ada pengeluaran di bulan ini.
                </p>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartCategoryData}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fill: "var(--text-2)", fontSize: 11 }}
                        tickFormatter={(val) => `Rp ${val / 1000}k`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={90}
                        tick={{ fill: "var(--text)", fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(val: any) => [formatRupiah(Number(val) || 0), "Total"]}
                        contentStyle={{
                          backgroundColor: "var(--surface)",
                          borderColor: "var(--border)",
                          color: "var(--text)",
                          borderRadius: "8px",
                          fontSize: "12px"
                        }}
                      />
                      <Bar dataKey="total" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Chart 2: 6-Month Income vs Expense Trend */}
            <div className="bg-surface rounded-[12px] border border-border p-5 space-y-4 shadow-card">
              <h3 className="text-[15px] font-serif font-bold text-text">Tren 6 bulan terakhir</h3>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "var(--text-2)", fontSize: 11 }} />
                    <YAxis
                      tick={{ fill: "var(--text-2)", fontSize: 11 }}
                      tickFormatter={(val) => `${val / 1000}k`}
                    />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        formatRupiah(Number(val) || 0),
                        name === "income" ? "Pemasukan" : "Pengeluaran"
                      ]}
                      contentStyle={{
                        backgroundColor: "var(--surface)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                        borderRadius: "8px",
                        fontSize: "12px"
                      }}
                    />
                    <Legend
                      formatter={(val) => (
                        <span style={{ color: "var(--text)", fontSize: "12px" }}>
                          {val === "income" ? "Pemasukan" : "Pengeluaran"}
                        </span>
                      )}
                    />
                    <Bar dataKey="income" fill="var(--primary)" name="income" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="var(--accent)" name="expense" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Transactions List (Up to 5) */}
          <div className="bg-surface rounded-[12px] border border-border p-5 space-y-4 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-serif font-bold text-text">Transaksi terbaru</h3>
              <Link
                to="/keuangan-keluarga/transaksi"
                className="text-[12px] font-medium text-primary hover:underline flex items-center gap-1"
              >
                <span>Lihat semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-border">
              {recentEntries.map((entry) => {
                const catName = resolveCategoryName(config, entry.categoryId);
                const isIncome = entry.type === "income";

                return (
                  <div
                    key={entry.id}
                    onClick={() => {
                      if (!entry.readOnly) {
                        setEditingEntry(entry);
                      }
                    }}
                    className={`py-3 flex items-center justify-between gap-3 ${
                      !entry.readOnly ? "hover:bg-surface-sunken/60 cursor-pointer" : ""
                    } px-2 rounded-[8px] transition`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-medium text-text truncate">
                          {catName}
                        </span>
                        {entry.source === "vaccine" && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-info-tint text-info font-medium border border-info/20">
                            Dari jadwal vaksin
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-text-2 truncate">
                        {entry.note || formatDayHeader(entry.date)}
                      </p>
                    </div>

                    <span
                      className={`text-[14px] font-bold shrink-0 ${
                        isIncome ? "text-primary-text" : "text-text"
                      }`}
                    >
                      {isIncome ? "+" : "−"}
                      {formatRupiah(entry.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Skipped Vaccine Hint */}
      {config.includeVaccineCosts && skippedVaccineWithoutDate > 0 && (
        <p className="text-[12px] text-text-3 flex items-center gap-1.5 pt-1">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>
            {skippedVaccineWithoutDate} biaya vaksin belum punya tanggal pemberian, jadi belum dihitung.
          </span>
        </p>
      )}

      {/* Modals */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <TransactionModal
        isOpen={!!editingEntry}
        onClose={() => setEditingEntry(null)}
        initialEntry={editingEntry}
      />
    </div>
  );
};
