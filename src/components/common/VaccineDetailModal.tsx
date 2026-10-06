import React from "react";
import { Info, X, ShieldCheck, HeartPulse, CheckCircle2, Thermometer } from "lucide-react";
import { SEED_VACCINE_INFO } from "../../data/seed";
import { ScheduleRow, VaccineInfo } from "../../types";
import { GratisBadge, StatusBadge } from "./Badges";

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      {/* Responsive Bottom Sheet / Centered Card */}
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] pb-[max(env(safe-area-inset-bottom),0.5rem)] sm:pb-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Mobile Grab Handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div className="space-y-1.5 pr-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-teal-50 text-teal-700 rounded-2xl">
                <Info className="w-5 h-5" />
              </span>
              <h3 id="modal-title" className="text-lg font-extrabold text-slate-900">
                {info ? info.nama : vaccineRef}
              </h3>
            </div>
            {info && (
              <div className="flex items-center gap-2 pt-0.5">
                <StatusBadge status={info.status} size="sm" />
                <GratisBadge gratis={info.gratisProgram === "Ya" ? "Ya" : "Tidak"} size="sm" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 transition min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-sm text-slate-700">
          {info ? (
            <>
              {/* Protects Against */}
              <div className="bg-teal-50/60 p-4 rounded-2xl border border-teal-200/50 space-y-1.5">
                <div className="flex items-center gap-2 text-teal-800 font-bold text-xs tracking-wide uppercase">
                  <ShieldCheck className="w-4 h-4" />
                  Penyakit yang Dicegah
                </div>
                <p className="text-slate-900 font-semibold leading-relaxed">
                  {info.melindungi}
                </p>
              </div>

              {/* Why Important */}
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-200/50 space-y-1.5">
                <div className="flex items-center gap-2 text-[#1F4E78] font-bold text-xs tracking-wide uppercase">
                  <HeartPulse className="w-4 h-4" />
                  Mengapa Sangat Penting
                </div>
                <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                  {info.penting}
                </p>
              </div>

              {/* Specific Post-Immunization Reactions / Side Effects (KIPI) */}
              <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200/70 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs tracking-wide uppercase">
                  <Thermometer className="w-4 h-4 text-amber-600" />
                  Reaksi Setelah Imunisasi (KIPI)
                </div>
                <p className="text-amber-950 leading-relaxed text-xs sm:text-sm">
                  {info.efekSamping}
                </p>
              </div>

              {/* Schedules in 0-5 years */}
              {relatedSchedule.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1F4E78]" />
                    Jadwal Pemberian pada Anak
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {relatedSchedule.map((row) => (
                      <div
                        key={row.id}
                        className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs space-y-1"
                      >
                        <div className="font-bold text-slate-900 flex justify-between">
                          <span>{row.vaksin}</span>
                          <span className="text-[#1F4E78] font-extrabold">{row.usia}</span>
                        </div>
                        {row.catatan && (
                          <div className="text-slate-500 text-[11px] leading-tight">
                            {row.catatan}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-slate-500">Informasi detail untuk vaksin ini tidak ditemukan di basis data standar.</p>
          )}

          <div className="text-xs text-slate-500 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
            <strong>Penanganan Mandiri:</strong> Kompres air hangat pada bekas suntikan jika bengkak/nyeri. Berikan ASI/cairan lebih sering dan parasetamol sesuai dosis anjuran dokter bila anak demam.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 bg-[#1F4E78] hover:bg-[#153654] text-white rounded-2xl text-sm font-bold shadow-sm transition min-h-[48px]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
