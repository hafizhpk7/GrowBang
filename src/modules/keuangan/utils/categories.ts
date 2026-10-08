import { Category, FinanceConfig, TxType } from "../types";
import { SYSTEM_CATEGORIES } from "../constants/categories";

export function getAllCategories(config: FinanceConfig): Category[] {
  const customSorted = [...(config.customCategories || [])].sort((a, b) =>
    a.name.localeCompare(b.name, "id")
  );
  return [...SYSTEM_CATEGORIES, ...customSorted];
}

export function getActiveCategories(config: FinanceConfig, type: TxType): Category[] {
  return getAllCategories(config).filter(
    (c) => c.type === type && !c.archived
  );
}

export function resolveCategoryName(config: FinanceConfig, categoryId: string): string {
  const all = getAllCategories(config);
  const found = all.find((c) => c.id === categoryId);
  return found ? found.name : "Kategori tidak dikenal";
}

export function validateCategoryName(
  name: string,
  type: TxType,
  config: FinanceConfig,
  opts?: { renamingId?: string }
): { ok: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: "Nama kategori wajib diisi" };
  }
  if (trimmed.length > 40) {
    return { ok: false, error: "Nama kategori maksimal 40 karakter" };
  }

  const allInType = getAllCategories(config).filter((c) => c.type === type);
  const lower = trimmed.toLowerCase();

  const isDuplicate = allInType.some((c) => {
    if (opts?.renamingId && c.id === opts.renamingId) return false;
    return c.name.trim().toLowerCase() === lower;
  });

  if (isDuplicate) {
    return { ok: false, error: "Nama kategori sudah dipakai" };
  }

  return { ok: true };
}
