import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/data-go-kr-client", () => ({
  fetchStockPriceByCode: vi.fn(),
}));

import { fetchStockPriceByCode } from "@/services/data-go-kr-client";
import { GET } from "./route";

function callGet(code: string) {
  return GET(new Request("http://localhost/api/stocks/" + code + "/price"), {
    params: Promise.resolve({ code }),
  });
}

describe("GET /api/stocks/[code]/price", () => {
  it("returns 200 with price data for an existing stock code", async () => {
    vi.mocked(fetchStockPriceByCode).mockResolvedValue({
      price: 277500,
      changeRate: -6.25,
      marketCap: 1622342313720000,
    });

    const res = await callGet("005930");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      price: 277500,
      changeRate: -6.25,
      marketCap: 1622342313720000,
    });
  });

  it("returns a 404 with a clear message when no price data is found", async () => {
    vi.mocked(fetchStockPriceByCode).mockResolvedValue(null);

    const res = await callGet("999999");
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(typeof body.error).toBe("string");
  });

  it("returns a 502 with a clear message when the upstream call fails", async () => {
    vi.mocked(fetchStockPriceByCode).mockRejectedValue(
      new Error("data.go.kr error: SERVICE_KEY_IS_NOT_REGISTERED_ERROR"),
    );

    const res = await callGet("005930");
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.error).toContain("SERVICE_KEY_IS_NOT_REGISTERED_ERROR");
  });
});
