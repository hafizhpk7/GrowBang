import React, { useEffect, useRef, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { useFinance } from "../state/FinanceContext";
import { LedgerEntry, TxType } from "../types";
import { getActiveCategories } from "../utils/categories";
import { formatRupiahInput, parseRupiahInput } from "../utils/currency";
import { todayLocal } from "../utils/dates";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEntry?: LedgerEntry | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialEntry
}) => {
  const { config, addTransaction, updateTransaction, deleteTransaction } = useFinance();

  const isEdit = !!initialEntry;
  const [type, setType] = useState<TxType>("expense");
  const [amountStr, setAmountStr] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [walletId, setWalletId] = useState<string>("default");
  const [date, setDate] = useState<string>(todayLocal());
  const [note, setNote] = useState<string>("");

  const [errors, setErrors] = useState<{
    amount?: string;
    categoryId?: string;
    walletId?: string;
    date?: string;
    note?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Sync state when modal opens or initialEntry changes
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setSubmitting(false);

      if (initialEntry) {
        setType(initialEntry.type);
        setAmountStr(formatRupiahInput(initialEntry.amount));
        setCategoryId(initialEntry.categoryId);
        setWalletId(initialEntry.walletId || "default");
        setDate(initialEntry.date);
        setNote(initialEntry.note || "");
      } else {
        setType("expense");
        setAmountStr("");
        const activeExp = getActiveCategories(config, "expense");
        setCategoryId(activeExp.length > 0 ? activeExp[0].id : "");
        setWalletId("default");
        setDate(todayLocal());
        setNote("");
      }

      // Focus
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, initialEntry, config]);

  // When type changes during create mode, reset category to first active of that type
  const handleTypeChange = (newType: TxType) => {
    setType(newType);
    const activeCats = getActiveCategories(config, newType);
    if (!activeCats.some((c) => c.id === categoryId)) {
      setCategoryId(activeCats.length > 0 ? activeCats[0].id : "");
    }
  };

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const num = parseRupiahInput(val);
    if (num === null) {
      setAmountStr("");
    } else {
      setAmountStr(formatRupiahInput(num));
    }
    setErrors((prev) => ({ ...prev, amount: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const numAmount = parseRupiahInput(amountStr) || 0;

    setSubmitting(true);
    let res;

    if (isEdit && initialEntry) {
      res = await updateTransaction(initialEntry.id, {
        type,
        amount: numAmount,
        categoryId,
        walletId,
        date,
        note
      });
    } else {
      res = await addTransaction({
        type,
        amount: numAmount,
        categoryId,
        walletId,
        date,
        note
      });
    }

    setSubmitting(false);

    if (res.ok) {
      onClose();
    } else if (res.errors) {
      setErrors(res.errors);
      // Focus first error
      if (res.errors.amount) {
        amountInputRef.current?.focus();
      }
    }
  };

  const handleDelete = async () => {
    if (!initialEntry) return;
    await deleteTransaction(initialEntry.id);
    onClose();
  };

  const activeCategories = getActiveCategories(config, type);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      style={{ backgroundColor: "var(--scrim)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="bg-surface rounded-[12px] max-w-[460px] w-full border border-border p-5 sm:p-6 space-y-5 shadow-popover"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 id="modal-title" className="text-[18px] font-serif font-bold text-text">
            {isEdit ? "Ubah transaksi" : "Catat transaksi"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-1 rounded-[8px] hover:bg-surface-sunken text-text-2 hover:text-text transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle */}
          <div className="space-y-1">
            <label className="text-[13px] font-medium text-text">Jenis transaksi</label>
            <div className="flex bg-surface-sunken p-1 rounded-[10px] border border-border" role="radiogroup">
              <button
                type="button"
                role="radio"
                aria-checked={type === "expense"}
                onClick={() => handleTypeChange("expense")}
                className={`flex-1 py-2 text-[13px] font-medium rounded-[8px] transition cursor-pointer min-h-[38px] ${
                  type === "expense"
                    ? "bg-surface text-danger border border-border shadow-2xs"
                    : "text-text-2 hover:text-text"
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={type === "income"}
                onClick={() => handleTypeChange("income")}
                className={`flex-1 py-2 text-[13px] font-medium rounded-[8px] transition cursor-pointer min-h-[38px] ${
                  type === "income"
                    ? "bg-surface text-primary border border-border shadow-2xs"
                    : "text-text-2 hover:text-text"
                }`}
              >
                Pemasukan
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1">
            <label htmlFor="tx-amount" className="text-[13px] font-medium text-text">
              Nominal
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-medium text-text-2">
                Rp
              </span>
              <input
                id="tx-amount"
                ref={amountInputRef}
                type="text"
                inputMode="numeric"
                value={amountStr}
                onChange={handleAmountChange}
                placeholder="0"
                className={`w-full pl-9 pr-3 py-2 text-[15px] rounded-[10px] border bg-surface text-text min-h-[44px] ${
                  errors.amount ? "border-danger" : "border-border hover:border-border-strong"
                }`}
              />
            </div>
            {errors.amount && (
              <p className="text-[12px] text-danger mt-1 font-medium">{errors.amount}</p>
            )}
          </div>

          {/* Category Input */}
          <div className="space-y-1">
            <label htmlFor="tx-category" className="text-[13px] font-medium text-text">
              Kategori
            </label>
            <select
              id="tx-category"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setErrors((prev) => ({ ...prev, categoryId: undefined }));
              }}
              className={`w-full px-3 py-2 text-[14px] rounded-[10px] border bg-surface text-text min-h-[44px] ${
                errors.categoryId ? "border-danger" : "border-border hover:border-border-strong"
              }`}
            >
              <option value="" disabled>
                Pilih kategori
              </option>
              {activeCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="text-[12px] text-danger mt-1 font-medium">{errors.categoryId}</p>
            )}
          </div>

          {/* Wallet Input */}
          <div className="space-y-1">
            <label htmlFor="tx-wallet" className="text-[13px] font-medium text-text">
              Dompet
            </label>
            <select
              id="tx-wallet"
              value={walletId}
              onChange={(e) => {
                setWalletId(e.target.value);
                setErrors((prev) => ({ ...prev, walletId: undefined }));
              }}
              className={`w-full px-3 py-2 text-[14px] rounded-[10px] border bg-surface text-text min-h-[44px] ${
                errors.walletId ? "border-danger" : "border-border hover:border-border-strong"
              }`}
            >
              {Object.values(config.wallets || {})
                .filter((w) => !w.archived || w.id === walletId)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.archived ? "(Diarsipkan)" : ""}
                  </option>
                ))}
            </select>
            {errors.walletId && (
              <p className="text-[12px] text-danger mt-1 font-medium">{errors.walletId}</p>
            )}
          </div>

          {/* Date Input */}
          <div className="space-y-1">
            <label htmlFor="tx-date" className="text-[13px] font-medium text-text">
              Tanggal
            </label>
            <input
              id="tx-date"
              type="date"
              value={date}
              max={todayLocal()}
              onChange={(e) => {
                setDate(e.target.value);
                setErrors((prev) => ({ ...prev, date: undefined }));
              }}
              className={`w-full px-3 py-2 text-[14px] rounded-[10px] border bg-surface text-text min-h-[44px] ${
                errors.date ? "border-danger" : "border-border hover:border-border-strong"
              }`}
            />
            {errors.date && (
              <p className="text-[12px] text-danger mt-1 font-medium">{errors.date}</p>
            )}
          </div>

          {/* Note Input */}
          <div className="space-y-1">
            <label htmlFor="tx-note" className="text-[13px] font-medium text-text">
              Catatan (opsional)
            </label>
            <input
              id="tx-note"
              type="text"
              maxLength={500}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setErrors((prev) => ({ ...prev, note: undefined }));
              }}
              placeholder="Contoh: Belanja mingguan di pasar"
              className={`w-full px-3 py-2 text-[14px] rounded-[10px] border bg-surface text-text min-h-[44px] ${
                errors.note ? "border-danger" : "border-border hover:border-border-strong"
              }`}
            />
            {errors.note && (
              <p className="text-[12px] text-danger mt-1 font-medium">{errors.note}</p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between gap-3">
            {isEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-2.5 rounded-[10px] bg-danger-tint hover:bg-danger/20 text-danger font-medium text-[13px] transition cursor-pointer min-h-[44px] flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-[10px] bg-surface-sunken hover:bg-border/60 text-text text-[13px] font-medium transition cursor-pointer min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-[10px] bg-primary hover:bg-primary-hover text-primary-fg font-medium text-[13px] transition cursor-pointer min-h-[44px] disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
