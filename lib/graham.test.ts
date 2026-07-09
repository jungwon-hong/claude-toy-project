import { describe, expect, it } from "vitest";
import { evaluateGraham } from "./graham";
import type { StockFinancials } from "@/types/stock";

function financials(overrides: Partial<StockFinancials>): StockFinancials {
  return {
    netIncome: 1000,
    totalAssets: 5000,
    totalLiabilities: 2000,
    totalEquity: 3000,
    revenue: 10000,
    ...overrides,
  };
}

describe("evaluateGraham", () => {
  it("passes all 4 criteria when every ratio clears its threshold", () => {
    // marketCap=10000 / netIncome=1000 -> PER 10 (<15)
    // marketCap=10000 / totalEquity=8000 -> PBR 1.25 (<1.5)
    // totalLiabilities=4000 / totalEquity=8000 -> debtRatio 50% (<100%)
    const result = evaluateGraham(
      { marketCap: 10000 },
      financials({ totalLiabilities: 4000, totalEquity: 8000, netIncome: 1000 }),
    );

    expect(result.satisfiedCount).toBe(4);
    expect(result.evaluableCount).toBe(4);
    for (const c of result.criteria) {
      expect(c.status).toBe("pass");
    }
  });

  it("fails only the PER criterion when PER exceeds the threshold, rest pass", () => {
    // marketCap=18400, netIncome=1000 -> PER 18.4 (>15, fail)
    // marketCap=18400 / totalEquity=13000 -> PBR ~1.42 (<1.5, pass)
    // totalLiabilities=5000 / totalEquity=13000 -> debtRatio ~38% (<100%, pass)
    const result = evaluateGraham(
      { marketCap: 18400 },
      financials({ totalLiabilities: 5000, totalEquity: 13000, netIncome: 1000 }),
    );

    const per = result.criteria.find((c) => c.key === "per");
    const others = result.criteria.filter((c) => c.key !== "per");

    expect(per?.status).toBe("fail");
    expect(others.every((c) => c.status === "pass")).toBe(true);
    expect(result.satisfiedCount).toBe(3);
  });

  it("shows PER as N/A and fails both per and profitable when netIncome is negative", () => {
    const result = evaluateGraham(
      { marketCap: 9800 },
      financials({ netIncome: -500, totalLiabilities: 2000, totalEquity: 4762 }),
    );

    const per = result.criteria.find((c) => c.key === "per");
    const profitable = result.criteria.find((c) => c.key === "profitable");

    expect(per?.value).toBe("N/A");
    expect(per?.status).toBe("fail");
    expect(profitable?.status).toBe("fail");
  });

  it("marks debtRatio unavailable when totalLiabilities is null, and shrinks evaluableCount", () => {
    const result = evaluateGraham(
      { marketCap: 9800 },
      financials({ totalLiabilities: null, totalEquity: 8000 }),
    );

    const debtRatio = result.criteria.find((c) => c.key === "debtRatio");

    expect(debtRatio?.status).toBe("unavailable");
    expect(debtRatio?.value).toBe("데이터 없음");
    expect(result.evaluableCount).toBe(3);
  });
});
