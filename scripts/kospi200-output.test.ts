import { describe, expect, it } from "vitest";
import kospi200 from "../public/data/kospi200.json";
import type { StockMasterEntry } from "../types/stock";

describe("public/data/kospi200.json", () => {
  const entries = kospi200 as StockMasterEntry[];

  it("has exactly 200 entries", () => {
    expect(entries).toHaveLength(200);
  });

  it("every entry has a valid code, name, and corpCode", () => {
    for (const entry of entries) {
      expect(entry.code).toMatch(/^[0-9A-Z]{6}$/);
      expect(entry.name.length).toBeGreaterThan(0);
      expect(entry.corpCode).toMatch(/^\d{8}$/);
    }
  });

  it("has no duplicate codes", () => {
    const codes = new Set(entries.map((e) => e.code));
    expect(codes.size).toBe(entries.length);
  });
});
