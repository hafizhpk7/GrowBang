import * as XLSX from "xlsx";
import { FinanceConfig, LedgerEntry } from "../types";
import { resolveCategoryName } from "./categories";
import { monthKeyOf } from "./dates";
import { summarizeMonth } from "./calculations";

export function buildExportRows(
  entries: LedgerEntry[],
  config: FinanceConfig,
  month: string
): {
  transactions: {
    Tanggal: string;
    Jenis: string;
    Kategori: string;
    "Nominal (Rp)": number;
    Catatan: string;
    Sumber: string;
  }[];
  summary: {
    Keterangan: string;
    "Nominal (Rp)": number;
  }[];
} {
  const monthEntries = (entries || []).filter((e) => monthKeyOf(e.date) === month);

  // Sorted by date asc then createdAt asc
  monthEntries.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return a.createdAt.localeCompare(b.createdAt);
  });

  const transactions = monthEntries.map((e) => ({
    Tanggal: e.date,
    Jenis: e.type === "income" ? "Pemasukan" : "Pengeluaran",
    Kategori: resolveCategoryName(config, e.categoryId),
    "Nominal (Rp)": e.amount,
    Catatan: e.note || "",
    Sumber: e.source === "vaccine" ? "Jadwal vaksin" : "Manual"
  }));

  const monthSummary = summarizeMonth(entries, month);

  const summary: { Keterangan: string; "Nominal (Rp)": number }[] = [
    { Keterangan: "Total pemasukan", "Nominal (Rp)": monthSummary.income },
    { Keterangan: "Total pengeluaran", "Nominal (Rp)": monthSummary.expense },
    { Keterangan: "Selisih", "Nominal (Rp)": monthSummary.net }
  ];

  for (const item of monthSummary.expenseByCategory) {
    const catName = resolveCategoryName(config, item.categoryId);
    summary.push({
      Keterangan: `Pengeluaran: ${catName}`,
      "Nominal (Rp)": item.total
    });
  }

  return {
    transactions,
    summary
  };
}

export function exportFinanceToExcel(
  entries: LedgerEntry[],
  config: FinanceConfig,
  month: string
): void {
  const { transactions, summary } = buildExportRows(entries, config, month);

  const wb = XLSX.utils.book_new();

  const wsTransactions = XLSX.utils.json_to_sheet(transactions);
  XLSX.utils.book_append_sheet(wb, wsTransactions, "Transaksi");

  const wsSummary = XLSX.utils.json_to_sheet(summary);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

  const fileName = `keuangan-keluarga-${month}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
