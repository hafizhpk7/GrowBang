import React, { useState } from "react";
import { Mail, Lock, User as UserIcon, Eye, EyeOff, AlertCircle, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { formatAuthErrorMessage } from "../../services/firebase";

export const AuthScreen: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, continueAsGuest } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCredentialError, setIsCredentialError] = useState(false);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsCredentialError(false);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        setErrorMessage(formatAuthErrorMessage(err));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsCredentialError(false);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage("Silakan masukkan alamat email Anda.");
      return;
    }

    if (!password) {
      setErrorMessage("Silakan masukkan kata sandi Anda.");
      return;
    }

    if (mode === "register") {
      if (!displayName.trim()) {
        setErrorMessage("Silakan masukkan nama lengkap atau panggilan Anda.");
        return;
      }
      if (password.length < 6) {
        setErrorMessage("Kata sandi minimal 6 karakter demi keamanan.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Konfirmasi kata sandi tidak cocok. Mohon periksa kembali.");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmail(cleanEmail, password);
      } else {
        await signUpWithEmail(cleanEmail, password, displayName.trim());
      }
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
        setIsCredentialError(true);
      }
      setErrorMessage(formatAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const switchToRegisterWithEmail = () => {
    setMode("register");
    setErrorMessage(null);
    setIsCredentialError(false);
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-[420px] space-y-6">
        {/* Header / Brand panel: flat primary-tint panel with serif tagline */}
        <div className="p-6 bg-primary-tint rounded-[12px] text-center space-y-2 border border-primary/20">
          <h1 className="text-[28px] font-serif font-bold text-text tracking-tight">
            GrowBang
          </h1>
          <p className="text-[14px] text-primary-text leading-relaxed">
            Pemantau imunisasi 0–5 tahun, jadwal terstruktur, dan estimasi biaya yang tenang & tersinkronisasi.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-surface rounded-[12px] border border-border shadow-[0_2px_10px_-2px_rgba(42,36,32,0.06)] p-6 sm:p-7 space-y-5">
          {/* Toggle Login / Register */}
          <div className="flex bg-surface-sunken p-1 rounded-[10px]">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMessage(null);
                setIsCredentialError(false);
              }}
              className={`flex-1 py-2 text-[14px] rounded-[8px] transition cursor-pointer ${
                mode === "login"
                  ? "bg-surface text-text font-medium border border-border shadow-xs"
                  : "text-text-2 hover:text-text"
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setErrorMessage(null);
                setIsCredentialError(false);
              }}
              className={`flex-1 py-2 text-[14px] rounded-[8px] transition cursor-pointer ${
                mode === "register"
                  ? "bg-surface text-text font-medium border border-border shadow-xs"
                  : "text-text-2 hover:text-text"
              }`}
            >
              Daftar
            </button>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-2.5 px-4 bg-surface hover:bg-surface-sunken text-text border border-border-strong rounded-[10px] text-[14px] font-medium flex items-center justify-center gap-2.5 transition min-h-[44px] cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{googleLoading ? "Menghubungkan..." : "Lanjutkan dengan Google"}</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[12px] text-text-3">atau dengan email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {errorMessage && (
            <div className="p-3 bg-danger-tint border border-danger/20 text-danger rounded-[10px] text-[13px] space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
              {isCredentialError && mode === "login" && (
                <div className="pt-1 border-t border-danger/15 flex items-center justify-between">
                  <span className="text-[12px] text-danger/90">Belum pernah mendaftar?</span>
                  <button
                    type="button"
                    onClick={switchToRegisterWithEmail}
                    className="text-[12px] font-semibold underline hover:no-underline cursor-pointer flex items-center gap-1"
                  >
                    Daftar akun sekarang <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "register" && (
              <div className="space-y-1">
                <label className="text-[13px] font-medium text-text">
                  Nama lengkap / panggilan
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-text-2 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Nama orang tua"
                    className="w-full pl-9 pr-3 py-2 text-[15px] rounded-[10px] border border-border-strong bg-surface text-text min-h-[44px]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[13px] font-medium text-text">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-2 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-9 pr-3 py-2 text-[15px] rounded-[10px] border border-border-strong bg-surface text-text min-h-[44px]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[13px] font-medium text-text">Kata sandi</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-2 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-9 pr-10 py-2 text-[15px] rounded-[10px] border border-border-strong bg-surface text-text min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-2 hover:text-text p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <div className="space-y-1">
                <label className="text-[13px] font-medium text-text">
                  Konfirmasi kata sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-text-2 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi"
                    className="w-full pl-9 pr-3 py-2 text-[15px] rounded-[10px] border border-border-strong bg-surface text-text min-h-[44px]"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover text-primary-fg font-medium rounded-[10px] transition min-h-[44px] cursor-pointer mt-2 text-[14px]"
            >
              {loading
                ? "Memproses..."
                : mode === "login"
                ? "Masuk ke akun"
                : "Buat akun baru"}
            </button>
          </form>

          {/* Guest / Offline Mode Entry */}
          <div className="pt-2 border-t border-border text-center space-y-2">
            <button
              type="button"
              onClick={continueAsGuest}
              className="w-full py-2.5 px-3 rounded-[10px] bg-surface-sunken hover:bg-border/60 text-text text-[13px] font-medium transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Lanjutkan sebagai Tamu (Mode Demo Offline)</span>
            </button>
            <p className="text-[11px] text-text-3">
              Data tetap tersimpan di browser Anda tanpa perlu mendaftar akun.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
