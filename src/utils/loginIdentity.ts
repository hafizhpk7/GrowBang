import { LOGIN_EMAIL_DOMAIN } from "../config/app";
import { formatAuthErrorMessage as formatOriginalAuthErrorMessage } from "../services/firebase";

export function normalizeUsername(input: string): string {
  return (input || "").trim().toLowerCase();
}

export function validateUsername(input: string): string | null {
  const normalized = normalizeUsername(input);
  if (!normalized) {
    return "Silakan masukkan username Anda.";
  }
  const regex = /^[a-z0-9._-]{3,32}$/;
  if (!regex.test(normalized)) {
    return "Username hanya boleh berisi huruf, angka, titik, garis bawah, atau strip (3–32 karakter).";
  }
  return null;
}

export function resolveLoginEmail(
  input: string,
  allowEmail: boolean
): { email: string } | { error: string } {
  const trimmed = (input || "").trim();
  if (!trimmed) {
    return { error: "Silakan masukkan username Anda." };
  }

  if (allowEmail && trimmed.includes("@")) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return { error: "Format email tidak valid." };
    }
    return { email: trimmed.toLowerCase() };
  }

  const err = validateUsername(trimmed);
  if (err) {
    return { error: err };
  }

  const normalized = normalizeUsername(trimmed);
  return { email: `${normalized}@${LOGIN_EMAIL_DOMAIN}` };
}

export function emailToUsername(email: string | null | undefined): string {
  if (!email || !email.includes("@")) {
    return "";
  }
  const parts = email.split("@");
  return parts[parts.length - 2] || "";
}

export function getAccountName(
  user: { displayName?: string | null; email?: string | null } | null | undefined
): string {
  if (!user) return "Orang Tua";
  const trimmedDisplay = (user.displayName || "").trim();
  if (trimmedDisplay) {
    return trimmedDisplay;
  }
  const uname = emailToUsername(user.email);
  if (uname) {
    return uname;
  }
  return "Orang Tua";
}

export function formatLoginErrorMessage(err: any, signupEnabled: boolean): string {
  if (signupEnabled) {
    return formatOriginalAuthErrorMessage(err);
  }

  const code = err?.code || "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-email":
      return "Username atau kata sandi tidak cocok.";
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat sebelum mencoba lagi.";
    case "auth/network-request-failed":
      return "Koneksi internet bermasalah. Periksa jaringan Anda dan coba lagi.";
    case "auth/user-disabled":
      return "Akun ini dinonaktifkan. Hubungi pemilik aplikasi.";
    case "auth/operation-not-allowed":
      return "Login dengan username belum diaktifkan. Hubungi pemilik aplikasi.";
    case "app/auth-disabled":
      return "Fitur ini sedang dinonaktifkan.";
    default:
      return "Terjadi kendala saat masuk. Silakan coba lagi.";
  }
}
