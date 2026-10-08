import { useMemo } from "react";
import { useBayi } from "./context/BayiContext";

export interface VaccineCostSource {
  profileId: string;
  profileName: string;                        // Profile.panggilan
  rows: { id: string; vaksin: string }[];     // from Profile.schedule
  records: {                                  // from Profile.records
    rowId: string;
    diberikan: boolean;
    tanggalDiberikan?: string;
    biayaAktual?: number;
    ditanggungAsuransi?: boolean;
    nominalKlaim?: number;
    statusKlaim?: string;
  }[];
}

export function useVaccineCostSources(): VaccineCostSource[] {
  const { appState } = useBayi();

  return useMemo(() => {
    return (appState?.profiles || []).map((p) => ({
      profileId: p.id,
      profileName: p.panggilan,
      rows: (p.schedule || []).map((r) => ({ id: r.id, vaksin: r.vaksin })),
      records: (p.records || []).map((rec) => ({
        rowId: rec.rowId,
        diberikan: rec.diberikan,
        tanggalDiberikan: rec.tanggalDiberikan,
        biayaAktual: rec.biayaAktual,
        ditanggungAsuransi: rec.ditanggungAsuransi,
        nominalKlaim: rec.nominalKlaim,
        statusKlaim: rec.statusKlaim
      }))
    }));
  }, [appState?.profiles]);
}
