import React from "react";
import { Gratis, ScheduleItemStatus, Status } from "../../types";

interface StatusDotProps {
  status: ScheduleItemStatus;
  label?: string;
}

/**
 * Status Indicators with light tinted background pill:
 * Selesai: bg-primary-tint text-primary-text border border-primary/20
 * Segera: bg-warning-tint text-warning-text border border-warning/25
 * Terlambat: bg-danger-tint text-danger border border-danger/25
 * Terjadwal: bg-surface-sunken text-text-2 border border-border
 */
export const StatusIndicator: React.FC<StatusDotProps> = ({ status, label }) => {
  switch (status) {
    case "Selesai":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[12px] bg-primary-tint text-primary-text font-medium border border-primary/20">
          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
          <span>{label || "Selesai"}</span>
        </span>
      );
    case "Segera":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[12px] bg-warning-tint text-warning-text font-medium border border-warning/25">
          <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
          <span>{label || "Segera (≤30 hr)"}</span>
        </span>
      );
    case "Terlambat":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[12px] bg-danger-tint text-danger font-medium border border-danger/25">
          <span className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
          <span>{label || "Terlambat"}</span>
        </span>
      );
    case "Terjadwal":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[12px] bg-surface-sunken text-text-2 border border-border">
          <span className="w-1.5 h-1.5 rounded-full bg-border-strong shrink-0" />
          <span>{label || "Terjadwal"}</span>
        </span>
      );
  }
};

/**
 * Tags (Category):
 * "Gratis" = var(--primary-tint) bg + var(--primary-text), 12px/semibold, radius 6, padding 2px 8px
 * "Bayar sendiri" = var(--surface-sunken) bg + border + var(--text)
 * "Subsidi" = var(--warning-tint) bg + var(--warning-text)
 */
export const CategoryTag: React.FC<{
  gratis: Gratis;
  status?: Status;
}> = ({ gratis }) => {
  if (gratis === "Ya") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[12px] font-semibold bg-primary-tint text-primary-text border border-primary/20">
        Gratis
      </span>
    );
  }

  if (gratis === "Sebagian") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[12px] font-medium bg-warning-tint text-warning-text border border-warning/20">
        Subsidi
      </span>
    );
  }

  // gratis === "Tidak"
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[12px] font-medium bg-surface-sunken text-text border border-border">
      Bayar sendiri
    </span>
  );
};

// Aliases for compatibility
export const StatusBadge: React.FC<{ status: Status; size?: "sm" | "md" }> = ({ status }) => {
  if (status === "Wajib") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[12px] font-semibold bg-primary-tint text-primary-text border border-primary/20">
        Imunisasi program
      </span>
    );
  }
  if (status === "Pilihan") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[12px] font-medium bg-surface-sunken text-text-2 border border-border">
        Vaksin pilihan
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[12px] font-medium bg-surface-sunken text-text-2 border border-border">
      Kondisional
    </span>
  );
};

export const GratisBadge: React.FC<{ gratis: Gratis; size?: "sm" | "md" }> = ({ gratis }) => {
  return <CategoryTag gratis={gratis} />;
};

export const ScheduleStatusBadge: React.FC<{ status: ScheduleItemStatus; size?: "sm" | "md" }> = ({ status }) => {
  return <StatusIndicator status={status} />;
};
