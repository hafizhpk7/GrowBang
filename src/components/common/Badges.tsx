import React from "react";
import { CheckCircle2, Clock, AlertCircle, Calendar } from "lucide-react";
import { Gratis, ScheduleItemStatus, Status } from "../../types";

interface StatusBadgeProps {
  status: Status;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "md" }) => {
  const sizeClasses = size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs";

  switch (status) {
    case "Wajib":
      return (
        <span
          className={`inline-flex items-center font-bold tracking-tight rounded-full border border-emerald-500/20 text-[#1b5e20] bg-[#e8f5e9] shadow-2xs ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5 shrink-0" />
          Wajib
        </span>
      );
    case "Pilihan":
      return (
        <span
          className={`inline-flex items-center font-bold tracking-tight rounded-full border border-amber-500/20 text-[#854d0e] bg-[#fef9c3] shadow-2xs ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 shrink-0" />
          Pilihan
        </span>
      );
    case "Kondisional":
      return (
        <span
          className={`inline-flex items-center font-bold tracking-tight rounded-full border border-slate-300/40 text-slate-700 bg-slate-100 shadow-2xs ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5 shrink-0" />
          Kondisional
        </span>
      );
    default:
      return null;
  }
};

interface GratisBadgeProps {
  gratis: Gratis;
  size?: "sm" | "md";
}

export const GratisBadge: React.FC<GratisBadgeProps> = ({ gratis, size = "md" }) => {
  const sizeClasses = size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs";

  switch (gratis) {
    case "Ya":
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-teal-50 text-teal-800 border border-teal-200/70 shadow-2xs ${sizeClasses}`}
        >
          Gratis (Puskesmas)
        </span>
      );
    case "Sebagian":
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-200/70 shadow-2xs ${sizeClasses}`}
        >
          Sebagian
        </span>
      );
    case "Tidak":
      return (
        <span
          className={`inline-flex items-center font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200/80 shadow-2xs ${sizeClasses}`}
        >
          Berbayar
        </span>
      );
    default:
      return null;
  }
};

interface ScheduleStatusBadgeProps {
  status: ScheduleItemStatus;
  size?: "sm" | "md";
}

export const ScheduleStatusBadge: React.FC<ScheduleStatusBadgeProps> = ({ status, size = "md" }) => {
  const sizeClasses = size === "sm" ? "px-2.5 py-0.5 text-[11px] font-bold" : "px-3 py-1 text-xs font-bold";

  switch (status) {
    case "Selesai":
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-500 text-white shadow-xs ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 mr-1 shrink-0" />
          Selesai
        </span>
      );
    case "Terlambat":
      return (
        <span className={`inline-flex items-center rounded-full bg-rose-500 text-white shadow-xs animate-pulse ${sizeClasses}`}>
          <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
          Terlambat
        </span>
      );
    case "Segera":
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-500 text-white shadow-xs ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 mr-1 shrink-0" />
          Segera (&le;30 hr)
        </span>
      );
    case "Terjadwal":
      return (
        <span className={`inline-flex items-center rounded-full bg-sky-100 text-sky-800 border border-sky-200 ${sizeClasses}`}>
          <Calendar className="w-3 h-3 mr-1 text-sky-600 shrink-0" />
          Terjadwal
        </span>
      );
    default:
      return null;
  }
};
