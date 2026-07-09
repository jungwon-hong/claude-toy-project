import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchStockFinancials, parseCorpCodeXml } from "./dart-client";

function account(
  account_nm: string,
  fs_div: string,
  sj_div: string,
  thstrm_amount: string,
) {
  return { account_nm, fs_div, sj_div, thstrm_amount };
}

function dartResponse(status: string, list?: unknown[]) {
  return {
    ok: true,
    json: async () => ({ status, message: "", list }),
  };
}

describe("parseCorpCodeXml", () => {
  it("maps 6-digit stock codes to their corp_code", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<result>
  <list>
    <corp_code>00126380</corp_code>
    <corp_name>삼성전자</corp_name>
    <corp_eng_name>Samsung Electronics</corp_eng_name>
    <stock_code>005930</stock_code>
    <modify_date>20260101</modify_date>
  </list>
  <list>
    <corp_code>00434003</corp_code>
    <corp_name>다코</corp_name>
    <corp_eng_name>Daco corporation</corp_eng_name>
    <stock_code> </stock_code>
    <modify_date>20170630</modify_date>
  </list>
</result>`;

    const map = parseCorpCodeXml(xml);

    expect(map.get("005930")).toBe("00126380");
    expect(map.size).toBe(1);
  });

  it("returns an empty map when no entries have a stock code", () => {
    const xml = `<result><list><corp_code>1</corp_code><stock_code> </stock_code></list></result>`;
    expect(parseCorpCodeXml(xml).size).toBe(0);
  });
});

describe("fetchStockFinancials", () => {
  beforeEach(() => {
    process.env.DART_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses comma-formatted amounts, preferring CFS over OFS", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      dartResponse("000", [
        account("자산총계", "CFS", "BS", "566,942,110,000,000"),
        account("자산총계", "OFS", "BS", "999,999,999"),
        account("부채총계", "CFS", "BS", "141,472,257,000,000"),
        account("자본총계", "CFS", "BS", "425,469,853,000,000"),
        account("당기순이익(손실)", "CFS", "IS", "34,451,283,000,000"),
        account("매출액", "CFS", "IS", "300,870,884,000,000"),
      ]),
    );

    const result = await fetchStockFinancials("00126380");

    expect(result).toEqual({
      totalAssets: 566942110000000,
      totalLiabilities: 141472257000000,
      totalEquity: 425469853000000,
      netIncome: 34451283000000,
      revenue: 300870884000000,
    });
  });

  it("sets a field to null when that account is missing from the response", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      dartResponse("000", [
        account("자산총계", "CFS", "BS", "100"),
        account("당기순이익(손실)", "CFS", "IS", "10"),
        // 부채총계/자본총계/매출액 intentionally absent
      ]),
    );

    const result = await fetchStockFinancials("00000001");

    expect(result.totalLiabilities).toBeNull();
    expect(result.totalEquity).toBeNull();
    expect(result.revenue).toBeNull();
    expect(result.totalAssets).toBe(100);
  });

  it("falls back to the previous year when DART has no report for the latest year", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(dartResponse("013")) // latest year: no data
      .mockResolvedValueOnce(
        dartResponse("000", [
          account("자산총계", "CFS", "BS", "100"),
          account("부채총계", "CFS", "BS", "50"),
          account("자본총계", "CFS", "BS", "50"),
          account("당기순이익(손실)", "CFS", "IS", "10"),
          account("매출액", "CFS", "IS", "200"),
        ]),
      );

    const result = await fetchStockFinancials("00000001", 2026);

    expect(result.totalAssets).toBe(100);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("throws when no report is found within maxYearsBack", async () => {
    global.fetch = vi.fn().mockResolvedValue(dartResponse("013"));
    await expect(
      fetchStockFinancials("00000001", 2026, 2),
    ).rejects.toThrow();
  });
});
