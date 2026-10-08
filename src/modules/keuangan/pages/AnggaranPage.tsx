import React, { useState } from "react";
import { Plus, Archive, ArchiveRestore, Edit2, Check, X, Shield } from "lucide-react";
import { formatRupiah } from "../../../utils/calc";
import { MonthSelector } from "../components/MonthSelector";
import { useFinance } from "../state/FinanceContext";
import { Category, TxType } from "../types";
import { getAllCategories } from "../utils/categories";
import { budgetStatus, summarizeMonth } from "../utils/calculations";
import { formatRupiahInput, parseRupiahInput } from "../utils/currency";

export const AnggaranPage: React.FC = () => {
  const {
    selectedMonth,
    setSelectedMonth,
    config,
    entries,
    saveBudget,
    addCategory,
    renameCategory,
    setCategoryArchived
  } = useFinance();

  // Add Category form state
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<TxType>("expense");
  const [addCatError, setAddCatError] = useState<string | null>(null);

  // Category inline rename state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [renameCatError, setRenameCatError] = useState<string | null>(null);

  // Budget local input values state { [catId]: string }
  const [budgetInputs, setBudgetInputs] = useState<Record<string, string>>({});

  const summary = summarizeMonth(entries, selectedMonth);
  const spentMap = new Map<string, number>();
  for (const item of summary.expenseByCategory) {
    spentMap.set(item.categoryId, item.total);
  }

  const allCategories = getAllCategories(config);
  const activeExpenseCategories = allCategories.filter(
    (c) => c.type === "expense" && !c.archived
  );

  // Handle saving budget when user blurs or presses Enter
  const handleBudgetBlurOrSubmit = async (catId: string) => {
    const rawStr = budgetInputs[catId];
    if (rawStr === undefined) return;

    const parsed = parseRupiahInput(rawStr);
    await saveBudget(catId, parsed);
  };

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddCatError(null);

    const res = await addCategory(newCatName, newCatType);
    if (res.ok) {
      setNewCatName("");
    } else if (res.error) {
      setAddCatError(res.error);
    }
  };

  const handleRenameSubmit = async (catId: string) => {
    setRenameCatError(null);
    const res = await renameCategory(catId, editingCatName);
    if (res.ok) {
      setEditingCatId(null);
      setEditingCatName("");
    } else if (res.error) {
      setRenameCatError(res.error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-serif font-bold text-text">Anggaran & Kategori</h1>
          <p className="text-[13px] text-text-2">
            Kelola batas pengeluaran bulanan dan daftar kategori kustom.
          </p>
        </div>

        <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
      </div>

      {/* Section 1: Anggaran Bulanan */}
      <div className="bg-surface rounded-[12px] border border-border p-5 space-y-4 shadow-card">
        <div>
          <h2 className="text-[16px] font-serif font-bold text-text">Anggaran bulanan</h2>
          <p className="text-[12px] text-text-2">
            Anggaran berlaku setiap bulan. Kosongkan nilai jika tidak ingin menetapkan batas.
          </p>
        </div>

        <div className="divide-y divide-border">
          {activeExpenseCategories.map((cat) => {
            const spent = spentMap.get(cat.id) || 0;
            const currentBudget = config.budgets?.[cat.id];
            const st = budgetStatus(spent, currentBudget);

            const displayInputVal =
              budgetInputs[cat.id] !== undefined
                ? budgetInputs[cat.id]
                : currentBudget
                ? formatRupiahInput(currentBudget)
                : "";

            return (
              <div key={cat.id} className="py-3.5 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[14px] font-medium text-text">{cat.name}</span>

                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-text-2 shrink-0">
                      Terpakai: <span className="font-semibold text-text">{formatRupiah(spent)}</span>
                    </span>

                    <div className="relative w-36">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-text-2">
                        Rp
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Tanpa batas"
                        value={displayInputVal}
                        onChange={(e) => {
                          const val = e.target.value;
                          const parsed = parseRupiahInput(val);
                          setBudgetInputs((prev) => ({
                            ...prev,
                            [cat.id]: parsed !== null ? formatRupiahInput(parsed) : ""
                          }));
                        }}
                        onBlur={() => handleBudgetBlurOrSubmit(cat.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleBudgetBlurOrSubmit(cat.id);
                          }
                        }}
                        className="w-full pl-7 pr-2 py-1 text-[13px] rounded-[8px] border border-border bg-surface text-text text-right min-h-[36px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Progress bar and status label */}
                {st.state !== "none" && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span
                        className={`font-semibold ${
                          st.state === "over"
                            ? "text-danger"
                            : st.state === "warning"
                            ? "text-warning-text"
                            : "text-primary-text"
                        }`}
                      >
                        {st.state === "over"
                          ? "Melebihi anggaran"
                          : st.state === "warning"
                          ? "Hampir habis"
                          : "Aman"}
                      </span>

                      <span className="text-text-2">
                        Sisa: {formatRupiah(Math.max(0, st.remaining))}
                      </span>
                    </div>

                    <div className="w-full h-2 bg-track rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          st.state === "over"
                            ? "bg-danger"
                            : st.state === "warning"
                            ? "bg-warning"
                            : "bg-primary"
                        }`}
                        style={{ width: `${Math.min(100, Math.round(st.ratio * 100))}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Kelola Kategori */}
      <div className="bg-surface rounded-[12px] border border-border p-5 space-y-5 shadow-card">
        <div>
          <h2 className="text-[16px] font-serif font-bold text-text">Kategori transaksi</h2>
          <p className="text-[12px] text-text-2">
            Kategori bawaan sistem tidak dapat diubah. Anda dapat menambah atau mengarsipkan kategori kustom.
          </p>
        </div>

        {/* Add Category Form */}
        <form onSubmit={handleAddCategorySubmit} className="space-y-3 p-4 bg-surface-sunken/60 rounded-[10px] border border-border">
          <p className="text-[13px] font-medium text-text">Tambah kategori kustom</p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex bg-surface p-1 rounded-[8px] border border-border shrink-0" role="radiogroup">
              <button
                type="button"
                role="radio"
                aria-checked={newCatType === "expense"}
                onClick={() => setNewCatType("expense")}
                className={`px-3 py-1.5 text-[12px] font-medium rounded-[6px] transition cursor-pointer ${
                  newCatType === "expense"
                    ? "bg-danger-tint text-danger font-bold"
                    : "text-text-2 hover:text-text"
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={newCatType === "income"}
                onClick={() => setNewCatType("income")}
                className={`px-3 py-1.5 text-[12px] font-medium rounded-[6px] transition cursor-pointer ${
                  newCatType === "income"
                    ? "bg-primary-tint text-primary-text font-bold"
                    : "text-text-2 hover:text-text"
                }`}
              >
                Pemasukan
              </button>
            </div>

            <input
              type="text"
              maxLength={40}
              placeholder="Nama kategori baru"
              value={newCatName}
              onChange={(e) => {
                setNewCatName(e.target.value);
                setAddCatError(null);
              }}
              className="flex-1 px-3 py-2 text-[13px] rounded-[8px] border border-border bg-surface text-text min-h-[38px]"
            />

            <button
              type="submit"
              className="px-4 py-2 rounded-[8px] bg-primary hover:bg-primary-hover text-primary-fg text-[13px] font-medium transition cursor-pointer min-h-[38px] flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </div>

          {addCatError && (
            <p className="text-[12px] text-danger font-medium">{addCatError}</p>
          )}
        </form>

        {/* Category List */}
        <div className="divide-y divide-border">
          {allCategories.map((cat) => {
            const isEditing = editingCatId === cat.id;

            return (
              <div key={cat.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      cat.type === "income"
                        ? "bg-primary-tint text-primary-text"
                        : "bg-danger-tint text-danger"
                    }`}
                  >
                    {cat.type === "income" ? "Masuk" : "Keluar"}
                  </span>

                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 max-w-xs">
                      <input
                        type="text"
                        maxLength={40}
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        className="px-2 py-1 text-[13px] rounded-[6px] border border-border bg-surface text-text w-full"
                      />
                      <button
                        type="button"
                        onClick={() => handleRenameSubmit(cat.id)}
                        className="p-1 text-primary hover:text-primary-hover cursor-pointer"
                        title="Simpan nama"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCatId(null)}
                        className="p-1 text-text-2 hover:text-text cursor-pointer"
                        title="Batal"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`text-[14px] font-medium ${
                        cat.archived ? "text-text-3 line-through" : "text-text"
                      } truncate`}
                    >
                      {cat.name}
                    </span>
                  )}

                  {cat.isSystem && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-sunken text-text-3 font-medium border border-border shrink-0 flex items-center gap-0.5">
                      <Shield className="w-2.5 h-2.5" />
                      <span>Bawaan</span>
                    </span>
                  )}
                </div>

                {/* Actions for custom categories */}
                {!cat.isSystem && (
                  <div className="flex items-center gap-1 shrink-0">
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCatId(cat.id);
                          setEditingCatName(cat.name);
                        }}
                        className="p-1.5 rounded-[6px] hover:bg-surface-sunken text-text-2 hover:text-text transition cursor-pointer"
                        title="Ubah nama"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      aria-label={
                        cat.archived
                          ? `Aktifkan kategori ${cat.name}`
                          : `Arsipkan kategori ${cat.name}`
                      }
                      title={
                        cat.archived
                          ? `Aktifkan kategori ${cat.name}`
                          : `Arsipkan kategori ${cat.name}`
                      }
                      onClick={() => setCategoryArchived(cat.id, !cat.archived)}
                      className="p-1.5 rounded-[6px] hover:bg-surface-sunken text-text-2 hover:text-text transition cursor-pointer"
                    >
                      {cat.archived ? (
                        <ArchiveRestore className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <Archive className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {renameCatError && (
          <p className="text-[12px] text-danger font-medium">{renameCatError}</p>
        )}
      </div>
    </div>
  );
};
