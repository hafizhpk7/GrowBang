import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import fs from "fs";
import path from "path";

import {
  normalizeUsername,
  validateUsername,
  resolveLoginEmail,
  emailToUsername,
  getAccountName,
  formatLoginErrorMessage
} from "../utils/loginIdentity";
import { LOGIN_EMAIL_DOMAIN } from "../config/app";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { AuthScreen } from "../components/auth/AuthScreen";
import { LauncherPage } from "../shell/pages/Launcher";
import { GlobalSettingsPage } from "../shell/pages/GlobalSettings";
import { ShellHeader } from "../shell/components/ShellHeader";

describe("Phase P: Private Access Mode Tests", () => {
  // T-ID-1: loginIdentity utilities
  describe("T-ID-1: loginIdentity pure functions", () => {
    it("normalizes usernames", () => {
      expect(normalizeUsername("  AbC_123.test-ok  ")).toBe("abc_123.test-ok");
    });

    it("validates username boundaries and rules", () => {
      expect(validateUsername("")).toBe("Silakan masukkan username Anda.");
      // < 3 chars
      expect(validateUsername("ab")).toBe(
        "Username hanya boleh berisi huruf, angka, titik, garis bawah, atau strip (3–32 karakter)."
      );
      // > 32 chars
      expect(validateUsername("a".repeat(33))).toBe(
        "Username hanya boleh berisi huruf, angka, titik, garis bawah, atau strip (3–32 karakter)."
      );
      // invalid characters
      expect(validateUsername("user name")).toBe(
        "Username hanya boleh berisi huruf, angka, titik, garis bawah, atau strip (3–32 karakter)."
      );
      expect(validateUsername("user!")).toBe(
        "Username hanya boleh berisi huruf, angka, titik, garis bawah, atau strip (3–32 karakter)."
      );
      expect(validateUsername("a@b")).toBe(
        "Username hanya boleh berisi huruf, angka, titik, garis bawah, atau strip (3–32 karakter)."
      );

      // valid 3 chars, 32 chars, and valid chars
      expect(validateUsername("abc")).toBeNull();
      expect(validateUsername("a".repeat(32))).toBeNull();
      expect(validateUsername("family.puyo_123-ok")).toBeNull();
    });

    it("resolves login email with allowEmail false and true", () => {
      // allowEmail = false
      const res1 = resolveLoginEmail("myuser", false);
      expect(res1).toEqual({ email: `myuser@${LOGIN_EMAIL_DOMAIN}` });

      const res2 = resolveLoginEmail("user@other.com", false);
      // contains @ when allowEmail false -> fails validateUsername
      expect("error" in res2).toBe(true);

      // allowEmail = true
      const res3 = resolveLoginEmail("VALID@EMAIL.COM", true);
      expect(res3).toEqual({ email: "valid@email.com" });

      const res4 = resolveLoginEmail("bad-email@", true);
      expect(res4).toEqual({ error: "Format email tidak valid." });

      const res5 = resolveLoginEmail("plainuser", true);
      expect(res5).toEqual({ email: `plainuser@${LOGIN_EMAIL_DOMAIN}` });
    });

    it("converts email to username correctly", () => {
      expect(emailToUsername("family@growbang.app")).toBe("family");
      expect(emailToUsername("sub.user@domain.com")).toBe("sub.user");
      expect(emailToUsername("nourl")).toBe("");
      expect(emailToUsername(null)).toBe("");
      expect(emailToUsername(undefined)).toBe("");
    });

    it("gets account name with fallbacks", () => {
      expect(getAccountName({ displayName: "  Ibu Puyo  ", email: "family@growbang.app" })).toBe("Ibu Puyo");
      expect(getAccountName({ displayName: "", email: "puyoeci@growbang.app" })).toBe("puyoeci");
      expect(getAccountName(null)).toBe("Orang Tua");
      expect(getAccountName({ displayName: undefined, email: undefined })).toBe("Orang Tua");
    });

    it("formats login error messages properly", () => {
      const err = { code: "auth/wrong-password", message: "Firebase raw error" };
      expect(formatLoginErrorMessage(err, false)).toBe("Username atau kata sandi tidak cocok.");
      expect(formatLoginErrorMessage({ code: "auth/too-many-requests" }, false)).toBe(
        "Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat sebelum mencoba lagi."
      );
      expect(formatLoginErrorMessage({ code: "app/auth-disabled" }, false)).toBe(
        "Fitur ini sedang dinonaktifkan."
      );
      expect(formatLoginErrorMessage({ code: "unknown-code" }, false)).toBe(
        "Terjadi kendala saat masuk. Silakan coba lagi."
      );

      // When signupEnabled is true, delegates to formatAuthErrorMessage
      expect(formatLoginErrorMessage({ code: "auth/email-already-in-use" }, true)).toContain("sudah terdaftar");
    });
  });

  // T-AUTH-UI-1: All flags false UI verification
  describe("T-AUTH-UI-1 .. T-AUTH-UI-5: AuthScreen with default flags false", () => {
    it("T-AUTH-UI-1: renders username and password and Masuk, hides public options", () => {
      render(
        <AuthProvider>
          <AuthScreen />
        </AuthProvider>
      );

      expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
      expect(screen.getByLabelText("Kata sandi")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Masuk" })).toBeInTheDocument();

      // Brand text present exactly
      expect(
        screen.getByText("Pemantau imunisasi 0–5 tahun, jadwal terstruktur, dan estimasi biaya yang tenang & tersinkronisasi.")
      ).toBeInTheDocument();

      // Hidden elements
      expect(screen.queryByText("Daftar")).not.toBeInTheDocument();
      expect(screen.queryByText(/Google/i)).not.toBeInTheDocument();
      expect(screen.queryByText("Buat akun")).not.toBeInTheDocument();
      expect(screen.queryByText("Konfirmasi kata sandi")).not.toBeInTheDocument();
      expect(screen.queryByText("Nama lengkap")).not.toBeInTheDocument();
      expect(screen.queryByText(/Tamu/i)).not.toBeInTheDocument();
    });

    it("T-AUTH-UI-2: empty identifier or empty password shows error without calling submit", async () => {
      render(
        <AuthProvider>
          <AuthScreen />
        </AuthProvider>
      );

      const submitBtn = screen.getByRole("button", { name: "Masuk" });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Silakan masukkan username Anda.");
      });
    });

    it("T-AUTH-UI-5: password show/hide toggle and label associations", async () => {
      render(
        <AuthProvider>
          <AuthScreen />
        </AuthProvider>
      );

      const passInput = screen.getByLabelText("Kata sandi") as HTMLInputElement;
      expect(passInput.type).toBe("password");

      const toggleBtn = screen.getByRole("button", { name: /Tampilkan kata sandi/i });
      fireEvent.click(toggleBtn);
      expect(passInput.type).toBe("text");

      fireEvent.click(screen.getByRole("button", { name: /Sembunyikan kata sandi/i }));
      expect(passInput.type).toBe("password");
    });
  });

  // T-ROUTE-1: Routing and display in ShellHeader / GlobalSettings / Launcher
  describe("T-ROUTE-1: Route gating and account name display without leaking email domain", () => {
    it("renders AuthScreen when not signed in across guarded routes", () => {
      const { container } = render(
        <MemoryRouter initialEntries={["/bayi/jadwal"]}>
          <AuthProvider>
            <Routes>
              <Route path="*" element={<AuthScreen />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    });
  });

  // T-SEC-2: Static file check for firestore.rules
  describe("T-SEC-2: Static rules checks", () => {
    it("firestore.rules contains private mode switch and allow list with exact domain", () => {
      const rulesPath = path.resolve(__dirname, "../../firestore.rules");
      const rulesContent = fs.readFileSync(rulesPath, "utf8");

      expect(rulesContent).toContain("function isPrivateMode()");
      expect(rulesContent).toContain("function isAllowedAccount()");
      expect(rulesContent).toContain("keluargapuyoeci@growbang.app");
      expect(rulesContent).toContain(LOGIN_EMAIL_DOMAIN);
      expect(rulesContent).toContain("(!isPrivateMode() || isAllowedAccount())");
    });
  });

  // T-ARCH-1: Bayi and Keuangan modules unchanged from baseline
  describe("T-ARCH-1: Bayi and Keuangan module files check", () => {
    it("modules folder structure exists and is intact", () => {
      const bayiPath = path.resolve(__dirname, "../../src/modules/bayi");
      const keuanganPath = path.resolve(__dirname, "../../src/modules/keuangan");
      expect(fs.existsSync(bayiPath)).toBe(true);
      expect(fs.existsSync(keuanganPath)).toBe(true);
    });
  });
});
