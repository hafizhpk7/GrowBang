import { Category, DEFAULT_WALLETS, FinanceConfig } from "../types";

export const SYSTEM_CATEGORIES: Category[] = [
  // EXPENSE
  { id: "makan-minum", name: "Makan & Minum", type: "expense", isSystem: true },
  { id: "belanja-harian", name: "Belanja Harian", type: "expense", isSystem: true },
  { id: "transportasi", name: "Transportasi", type: "expense", isSystem: true },
  { id: "tagihan-utilitas", name: "Tagihan & Utilitas", type: "expense", isSystem: true },
  { id: "rumah-cicilan", name: "Rumah & Cicilan", type: "expense", isSystem: true },
  { id: "kesehatan", name: "Kesehatan", type: "expense", isSystem: true },
  { id: "kesehatan-anak", name: "Kesehatan Anak", type: "expense", isSystem: true },
  { id: "keperluan-anak", name: "Keperluan Anak", type: "expense", isSystem: true },
  { id: "pendidikan", name: "Pendidikan", type: "expense", isSystem: true },
  { id: "hiburan", name: "Hiburan & Rekreasi", type: "expense", isSystem: true },
  { id: "sosial-donasi", name: "Sosial & Donasi", type: "expense", isSystem: true },
  { id: "lainnya-keluar", name: "Lainnya", type: "expense", isSystem: true },
  // INCOME
  { id: "gaji", name: "Gaji", type: "income", isSystem: true },
  { id: "usaha", name: "Usaha", type: "income", isSystem: true },
  { id: "bonus-thr", name: "Bonus & THR", type: "income", isSystem: true },
  { id: "hadiah", name: "Hadiah", type: "income", isSystem: true },
  { id: "lainnya-masuk", name: "Lainnya", type: "income", isSystem: true }
];

export const DEFAULT_FINANCE_CONFIG: FinanceConfig = {
  schemaVersion: 1,
  customCategories: [],
  budgets: {},
  includeVaccineCosts: true,
  wallets: { ...DEFAULT_WALLETS }
};

export const FIRESTORE_TX_KEYS = [
  "id",
  "ownerId",
  "type",
  "amount",
  "categoryId",
  "date",
  "note",
  "createdAt",
  "updatedAt",
  "walletId",
  "createdBy"
] as const;

export const FIRESTORE_CONFIG_KEYS = [
  "ownerId",
  "schemaVersion",
  "customCategories",
  "budgets",
  "includeVaccineCosts",
  "wallets",
  "updatedAt"
] as const;

export const FIRESTORE_SAVINGS_GOAL_KEYS = [
  "id",
  "name",
  "targetAmount",
  "currentAmount",
  "deadline",
  "createdAt",
  "updatedAt",
  "createdBy"
] as const;

export const FIRESTORE_RECURRING_RULE_KEYS = [
  "id",
  "name",
  "type",
  "amount",
  "categoryId",
  "walletId",
  "frequency",
  "active",
  "startDate",
  "dayOfMonth",
  "dayOfWeek",
  "lastGeneratedThrough",
  "createdAt",
  "updatedAt",
  "createdBy"
] as const;
