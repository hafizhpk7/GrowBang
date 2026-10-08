import React from "react";
import { PaymentMode } from "../../../types";
import { Building2, ShieldCheck, Wallet, Sparkles, ChevronDown } from "lucide-react";

interface Props {
  paymentMode: PaymentMode;
  onChange: (mode: PaymentMode) => void;
  variant?: "full" | "compact" | "badge";
}

export const PAYMENT_MODE_LABELS: Record<
  PaymentMode,
  {
    title: string;
    shortTitle: string;
    description: string;
    badge: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  HYBRID: {
    title: "Hybrid (Puskesmas & Swasta)",
    shortTitle: "Hybrid",
    description: "Program pemerintah (Wajib) gratis di Puskesmas, vaksin pilihan bayar mandiri di swasta.",
    badge: "Opsi Terpopuler",
    icon: Wallet
  },
  FULL_PRIVATE: {
    title: "Full Swasta / Asuransi",
    shortTitle: "Full Swasta",
    description: "Semua imunisasi (wajib & pilihan) dilakukan di Klinik/RS Swasta dengan tarif mandiri/asuransi.",
    badge: "Mandiri / Asuransi",
    icon: Building2
  },
  FULL_BPJS: {
    title: "Full BPJS / Puskesmas",
    shortTitle: "Full BPJS",
    description: "Fokus pada imunisasi program pemerintah yang ditanggung BPJS. Vaksin pilihan tidak ditanggung.",
    badge: "Program Pemerintah",
    icon: ShieldCheck
  }
};

export const PaymentModeSelector: React.FC<Props> = ({
  paymentMode,
  onChange,
  variant = "full"
}) => {
  if (variant === "compact") {
    return (
      <div className="inline-flex items-center gap-1.5 bg-surface-sunken p-1 rounded-[10px] border border-border">
        {(["HYBRID", "FULL_PRIVATE", "FULL_BPJS"] as const).map((mode) => {
          const isSelected = paymentMode === mode;
          const info = PAYMENT_MODE_LABELS[mode];
          const Icon = info.icon;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onChange(mode)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[12px] sm:text-[13px] transition cursor-pointer min-h-[36px] ${
                isSelected
                  ? "bg-surface text-text font-semibold border border-border shadow-xs"
                  : "text-text-2 hover:text-text font-medium"
              }`}
              title={info.description}
            >
              <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{info.shortTitle}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === "badge") {
    const current = PAYMENT_MODE_LABELS[paymentMode];
    const Icon = current.icon;
    return (
      <div className="relative inline-block">
        <select
          value={paymentMode}
          onChange={(e) => onChange(e.target.value as PaymentMode)}
          className="appearance-none bg-surface border border-border hover:border-border-strong rounded-[8px] pl-8 pr-8 py-1.5 text-[12px] sm:text-[13px] font-semibold text-text cursor-pointer shadow-xs focus:outline-none focus:border-primary transition"
          aria-label="Mode Simulasi Biaya"
        >
          <option value="HYBRID">Mode: Hybrid (Puskesmas & Swasta)</option>
          <option value="FULL_PRIVATE">Mode: Full Swasta / Asuransi</option>
          <option value="FULL_BPJS">Mode: Full BPJS / Puskesmas</option>
        </select>
        <Icon className="w-3.5 h-3.5 text-primary absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <ChevronDown className="w-3.5 h-3.5 text-text-2 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    );
  }

  // "full" variant: Sleek cards
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-[14px] font-semibold text-text flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <span>Skenario Mode Pembayaran (Simulasi Biaya)</span>
        </label>
        <span className="text-[12px] text-text-2 font-medium">Pilih salah satu</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(["HYBRID", "FULL_PRIVATE", "FULL_BPJS"] as const).map((mode) => {
          const isSelected = paymentMode === mode;
          const info = PAYMENT_MODE_LABELS[mode];
          const Icon = info.icon;

          return (
            <button
              key={mode}
              type="button"
              onClick={() => onChange(mode)}
              className={`p-3.5 rounded-[12px] border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 relative ${
                isSelected
                  ? "bg-surface border-primary ring-1 ring-primary/30 shadow-[0_4px_14px_-2px_rgba(0,0,0,0.06)]"
                  : "bg-surface-sunken/60 hover:bg-surface border-border hover:border-border-strong"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-primary" : "text-text-2"}`} />
                    <span className={`text-[13px] font-semibold ${isSelected ? "text-text" : "text-text-2"}`}>
                      {info.title}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-text-2 leading-relaxed">
                  {info.description}
                </p>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <span className={`inline-block px-2 py-0.5 rounded-[5px] text-[10px] font-medium ${
                  isSelected
                    ? "bg-primary-tint text-primary-text border border-primary/20"
                    : "bg-surface text-text-3 border border-border"
                }`}>
                  {info.badge}
                </span>

                {isSelected && (
                  <span className="text-[11px] font-semibold text-primary">
                    Aktif
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
