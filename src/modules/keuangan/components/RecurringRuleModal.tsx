import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { RecurringFrequency, RecurringRule, TxType } from "../types";
import { getActiveCategories, resolveCategoryName } from "../utils/categories";
import { formatRupiahInput, parseRupiahInput } from "../utils/currency";
import { todayLocal } from "../utils/dates";
import { useFinance } from "../state/FinanceContext";
import { getDueOccurrences } from "../utils/recurring";

interface RecurringRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRule?: RecurringRule | null;
  onSave: (rule: RecurringRule) => Promise<{ ok: boolean; errors?: any }>;
}

export const RecurringRuleModal: React.FC<RecurringRuleModalProps> = ({
  isOpen,
  onClose,
  initialRule,
  onSave
}) => {
  const { config } = useFinance();
  const isEdit = !!initialRule;

  const [name, setName] = useState("");
  const [type, setType] = useState<TxType>("expense");
  const [amountStr, setAmountStr] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [walletId, setWalletId] = useState("default");
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [startDate, setStartDate] = useState(todayLocal());
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [active, setActive] = useState(true);

  const [errors, setErrors] = useState<{ name?: string; amount?: string; categoryId?: string; walletId?: string; startDate?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setSubmitting(false);

      if (initialRule) {
        setName(initialRule.name || "");
        setType(initialRule.type);
        setAmountStr(formatRupiahInput(initialRule.amount));
        setCategoryId(initialRule.categoryId);
        setWalletId(initialRule.walletId || "default");
        setFrequency(initialRule.frequency);
        setStartDate(initialRule.startDate || todayLocal());
        setDayOfMonth(initialRule.dayOfMonth || 1);
        setDayOfWeek(initialRule.dayOfWeek || 1);
        setActive(initialRule.active !== false);
      } else {
        setName("");
        setType("expense");
        setAmountStr("");
        const activeExp = getActiveCategories(config, "expense");
        setCategoryId(activeExp.length > 0 ? activeExp[0].id : "");
        setWalletId("default");
        setFrequency("monthly");
        const today = todayLocal();
        setStartDate(today);
        setDayOfMonth(parseInt(today.split("-")[2], 10));
        setDayOfWeek(1);
        setActive(true);
      }

      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [isOpen, initialRule, config]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeCategories = getActiveCategories(config, type);

  // Preview due occurrences if start date is in the past
  const previewRule: RecurringRule = {
    id: initialRule?.id || "preview",
    name: name.trim() || undefined,
    type,
    amount: parseRupiahInput(amountStr) || 0,
    categoryId,
    walletId,
    frequency,
    active,
    startDate,
    dayOfMonth: frequency === "monthly" ? dayOfMonth : undefined,
    dayOfWeek: frequency === "weekly" ? dayOfWeek : undefined
  };
  const duePreview = startDate < todayLocal() ? getDueOccurrences(previewRule, todayLocal()) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const amount = parseRupiahInput(amountStr) || 0;
    const ruleId = initialRule?.id || ("rule-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6));

    const payload: RecurringRule = {
      id: ruleId,
      name: name.trim() ? name.trim() : undefined,
      type,
      amount,
      categoryId,
      walletId,
      frequency,
      active,
      startDate,
      dayOfMonth: frequency === "monthly" ? Number(dayOfMonth) : undefined,
      dayOfWeek: frequency === "weekly" ? Number(dayOfWeek) : undefined,
      createdAt: initialRule?.createdAt,
      createdBy: initialRule?.createdBy
    };

    setSubmitting(true);
    const res = await onSave(payload);
    setSubmitting(false);

    if (res.ok) {
      onClose();
    } else if (res.errors) {
      setErrors(res.errors);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      style={{ backgroundColor: "var(--scrim)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-surface rounded-[12px] max-w-[480px] w-full border border-border p-5 sm:p-6 space-y-5 shadow-popover max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-[18px] font-serif font-bold text-text">
            {isEdit ? "Ubah aturan berulang" : "Tambah aturan berulang"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-1 rounded-[8px] hover:bg-surface-sunken text-text-2 hover:text-text transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="rule-name" className="text-[13px] font-medium text-text">
              Nama / Keterangan Aturan
            </label>
            <input
              id="rule-name"
              ref={nameInputRef}
              type="text"
              maxLength={100}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors(prev => ({ ...prev, name: undefined }));
              }}
              placeholder="Contoh: Gaji Bulanan, Sewa Rumah, Internet"
              className={`w-full px-3 py-2 text-[14px] rounded-[10px] border bg-surface text-text min-h-[44px] ${
                errors.name ? "border-danger" : "border-border hover:border-border-strong"
              }`}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[13px] font-medium text-text">Jenis transaksi</label>
            <div className="flex bg-surface-sunken p-1 rounded-[10px] border border-border" role="radiogroup">
              <button
                type="button"
                role="radio"
                aria-checked={type === "expense"}
                onClick={() => {
                  setType("expense");
                  const activeExp = getActiveCategories(config, "expense");
                  setCategoryId(activeExp.length > 0 ? activeExp[0].id : "");
                }}
                className={`flex-1 py-2 text-[13px] font-medium rounded-[8px] transition cursor-pointer ${
                  type === "expense" ? "bg-surface text-danger border border-border shadow-2xs" : "text-text-2"
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={type === "income"}
                onClick={() => {
                  setType("income");
                  const activeInc = getActiveCategories(config, "income");
                  setCategoryId(activeInc.length > 0 ? activeInc[0].id : "");
                }}
                className={`flex-1 py-2 text-[13px] font-medium rounded-[8px] transition cursor-pointer ${
                  type === "income" ? "bg-surface text-primary border border-border shadow-2xs" : "text-text-2"
                }`}
              >
                Pemasukan
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="rule-amount" className="text-[13px] font-medium text-text">
              Nominal (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-medium text-text-2">
                Rp
              </span>
              <input
                id="rule-amount"
                type="text"
                inputMode="numeric"
                value={amountStr}
                onChange={(e) => {
                  const num = parseRupiahInput(e.target.value);
                  setAmountStr(num === null ? "" : formatRupiahInput(num));
                  setErrors(prev => ({ ...prev, amount: undefined }));
                }}
                placeholder="0"
                className={`w-full pl-9 pr-3 py-2 text-[15px] rounded-[10px] border bg-surface text-text min-h-[44px] ${
                  errors.amount ? "border-danger" : "border-border hover:border-border-strong"
                }`}
              />
            </div>
            {errors.amount && <p className="text-[12px] text-danger mt-1 font-medium">{errors.amount}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="rule-category" className="text-[13px] font-medium text-text">
              Kategori
            </label>
            <select
              id="rule-category"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setErrors(prev => ({ ...prev, categoryId: undefined }));
              }}
              className={`w-full px-3 py-2 text-[14px] rounded-[10px] border bg-surface text-text min-h-[44px] ${
                errors.categoryId ? "border-danger" : "border-border hover:border-border-strong"
              }`}
            >
              <option value="" disabled>Pilih kategori</option>
              {activeCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="text-[12px] text-danger mt-1 font-medium">{errors.categoryId}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="rule-wallet" className="text-[13px] font-medium text-text">
              Dompet
            </label>
            <select
              id="rule-wallet"
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full px-3 py-2 text-[14px] rounded-[10px] border bg-surface text-text border-border min-h-[44px]"
            >
              {Object.values(config.wallets || {}).map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="rule-freq" className="text-[13px] font-medium text-text">
                Frekuensi
              </label>
              <select
                id="rule-freq"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                className="w-full px-3 py-2 text-[14px] rounded-[10px] border bg-surface text-text border-border min-h-[44px]"
              >
                <option value="daily">Setiap hari</option>
                <option value="weekly">Setiap minggu</option>
                <option value="monthly">Setiap bulan</option>
              </select>
            </div>

            {frequency === "monthly" && (
              <div className="space-y-1">
                <label htmlFor="rule-dom" className="text-[13px] font-medium text-text">
                  Tanggal setiap bulan (1-31)
                </label>
                <input
                  id="rule-dom"
                  type="number"
                  min={1}
                  max={31}
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 text-[14px] rounded-[10px] border bg-surface text-text border-border min-h-[44px]"
                />
              </div>
            )}

            {frequency === "weekly" && (
              <div className="space-y-1">
                <label htmlFor="rule-dow" className="text-[13px] font-medium text-text">
                  Hari dalam seminggu
                </label>
                <select
                  id="rule-dow"
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-[14px] rounded-[10px] border bg-surface text-text border-border min-h-[44px]"
                >
                  <option value={1}>(1) Senin</option>
                  <option value={2}>(2) Selasa</option>
                  <option value={3}>(3) Rabu</option>
                  <option value={4}>(4) Kamis</option>
                  <option value={5}>(5) Jumat</option>
                  <option value={6}>(6) Sabtu</option>
                  <option value={0}>(0) Minggu</option>
                </select>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="rule-start" className="text-[13px] font-medium text-text">
              Mulai Tanggal
            </label>
            <input
              id="rule-start"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setErrors(prev => ({ ...prev, startDate: undefined }));
              }}
              className={`w-full px-3 py-2 text-[14px] rounded-[10px] border bg-surface text-text min-h-[44px] ${
                errors.startDate ? "border-danger" : "border-border hover:border-border-strong"
              }`}
            />
            {errors.startDate && <p className="text-[12px] text-danger mt-1 font-medium">{errors.startDate}</p>}
          </div>

          {duePreview.length > 0 && (
            <div className="bg-surface-sunken p-3 rounded-[10px] border border-border text-[12px] text-text-2">
              Perhatian: Tanggal mulai di masa lalu. Aturan ini akan langsung membuat <span className="font-semibold text-text">{duePreview.length} transaksi berulang</span> ke belakang sampai hari ini.
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
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
              Simpan Aturan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
