import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

describe("9.5 Static Architecture & Integrity Checks (T-ARCH-1 .. T-ARCH-6)", () => {
  const keuanganDir = path.resolve(process.cwd(), "src/modules/keuangan");
  const bayiDir = path.resolve(process.cwd(), "src/modules/bayi");
  const shellDir = path.resolve(process.cwd(), "src/shell");

  const keuanganFiles = getAllFiles(keuanganDir);
  const bayiFiles = getAllFiles(bayiDir);
  const shellFiles = getAllFiles(shellDir);

  it("T-ARCH-1: Finance imports from Bayi ONLY via src/modules/bayi/public", () => {
    for (const filePath of keuanganFiles) {
      const content = fs.readFileSync(filePath, "utf8");
      const imports = content.match(/from\s+['"]([^'"]+)['"]/g) || [];

      for (const imp of imports) {
        if (imp.includes("bayi")) {
          expect(imp).toMatch(/bayi\/public/);
        }
      }
    }

    // Bayi imports nothing from keuangan
    for (const filePath of bayiFiles) {
      const content = fs.readFileSync(filePath, "utf8");
      const imports = content.match(/from\s+['"]([^'"]+)['"]/g) || [];
      for (const imp of imports) {
        expect(imp).not.toContain("keuangan");
      }
    }
  });

  it("T-ARCH-3: No hex colors or arbitrary tailwind palette colors in src/modules/keuangan", () => {
    for (const filePath of keuanganFiles) {
      const content = fs.readFileSync(filePath, "utf8");

      // Check no #xxxxxx hex colors except inside SVGs or CSS variables
      const hexMatches = content.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
      expect(hexMatches).toHaveLength(0);

      // Check no bg-red-500, text-blue-600, etc.
      const paletteMatches = content.match(/\b(bg|text|border|ring)-(red|blue|green|emerald|purple|indigo|amber|teal|pink|slate|gray|zinc)-[0-9]{3}\b/g) || [];
      expect(paletteMatches).toHaveLength(0);
    }
  });

  it("T-ARCH-4: No usage of toISOString().split or toISOString().slice for dates in src/modules/keuangan", () => {
    for (const filePath of keuanganFiles) {
      const content = fs.readFileSync(filePath, "utf8");
      expect(content).not.toContain(".toISOString().split");
      expect(content).not.toContain(".toISOString().slice");
    }
  });

  it("T-ARCH-5 & T-ARCH-6: No dangerouslySetInnerHTML or imported Record from src/types in finance module", () => {
    for (const filePath of keuanganFiles) {
      const content = fs.readFileSync(filePath, "utf8");

      expect(content).not.toContain("dangerouslySetInnerHTML");

      // Check no import { Record } from "../types"
      const typeImports = content.match(/import\s+.*\{[^}]*\bRecord\b[^}]*\}\s+from\s+['"].*types/g) || [];
      expect(typeImports).toHaveLength(0);
    }
  });
});
