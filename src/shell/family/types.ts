export type Role = "admin" | "member";
export type Relation = "ayah" | "ibu" | "wali" | "kakek" | "nenek" | "saudara" | "pengasuh" | "lainnya";
export const RELATIONS: Relation[] = ["ayah", "ibu", "wali", "kakek", "nenek", "saudara", "pengasuh", "lainnya"];

export interface Family {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: 1;
}

export interface Member {
  uid: string;
  familyId: string;
  displayName: string;
  relation: Relation;
  role: Role;
  isOwner: boolean;
  joinedAt: string;
  updatedAt: string;
  inviteCode?: string;
}

// Backwards compatibility alias if needed
export type MemberInfo = Member;

export interface Invite {
  code: string;
  familyId: string;
  familyName: string;
  createdBy: string;
  relation: Relation;
  role: Role;
  createdAt: string;
  expiresAt: string; // ISO string
  used: boolean;
  usedBy?: string;
  usedAt?: string;
}

export type InviteStatus = "valid" | "used" | "expired";

export type FamilyAction =
  | "finance.read"
  | "finance.write"
  | "baby.write"
  | "members.manage"
  | "invites.manage"
  | "family.rename"
  | "family.transferOwnership"
  | "family.delete"
  | "family.leave"
  | "profile.editSelfName";

// Shared keys and constants (Section 5.9 & Part I Section I.3)
export const FAMILY_KEYS = ["id", "name", "ownerId", "createdAt", "updatedAt", "schemaVersion"] as const;
export const MEMBER_KEYS = ["uid", "familyId", "displayName", "relation", "role", "isOwner", "joinedAt", "updatedAt"] as const;
export const MEMBERSHIP_KEYS = ["uid", "familyId", "createdAt"] as const;
export const INVITE_CREATE_KEYS = ["code", "familyId", "familyName", "createdBy", "relation", "role", "createdAt", "expiresAt", "used"] as const;

export const FAMILY_TX_KEYS = [
  "id", "familyId", "type", "amount", "categoryId", "date", "note", "createdAt", "updatedAt", "createdBy", "updatedBy", "walletId"
] as const;

export const FAMILY_CONFIG_KEYS = [
  "familyId", "schemaVersion", "customCategories", "budgets", "includeVaccineCosts", "updatedAt", "updatedBy", "wallets"
] as const;

export const FAMILY_BABY_KEYS = [
  "id", "panggilan", "tanggalLahir", "catatan", "insurance", "schemaVersion", "createdAt", "updatedAt", "createdBy", "updatedBy", "sourceUid"
] as const;

export const FAMILY_SCHEDULE_KEYS = [
  "rows", "updatedAt", "updatedBy"
] as const;

export const FAMILY_RECORD_KEYS = [
  "rowId", "diberikan", "tanggalDiberikan", "tempat", "merekBatch", "biayaAktual", "ditanggungAsuransi", "nominalKlaim", "statusKlaim", "efekSamping", "catatan", "updatedAt", "updatedBy"
] as const;

export const FAMILY_DATA_COLLECTIONS = ["financeTransactions", "savingsGoals", "recurringRules"] as const;

export const MAX_FAMILY_MEMBERS_SOFT = 50; // Soft UI cap only; not a security boundary
export const NAME_MAX_LENGTH = 80;
export const DISPLAY_NAME_MAX_LENGTH = 80;
export const NOTE_MAX_LENGTH = 500;
export const AMOUNT_MAX = 1_000_000_000_000;
export const CUSTOM_CATEGORIES_MAX = 100;
export const BUDGETS_MAX = 200;
export const WALLETS_MAX = 50;
export const INVITE_MAX_DAYS = 3;

export const RELATION_LABELS: Record<Relation, string> = {
  ayah: "Ayah",
  ibu: "Ibu",
  wali: "Wali",
  kakek: "Kakek",
  nenek: "Nenek",
  saudara: "Saudara",
  pengasuh: "Pengasuh",
  lainnya: "Lainnya"
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  member: "Anggota"
};
