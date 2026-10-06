import React, { useState } from "react";
import {
  X,
  Plus,
  Baby,
  Calendar,
  Trash2,
  Edit2,
  AlertTriangle
} from "lucide-react";
import { createNewProfile } from "../../data/seed";
import { Profile } from "../../types";
import { getChildAge } from "../../utils/dates";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profiles: Profile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  onAddProfile: (profile: Profile) => void;
  onUpdateProfile?: (profile: Profile) => void;
  onDeleteProfile?: (id: string) => void;
}

export const ProfileModal: React.FC<Props> = ({
  isOpen,
  onClose,
  profiles,
  activeProfileId,
  onSelectProfile,
  onAddProfile,
  onUpdateProfile,
  onDeleteProfile
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<"list" | "add" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [panggilan, setPanggilan] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState(
    new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [catatan, setCatatan] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const startAdd = () => {
    setPanggilan("");
    setTanggalLahir(new Date().toISOString().split("T")[0]);
    setCatatan("");
    setErrorMsg("");
    setConfirmDeleteId(null);
    setMode("add");
  };

  const startEdit = (p: Profile) => {
    setEditingId(p.id);
    setPanggilan(p.panggilan);
    setTanggalLahir(p.tanggalLahir);
    setCatatan(p.catatan || "");
    setErrorMsg("");
    setConfirmDeleteId(null);
    setMode("edit");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!panggilan.trim()) {
      setErrorMsg("Nama panggilan anak wajib diisi.");
      return;
    }

    if (mode === "add") {
      const newId = "child-" + Date.now();
      const profile = createNewProfile(newId, panggilan.trim(), tanggalLahir);
      if (catatan.trim()) profile.catatan = catatan.trim();
      onAddProfile(profile);
      setMode("list");
    } else if (mode === "edit" && editingId) {
      const target = profiles.find((p) => p.id === editingId);
      if (target && onUpdateProfile) {
        onUpdateProfile({
          ...target,
          panggilan: panggilan.trim(),
          tanggalLahir,
          catatan: catatan.trim() || undefined
        });
      }
      setMode("list");
    }
  };

  const executeDelete = (id: string) => {
    if (onDeleteProfile) {
      onDeleteProfile(id);
    }
    setConfirmDeleteId(null);
  };

  const targetDeleteProfile = profiles.find((p) => p.id === confirmDeleteId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      {/* Bottom sheet on mobile / centered modal on desktop */}
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] pb-[max(env(safe-area-inset-bottom),0.5rem)] sm:pb-0"
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Grab Bar */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1F4E78]/10 text-[#1F4E78] flex items-center justify-center">
              <Baby className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {mode === "list" ? "Kelola Profil Anak" : mode === "add" ? "Tambah Profil Baru" : "Ubah Profil Anak"}
              </h3>
              <p className="text-xs text-slate-500">
                {mode === "list" ? "Pilih anak aktif atau tambahkan profil" : "Informasi tanggal lahir & riwayat"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/50 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Delete Confirmation Overlay inside modal */}
        {confirmDeleteId && targetDeleteProfile && (
          <div className="p-5 bg-rose-50 border-b border-rose-200 space-y-3 animate-fadeIn">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-rose-900 leading-relaxed">
                <strong>Hapus profil "{targetDeleteProfile.panggilan}"?</strong>
                <p className="mt-1 text-rose-700">
                  {profiles.length <= 1
                    ? "Ini adalah satu-satunya profil yang ada. Jika dihapus, Anda akan diarahkan ke layar selamat datang untuk membuat profil baru."
                    : "Seluruh jadwal dan riwayat vaksin yang tercatat untuk anak ini akan dihapus permanen dari browser."}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 min-h-[40px]"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={() => executeDelete(confirmDeleteId)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm min-h-[40px]"
              >
                Ya, Hapus Sekarang
              </button>
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {mode === "list" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Daftar Profil ({profiles.length})
                </span>
                <button
                  type="button"
                  onClick={startAdd}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1F4E78] hover:underline px-3 py-1.5 rounded-xl bg-blue-50/80 min-h-[40px]"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Anak
                </button>
              </div>

              <div className="space-y-2.5">
                {profiles.map((p) => {
                  const isActive = p.id === activeProfileId;
                  const age = getChildAge(p.tanggalLahir);
                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isActive
                          ? "border-[#1F4E78] bg-blue-50/50 shadow-xs ring-1 ring-[#1F4E78]/30"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProfile(p.id);
                          onClose();
                        }}
                        className="flex-1 text-left flex items-center gap-3.5 min-h-[48px]"
                      >
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-base shrink-0 shadow-2xs ${
                            isActive
                              ? "bg-[#1F4E78] text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {p.panggilan.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                              {p.panggilan}
                            </h4>
                            {isActive && (
                              <span className="text-[10px] bg-[#1F4E78] text-white px-2 py-0.5 rounded-full font-bold">
                                Aktif
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-teal-700 font-semibold mt-0.5">
                            {age.text}
                          </p>
                          {p.catatan && (
                            <p className="text-[11px] text-slate-400 italic line-clamp-1 mt-0.5">
                              {p.catatan}
                            </p>
                          )}
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="Ubah info profil"
                          aria-label="Ubah info anak"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(p.id)}
                          className="p-2 text-rose-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="Hapus profil anak"
                          aria-label="Hapus profil anak"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200/50 text-xs text-blue-900 leading-relaxed">
                💡 <strong>Tips Privasi:</strong> Cukup nama panggilan saja, tidak perlu nama lengkap. Data tersimpan privat di browser Anda.
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Nama Panggilan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={panggilan}
                  onChange={(e) => setPanggilan(e.target.value)}
                  placeholder="Misal: Alif, Kayla, Danis"
                  className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1F4E78] min-h-[48px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Tanggal Lahir <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={tanggalLahir}
                  onChange={(e) => setTanggalLahir(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1F4E78] min-h-[48px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Misal: Golongan darah O, riwayat alergi dingin, dll."
                  className="w-full px-4 py-2.5 text-sm rounded-2xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1F4E78]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setMode("list")}
                  className="px-4 py-3 text-sm font-semibold rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition min-h-[48px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 text-sm font-bold rounded-2xl bg-[#1F4E78] hover:bg-[#153654] text-white shadow-md transition min-h-[48px]"
                >
                  {mode === "add" ? "Tambah Profil" : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {mode === "list" && (
          <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-sm font-bold transition min-h-[44px]"
            >
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
