import React from "react";
import { X, ShieldCheck, HeartPulse } from "lucide-react";
import { SEED_VACCINE_INFO } from "../../data/seed";
import { ScheduleRow, VaccineInfo } from "../../types";
import { CategoryTag, StatusBadge } from "./Badges";

interface Props {
  vaccineRef: string | null;
  onClose: () => void;
  scheduleRows?: ScheduleRow[];
}

export const VaccineDetailModal: React.FC<Props> = ({ vaccineRef, onClose, scheduleRows = [] }) => {
  if (!vaccineRef) return null;

  const info: VaccineInfo | undefined = SEED_VACCINE_INFO.find(
    (v) => v.id.toLowerCase() === vaccineRef.toLowerCase()
  );

  const relatedSchedule = scheduleRows.filter((r) => r.ref.toLowerCase() === vaccineRef.toLowerCase());

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: "var(--scrim)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-surface rounded-t-[16px] sm:rounded-[12px] max-w-[480px] w-full border border-border overflow-hidden flex flex-col max-h-[88vh] pb-[max(env(safe-area-inset-bottom),0.5rem)] sm:pb-0 animate-fadeIn"
        style={{ boxShadow: "var(--shadow-popover)" }}
      >
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 bg-border-strong rounded-full" />
        </div>

        {/* Header */}
        <div className="p-4 border-b border-border flex items-start justify-between">
          <div className="space-y-1 pr-3">
            <h3 id="modal-title" className="text-[20px] font-serif font-medium text-text">
              {info ? info.nama : vaccineRef}
            </h3>
            {info && (
              <div className="flex items-center gap-2 pt-0.5">
                <StatusBadge status={info.status} />
                <CategoryTag gratis={info.gratisProgram === "Ya" ? "Ya" : "Tidak"} />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-text-2 hover:text-text rounded-[10px] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-[14px] text-text">
          {info ? (
            <>
              {/* Protects Against */}
              <div className="p-3.5 rounded-[10px] bg-primary-tint/60 border border-primary/20 space-y-1">
                <div className="flex items-center gap-1.5 text-primary-text font-medium text-[13px]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Penyakit yang dicegah</span>
                </div>
                <p className="text-text leading-relaxed">
                  {info.melindungi}
                </p>
              </div>

              {/* Why Important */}
              <div className="p-3.5 rounded-[10px] bg-surface-sunken border border-border space-y-1">
                <div className="flex items-center gap-1.5 text-text-2 font-medium text-[13px]">
                  <HeartPulse className="w-4 h-4" />
                  <span>Mengapa penting</span>
                </div>
                <p className="text-text-2 leading-relaxed">
                  {info.penting}
                </p>
              </div>

              {/* KIPI */}
              <div className="space-y-1 pt-1">
                <h4 className="text-[13px] font-medium text-text">Reaksi setelah imunisasi (KIPI)</h4>
                <p className="text-[13px] text-text-2 leading-relaxed">
                  {info.efekSamping}
                </p>
              </div>

              {/* Schedule list */}
              {relatedSchedule.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <h4 className="text-[13px] font-medium text-text">Jadwal pemberian (0–5 tahun)</h4>
                  <div className="space-y-1">
                    {relatedSchedule.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between text-[13px] py-1 border-b border-border/50 last:border-none"
                      >
                        <span className="text-text">{r.vaksin}</span>
                        <span className="text-text-2">Usia {r.usia}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-text-2">Informasi detail vaksin ini belum tersedia.</p>
          )}
        </div>
      </div>
    </div>
  );
};
