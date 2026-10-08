import { Baby, Wallet, LucideIcon } from "lucide-react";

export interface AppModule {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  basePath: string;
  status: "active" | "coming-soon";
}

export const MODULE_REGISTRY: AppModule[] = [
  {
    id: "bayi",
    name: "Bayi",
    description: "Jadwal imunisasi, pertumbuhan, dan biaya vaksin",
    icon: Baby,
    basePath: "/bayi/beranda",
    status: "active"
  },
  {
    id: "keuangan-keluarga",
    name: "Keuangan Keluarga",
    description: "Catat pemasukan, pengeluaran, dan anggaran keluarga",
    icon: Wallet,
    basePath: "/keuangan-keluarga",
    status: "active"
  }
];
