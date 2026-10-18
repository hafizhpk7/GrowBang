import { FinanceConfig, RecurringRule, SavingsGoal, Transaction, TxType } from "../types";
import { getAllCategories } from "./categories";
import { isValidDateString, todayLocal } from "./dates";

export function validateTransactionInput(
  input: {
    type?: TxType;
    amount?: number;
    categoryId?: string;
    walletId?: string;
    date?: string;
    note?: string;
  },
  config: FinanceConfig,
  opts?: { today?: string; editingId?: string; existingCategoryId?: string; existingWalletId?: string }
): {
  ok: boolean;
  errors: { amount?: string; categoryId?: string; walletId?: string; date?: string; note?: string };
} {
  const errors: { amount?: string; categoryId?: string; walletId?: string; date?: string; note?: string } = {};

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

  // 3. Wallet validation
  const wallets = config.wallets || {};
  const walletId = input.walletId || "default";
  const targetWallet = wallets[walletId];
  if (!targetWallet) {
    errors.walletId = "Pilih dompet";
  } else if (targetWallet.archived) {
    const isEditingCurrent = opts?.existingWalletId && opts.existingWalletId === walletId;
    if (!isEditingCurrent) {
      errors.walletId = "Dompet diarsipkan";
    }
  }

  // 4. Date validation
  const today = opts?.today || todayLocal();
  if (!input.date || !isValidDateString(input.date)) {
    errors.date = "Tanggal tidak valid";
  } else if (input.date > today) {
    errors.date = "Tanggal tidak boleh di masa depan";
  }

  // 5. Note validation
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

export function validateWalletName(name: string, existingWallets: Record<string, { name: string; archived?: boolean }>): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Nama dompet wajib diisi";
  if (trimmed.length > 40) return "Nama dompet maksimal 40 karakter";
  const lower = trimmed.toLowerCase();
  for (const w of Object.values(existingWallets)) {
    if (!w.archived && w.name.trim().toLowerCase() === lower) {
      // Allow if name is identical case-insensitively (if editing)
      return "Nama dompet sudah ada";
    }
  }
  return null;
}

export function validateSavingsGoalInput(input: {
  name?: string;
  targetAmount?: number;
  deadline?: string;
}): { ok: boolean; errors: { name?: string; targetAmount?: string; deadline?: string } } {
  const errors: { name?: string; targetAmount?: string; deadline?: string } = {};

  const name = (input.name || "").trim();
  if (!name) {
    errors.name = "Nama target wajib diisi";
  } else if (name.length > 100) {
    errors.name = "Nama target maksimal 100 karakter";
  }

  if (typeof input.targetAmount !== "number" || isNaN(input.targetAmount) || !Number.isInteger(input.targetAmount) || input.targetAmount <= 0) {
    errors.targetAmount = "Target nominal harus lebih dari 0";
  } else if (input.targetAmount > 1_000_000_000_000) {
    errors.targetAmount = "Target nominal terlalu besar";
  }

  if (input.deadline && !isValidDateString(input.deadline)) {
    errors.deadline = "Tanggal tenggat tidak valid";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors
  };
}

export function validateRecurringRuleInput(
  input: {
    name?: string;
    type?: TxType;
    amount?: number;
    categoryId?: string;
    walletId?: string;
    frequency?: string;
    startDate?: string;
  },
  config: FinanceConfig
): { ok: boolean; errors: { name?: string; amount?: string; categoryId?: string; walletId?: string; startDate?: string } } {
  const errors: { name?: string; amount?: string; categoryId?: string; walletId?: string; startDate?: string } = {};

  if (input.name && input.name.trim().length > 100) {
    errors.name = "Nama aturan maksimal 100 karakter";
  }

  if (typeof input.amount !== "number" || isNaN(input.amount) || !Number.isInteger(input.amount) || input.amount <= 0) {
    errors.amount = "Nominal harus lebih dari 0";
  } else if (input.amount > 1_000_000_000_000) {
    errors.amount = "Nominal terlalu besar";
  }

  if (!input.categoryId) {
    errors.categoryId = "Pilih kategori";
  } else {
    const all = getAllCategories(config);
    const found = all.find(c => c.id === input.categoryId);
    if (!found || (input.type && found.type !== input.type)) {
      errors.categoryId = "Pilih kategori yang valid";
    }
  }

  const wallets = config.wallets || {};
  const walletId = input.walletId || "default";
  if (!wallets[walletId]) {
    errors.walletId = "Pilih dompet";
  }

  if (!input.startDate || !isValidDateString(input.startDate)) {
    errors.startDate = "Tanggal mulai tidak valid";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors
  };
}
