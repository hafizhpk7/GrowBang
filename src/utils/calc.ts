import { CostSummaryTotal, CostSummaryYear, ScheduleRow, VaccineRecord } from "../types";

export interface ScenarioOptions {
  heksavalenSwasta: boolean;
  sertakanKondisional: boolean;
}

export const YEAR_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "0–12 bln",
  2: "12–24 bln",
  3: "24–36 bln",
  4: "36–48 bln",
  5: "48–60 bln"
};

export function formatRupiah(amount: number | undefined | null, dashForZero = false): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "-";
  if (amount === 0 && dashForZero) return "-";
  return "Rp " + new Intl.NumberFormat("id-ID").format(amount);
}

export function formatRupiahRange(min: number, max: number, dashForZero = false): string {
  if (min === 0 && max === 0 && dashForZero) return "-";
  return `${formatRupiah(min, dashForZero)} – ${formatRupiah(max, dashForZero)}`;
}

export function applyScenarios(schedule: ScheduleRow[], options: ScenarioOptions): ScheduleRow[] {
  return schedule.map((row) => {
    let copy = { ...row };

    // Scenario (a): Heksavalen swasta
    // Replaces min 900,000 / max 1,300,000 for DPT-HB-Hib (r04, r08, r12, r25)
    if (options.heksavalenSwasta && (row.id === "r04" || row.id === "r08" || row.id === "r12" || row.id === "r25")) {
      copy.min = 900000;
      copy.max = 1300000;
      // In private hexavalent setting, usually paid privately
      copy.gratis = "Tidak";
    }

    // Scenario (b): Sertakan vaksin kondisional / opsional (JE, MMR, Meningokokus)
    if (options.sertakanKondisional && (row.id === "r22" || row.id === "r23" || row.id === "r31" || row.status === "Kondisional")) {
      copy.masuk = true;
    }

    return copy;
  });
}

export function calculateCostSummary(
  schedule: ScheduleRow[],
  scenarios: ScenarioOptions = { heksavalenSwasta: false, sertakanKondisional: false }
): { years: CostSummaryYear[]; total: CostSummaryTotal } {
  const activeRows = applyScenarios(schedule, scenarios);

  const years: CostSummaryYear[] = ([1, 2, 3, 4, 5] as const).map((tahun) => {
    const yearRows = activeRows.filter((r) => r.tahun === tahun && r.masuk === true);

    // Tanggung sendiri: gratis !== "Ya" (note: "Sebagian" is included)
    const outOfPocketRows = yearRows.filter((r) => r.gratis !== "Ya");
    const tanggungSendiriMin = outOfPocketRows.reduce((sum, r) => sum + (Number(r.min) || 0), 0);
    const tanggungSendiriMax = outOfPocketRows.reduce((sum, r) => sum + (Number(r.max) || 0), 0);

    // Semua di swasta: all active rows in this year
    const semuaSwastaMin = yearRows.reduce((sum, r) => sum + (Number(r.min) || 0), 0);
    const semuaSwastaMax = yearRows.reduce((sum, r) => sum + (Number(r.max) || 0), 0);

    // Dibebaskan program = Semua swasta - Tanggung sendiri
    const dibebaskanMin = Math.max(0, semuaSwastaMin - tanggungSendiriMin);
    const dibebaskanMax = Math.max(0, semuaSwastaMax - tanggungSendiriMax);

    return {
      tahun,
      rentangUsia: YEAR_LABELS[tahun],
      tanggungSendiriMin,
      tanggungSendiriMax,
      semuaSwastaMin,
      semuaSwastaMax,
      dibebaskanMin,
      dibebaskanMax
    };
  });

  const total: CostSummaryTotal = years.reduce(
    (acc, y) => ({
      tanggungSendiriMin: acc.tanggungSendiriMin + y.tanggungSendiriMin,
      tanggungSendiriMax: acc.tanggungSendiriMax + y.tanggungSendiriMax,
      semuaSwastaMin: acc.semuaSwastaMin + y.semuaSwastaMin,
      semuaSwastaMax: acc.semuaSwastaMax + y.semuaSwastaMax,
      dibebaskanMin: acc.dibebaskanMin + y.dibebaskanMin,
      dibebaskanMax: acc.dibebaskanMax + y.dibebaskanMax
    }),
    {
      tanggungSendiriMin: 0,
      tanggungSendiriMax: 0,
      semuaSwastaMin: 0,
      semuaSwastaMax: 0,
      dibebaskanMin: 0,
      dibebaskanMax: 0
    }
  );

  return { years, total };
}

export function calculateRealization(records: VaccineRecord[], schedule: ScheduleRow[]) {
  const rowMap = new Map(schedule.map((r) => [r.id, r]));

  let totalBiayaAktual = 0;
  let totalKlaimDiajukan = 0;
  let totalKlaimDisetujui = 0;
  let totalKlaimDitolak = 0;

  const perTahunRealization: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  };

  records.forEach((rec) => {
    if (rec.diberikan && rec.biayaAktual !== undefined) {
      totalBiayaAktual += Number(rec.biayaAktual) || 0;
      const row = rowMap.get(rec.rowId);
      if (row) {
        perTahunRealization[row.tahun] += Number(rec.biayaAktual) || 0;
      }
    }

    const claimAmt = Number(rec.nominalKlaim) || 0;
    if (rec.statusKlaim === "Diajukan") {
      totalKlaimDiajukan += claimAmt;
    } else if (rec.statusKlaim === "Disetujui") {
      totalKlaimDisetujui += claimAmt;
    } else if (rec.statusKlaim === "Ditolak") {
      totalKlaimDitolak += claimAmt;
    }
  });

  return {
    totalBiayaAktual,
    totalKlaimDiajukan,
    totalKlaimDisetujui,
    totalKlaimDitolak,
    perTahunRealization
  };
}
