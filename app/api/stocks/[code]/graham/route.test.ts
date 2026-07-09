import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/data-go-kr-client", () => ({
  fetchStockPriceByCode: vi.fn(),
}));
vi.mock("@/services/dart-client", () => ({
  fetchStockFinancials: vi.fn(),
}));

import { fetchStockPriceByCode } from "@/services/data-go-kr-client";
import { fetchStockFinancials } from "@/services/dart-client";
import { GET } from "./route";

function callGet(code: string) {
  return GET(new Request("http://localhost/api/stocks/" + code + "/graham"), {
    params: Promise.resolve({ code }),
  });
}

describe("GET /api/stocks/[code]/graham", () => {
  it("returns a GrahamResult with 4 criteria for a stock with normal financials", async () => {
    vi.mocked(fetchStockPriceByCode).mockResolvedValue({
      price: 100,
      changeRate: 1,
      marketCap: 10000,
    });
    vi.mocked(fetchStockFinancials).mockResolvedValue({
      totalAssets: 12000,
      totalLiabilities: 4000,
      totalEquity: 8000,
      netIncome: 1000,
      revenue: 20000,
    });

    const res = await callGet("005930"); // Samsung, always in the master list
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.criteria).toHaveLength(4);
    expect(body.satisfiedCount).toBe(4);
  });

  it("returns PER as N/A when the company reported a net loss", async () => {
    vi.mocked(fetchStockPriceByCode).mockResolvedValue({
      price: 100,
      changeRate: 1,
      marketCap: 10000,
    });
    vi.mocked(fetchStockFinancials).mockResolvedValue({
      totalAssets: 12000,
      totalLiabilities: 4000,
      totalEquity: 8000,
      netIncome: -500,
      revenue: 20000,
    });

    const res = await callGet("005930");
    const body = await res.json();

    const per = body.criteria.find((c: { key: string }) => c.key === "per");
    expect(per.value).toBe("N/A");
  });

  it("marks a criterion unavailable when DART is missing that account", async () => {
    vi.mocked(fetchStockPriceByCode).mockResolvedValue({
      price: 100,
      changeRate: 1,
      marketCap: 10000,
    });
    vi.mocked(fetchStockFinancials).mockResolvedValue({
      totalAssets: 12000,
      totalLiabilities: null,
      totalEquity: 8000,
      netIncome: 1000,
      revenue: 20000,
    });

    const res = await callGet("005930");
    const body = await res.json();

    const debtRatio = body.criteria.find(
      (c: { key: string }) => c.key === "debtRatio",
    );
    expect(debtRatio.status).toBe("unavailable");
  });

  it("returns 404 for a code that isn't in the KOSPI200 master list", async () => {
    const res = await callGet("000000");
    expect(res.status).toBe(404);
  });
});
