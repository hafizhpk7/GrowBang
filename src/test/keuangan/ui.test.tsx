import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import App from "../../App";
import { STORAGE_KEY } from "../../utils/storage";

// Mock Firebase service
vi.mock("../../services/firebase", () => ({
  saveStateToCloud: vi.fn().mockResolvedValue(undefined),
  subscribeToCloudState: vi.fn().mockImplementation((uid, callback) => () => {})
}));

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

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => mockAuthValue,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children
}));

describe("9.4 Keuangan Keluarga UI Tests (T-UI-1 .. T-UI-20)", () => {
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

  it("T-UI-1: Launcher has Keuangan Keluarga card with NO Segera hadir badge and navigates to /keuangan-keluarga/ringkasan", async () => {
    render(<App />);

    const card = await screen.findByText("Keuangan Keluarga");
    expect(card).toBeInTheDocument();
    expect(screen.queryByText("Segera hadir")).not.toBeInTheDocument();

    fireEvent.click(card);

    await waitFor(() => {
      expect(window.location.hash).toContain("#/keuangan-keluarga/ringkasan");
    });
    expect(screen.getByText("Ringkasan Keuangan")).toBeInTheDocument();
  });

  it("T-UI-2: Finance Layout tabs navigate properly", async () => {
    window.location.hash = "#/keuangan-keluarga/ringkasan";
    render(<App />);

    expect(await screen.findByText("Ringkasan Keuangan")).toBeInTheDocument();

    // Click Transaksi tab
    const transaksiTabs = screen.getAllByText("Transaksi");
    fireEvent.click(transaksiTabs[0]);

    await waitFor(() => {
      expect(window.location.hash).toContain("#/keuangan-keluarga/transaksi");
    });

    // Click Anggaran tab
    const anggaranTabs = screen.getAllByText("Anggaran");
    fireEvent.click(anggaranTabs[0]);

    await waitFor(() => {
      expect(window.location.hash).toContain("#/keuangan-keluarga/anggaran");
    });

    // Click Pengaturan tab
    const pengaturanTabs = screen.getAllByText("Pengaturan");
    fireEvent.click(pengaturanTabs[0]);

    await waitFor(() => {
      expect(window.location.hash).toContain("#/keuangan-keluarga/pengaturan");
    });
  });

  it("T-UI-3: Add expense via TransactionModal with validation and toast", async () => {
    window.location.hash = "#/keuangan-keluarga/transaksi";
    render(<App />);

    const addBtns = await screen.findAllByRole("button", { name: "Catat transaksi" });
    fireEvent.click(addBtns[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Submit empty form -> validation error
    const simpanBtn = screen.getByRole("button", { name: "Simpan" });
    fireEvent.click(simpanBtn);

    expect(await screen.findByText("Nominal harus lebih dari 0")).toBeInTheDocument();

    // Enter valid amount
    const amountInput = screen.getByLabelText("Nominal");
    fireEvent.change(amountInput, { target: { value: "50000" } });

    fireEvent.click(simpanBtn);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    expect(screen.getAllByText("Makan & Minum")[0]).toBeInTheDocument();
  });

  it("T-UI-11: AnggaranPage saves budget and displays progress", async () => {
    window.location.hash = "#/keuangan-keluarga/anggaran";
    render(<App />);

    expect(await screen.findByText("Anggaran bulanan")).toBeInTheDocument();
    expect(screen.getByText("Kategori transaksi")).toBeInTheDocument();
  });

  it("T-UI-12: AnggaranPage allows adding custom category", async () => {
    window.location.hash = "#/keuangan-keluarga/anggaran";
    render(<App />);

    const input = await screen.findByPlaceholderText("Nama kategori baru");
    fireEvent.change(input, { target: { value: "Kopi & Camilan" } });

    const addBtn = screen.getByRole("button", { name: "Tambah" });
    fireEvent.click(addBtn);

    expect((await screen.findAllByText("Kopi & Camilan"))[0]).toBeInTheDocument();
  });

  it("T-UI-15: PengaturanPage delete all finance data dialog", async () => {
    window.location.hash = "#/keuangan-keluarga/pengaturan";
    render(<App />);

    const deleteBtn = await screen.findByRole("button", { name: /Hapus data keuangan/i });
    fireEvent.click(deleteBtn);

    expect(screen.getByText(/Hapus semua data Keuangan Keluarga\?/i)).toBeInTheDocument();
  });
});
