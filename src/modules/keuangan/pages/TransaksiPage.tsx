import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ExternalLink, Plus, Filter, Wallet } from "lucide-react";
import { formatRupiah } from "../../../utils/calc";
import { MODULE_REGISTRY } from "../../registry";
import { MonthSelector } from "../components/MonthSelector";
import { TransactionModal } from "../components/TransactionModal";
import { useFinance } from "../state/FinanceContext";
import { useFamily } from "../../../shell/family/context/FamilyContext";
import { useAuth } from "../../../context/AuthContext";
import { LedgerEntry, TxType } from "../types";
import { getAllCategories, resolveCategoryName } from "../utils/categories";
import { filterEntries, groupByDate, summarizeMonth } from "../utils/calculations";
import { formatDayHeader, monthKeyOf } from "../utils/dates";

export const TransaksiPage: React.FC = () => {
  const { selectedMonth, setSelectedMonth, config, entries } = useFinance();
  const { members } = useFamily();
  const { user } = useAuth();

  const [typeFilter, setTypeFilter] = useState<TxType | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [memberFilter, setMemberFilter] = useState<string>("all"); // "all", "me", or uid
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);

  const bayiModule = MODULE_REGISTRY.find((m) => m.id === "bayi");
  const bayiBiayaPath = bayiModule ? `${bayiModule.basePath.replace(/\/beranda$/, "")}/biaya` : "/bayi/biaya";

  // Filter entries for selected month
  const monthEntries = useMemo(() => {
    return entries.filter((e) => monthKeyOf(e.date) === selectedMonth);
  }, [entries, selectedMonth]);

  // Apply search & dropdown filters
  const filteredList = useMemo(() => {
    let list = filterEntries(
      monthEntries,
      {
        type: typeFilter,
        categoryId: categoryFilter,
        query: searchQuery
      },
      config
    );

    if (memberFilter !== "all") {
      list = list.filter(e => {
        if (memberFilter === "me") return e.createdBy === user?.uid;
        return e.createdBy === memberFilter;
      });
    }
    
    return list;
  }, [monthEntries, typeFilter, categoryFilter, searchQuery, config, memberFilter, user?.uid]);

  // Group by date
  const groupedData = useMemo(() => {
    return groupByDate(filteredList);
  }, [filteredList]);

  const allCategories = getAllCategories(config);
  const summary = summarizeMonth(entries, selectedMonth);
  const isMonthEmpty = summary.count === 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-serif font-bold text-text">Daftar Transaksi</h1>
          <p className="text-[13px] text-text-2">
            Riwayat pemasukan dan pengeluaran bulan {selectedMonth}.
          </p>
        </div>

        <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
      </div>

      {/* Filter Bar */}
      <div className="bg-surface rounded-[12px] border border-border p-4 space-y-3 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Type Filter Chips */}
          <div className="flex items-center gap-1.5 bg-surface-sunken p-1 rounded-[10px] border border-border shrink-0">
            {[
              { id: "all", label: "Semua" },
              { id: "expense", label: "Pengeluaran" },
              { id: "income", label: "Pemasukan" }
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setTypeFilter(chip.id as any)}
                className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition cursor-pointer ${
                  typeFilter === chip.id
                    ? "bg-surface text-text border border-border shadow-2xs"
                    : "text-text-2 hover:text-text"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown & Search Input */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-lg">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-[13px] rounded-[10px] border border-border bg-surface text-text min-h-[40px]"
            >
              <option value="all">Semua kategori</option>
              {allCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.archived ? "(Diarsipkan)" : ""}
                </option>
              ))}
            </select>

            <select
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className="px-3 py-2 text-[13px] rounded-[10px] border border-border bg-surface text-text min-h-[40px]"
            >
              <option value="all">Semua Anggota</option>
              <option value="me">Saya</option>
              {members.map((m) => (
                <option key={m.uid} value={m.uid}>
                  {m.displayName}
                </option>
              ))}
            </select>

            <div className="relative flex-1">
              <Search className="w-4 h-4 text-text-2 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari catatan atau kategori"
                className="w-full pl-9 pr-3 py-2 text-[13px] rounded-[10px] border border-border bg-surface text-text min-h-[40px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {isMonthEmpty ? (
        <div className="bg-surface rounded-[12px] border border-border p-8 text-center space-y-4 shadow-card">
          <div className="w-12 h-12 bg-surface-sunken text-text-2 rounded-full flex items-center justify-center mx-auto">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-[16px] font-serif font-bold text-text">Belum ada transaksi bulan ini</h3>
            <p className="text-[13px] text-text-2 max-w-sm mx-auto">
              Tidak ada catatan transaksi pada bulan yang dipilih.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-[10px] bg-primary hover:bg-primary-hover text-primary-fg text-[13px] font-medium transition cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Catat transaksi</span>
          </button>
        </div>
      ) : groupedData.length === 0 ? (
        <div className="bg-surface rounded-[12px] border border-border p-8 text-center space-y-2 shadow-card">
          <Filter className="w-8 h-8 text-text-3 mx-auto" />
          <p className="text-[14px] font-medium text-text">
            Tidak ada transaksi yang cocok dengan filter.
          </p>
          <p className="text-[13px] text-text-2">
            Coba ubah filter jenis, kategori, atau kata kunci pencarian Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedData.map((group) => (
            <div
              key={group.date}
              className="bg-surface rounded-[12px] border border-border overflow-hidden shadow-card"
            >
              {/* Date Header */}
              <div className="bg-surface-sunken/60 px-4 py-2.5 border-b border-border flex items-center justify-between">
                <span className="text-[13px] font-medium text-text">
                  {formatDayHeader(group.date)}
                </span>
              </div>

              {/* Transactions List */}
              <div className="divide-y divide-border">
                {group.entries.map((entry) => {
                  const catName = resolveCategoryName(config, entry.categoryId);
                  const creator = members.find((m: any) => m.uid === entry.createdBy)?.displayName || 'Unknown';
                  const isIncome = entry.type === "income";

                  return (
                    <div
                      key={entry.id}
                      tabIndex={entry.readOnly ? undefined : 0}
                      role={entry.readOnly ? undefined : "button"}
                      onKeyDown={(e) => {
                        if (!entry.readOnly && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          setEditingEntry(entry);
                        }
                      }}
                      onClick={() => {
                        if (!entry.readOnly) {
                          setEditingEntry(entry);
                        }
                      }}
                      className={`px-4 py-3 flex items-center justify-between gap-3 ${
                        !entry.readOnly
                          ? "hover:bg-surface-sunken/60 cursor-pointer focus:outline-none focus:bg-surface-sunken/80"
                          : ""
                      } transition`}
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-medium text-text truncate">
                            {catName}
                          </span>
                          <span className="text-[11px] text-text-3">Dicatat oleh {creator}</span>
                          {entry.source === "vaccine" && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-info-tint text-info font-medium border border-info/20 flex items-center gap-1">
                              <span>Dari jadwal vaksin</span>
                              <Link
                                to={bayiBiayaPath}
                                aria-label="Buka di Biaya vaksin"
                                title="Buka di Biaya vaksin"
                                onClick={(e) => e.stopPropagation()}
                                className="hover:underline p-0.5"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </span>
                          )
                        }
                        </div>
                        {entry.note && (
                          <p className="text-[12px] text-text-2 truncate">{entry.note}</p>
                        )}
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
          ))}
        </div>
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
