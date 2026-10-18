export type TxType = "income" | "expense";

export interface Wallet {
  id: string;            // e.g. "default", "wallet-..."
  name: string;          // e.g. "Kas Utama", "BCA", "GoPay"
  isDefault?: boolean;
  archived?: boolean;
  createdAt?: string;
}

export const DEFAULT_WALLET_ID = "default";
export const DEFAULT_WALLET_NAME = "Kas Utama";
export const DEFAULT_WALLETS: Record<string, Wallet> = {
  [DEFAULT_WALLET_ID]: {
    id: DEFAULT_WALLET_ID,
    name: DEFAULT_WALLET_NAME,
    isDefault: true
  }
};

export interface Transaction {
  id: string;            // [A-Za-z0-9_-]{1,128} or deterministic rec ID
  type: TxType;
  amount: number;        // integer rupiah, 1 .. 1_000_000_000_000
  categoryId: string;    // 1..64 chars
  walletId?: string;     // walletId (defaults to "default" / "Kas Utama")
  date: string;          // "YYYY-MM-DD", a REAL calendar date
  note?: string;         // trimmed, max 500 chars; omitted when empty
  createdAt: string;     // ISO timestamp
  updatedAt: string;     // ISO timestamp
  createdBy?: string;    // uid
}

export interface Category {
  id: string;
  name: string;          // trimmed, 1..40 chars
  type: TxType;
  isSystem: boolean;
  archived?: boolean;
}

export interface FinanceConfig {
  schemaVersion: 1;
  customCategories: Category[];                 // isSystem always false
  budgets: { [categoryId: string]: number };    // integer rupiah > 0; absent = no budget
  includeVaccineCosts: boolean;                 // default true
  wallets?: Record<string, Wallet>;             // map of walletId -> Wallet
}

export type EntrySource = "manual" | "vaccine";

export interface LedgerEntry extends Transaction {
  source: EntrySource;
  readOnly: boolean;           // true for vaccine entries
  profileId?: string;          // vaccine entries only
  profileName?: string;
  rowId?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;                // 1..100 chars
  targetAmount: number;        // integer rupiah > 0
  currentAmount: number;       // integer rupiah >= 0
  deadline?: string;           // "YYYY-MM-DD"
  createdAt?: string;          // ISO timestamp
  updatedAt?: string;          // ISO timestamp
  createdBy?: string;          // uid
}

export type RecurringFrequency = "daily" | "weekly" | "monthly";

export interface RecurringRule {
  id: string;
  name?: string;               // description / label
  type: TxType;
  amount: number;              // integer rupiah
  categoryId: string;
  walletId: string;
  frequency: RecurringFrequency;
  active?: boolean;            // default true
  startDate?: string;          // "YYYY-MM-DD"
  dayOfMonth?: number;         // 1..31
  dayOfWeek?: number;          // 0..6
  lastGeneratedThrough?: string; // "YYYY-MM-DD"
  createdAt?: string;          // ISO timestamp
  updatedAt?: string;          // ISO timestamp
  createdBy?: string;          // uid
}
