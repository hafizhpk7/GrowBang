const MONTH_NAMES_INDONESIAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const SHORT_MONTH_NAMES_INDONESIAN = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agt", "Sep", "Okt", "Nov", "Des"
];

const WEEKDAY_NAMES_INDONESIAN = [
  "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"
];

export function todayLocal(now = new Date()): string {
  // Always format in Asia/Jakarta timezone to avoid local vs UTC drift
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(now);
}

export function isValidDateString(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [yStr, mStr, dStr] = s.split("-");
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const d = parseInt(dStr, 10);

  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;

  const dateObj = new Date(y, m - 1, d);
  return (
    dateObj.getFullYear() === y &&
    dateObj.getMonth() === m - 1 &&
    dateObj.getDate() === d
  );
}

export function monthKeyOf(date: string): string {
  return date.slice(0, 7);
}

export function currentMonthKey(now = new Date()): string {
  return todayLocal(now).slice(0, 7);
}

export function monthRange(monthKey: string): { from: string; to: string } {
  const [yStr, mStr] = monthKey.split("-");
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);

  const lastDay = new Date(y, m, 0).getDate();
  const from = `${monthKey}-01`;
  const to = `${monthKey}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

export function addMonths(monthKey: string, n: number): string {
  const [yStr, mStr] = monthKey.split("-");
  let y = parseInt(yStr, 10);
  let m = parseInt(mStr, 10) - 1 + n;

  y += Math.floor(m / 12);
  m = ((m % 12) + 12) % 12;

  const resY = String(y).padStart(4, "0");
  const resM = String(m + 1).padStart(2, "0");
  return `${resY}-${resM}`;
}

export function monthLabel(monthKey: string): string {
  const [yStr, mStr] = monthKey.split("-");
  const m = parseInt(mStr, 10) - 1;
  return `${MONTH_NAMES_INDONESIAN[m]} ${yStr}`;
}

export function shortMonthLabel(monthKey: string): string {
  const [, mStr] = monthKey.split("-");
  const m = parseInt(mStr, 10) - 1;
  return SHORT_MONTH_NAMES_INDONESIAN[m];
}

export function formatDayHeader(dateStr: string): string {
  if (!isValidDateString(dateStr)) return dateStr;
  const [yStr, mStr, dStr] = dateStr.split("-");
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const d = parseInt(dStr, 10);

  const dateObj = new Date(y, m - 1, d);
  const dayName = WEEKDAY_NAMES_INDONESIAN[dateObj.getDay()];
  const monthName = MONTH_NAMES_INDONESIAN[m - 1];

  return `${dayName}, ${d} ${monthName} ${y}`;
}
