export type Status = "Wajib" | "Pilihan" | "Kondisional";
export type Gratis = "Ya" | "Tidak" | "Sebagian";

export interface ScheduleRow {
  id: string;
  tahun: 1 | 2 | 3 | 4 | 5;
  usia: string;
  bln: number;
  vaksin: string;
  ref: string;
  status: Status;
  gratis: Gratis;
  masuk: boolean;
  min: number;
  max: number;
  catatan: string;
  isCustom?: boolean;
}

export interface VaccineInfo {
  id: string;
  nama: string;
  melindungi: string;
  penting: string;
  status: Status;
  gratisProgram: "Ya" | "Tidak";
  efekSamping: string;
}

export type FacilityType = "Puskesmas" | "Posyandu" | "Rumah Sakit" | "Klinik" | "Dokter Praktik" | "Lainnya";
export type ClaimStatus = "Belum diajukan" | "Diajukan" | "Disetujui" | "Ditolak";
export type ScheduleItemStatus = "Selesai" | "Terlambat" | "Segera" | "Terjadwal";

export type VaccineRecord = {
  rowId: string;
  diberikan: boolean;
  tanggalDiberikan?: string;
  tempat?: FacilityType;
  merekBatch?: string;
  biayaAktual?: number;
  ditanggungAsuransi?: boolean;
  nominalKlaim?: number;
  statusKlaim?: ClaimStatus;
  efekSamping?: string;
  catatan?: string;
};

export type Record = VaccineRecord;
export type ImmunizationRecord = VaccineRecord;

export interface Insurance {
  namaProduk: string;
  nomorPolis?: string;
  limitPerTahun: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  masaTungguBulan: number;
  mekanisme: "Cashless" | "Reimburse" | "Keduanya" | "";
  vaksinDikecualikan: string;
  catatan: string;
  checklist: boolean[]; /* 4 item */
}

export interface Profile {
  id: string;
  panggilan: string;
  tanggalLahir: string;
  catatan?: string;
  schedule: ScheduleRow[];
  records: VaccineRecord[];
  insurance: Insurance;
}

export type PaymentMode = "HYBRID" | "FULL_PRIVATE" | "FULL_BPJS";

export interface AppState {
  schemaVersion: number;
  profiles: Profile[];
  activeProfileId: string;
  paymentMode?: PaymentMode;
}

export interface CostSummaryYear {
  tahun: 1 | 2 | 3 | 4 | 5;
  rentangUsia: string;
  tanggungSendiriMin: number;
  tanggungSendiriMax: number;
  semuaSwastaMin: number;
  semuaSwastaMax: number;
  dibebaskanMin: number;
  dibebaskanMax: number;
}

export interface CostSummaryTotal {
  tanggungSendiriMin: number;
  tanggungSendiriMax: number;
  semuaSwastaMin: number;
  semuaSwastaMax: number;
  dibebaskanMin: number;
  dibebaskanMax: number;
}
