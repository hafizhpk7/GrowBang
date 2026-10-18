import "@testing-library/jest-dom/vitest";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import fs from "fs";
import path from "path";
import { KulaLogo } from "../components/common/KulaLogo";

describe("Kula Logo & App Assets", () => {
  it("renders KulaLogo component with default alt='Kula' and dark mode cream tile styling", () => {
    const { container } = render(<KulaLogo size={48} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper.className).toContain("dark:bg-[#FAF7F2]");
    expect(wrapper.style.width).toBe("48px");
    expect(wrapper.style.height).toBe("48px");

    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img?.getAttribute("alt")).toBe("Kula");
  });

  it("renders KulaLogo with alt='' when adjacent to text", () => {
    const { container } = render(<KulaLogo size={40} alt="" />);
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img?.getAttribute("alt")).toBe("");
  });

  it("verifies public logo assets exist with valid non-zero byte size", () => {
    const publicAssets = [
      "public/favicon.svg",
      "public/favicon-32x32.png",
      "public/apple-touch-icon.png",
      "public/pwa-192x192.png",
      "public/pwa-512x512.png",
      "public/pwa-maskable-512x512.png",
      "src/assets/kula-logo-mark.svg"
    ];

    for (const asset of publicAssets) {
      const fullPath = path.resolve(asset);
      expect(fs.existsSync(fullPath)).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size).toBeGreaterThan(100);
    }
  });

  it("verifies index.html has correct favicon and apple-touch-icon links", () => {
    const indexHtml = fs.readFileSync(path.resolve("index.html"), "utf-8");
    expect(indexHtml).toContain('<link rel="icon" type="image/svg+xml" href="/favicon.svg" />');
    expect(indexHtml).toContain('<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />');
    expect(indexHtml).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png" />');
    expect(indexHtml).not.toContain('"/icon.svg"');
    expect(indexHtml).not.toContain("'icon.svg'");
  });
});
