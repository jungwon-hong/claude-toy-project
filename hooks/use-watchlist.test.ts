import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useWatchlist } from "./use-watchlist";

function mockFetchOnce(url: string, body: unknown, ok = true) {
  return { url, ok, json: async () => body };
}

describe("useWatchlist", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds a stock and fetches its price + graham data", async () => {
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/price")) {
        return mockFetchOnce(url, { price: 277500, changeRate: -6.25, marketCap: 1 });
      }
      return mockFetchOnce(url, {
        criteria: [],
        satisfiedCount: 4,
        evaluableCount: 4,
      });
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useWatchlist());

    act(() => {
      result.current.addStock({ code: "005930", name: "삼성전자" });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe("삼성전자");

    await waitFor(() => {
      expect(result.current.items[0].price?.price).toBe(277500);
      expect(result.current.items[0].graham?.satisfiedCount).toBe(4);
    });
  });

  it("persists only {code, name} to localStorage, never price or financial data", async () => {
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/price")) {
        return mockFetchOnce(url, { price: 100, changeRate: 1, marketCap: 1 });
      }
      return mockFetchOnce(url, { criteria: [], satisfiedCount: 1, evaluableCount: 4 });
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useWatchlist());

    act(() => {
      result.current.addStock({ code: "005930", name: "삼성전자" });
    });

    const stored = JSON.parse(window.localStorage.getItem("graham-watchlist") ?? "[]");
    expect(stored).toEqual([{ code: "005930", name: "삼성전자" }]);
  });

  it("starts with an empty items array when the watchlist has nothing added", () => {
    const { result } = renderHook(() => useWatchlist());
    expect(result.current.items).toEqual([]);
  });
});
