import { DEFAULT_WALLET_ID, RecurringRule, Transaction } from "../types";
import { todayLocal } from "./dates";

export function generateRecurringTxId(ruleId: string, date: string): string {
  return `rec:${ruleId}:${date}`;
}

function parseDateUtc(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDateUtc(dateObj: Date): string {
  const y = String(dateObj.getUTCFullYear()).padStart(4, "0");
  const m = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function getDueOccurrences(
  rule: RecurringRule,
  todayStr: string = todayLocal()
): string[] {
  if (rule.active === false) return [];

  const startDateStr = rule.startDate || todayStr;
  const highWater = rule.lastGeneratedThrough || "";
  const today = parseDateUtc(todayStr);
  const start = parseDateUtc(startDateStr);

  const occurrences: string[] = [];
  let curr = new Date(start.getTime());

  if (highWater) {
    const hwDate = parseDateUtc(highWater);
    if (hwDate.getTime() >= start.getTime()) {
      curr = new Date(hwDate.getTime());
      curr.setUTCDate(curr.getUTCDate() + 1);
    }
  }

  const freq = rule.frequency;
  const dayOfWeekTarget = rule.dayOfWeek !== undefined ? rule.dayOfWeek : start.getUTCDay();
  const targetDayOfMonth = rule.dayOfMonth !== undefined ? rule.dayOfMonth : start.getUTCDate();

  let count = 0;
  while (curr.getTime() <= today.getTime() && count < 120) {
    const currStr = formatDateUtc(curr);
    let isMatch = false;

    if (freq === "daily") {
      isMatch = true;
    } else if (freq === "weekly") {
      if (curr.getUTCDay() === dayOfWeekTarget) {
        isMatch = true;
      }
    } else if (freq === "monthly") {
      const y = curr.getUTCFullYear();
      const m = curr.getUTCMonth() + 1;
      const lastDay = getLastDayOfMonth(y, m);
      const expectedDay = Math.min(targetDayOfMonth, lastDay);
      if (curr.getUTCDate() === expectedDay) {
        isMatch = true;
      }
    }

    if (isMatch && currStr >= startDateStr && currStr <= todayStr) {
      occurrences.push(currStr);
      count++;
    }

    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  return occurrences;
}

export function buildRecurringTransaction(
  rule: RecurringRule,
  date: string,
  userId?: string | null
): Transaction {
  const deterministicId = generateRecurringTxId(rule.id, date);
  const noteText = rule.name ? `[Berulang] ${rule.name}` : "[Berulang]";
  return {
    id: deterministicId,
    type: rule.type || "expense",
    amount: Math.floor(rule.amount),
    categoryId: rule.categoryId,
    walletId: rule.walletId || DEFAULT_WALLET_ID,
    date,
    note: noteText,
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
    createdBy: rule.createdBy || userId || undefined
  };
}

export interface RuleEvaluationResult {
  transactions: Transaction[];
  ruleUpdates: { ruleId: string; lastGeneratedThrough: string }[];
}

export function evaluateAllRecurringRules(
  rules: RecurringRule[],
  todayStr: string = todayLocal(),
  userId?: string | null
): RuleEvaluationResult {
  const transactions: Transaction[] = [];
  const ruleUpdates: { ruleId: string; lastGeneratedThrough: string }[] = [];

  for (const rule of rules) {
    const dueDates = getDueOccurrences(rule, todayStr);
    if (dueDates.length > 0) {
      for (const d of dueDates) {
        transactions.push(buildRecurringTransaction(rule, d, userId));
      }
      const maxDate = dueDates[dueDates.length - 1];
      ruleUpdates.push({
        ruleId: rule.id,
        lastGeneratedThrough: maxDate
      });
    }
  }

  return { transactions, ruleUpdates };
}
