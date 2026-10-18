import "@testing-library/jest-dom/vitest";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { KulaMascotPoster } from "../components/three/KulaMascotPoster";
import { KulaMascotView } from "../components/three/KulaMascotView";
import { APP_NAME } from "../config/app";

describe("Kura Mascot & Kula Rebrand", () => {
  it("verifies APP_NAME is rebranded to Kula", () => {
    expect(APP_NAME).toBe("Kula");
  });

  it("renders KulaMascotPoster with SVG and accessible hidden attributes", () => {
    const { container } = render(<KulaMascotPoster progress={50} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("renders KulaMascotView with decorative aria-label, role img, and overlay text", () => {
    render(
      <KulaMascotView
        progress={75}
        greeting="Halo, Adik!"
        subtitle="Apa yang ingin dirawat hari ini?"
      />
    );

    const mascotEl = screen.getByRole("img", { name: /Kura, maskot kura-kura Kula/i });
    expect(mascotEl).toBeInTheDocument();
    expect(screen.getByText("Halo, Adik!")).toBeInTheDocument();
    expect(screen.getByText("Apa yang ingin dirawat hari ini?")).toBeInTheDocument();
    expect(screen.getByText("Imunisasi 75%")).toBeInTheDocument();
  });
});
