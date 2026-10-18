import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { SavingsGoal } from "../types";
import { formatRupiahInput, parseRupiahInput } from "../utils/currency";

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  mode: "deposit" | "withdraw";
  onConfirm: (id: string, delta: number) => Promise<void>;
}

export const ContributionModal: React.FC<ContributionModalProps> = ({
  isOpen,
  onClose,
  goal,
  mode,
  onConfirm
}) => {
  const [amountStr, setAmountStr] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setAmountStr("");
      setError("");
      setSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const val = parseRupiahInput(amountStr);
    if (val === null || val <= 0 || !Number.isInteger(val)) {
      setError("Nominal harus lebih dari 0");
      return;
    }

    if (mode === "withdraw" && val > goal.currentAmount) {
      setError("Nominal penarikan melebihi saldo tabungan saat ini");
      return;
    }

    setSubmitting(true);
    const delta = mode === "deposit" ? val : -val;
    await onConfirm(goal.id, delta);
    setSubmitting(false);
    onClose();
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
        className="bg-surface rounded-[12px] max-w-[420px] w-full border border-border p-5 sm:p-6 space-y-5 shadow-popover"
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-[18px] font-serif font-bold text-text">
            {mode === "deposit" ? "Setor ke Tabungan" : "Tarik dari Tabungan"}
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

        <p className="text-[13px] text-text-2">
          Target: <span className="font-semibold text-text">{goal.name}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="contrib-amount" className="text-[13px] font-medium text-text">
              Nominal (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-medium text-text-2">
                Rp
              </span>
              <input
                id="contrib-amount"
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={amountStr}
                onChange={(e) => {
                  const num = parseRupiahInput(e.target.value);
                  setAmountStr(num === null ? "" : formatRupiahInput(num));
                  setError("");
                }}
                placeholder="0"
                className={`w-full pl-9 pr-3 py-2 text-[15px] rounded-[10px] border bg-surface text-text min-h-[44px] ${
                  error ? "border-danger" : "border-border hover:border-border-strong"
                }`}
              />
            </div>
            {error && <p className="text-[12px] text-danger mt-1 font-medium">{error}</p>}
          </div>

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
              {mode === "deposit" ? "Setor" : "Tarik"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
