import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, UserPlus, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useFamily } from "../context/FamilyContext";
import { Invite, RELATION_LABELS, ROLE_LABELS } from "../types";
import { formatInviteCode, normalizeInviteCode, resolveDefaultDisplayName } from "../utils";
import * as familyService from "../service/family";

export const JoinPage: React.FC = () => {
  const navigate = useNavigate();
  const { code: codeParam } = useParams<{ code?: string }>();
  const { user, isGuest } = useAuth();
  const { actions, status: familyStatus } = useFamily();

  const [rawCode, setRawCode] = useState(codeParam || "");
  const [displayName, setDisplayName] = useState(resolveDefaultDisplayName(user));
  const [invite, setInvite] = useState<Invite | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(resolveDefaultDisplayName(user));
    }
  }, [user]);

  // If code is provided in route param, auto-preview
  useEffect(() => {
    if (codeParam) {
      const clean = normalizeInviteCode(codeParam);
      if (clean) {
        setRawCode(formatInviteCode(clean));
        handlePreview(clean);
      }
    }
  }, [codeParam]);

  const handlePreview = async (codeToTest?: string) => {
    const code = normalizeInviteCode(codeToTest || rawCode);
    if (!code) {
      setErrorMsg("Format kode undangan tidak valid (harus 10 karakter).");
      return;
    }

    setPreviewLoading(true);
    setErrorMsg(null);
    try {
      const { invite: loadedInvite, status } = await familyService.previewInvite(code);
      if (status === "used") {
        setErrorMsg("Kode undangan sudah dipakai.");
        setInvite(null);
      } else if (status === "expired") {
        setErrorMsg("Kode undangan sudah kedaluwarsa.");
        setInvite(null);
      } else {
        setInvite(loadedInvite);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Kode undangan tidak ditemukan.");
      setInvite(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      setErrorMsg("Silakan masuk terlebih dahulu untuk bergabung ke keluarga.");
      return;
    }
    if (!invite) return;

    setJoining(true);
    setErrorMsg(null);
    try {
      await actions.joinFamily(invite.code, displayName);
      navigate("/keluarga");
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan. Coba lagi.");
    } finally {
      setJoining(false);
    }
  };

  const handleCodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setRawCode(formatInviteCode(val));
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-bg text-text pb-12">
      <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-md border-b border-border">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            to="/keluarga"
            className="p-2 -ml-2 text-text-2 hover:text-text rounded-full hover:bg-surface transition"
            aria-label="Kembali ke Beranda utama"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold">Gabung Keluarga</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-6 space-y-6">
        {isGuest && (
          <div className="p-4 rounded-xl border border-warning/40 bg-warning-tint text-text text-[13px] flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <p>
              Tamu tidak dapat membuat atau bergabung ke keluarga. Silakan masuk dengan akun terdaftar di halaman Masuk
              untuk bergabung.
            </p>
          </div>
        )}

        {familyStatus === "active" && (
          <div className="p-4 rounded-xl border border-warning/40 bg-warning-tint text-text text-[13px] flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <p>
              Anda sudah tergabung di sebuah keluarga. Keluar dulu untuk bergabung ke keluarga lain.
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-xl border border-danger/40 bg-danger-tint text-danger text-[13px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 1: Input Code if no invite previewed */}
        {!invite ? (
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <div className="space-y-1">
              <label htmlFor="invite-code-input" className="block text-[13px] font-semibold text-text">
                Kode Undangan
              </label>
              <p className="text-[12px] text-text-2">
                Masukkan kode undangan 10 karakter dari admin keluarga Anda (misalnya: XXXXX-XXXXX).
              </p>
            </div>

            <div className="flex gap-2">
              <input
                id="invite-code-input"
                type="text"
                value={rawCode}
                onChange={handleCodeInputChange}
                maxLength={11}
                placeholder="XXXXX-XXXXX"
                disabled={previewLoading || isGuest}
                className="flex-1 px-3.5 py-2.5 bg-surface-sunken border border-border rounded-xl text-center font-mono font-bold tracking-wider uppercase text-base focus:outline-hidden focus:ring-2 focus:ring-primary min-h-[44px]"
              />
              <button
                type="button"
                onClick={() => handlePreview()}
                disabled={previewLoading || normalizeInviteCode(rawCode).length !== 10 || isGuest}
                className="px-5 py-2.5 bg-primary text-primary-text font-semibold rounded-xl text-[14px] hover:bg-primary-hover disabled:opacity-50 transition min-h-[44px] cursor-pointer"
              >
                {previewLoading ? "Memeriksa..." : "Periksa"}
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Preview & Confirm Join */
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-tint flex items-center justify-center text-primary-text">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-base">Undangan Ditemukan</h2>
                <p className="text-[12px] text-text-2">Kode: {formatInviteCode(invite.code)}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-sunken border border-border space-y-2 text-[13px]">
              <p>
                Anda diundang ke keluarga <strong className="text-text">{invite.familyName}</strong> sebagai{" "}
                <strong className="text-text">
                  {RELATION_LABELS[invite.relation]} ({ROLE_LABELS[invite.role]})
                </strong>
                .
              </p>
              <p className="text-[12px] text-text-2">
                Hak akses: {invite.role === "admin" ? "Dapat mencatat & mengubah keuangan keluarga." : "Mode lihat saja."}
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="join-display-name" className="block text-[13px] font-semibold text-text">
                Nama Tampilan Anda di Keluarga
              </label>
              <input
                id="join-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={80}
                placeholder="Nama Anda"
                className="w-full px-3.5 py-2.5 bg-surface-sunken border border-border rounded-xl text-[14px] focus:outline-hidden focus:ring-2 focus:ring-primary min-h-[44px]"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setInvite(null);
                  setErrorMsg(null);
                }}
                disabled={joining}
                className="flex-1 py-2.5 bg-surface-sunken text-text hover:bg-border font-semibold rounded-xl text-[14px] transition min-h-[44px] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleJoin}
                disabled={joining || !displayName.trim() || familyStatus === "active" || isGuest}
                className="flex-1 py-2.5 bg-primary text-primary-text font-semibold rounded-xl text-[14px] hover:bg-primary-hover disabled:opacity-50 transition min-h-[44px] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>{joining ? "Bergabung..." : "Gabung"}</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export const JoinFamilyPage = JoinPage;
export default JoinPage;
