import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("firestore.rules validation", () => {
  it("isValidUserAppState should contain hasOnly and paymentMode", () => {
    const rules = fs.readFileSync(path.join(process.cwd(), "firestore.rules"), "utf8");
    const fnMatch = rules.match(/function isValidUserAppState\([\s\S]*?\{([\s\S]*?)\n\s*\}/);
    expect(fnMatch).toBeTruthy();
    const fnBody = fnMatch ? fnMatch[1] : "";
    expect(fnBody).toContain("hasOnly");
    expect(fnBody).toContain("paymentMode");
  });
});
