import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import * as layout from "../config/layout";
import { ScheduleCheckbox } from "../modules/bayi/components/ScheduleCheckbox";
import { ScheduleTab } from "../modules/bayi/components/ScheduleTab";
import { BayiSidebar } from "../modules/bayi/components/BayiSidebar";
import { createSampleProfile } from "../data/seed";
import fs from "fs";
import path from "path";

describe("Phase U: Layout and Schedule Verification", () => {
  it("U1: Layout constants strictly match specification", () => {
    expect(layout.CONTENT_MAX).toBe("max-w-[1200px] 2xl:max-w-[1360px]");
    expect(layout.PAGE_PAD).toBe("px-4 sm:px-6 lg:px-8");
    expect(layout.PAGE_CONTAINER).toBe(
      "w-full mx-auto max-w-[1200px] 2xl:max-w-[1360px] px-4 sm:px-6 lg:px-8"
    );
    expect(layout.READING_MAX).toBe("max-w-[880px]");
  });

  it("U2: No production source file hard-codes max-w-960px or max-w-1040px", () => {
    function scanDir(dir: string): string[] {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          if (file !== "test" && file !== "__snapshots__") {
            results = results.concat(scanDir(full));
          }
        } else if ((file.endsWith(".tsx") || file.endsWith(".ts")) && !file.includes(".test.")) {
          results.push(full);
        }
      }
      return results;
    }

    const targetPattern960 = ["max-w-", "[960px]"].join("");
    const targetPattern1040 = ["max-w-", "[1040px]"].join("");

    const allSrcFiles = scanDir(path.resolve(__dirname, ".."));
    for (const f of allSrcFiles) {
      const content = fs.readFileSync(f, "utf8");
      expect(content).not.toContain(targetPattern960);
      expect(content).not.toContain(targetPattern1040);
    }
  });

  it("U3: ScheduleTab does not use hard-coded hex colors or negative margins on interactive elements", () => {
    const filePath = path.resolve(__dirname, "../modules/bayi/components/ScheduleTab.tsx");
    const content = fs.readFileSync(filePath, "utf8");

    // No hex colors
    expect(content).not.toMatch(/#[0-9a-fA-F]{3,6}/);

    // Negative margin utility check: only filter bleed permitted (-mx-4)
    const negMargins = content.match(/-m[trblxy]?-\[?[0-9]/g) || [];
    for (const m of negMargins) {
      expect(m).toBe("-mx-4");
    }
  });

  it("U4: ScheduleCheckbox renders accessible touch target and handles toggle", () => {
    const onToggle = vi.fn();
    render(
      <ScheduleCheckbox
        checked={false}
        onToggle={onToggle}
        label="Tandai BCG selesai"
        title="Tandai sudah diberikan"
        size="md"
      />
    );

    const btn = screen.getByRole("checkbox", { name: "Tandai BCG selesai" });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("aria-checked", "false");
    expect(btn).toHaveAttribute("title", "Tandai sudah diberikan");

    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("U5: ScheduleTab renders timeline view with exact checkbox labels and action buttons", () => {
    const dummyProfile = createSampleProfile();
    const dummyHandlers = {
      profile: dummyProfile,
      paymentMode: "HYBRID" as const,
      onUpdatePaymentMode: vi.fn(),
      onUpdateScheduleRow: vi.fn(),
      onUpdateRecord: vi.fn(),
      onAddCustomRow: vi.fn(),
      onDeleteCustomRow: vi.fn(),
      onResetSchedule: vi.fn(),
      onOpenVaccineDetail: vi.fn()
    };

    render(<ScheduleTab {...dummyHandlers} />);

    // Header title and description
    expect(screen.getByText("Jadwal imunisasi")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Garis waktu kronologis imunisasi 0–5 tahun sesuai anjuran resmi IDAI & Kemenkes RI."
      )
    ).toBeInTheDocument();

    // Required button labels
    expect(screen.getByText("Kustom")).toBeInTheDocument();
    expect(screen.getByTitle("Reset ke 35 baris bawaan")).toBeInTheDocument();
    expect(screen.getAllByText("Info Detail").length).toBeGreaterThan(0);

    // Timeline checkbox label
    const firstRow = dummyProfile.schedule[0];
    expect(
      screen.getByRole("checkbox", { name: `Tandai ${firstRow.vaksin} selesai` })
    ).toBeInTheDocument();
  });

  it("U6: ScheduleTab table view renders table checkbox labels, titles, and mobile hint", () => {
    const dummyProfile = createSampleProfile();
    const dummyHandlers = {
      profile: dummyProfile,
      paymentMode: "HYBRID" as const,
      onUpdatePaymentMode: vi.fn(),
      onUpdateScheduleRow: vi.fn(),
      onUpdateRecord: vi.fn(),
      onAddCustomRow: vi.fn(),
      onDeleteCustomRow: vi.fn(),
      onResetSchedule: vi.fn(),
      onOpenVaccineDetail: vi.fn()
    };

    render(<ScheduleTab {...dummyHandlers} />);

    // Switch to table mode
    fireEvent.click(screen.getByTitle("Tampilan Tabel"));

    // Table checkbox label and title
    const firstRow = dummyProfile.schedule[0];
    const tableCheckbox = screen.getByRole("checkbox", {
      name: `Tandai status ${firstRow.vaksin}`
    });
    expect(tableCheckbox).toBeInTheDocument();
    expect(tableCheckbox).toHaveAttribute("title", "Tandai belum diberikan");

    // Action button "Detail"
    expect(screen.getAllByText("Detail").length).toBeGreaterThan(0);

    // Mobile scroll hint
    expect(
      screen.getByText("Geser ke samping untuk melihat kolom lainnya.")
    ).toBeInTheDocument();
  });

  it("U7: BayiSidebar features tablet icon rail attributes and accessible names", () => {
    render(
      <BrowserRouter>
        <BayiSidebar />
      </BrowserRouter>
    );

    const berandaUtamaLink = screen.getByRole("link", { name: "Beranda utama" });
    expect(berandaUtamaLink).toBeInTheDocument();
    expect(berandaUtamaLink).toHaveAttribute("title", "Beranda utama");

    const jadwalLink = screen.getByRole("link", { name: "Jadwal" });
    expect(jadwalLink).toBeInTheDocument();
    expect(jadwalLink).toHaveAttribute("title", "Jadwal");
  });
});
