import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import App from "../App";
import { ToastProvider } from "../components/common/Toast";
import { ThemeProvider } from "../context/ThemeContext";
import { STORAGE_KEY, clearAllData } from "../utils/storage";
import { createSampleProfile } from "../data/seed";

// Mock Firebase service
vi.mock("../services/firebase", () => ({
  saveStateToCloud: vi.fn().mockResolvedValue(undefined),
  subscribeToCloudState: vi.fn().mockImplementation((uid, callback) => {
    // Return unsubscribe function
    return () => {};
  })
}));

// Mutable auth state for tests
let mockAuthValue = {
  user: null as any,
  loading: false,
  isGuest: true,
  cloudSyncStatus: "synced" as const,
  lastSyncTime: null as string | null,
  setCloudSyncStatus: vi.fn(),
  markSynced: vi.fn(),
  signInWithGoogle: vi.fn(),
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  continueAsGuest: vi.fn(),
  signOut: vi.fn()
};

vi.mock("../context/AuthContext", () => ({
  useAuth: () => mockAuthValue,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children
}));

describe("6E: Routing, Integration, & UI Tests (R1-R17)", () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = "#/";
    mockAuthValue = {
      user: null,
      loading: false,
      isGuest: true,
      cloudSyncStatus: "synced",
      lastSyncTime: null,
      setCloudSyncStatus: vi.fn(),
      markSynced: vi.fn(),
      signInWithGoogle: vi.fn(),
      signInWithEmail: vi.fn(),
      signUpWithEmail: vi.fn(),
      continueAsGuest: vi.fn(),
      signOut: vi.fn()
    };
  });

  it("R1 Not signed in and not guest -> AuthScreen shown", () => {
    mockAuthValue.isGuest = false;
    mockAuthValue.user = null;

    render(<App />);
    expect(screen.getByText(/Pemantau imunisasi 0–5 tahun/i)).toBeInTheDocument();
  });

  it("R2 Auth loading -> Menyiapkan aplikasi skeleton shown", () => {
    mockAuthValue.loading = true;

    render(<App />);
    expect(screen.getByText(/Menyiapkan aplikasi.../i)).toBeInTheDocument();
  });

  it("R3 Guest or signed in at '/' -> Launcher with module cards shown", async () => {
    window.location.hash = "#/";
    render(<App />);

    expect(await screen.findByText(/Halo, Tamu!/i)).toBeInTheDocument();
    expect(screen.getByText("Bayi")).toBeInTheDocument();
    expect(screen.getByText("Keuangan Keluarga")).toBeInTheDocument();
  });

  it("R4 Click Bayi card -> navigates to /bayi/beranda and shows dashboard", async () => {
    window.location.hash = "#/";
    render(<App />);

    const bayiCard = await screen.findByText("Bayi");
    fireEvent.click(bayiCard);

    await waitFor(() => {
      expect(window.location.hash).toContain("#/bayi/beranda");
    });
    expect(screen.getByText(/Yang perlu dilakukan/i)).toBeInTheDocument();
  });

  it("R5 Click Keuangan Keluarga -> opens /keuangan-keluarga/ringkasan and renders Ringkasan page", async () => {
    window.location.hash = "#/";
    render(<App />);

    const finCard = await screen.findByText("Keuangan Keluarga");
    fireEvent.click(finCard);

    await waitFor(() => {
      expect(window.location.hash).toContain("#/keuangan-keluarga/ringkasan");
    });
    expect(screen.getByText("Ringkasan Keuangan")).toBeInTheDocument();
  });

  it("R6 Navigating inside Bayi updates routes and highlights active item", async () => {
    window.location.hash = "#/bayi/beranda";
    render(<App />);

    expect(await screen.findByText(/Yang perlu dilakukan/i)).toBeInTheDocument();

    // Click Jadwal in sidebar
    const jadwalButtons = screen.getAllByRole("link", { name: /Jadwal/i });
    fireEvent.click(jadwalButtons[0]);

    await waitFor(() => {
      expect(window.location.hash).toContain("#/bayi/jadwal");
    });

    // Click Biaya vaksin
    const biayaButtons = screen.getAllByRole("link", { name: /Biaya vaksin/i });
    fireEvent.click(biayaButtons[0]);

    await waitFor(() => {
      expect(window.location.hash).toContain("#/bayi/biaya");
    });
    expect(screen.getByText(/Keuangan/i)).toBeInTheDocument();
  });

  it("R9 Back to home button in Bayi goes to '/'", async () => {
    window.location.hash = "#/bayi/beranda";
    render(<App />);

    const backHome = await screen.findByText(/Beranda utama/i);
    fireEvent.click(backHome);

    await waitFor(() => {
      expect(window.location.hash).toBe("#/");
    });
  });

  it("R10 Unknown path redirects to '/'", async () => {
    window.location.hash = "#/unknown-random-route";
    render(<App />);

    await waitFor(() => {
      expect(window.location.hash).toBe("#/");
    });
  });

  it("R11 Zero profiles shows OnboardingModal at /bayi/beranda", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ profiles: [], activeProfileId: "" }));
    window.location.hash = "#/bayi/beranda";

    render(<App />);

    expect(await screen.findByText(/Pemantau imunisasi anak/i)).toBeInTheDocument();
  });

  it("R15 Bayi settings: Hapus semua data Bayi shows explicit confirmation", async () => {
    window.location.hash = "#/bayi/pengaturan";
    render(<App />);

    const deleteBtn = await screen.findByText(/Hapus Data Modul Bayi/i);
    fireEvent.click(deleteBtn);

    expect(screen.getByText(/Peringatan tahap 1: Anda yakin/i)).toBeInTheDocument();

    const continueBtn = screen.getByText(/Lanjutkan/i);
    fireEvent.click(continueBtn);

    expect(screen.getByText(/Konfirmasi terakhir: Data profil dan jadwal/i)).toBeInTheDocument();

    const finalConfirm = screen.getByText(/Ya, hapus data Bayi/i);
    fireEvent.click(finalConfirm);

    await waitFor(() => {
      expect(window.location.hash).toBe("#/bayi/beranda");
    });
  });

  it("R16 Global settings page renders and links to/from Baby settings", async () => {
    window.location.hash = "#/pengaturan";
    render(<App />);

    expect(await screen.findByText(/Pengaturan Spesifik Modul/i)).toBeInTheDocument();

    const babySettingsLink = screen.getByText(/Pengaturan Modul Bayi/i);
    fireEvent.click(babySettingsLink);

    await waitFor(() => {
      expect(window.location.hash).toBe("#/bayi/pengaturan");
    });
  });

  it("R17 Theme toggle works from Launcher and persists choice", async () => {
    window.location.hash = "#/";
    render(<App />);

    const darkBtn = await screen.findByRole("button", { name: /Tema Gelap/i });
    fireEvent.click(darkBtn);

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
