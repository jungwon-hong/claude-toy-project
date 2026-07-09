import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchKospiSnapshotForDate,
  fetchLatestKospiSnapshot,
} from "./data-go-kr-client";

function mockResponse(totalCount: number, items: unknown[]) {
  return {
    ok: true,
    json: async () => ({
      response: {
        header: { resultCode: "00", resultMsg: "NORMAL SERVICE." },
        body: { totalCount, items: { item: items } },
      },
    }),
  };
}

describe("fetchKospiSnapshotForDate", () => {
  beforeEach(() => {
    process.env.DATA_GO_KR_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps API fields to KospiSnapshotItem", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse(1, [
        { srtnCd: "005930", itmsNm: "삼성전자", mrktTotAmt: "500000000000" },
      ]),
    );

    const result = await fetchKospiSnapshotForDate("20260708");

    expect(result).toEqual([
      { code: "005930", name: "삼성전자", marketCap: 500000000000 },
    ]);
  });

  it("returns an empty array when totalCount is 0 (weekend/holiday)", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockResponse(0, []));
    const result = await fetchKospiSnapshotForDate("20260711");
    expect(result).toEqual([]);
  });

  it("paginates until all rows are collected", async () => {
    const page1 = mockResponse(2, [
      { srtnCd: "000020", itmsNm: "동화약품", mrktTotAmt: "1" },
    ]);
    const page2 = mockResponse(2, [
      { srtnCd: "000040", itmsNm: "KR모터스", mrktTotAmt: "2" },
    ]);
    global.fetch = vi.fn().mockResolvedValueOnce(page1).mockResolvedValueOnce(page2);

    const result = await fetchKospiSnapshotForDate("20260708");

    expect(result).toHaveLength(2);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});

describe("fetchLatestKospiSnapshot", () => {
  beforeEach(() => {
    process.env.DATA_GO_KR_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("walks backward until a date with data is found", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(0, [])) // day 0: no data
      .mockResolvedValueOnce(
        mockResponse(1, [
          { srtnCd: "005930", itmsNm: "삼성전자", mrktTotAmt: "1" },
        ]),
      ); // day -1: has data

    const result = await fetchLatestKospiSnapshot(new Date("2026-07-08"));

    expect(result).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("throws after exhausting maxDaysBack", async () => {
    global.fetch = vi.fn().mockResolvedValue(mockResponse(0, []));
    await expect(
      fetchLatestKospiSnapshot(new Date("2026-07-08"), 2),
    ).rejects.toThrow();
  });
});
