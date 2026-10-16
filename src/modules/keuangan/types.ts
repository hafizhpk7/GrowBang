export type TxType = "income" | "expense";

export interface Transaction {
  id: string;            // [A-Za-z0-9_-]{1,128}
  type: TxType;
  amount: number;        // integer rupiah, 1 .. 1_000_000_000_000
  categoryId: string;    // 1..64 chars
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
}

export type EntrySource = "manual" | "vaccine";

export interface LedgerEntry extends Transaction {
  source: EntrySource;
  readOnly: boolean;           // true for vaccine entries
  profileId?: string;          // vaccine entries only
  profileName?: string;
  rowId?: string;
}
