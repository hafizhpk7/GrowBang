import { addDays, addMonths, differenceInDays, differenceInMonths, differenceInYears, format, isAfter, isBefore, parseISO, startOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { Record, ScheduleItemStatus, ScheduleRow } from "../types";

export function formatIndonesianDate(date: Date | string | undefined | null, formatStr = "d MMM yyyy"): string {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    if (isNaN(d.getTime())) return "-";
    return format(d, formatStr, { locale: id });
  } catch {
    return "-";
  }
}

export function formatFullIndonesianDate(date: Date | string | undefined | null): string {
  return formatIndonesianDate(date, "d MMMM yyyy");
}

export function calculateDueDate(birthDateStr: string, bln: number): Date {
  try {
    if (!birthDateStr) return new Date();
    const birthDate = typeof birthDateStr === "string" ? parseISO(birthDateStr) : new Date(birthDateStr);
    if (isNaN(birthDate.getTime())) return new Date();
    const months = typeof bln === "number" && !isNaN(bln) ? bln : 0;
    return addMonths(birthDate, months);
  } catch {
    return new Date();
  }
}

export function getChildAge(birthDateStr: string, targetDate: Date = new Date()): { years: number; months: number; days: number; text: string } {
  try {
    if (!birthDateStr) {
      return { years: 0, months: 0, days: 0, text: "-" };
    }
    const birthDate = typeof birthDateStr === "string" ? parseISO(birthDateStr) : new Date(birthDateStr);
    if (isNaN(birthDate.getTime())) {
      return { years: 0, months: 0, days: 0, text: "Tanggal lahir tidak valid" };
    }

    const today = startOfDay(targetDate);
    const birth = startOfDay(birthDate);

    if (isBefore(today, birth)) {
      return { years: 0, months: 0, days: 0, text: "Belum lahir" };
    }

    const years = differenceInYears(today, birth);
    const dateAfterYears = addMonths(birth, years * 12);
    const months = differenceInMonths(today, dateAfterYears);
    const dateAfterMonths = addMonths(dateAfterYears, months);
    const days = differenceInDays(today, dateAfterMonths);

    const parts: string[] = [];
    if (years > 0) parts.push(`${years} tahun`);
    if (months > 0 || years > 0) parts.push(`${months} bulan`);
    parts.push(`${days} hari`);

    return {
      years,
      months,
      days,
      text: parts.join(" ")
    };
  } catch {
    return { years: 0, months: 0, days: 0, text: "-" };
  }
}

export function getScheduleStatus(
  row: ScheduleRow,
  record: Record | undefined,
  birthDateStr: string,
  now: Date = new Date()
): { status: ScheduleItemStatus; dueDate: Date; dueDateStr: string; daysDiff: number; diffDays: number } {
  const dueDate = calculateDueDate(birthDateStr, row?.bln ?? 0);
  const today = startOfDay(now instanceof Date && !isNaN(now.getTime()) ? now : new Date());
  const due = startOfDay(dueDate instanceof Date && !isNaN(dueDate.getTime()) ? dueDate : today);

  const rawDiff = differenceInDays(due, today);
  const validDiff = typeof rawDiff === "number" && !isNaN(rawDiff) && isFinite(rawDiff) ? rawDiff : 0;
  const dueDateStr = formatIndonesianDate(dueDate);

  if (record?.diberikan) {
    return {
      status: "Selesai",
      dueDate,
      dueDateStr,
      daysDiff: validDiff,
      diffDays: validDiff
    };
  }

  if (isBefore(due, today)) {
    return {
      status: "Terlambat",
      dueDate,
      dueDateStr,
      daysDiff: validDiff,
      diffDays: validDiff
    };
  }

  const thirtyDaysAhead = addDays(today, 30);
  if (!isAfter(due, thirtyDaysAhead)) {
    return {
      status: "Segera",
      dueDate,
      dueDateStr,
      daysDiff: validDiff,
      diffDays: validDiff
    };
  }

  return {
    status: "Terjadwal",
    dueDate,
    dueDateStr,
    daysDiff: validDiff,
    diffDays: validDiff
  };
}
