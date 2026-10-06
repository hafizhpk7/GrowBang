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
    const birthDate = parseISO(birthDateStr);
    if (isNaN(birthDate.getTime())) return new Date();
    return addMonths(birthDate, bln);
  } catch {
    return new Date();
  }
}

export function getChildAge(birthDateStr: string, targetDate: Date = new Date()): { years: number; months: number; days: number; text: string } {
  try {
    const birthDate = parseISO(birthDateStr);
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
): { status: ScheduleItemStatus; dueDate: Date; dueDateStr: string; daysDiff: number } {
  const dueDate = calculateDueDate(birthDateStr, row.bln);
  const today = startOfDay(now);
  const due = startOfDay(dueDate);

  if (record?.diberikan) {
    return {
      status: "Selesai",
      dueDate,
      dueDateStr: formatIndonesianDate(dueDate),
      daysDiff: differenceInDays(due, today)
    };
  }

  const daysDiff = differenceInDays(due, today);

  if (isBefore(due, today)) {
    return {
      status: "Terlambat",
      dueDate,
      dueDateStr: formatIndonesianDate(dueDate),
      daysDiff
    };
  }

  const thirtyDaysAhead = addDays(today, 30);
  if (!isAfter(due, thirtyDaysAhead)) {
    return {
      status: "Segera",
      dueDate,
      dueDateStr: formatIndonesianDate(dueDate),
      daysDiff
    };
  }

  return {
    status: "Terjadwal",
    dueDate,
    dueDateStr: formatIndonesianDate(dueDate),
    daysDiff
  };
}
