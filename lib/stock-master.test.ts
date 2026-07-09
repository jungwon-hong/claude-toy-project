import { describe, expect, it } from "vitest";
import { searchStockMaster } from "./stock-master";
import type { StockMasterEntry } from "@/types/stock";

const master: StockMasterEntry[] = [
  { code: "005930", name: "삼성전자", corpCode: "00126380" },
  { code: "006400", name: "삼성SDI", corpCode: "00126362" },
  { code: "028260", name: "삼성물산", corpCode: "00149655" },
  { code: "207940", name: "삼성바이오로직스", corpCode: "00164509" },
  { code: "009150", name: "삼성전기", corpCode: "00126413" },
  { code: "010140", name: "삼성중공업", corpCode: "00113034" },
  { code: "000660", name: "SK하이닉스", corpCode: "00164779" },
];

describe("searchStockMaster", () => {
  it("returns up to `limit` entries whose name contains the query", () => {
    const result = searchStockMaster("삼성", master, 5);
    expect(result).toHaveLength(5);
    for (const entry of result) {
      expect(entry.name).toContain("삼성");
    }
  });

  it("returns an empty array when nothing matches", () => {
    expect(searchStockMaster("존재하지않는종목", master, 5)).toEqual([]);
  });

  it("returns an empty array for an empty query", () => {
    expect(searchStockMaster("", master, 5)).toEqual([]);
  });
});
