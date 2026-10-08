import { FinanceConfig, Transaction, TxType } from "../types";
import { getAllCategories } from "./categories";
import { isValidDateString, todayLocal } from "./dates";

export function validateTransactionInput(
  input: {
    type?: TxType;
    amount?: number;
    categoryId?: string;
    date?: string;
    note?: string;
  },
  config: FinanceConfig,
  opts?: { today?: string; editingId?: string; existingCategoryId?: string }
): {
  ok: boolean;
  errors: { amount?: string; categoryId?: string; date?: string; note?: string };
} {
  const errors: { amount?: string; categoryId?: string; date?: string; note?: string } = {};

  // 1. Amount validation
  if (typeof input.amount !== "number" || isNaN(input.amount) || !Number.isInteger(input.amount) || input.amount <= 0) {
    errors.amount = "Nominal harus lebih dari 0";
  } else if (input.amount > 1_000_000_000_000) {
    errors.amount = "Nominal terlalu besar";
  }

  // 2. Category validation
  if (!input.categoryId) {
    errors.categoryId = "Pilih kategori";
  } else {
    const all = getAllCategories(config);
    const found = all.find((c) => c.id === input.categoryId);
    if (!found) {
      errors.categoryId = "Pilih kategori";
    } else {
      if (input.type && found.type !== input.type) {
        errors.categoryId = "Pilih kategori";
      } else if (found.archived) {
        const isEditingCurrent = opts?.existingCategoryId && opts.existingCategoryId === input.categoryId;
        if (!isEditingCurrent) {
          errors.categoryId = "Pilih kategori";
        }
      }
    }
  }

  // 3. Date validation
  const today = opts?.today || todayLocal();
  if (!input.date || !isValidDateString(input.date)) {
    errors.date = "Tanggal tidak valid";
  } else if (input.date > today) {
    errors.date = "Tanggal tidak boleh di masa depan";
  }

  // 4. Note validation
  if (input.note) {
    const trimmedNote = input.note.trim();
    if (trimmedNote.length > 500) {
      errors.note = "Catatan maksimal 500 karakter";
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors
  };
}
