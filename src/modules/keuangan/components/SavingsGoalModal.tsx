import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { SavingsGoal } from "../types";
import { formatRupiahInput, parseRupiahInput } from "../utils/currency";
import { todayLocal } from "../utils/dates";

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGoal?: SavingsGoal | null;
  onSave: (goal: SavingsGoal) => Promise<{ ok: boolean; errors?: any }>;
}

export const SavingsGoalModal: React.FC<SavingsGoalModalProps> = ({
  isOpen,
  onClose,
  initialGoal,
  onSave
}) => {
  const isEdit = !!initialGoal;
  const [name, setName] = useState("");
  const [targetStr, setTargetStr] = useState("");
  const [deadline, setDeadline] = useState("");
  const [errors, setErrors] = useState<{ name?: string; targetAmount?: string; deadline?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setSubmitting(false);
      if (initialGoal) {
        setName(initialGoal.name);
        setTargetStr(formatRupiahInput(initialGoal.targetAmount));
        setDeadline(initialGoal.deadline || "");
      } else {
        setName("");
        setTargetStr("");
        setDeadline("");
      }
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, initialGoal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const targetAmount = parseRupiahInput(targetStr) || 0;
    const goalId = initialGoal?.id || ("goal-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6));

    const payload: SavingsGoal = {
      id: goalId,
      name: name.trim(),
      targetAmount,
      currentAmount: initialGoal ? initialGoal.currentAmount : 0,
      deadline: deadline || undefined,
      createdAt: initialGoal?.createdAt,
      createdBy: initialGoal?.createdBy
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
        className="bg-surface rounded-[12px] max-w-[460px] w-full border border-border p-5 sm:p-6 space-y-5 shadow-popover"
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-[18px] font-serif font-bold text-text">
            {isEdit ? "Ubah target tabungan" : "Tambah target tabungan"}
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
            <label htmlFor="goal-name" className="text-[13px] font-medium text-text">
              Nama Target
            </label>
            <input
              id="goal-name"
              ref={nameInputRef}
              type="text"
              maxLength={100}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors(prev => ({ ...prev, name: undefined }));
              }}
              placeholder="Contoh: Dana Darurat, Pendidikan Anak"
              className={`w-full px-3 py-2 text-[14px] rounded-[10px] border bg-surface text-text min-h-[44px] ${
                errors.name ? "border-danger" : "border-border hover:border-border-strong"
              }`}
            />
            {errors.name && <p className="text-[12px] text-danger mt-1 font-medium">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="goal-target" className="text-[13px] font-medium text-text">
              Target Nominal (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-medium text-text-2">
                Rp
              </span>
              <input
                id="goal-target"
                type="text"
                inputMode="numeric"
                value={targetStr}
                onChange={(e) => {
                  const num = parseRupiahInput(e.target.value);
                  setTargetStr(num === null ? "" : formatRupiahInput(num));
                  setErrors(prev => ({ ...prev, targetAmount: undefined }));
                }}
                placeholder="0"
                className={`w-full pl-9 pr-3 py-2 text-[15px] rounded-[10px] border bg-surface text-text min-h-[44px] ${
                  errors.targetAmount ? "border-danger" : "border-border hover:border-border-strong"
                }`}
              />
            </div>
            {errors.targetAmount && <p className="text-[12px] text-danger mt-1 font-medium">{errors.targetAmount}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="goal-deadline" className="text-[13px] font-medium text-text">
              Tenggat Waktu (Opsional)
            </label>
            <input
              id="goal-deadline"
              type="date"
              value={deadline}
              onChange={(e) => {
                setDeadline(e.target.value);
                setErrors(prev => ({ ...prev, deadline: undefined }));
              }}
              className={`w-full px-3 py-2 text-[14px] rounded-[10px] border bg-surface text-text min-h-[44px] ${
                errors.deadline ? "border-danger" : "border-border hover:border-border-strong"
              }`}
            />
            {errors.deadline && <p className="text-[12px] text-danger mt-1 font-medium">{errors.deadline}</p>}
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
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
