export function parseRupiahInput(str: string): number | null {
  const digitsOnly = str.replace(/\D/g, "");
  if (!digitsOnly) return null;
  if (digitsOnly.length > 13) return null;

  const parsed = parseInt(digitsOnly, 10);
  if (isNaN(parsed)) return null;
  return parsed;
}

export function formatRupiahInput(n: number): string {
  if (typeof n !== "number" || isNaN(n)) return "";
  return new Intl.NumberFormat("id-ID").format(Math.floor(n));
}
