import { Category, FinanceConfig, LedgerEntry, TxType } from "../types";
import { resolveCategoryName } from "./categories";
import { addMonths, monthKeyOf, shortMonthLabel } from "./dates";

export function summarizeMonth(
  entries: LedgerEntry[],
  month: string
): {
  income: number;
  expense: number;
  net: number;
  count: number;
  expenseByCategory: { categoryId: string; total: number; count: number }[];
  incomeByCategory: { categoryId: string; total: number; count: number }[];
} {
  let income = 0;
  let expense = 0;
  let count = 0;

  const expMap = new Map<string, { total: number; count: number }>();
  const incMap = new Map<string, { total: number; count: number }>();

  for (const entry of entries || []) {
    if (monthKeyOf(entry.date) === month) {
      count += 1;
      if (entry.type === "expense") {
        expense += entry.amount;
        const cur = expMap.get(entry.categoryId) || { total: 0, count: 0 };
        expMap.set(entry.categoryId, {
          total: cur.total + entry.amount,
          count: cur.count + 1
        });
      } else if (entry.type === "income") {
        income += entry.amount;
        const cur = incMap.get(entry.categoryId) || { total: 0, count: 0 };
        incMap.set(entry.categoryId, {
          total: cur.total + entry.amount,
          count: cur.count + 1
        });
      }
    }
  }

  const sortCategories = (map: Map<string, { total: number; count: number }>) => {
    const list = Array.from(map.entries()).map(([categoryId, val]) => ({
      categoryId,
      total: val.total,
      count: val.count
    }));

    list.sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.categoryId.localeCompare(b.categoryId);
    });

    return list;
  };

  return {
    income,
    expense,
    net: income - expense,
    count,
    expenseByCategory: sortCategories(expMap),
    incomeByCategory: sortCategories(incMap)
  };
}

export function buildTrend(
  entries: LedgerEntry[],
  endMonth: string,
  n = 6
): { month: string; label: string; income: number; expense: number }[] {
  const result: { month: string; label: string; income: number; expense: number }[] = [];

  // Start month is endMonth - (n - 1) months
  const startMonth = addMonths(endMonth, -(n - 1));

  for (let i = 0; i < n; i++) {
    const mKey = addMonths(startMonth, i);
    const summary = summarizeMonth(entries, mKey);
    result.push({
      month: mKey,
      label: shortMonthLabel(mKey),
      income: summary.income,
      expense: summary.expense
    });
  }

  return result;
}

export function monthOverMonthDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export interface BudgetStatusResult {
  state: "none" | "ok" | "warning" | "over";
  ratio: number;
  remaining: number;
}

export function budgetStatus(spent: number, budget?: number): BudgetStatusResult {
  if (budget === undefined || budget === null || budget <= 0) {
    return { state: "none", ratio: 0, remaining: 0 };
  }

  const ratio = spent / budget;
  let state: "ok" | "warning" | "over" = "ok";

  if (ratio > 1.0) {
    state = "over";
  } else if (ratio >= 0.8) {
    state = "warning";
  } else {
    state = "ok";
  }

  return {
    state,
    ratio,
    remaining: budget - spent
  };
}

export function summarizeBudgets(
  expenseByCategory: { categoryId: string; total: number; count: number }[],
  budgets: { [categoryId: string]: number },
  categories: Category[]
): {
  totalBudget: number;
  totalSpentOnBudgeted: number;
  rows: {
    categoryId: string;
    budget: number;
    spent: number;
    status: BudgetStatusResult;
  }[];
} {
  const spentMap = new Map<string, number>();
  for (const item of expenseByCategory || []) {
    spentMap.set(item.categoryId, item.total);
  }

  let totalBudget = 0;
  let totalSpentOnBudgeted = 0;
  const rows: {
    categoryId: string;
    budget: number;
    spent: number;
    status: BudgetStatusResult;
  }[] = [];

  const budgetedCategoryIds = Object.keys(budgets || {}).filter((catId) => {
    const b = budgets[catId];
    return typeof b === "number" && b > 0;
  });

  for (const catId of budgetedCategoryIds) {
    const b = budgets[catId];
    const spent = spentMap.get(catId) || 0;
    const st = budgetStatus(spent, b);

    totalBudget += b;
    totalSpentOnBudgeted += spent;

    rows.push({
      categoryId: catId,
      budget: b,
      spent,
      status: st
    });
  }

  return {
    totalBudget,
    totalSpentOnBudgeted,
    rows
  };
}

export function groupByDate(entries: LedgerEntry[]): { date: string; entries: LedgerEntry[] }[] {
  const groupsMap = new Map<string, LedgerEntry[]>();

  for (const entry of entries || []) {
    const dateKey = entry.date;
    if (!groupsMap.has(dateKey)) {
      groupsMap.set(dateKey, []);
    }
    groupsMap.get(dateKey)!.push(entry);
  }

  // Sort dates descending
  const sortedDates = Array.from(groupsMap.keys()).sort((a, b) => b.localeCompare(a));

  return sortedDates.map((date) => {
    const dayEntries = groupsMap.get(date)!;
    // Sort within a date:
    // manual entries first (sorted by createdAt desc, tie -> id asc),
    // then vaccine entries (sorted by id asc)
    dayEntries.sort((a, b) => {
      if (a.source === "manual" && b.source === "manual") {
        if (b.createdAt !== a.createdAt) {
          return b.createdAt.localeCompare(a.createdAt);
        }
        return a.id.localeCompare(b.id);
      }
      if (a.source === "manual" && b.source === "vaccine") {
        return -1;
      }
      if (a.source === "vaccine" && b.source === "manual") {
        return 1;
      }
      // Both vaccine
      return a.id.localeCompare(b.id);
    });

    return {
      date,
      entries: dayEntries
    };
  });
}

export function filterEntries(
  entries: LedgerEntry[],
  filters: { type?: TxType | "all"; categoryId?: string; query?: string },
  config: FinanceConfig
): LedgerEntry[] {
  const cleanQuery = (filters.query || "").trim().toLowerCase();

  return (entries || []).filter((entry) => {
    // Type filter
    if (filters.type && filters.type !== "all" && entry.type !== filters.type) {
      return false;
    }

    // Category filter
    if (filters.categoryId && filters.categoryId !== "all" && entry.categoryId !== filters.categoryId) {
      return false;
    }

    // Query filter (matches note OR resolved category name)
    if (cleanQuery) {
      const noteMatch = (entry.note || "").toLowerCase().includes(cleanQuery);
      const catName = resolveCategoryName(config, entry.categoryId).toLowerCase();
      const catMatch = catName.includes(cleanQuery);

      if (!noteMatch && !catMatch) {
        return false;
      }
    }

    return true;
  });
}
